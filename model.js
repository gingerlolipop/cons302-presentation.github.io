import { solve, verify, groupCount } from './solver.js';
export const defaultConfig=()=>({count:43,absent:'',together:'',apart:'',roster:null});
export function parseConfig(c){
 if(!c||typeof c!=='object'||!Number.isInteger(c.count)||c.count<1||c.count>100)throw Error('Enter a whole number of students between 1 and 100.');
 for(const k of ['absent','together','apart'])if(typeof c[k]!=='string'||c[k].length>10000)throw Error('Use text up to 10,000 characters per field.');
 const nums=(text,label)=>{if(!text.trim())return [];const t=text.trim().split(/[,;\s]+/);if(t.some(v=>!/^\d+$/.test(v)))throw Error(label+': use numbers separated by commas or spaces.');const a=t.map(Number);if(new Set(a).size!==a.length)throw Error(label+': a number appears more than once.');return a;};
 let enrolled;
 if(c.roster!=null){
  if(!Array.isArray(c.roster)||!c.roster.length||c.roster.length>100||c.count!==c.roster.length)throw Error('The CSV roster is invalid. Please upload it again.');
  const seen=new Set();for(const student of c.roster){if(!student||!Number.isInteger(student.number)||student.number<1||student.number>100||seen.has(student.number)||typeof student.name!=='string'||!student.name.trim()||student.name.length>100)throw Error('The CSV roster has an invalid number or name. Please upload it again.');if(student.firstName!==undefined&&(typeof student.firstName!=='string'||!student.firstName.trim()||student.firstName.length>100||typeof student.preferredName!=='string'||student.preferredName.length>100||student.name!==(student.preferredName||student.firstName)))throw Error('The CSV roster has inconsistent names. Please upload it again.');seen.add(student.number);}
  enrolled=c.roster.map(s=>s.number);
 }else enrolled=Array.from({length:c.count},(_,i)=>i+1);
 const absent=nums(c.absent,'Absent numbers');if(absent.some(n=>!enrolled.includes(n)))throw Error('Every absent number must be in the class roster.');
 const roster=enrolled.filter(n=>!absent.includes(n));if(!roster.length)throw Error('At least one student must be present.');groupCount(roster.length);
 const rules=(text,label)=>text.split('\n').flatMap((line,i)=>{if(!line.trim())return [];const a=nums(line,label+' line '+(i+1));if(a.length<2)throw Error(label+' line '+(i+1)+': enter at least two numbers.');for(const n of a){if(!enrolled.includes(n))throw Error(label+': student '+n+' is not in the class roster.');if(absent.includes(n))throw Error(label+': student '+n+' is absent. Remove them from this request.');}return [a];});
 return {n:c.count,roster,together:rules(c.together,'Keep together'),apart:rules(c.apart,'Keep apart')};
}
export class Classroom {
 constructor(saved){this.config=defaultConfig();this.result=null;this.revealed=0;this.revision=0;if(saved){const c=parseConfig(saved.config);if(saved.result)verify(c,saved.result);if(!Number.isInteger(saved.revision)||saved.revision<0||!Number.isInteger(saved.revealed)||saved.revealed<0||saved.revealed>(saved.result?.groups.length??0))throw Error('The saved draw is invalid.');this.config={...structuredClone(saved.config),roster:saved.config.roster??null};this.result=saved.result;this.revealed=saved.revealed;this.revision=saved.revision;}}
 check(config){const c=parseConfig(config),r=solve(c);verify(c,r);return {groups:r.groups.length,balanced:r.balanced};}
 save(config){if(this.result)throw Error('The draw is locked. Start a new draw before editing.');this.check(config);this.config={...structuredClone(config),roster:config.roster??null};this.revision++;}
 draw(revision){if(this.result)return this.publicState();if(revision!==this.revision)throw Error('The setup changed. Please try again.');const c=parseConfig(this.config),r=solve(c);verify(c,r);this.result=r;this.revealed=0;this.revision++;return this.publicState();}
 reveal(all,revision){if(!this.result)throw Error('Draw the groups first.');if(typeof all!=='boolean')throw Error('Invalid reveal request.');if(revision!==this.revision)throw Error('The draw changed. Please try again.');this.revealed=all?this.result.groups.length:Math.min(this.revealed+1,this.result.groups.length);this.revision++;return this.publicState();}
 reset(){this.result=null;this.revealed=0;this.revision++;}
 clear(){this.config=defaultConfig();this.reset();}
 snapshot(){return {config:this.config,result:this.result,revealed:this.revealed,revision:this.revision};}
 publicState(){const n=parseConfig(this.config).roster.length,groups=this.result?structuredClone(this.result.groups.slice(0,this.revealed)):[],revealed=new Set(groups.flat()),names={};for(const student of this.config.roster??[])if(revealed.has(student.number))names[student.number]=student.name;return {students:n,groupCount:groupCount(n),drawn:!!this.result,revealed:this.revealed,groups,names,revision:this.revision};}
}
