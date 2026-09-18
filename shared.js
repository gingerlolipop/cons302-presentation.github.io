import {groupCount,MAX_PRESENT,MAX_GROUP_SIZE} from './solver.js';
export const $=id=>document.getElementById(id);
export function resultsCSV(state){
 const quote=value=>'"'+String(value).replaceAll('"','""')+'"';
 const safeName=name=>/^[\s]*[=+@-]/.test(name)?"'"+name:name;
 return '\uFEFFGroup,Student number,Preferred name\r\n'+state.groups.flatMap((g,i)=>g.map(n=>[i+1,n,quote(safeName(state.names?.[n]??''))].join(','))).join('\r\n');
}
export function downloadCSV(state){if(!state||state.revealed!==state.groupCount)return;const a=document.createElement('a'),url=URL.createObjectURL(new Blob([resultsCSV(state)],{type:'text/csv;charset=utf-8'}));a.href=url;a.download='CONS302-presentation-groups.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
export function show(id,text){$(id).textContent=text;$(id).hidden=!text;}
export function validatePublicState(s){if(!s||typeof s!=='object'||!Number.isInteger(s.students)||s.students<1||s.students>MAX_PRESENT||s.groupCount!==groupCount(s.students)||typeof s.drawn!=='boolean'||!Number.isInteger(s.revealed)||s.revealed<0||s.revealed>s.groupCount||!Array.isArray(s.groups)||s.groups.length!==s.revealed||!Number.isInteger(s.revision)||s.revision<0)return false;if(!s.drawn&&s.revealed)return false;const flat=s.groups.flat();if(s.names!==undefined){if(!s.names||typeof s.names!=='object'||Array.isArray(s.names)||Object.entries(s.names).some(([n,name])=>!flat.includes(Number(n))||String(Number(n))!==n||typeof name!=='string'||!name.trim()||name.length>100))return false;}return new Set(flat).size===flat.length&&s.groups.every(g=>Array.isArray(g)&&g.length>=1&&g.length<=MAX_GROUP_SIZE&&g.every(n=>Number.isInteger(n)&&n>=1&&n<=100));}
