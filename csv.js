// Parse quoted comma-separated UTF-8 CSV, including Excel BOM and CRLF files.
export function parseRosterCSV(input){
 if(typeof input!=='string'||input.length>100000)throw Error('Use a CSV file smaller than 100 KB.');
 const text=input.replace(/^\uFEFF/,'');
 const rows=[];let cells=[],cell='',quoted=false,closed=false,start=true,line=1,rowLine=1;
 const endCell=()=>{cells.push(cell);cell='';closed=false;start=true;};
 const endRow=()=>{endCell();if(cells.some(v=>v.trim()))rows.push({cells,line:rowLine});cells=[];rowLine=line+1;};
 for(let i=0;i<text.length;i++){
  const ch=text[i];
  if(quoted){if(ch==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else{cell+=ch;if(ch==='\n')line++;}continue;}
  if(ch==='"'){if(!start||cell.trim())throw Error(`CSV line ${line}: unexpected quotation mark.`);cell='';quoted=true;start=false;continue;}
  if(ch===','){endCell();continue;}
  if(ch==='\r'||ch==='\n'){endRow();if(ch==='\r'&&text[i+1]==='\n')i++;line++;rowLine=line;continue;}
  if(closed){if(!/\s/.test(ch))throw Error(`CSV line ${line}: unexpected text after a quoted value.`);continue;}
  cell+=ch;if(!/\s/.test(ch))start=false;
 }
 if(quoted)throw Error('CSV has an unclosed quotation mark. Export it again as CSV UTF-8.');
 endRow();if(rows.length<2)throw Error('The CSV needs a header row and at least one student. Use number,first_name.');
 const normalize=s=>s.trim().toLowerCase().replace(/[\s_-]+/g,'');
 const head=rows[0].cells.map(normalize),numberHeaders=['number','studentnumber','studentid','id'],nameHeaders=['firstname','firstnames','name','studentfirstname','studentfirstnames'];
 const ni=head.map((v,i)=>numberHeaders.includes(v)?i:-1).filter(i=>i>=0),fi=head.map((v,i)=>nameHeaders.includes(v)?i:-1).filter(i=>i>=0);
 if(ni.length!==1||fi.length!==1)throw Error('Include one number column and one first_name column. Example header: number,first_name');
 const roster=[],seen=new Set();
 for(const row of rows.slice(1)){
  if(row.cells.length!==head.length)throw Error(`CSV line ${row.line}: the number of columns does not match the header. Put names containing commas in double quotes.`);
  const value=row.cells[ni[0]].trim();if(!/^\d+$/.test(value)||Number(value)<1||Number(value)>100)throw Error(`CSV line ${row.line}: student number must be a whole number from 1 to 100.`);
  const number=Number(value),name=row.cells[fi[0]].trim().replace(/[\r\n\t]+/g,' ');
  if(seen.has(number))throw Error(`CSV line ${row.line}: student number ${number} appears more than once.`);
  if(!name||name.length>100)throw Error(`CSV line ${row.line}: enter a first name with 1–100 characters.`);
  seen.add(number);roster.push({number,name});
 }
 if(roster.length>100)throw Error('Use at most 100 students.');
 return roster.sort((a,b)=>a.number-b.number);
}
