import {Classroom,defaultConfig} from './model.js';
import {parseRosterCSV} from './csv.js';
import {$,show,downloadCSV} from './shared.js';
const KEY='cons302-teacher-tab-v1';
let saved=null;try{saved=JSON.parse(sessionStorage.getItem(KEY)||'null');}catch{}
let classroom;try{classroom=new Classroom(saved?.classroom);}catch{try{classroom=new Classroom({...saved.classroom,result:null,revealed:0,revision:saved.classroom.revision+1});try{sessionStorage.setItem(KEY+':previous-rules-backup',JSON.stringify(saved));}catch{}show('error','The previous draw does not fit the current rules (exactly 8 groups, at most 6 students each). Your roster and requests were kept. Check and save the setup, then draw again.');}catch{classroom=new Classroom();saved=null;show('error','The saved setup could not be restored. Please enter it again.');}}
const session=saved&&/^[a-f0-9-]{36}$/.test(saved.session)?saved.session:crypto.randomUUID();
let busy=false,dialogAction=null,channel=null,uploadedRoster=null;
const formValue=()=>({count:Number($('count').value),absent:$('absent').value,together:$('together').value,apart:$('apart').value,roster:uploadedRoster});
const dirty=()=>JSON.stringify(formValue())!==JSON.stringify(classroom.config);
function fill(c){uploadedRoster=c.roster??null;$('count').value=c.count;for(const k of ['absent','together','apart'])$(k).value=c[k];}
fill(saved?.draft??classroom.config);
function persist(){try{sessionStorage.setItem(KEY,JSON.stringify({session,classroom:classroom.snapshot(),draft:formValue()}));}catch{show('storage-warning','Browser storage is unavailable. You can still draw, but keep this tab open: a refresh will lose your setup.');}}
function render(){const s=classroom.publicState();renderRoster();$('fields').disabled=busy||s.drawn;$('check').disabled=busy||s.drawn;$('save').disabled=busy||s.drawn;$('open').setAttribute('aria-disabled',String(busy||dirty()||!channel));$('open').style.opacity=busy||dirty()||!channel?'.5':'1';$('locked').hidden=!s.drawn;$('locked-info').textContent=`${s.revealed} of ${s.groupCount} groups revealed.`;$('download').hidden=!s.drawn||s.revealed!==s.groupCount;$('save-status').textContent=busy?'Checking…':s.drawn?'Draw locked':dirty()?'Unsaved changes. Save before opening the class screen.':'Setup ready in this teacher tab.';}
function send(extra={}){channel?.postMessage({type:'state',board:classroom.publicState(),...extra});}
if(!('BroadcastChannel' in window)){show('error','This browser cannot connect the teacher and class tabs. Use a current version of Chrome, Edge, Firefox or Safari.');}else{
 channel=new BroadcastChannel('cons302:'+session);
 channel.onmessage=event=>{
  const msg=event.data;if(!msg||typeof msg!=='object')return;
  if(msg.type==='hello'){send();return;}
  if(msg.type!=='command'||!['draw','next','all'].includes(msg.action)||typeof msg.requestId!=='string'||msg.requestId.length>100)return;
  if(busy){send({requestId:msg.requestId,error:'The teacher setup is busy. Try again in a moment.'});return;}
  try{
   if(dirty())throw Error('Save the edited setup before drawing or revealing.');
   if(msg.action==='draw')classroom.draw(msg.revision);else classroom.reveal(msg.action==='all',msg.revision);
   persist();render();send({requestId:msg.requestId,action:msg.action});
  }catch(e){show('error',e.message);send({requestId:msg.requestId,error:'Please check the teacher tab before continuing. No requests were ignored.'});}
 };
}
$('open').href='index.html#'+session;
$('open').addEventListener('click',e=>{if(busy||dirty()||!channel){e.preventDefault();show('error','Save the setup first, then open the class screen.');}});
async function setupAction(save){if(busy||classroom.result)return;busy=true;show('error','');show('notice','');render();await new Promise(r=>setTimeout(r,20));try{const c=formValue(),check=save?(classroom.save(c),{groups:classroom.publicState().groupCount}):classroom.check(c);if(save){persist();send();show('notice','Setup saved in this tab. Open the class screen and keep this tab open.');}else show('notice',`Requests work: ${check.groups} groups. ${check.balanced?'Sizes can be balanced.':'Sizes may vary to honor requests.'} The live draw will be randomized again.`);}catch(e){show('error',e.message);}finally{busy=false;render();}}
function renderRoster(){
 $('count').readOnly=!!uploadedRoster;
 $('count-help').textContent=uploadedRoster?'Counted from the CSV. Original student numbers are preserved.':'Student numbers run from 1 to this number.';
 $('roster-status').textContent=uploadedRoster?`${uploadedRoster.length} students imported. Preferred names will appear when groups are revealed; blank preferred names use real first names.`:'No CSV selected. You can also draw using numbers only.';
 $('roster-preview').hidden=!uploadedRoster;$('remove-roster').hidden=!uploadedRoster;
 $('roster-list').replaceChildren();
 for(const student of uploadedRoster??[]){const row=document.createElement('tr'),number=document.createElement('td'),first=document.createElement('td'),name=document.createElement('td');number.textContent=String(student.number);first.textContent=student.firstName??student.name;name.textContent=student.name;row.append(number,first,name);$('roster-list').append(row);}
}
$('csv-file').addEventListener('change',async()=>{
 const file=$('csv-file').files?.[0];if(!file||busy||classroom.result)return;
 busy=true;show('error','');show('notice','');render();
 try{if(file.size>100000)throw Error('Use a CSV file smaller than 100 KB.');const roster=parseRosterCSV(await file.text());uploadedRoster=roster;$('count').value=roster.length;persist();show('notice',`Imported ${roster.length} students with display names. Review the roster, then save the setup. Your numbered requests are kept.`);}
 catch(e){show('error',e.message+' The previous roster was kept.');}
 finally{busy=false;$('csv-file').value='';render();}
});
$('remove-roster').onclick=()=>{if(busy||classroom.result)return;uploadedRoster=null;persist();render();show('notice','Names removed. Number-only mode uses every number from 1 to the student count. Review any absent numbers and requests, then save.');};
$('form').addEventListener('submit',e=>{e.preventDefault();void setupAction(true);});$('check').onclick=()=>void setupAction(false);
for(const id of ['count','absent','together','apart'])$(id).addEventListener('input',()=>{show('error','');show('notice','');persist();render();});
$('download').onclick=()=>downloadCSV(classroom.publicState());
function confirm(action){dialogAction=action;$('confirm-title').textContent=action==='clear'?'Clear all tab data?':'Start a new draw?';$('confirm-description').textContent=action==='clear'?'This removes the imported names, requests and current draw from this teacher tab. Save any results you need first.':'This clears the current groups while keeping your requests. Save any results you need first.';$('confirm-dialog').showModal();}
$('reset').onclick=()=>confirm('reset');$('clear').onclick=()=>confirm('clear');$('cancel').onclick=()=>$('confirm-dialog').close();$('confirm').onclick=()=>{if(dialogAction==='clear'){classroom.clear();fill(defaultConfig());try{sessionStorage.removeItem(KEY);sessionStorage.removeItem(KEY+':previous-rules-backup');}catch{}show('notice','Names, requests and draw cleared from this teacher tab.');}else{classroom.reset();persist();show('notice','The draw is cleared. Your requests are kept.');}show('error','');render();send();$('confirm-dialog').close();};
window.addEventListener('beforeunload',e=>{if(dirty()||classroom.result){e.preventDefault();e.returnValue='';}});
window.addEventListener('pagehide',e=>{if(!e.persisted)channel?.close();});
render();persist();send();
