import {MAX_GROUP_SIZE} from './solver.js';
import {$,show,downloadCSV,validatePublicState} from './shared.js';
const session=location.hash.slice(1),valid=/^[a-f0-9-]{36}$/.test(session),key='cons302-class-screen:'+session;
let state=null,channel=null,lastSeen=0,pending=null,counting=false,projected=false,renderedRevision=-1;
if(valid){try{const s=JSON.parse(sessionStorage.getItem(key)||'null');if(validatePublicState(s))state=s;}catch{}}
function connected(){return !!channel&&Date.now()-lastSeen<7000;}
function render(){
 const complete=state?.drawn&&state.revealed===state.groupCount;
 $('setup-link').hidden=valid;$('draw').hidden=!state||state.drawn;$('next').hidden=!state||!state.drawn||complete;$('all').hidden=$('next').hidden;$('complete').hidden=!complete;$('result-actions').hidden=!complete;
 for(const id of ['draw','next','all'])$(id).disabled=!connected()||!!pending||counting;
 $('next').textContent=`Reveal group ${(state?.revealed??0)+1} →`;
 $('summary').textContent=state?`${state.students} students · ${state.groupCount} groups · up to 8 groups · no more than 6 per group`:'Up to 8 presentation groups, with no more than 6 students each.';
 $('progress').textContent=pending||counting?'Mixing…':state?.drawn?`${state.revealed} / ${state.groupCount} revealed`:'Ready to grow together';
 $('groups-title').textContent=complete?'Meet your group':'Room for every perspective';
 $('connection').textContent=!valid?'Open Teacher setup to prepare a draw on this computer.':connected()?'Connected to your teacher tab.':state?'Teacher tab disconnected. Keep it open in this browser to continue.':'Waiting for the teacher tab on this computer. Open this screen using its Open class screen button.';
 if(state?.revision===renderedRevision)return;
 renderedRevision=state?.revision??-1;
 $('groups').replaceChildren();
 for(let i=0;i<(state?.groupCount??0);i++){
  const g=state.groups[i],card=document.createElement('article');card.className='team-card '+['fern','river','sun'][i%3]+(g?' is-revealed':'');
  const head=document.createElement('div');head.className='team-heading';const icon=document.createElement('span');icon.className='group-icon';icon.setAttribute('aria-hidden','true');icon.textContent=['✿','⌘','♧'][i%3];const h=document.createElement('h3');h.textContent='Group '+String(i+1).padStart(2,'0');const meta=document.createElement('span');meta.textContent=g?g.length+' students':'Awaiting reveal';head.append(icon,h,meta);card.append(head);
  const body=document.createElement('div');body.className='student-numbers';
  if(g)for(const n of g){const name=state.names?.[n],badge=document.createElement('span');badge.className='student-number';badge.textContent=String(n).padStart(2,'0');badge.setAttribute('aria-label','Student '+n);if(name){body.classList.add('with-names');const member=document.createElement('div');member.className='named-student';const label=document.createElement('span');label.className='first-name';label.textContent=name;member.append(badge,label);body.append(member);}else body.append(badge);}
  else{const dots=document.createElement('div');dots.className='seed-spaces';dots.setAttribute('aria-hidden','true');for(let j=0;j<MAX_GROUP_SIZE;j++)dots.append(document.createElement('span'));const p=document.createElement('p');p.textContent='Your team is taking root.';body.append(dots,p);}card.append(body);$('groups').append(card);
 }
}
async function countdown(){counting=true;$('countdown').hidden=false;render();if(!matchMedia('(prefers-reduced-motion: reduce)').matches)for(let i=3;i>=1;i--){$('tick').textContent=i;await new Promise(r=>setTimeout(r,650));}$('countdown').hidden=true;counting=false;render();}
if(valid&&'BroadcastChannel' in window){
 channel=new BroadcastChannel('cons302:'+session);
 channel.onmessage=event=>{const msg=event.data;if(msg?.type!=='state'||!validatePublicState(msg.board))return;lastSeen=Date.now();const justDrew=!state?.drawn&&msg.board.drawn;
  if(!state||msg.board.revision>=state.revision){state=msg.board;try{sessionStorage.setItem(key,JSON.stringify(state));}catch{}}
  if(pending&&msg.requestId===pending.id){clearTimeout(pending.timer);pending=null;show('error',typeof msg.error==='string'?msg.error:'');}
  render();if(justDrew&&!counting)void countdown();
 };
 channel.postMessage({type:'hello'});
 setInterval(()=>{channel.postMessage({type:'hello'});if(pending&&Date.now()-pending.at>9000){clearTimeout(pending.timer);pending=null;show('error','No response from the teacher tab. Check that it is still open before trying again.');}render();},2500);
}else if(valid)show('error','This browser cannot connect classroom tabs. Use a current browser.');
function command(action){if(!state||pending||counting||!connected())return;const id=crypto.randomUUID();pending={id,at:Date.now(),timer:setTimeout(()=>{pending=null;show('error','No response from the teacher tab. Check that it is still open.');render();},10000)};show('error','');channel.postMessage({type:'command',action,revision:state.revision,requestId:id});render();}
$('draw').onclick=()=>command('draw');$('next').onclick=()=>command('next');$('all').onclick=()=>command('all');$('csv').onclick=()=>downloadCSV(state);$('print').onclick=()=>print();
$('project').onclick=async()=>{projected=!projected;document.body.classList.toggle('projected',projected);$('project').textContent=projected?'Exit projection':'Project';$('project').setAttribute('aria-pressed',String(projected));try{if(projected&&!document.fullscreenElement)await document.documentElement.requestFullscreen();else if(document.fullscreenElement)await document.exitFullscreen();}catch{}};
window.addEventListener('pagehide',e=>{if(!e.persisted)channel?.close();});
render();
if(document.modelContext?.registerTool){const life=new AbortController();try{Promise.resolve(document.modelContext.registerTool({name:'read_presentation_groups',description:'Read only the revealed CONS302 presentation groups on this class screen.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute(input){if(!input||typeof input!=='object'||Object.keys(input).length)throw Error('Provide an empty object.');if(!state)throw Error('Connect a teacher tab first.');return structuredClone(state);}},{signal:life.signal})).catch(()=>{});}catch{}window.addEventListener('pagehide',e=>{if(!e.persisted)life.abort();});}
