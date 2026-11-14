/* Three independent, atomic local save records. Legacy keys remain untouched. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Ben10SaveSlots=factory()})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const KEY='ben10.omnitrix-fragmentado.saves.v1',PROGRESSION='ben10.demo.progression.v11',UNLOCKS='ben10.campaign.v37.unlocks';
 const copy=x=>JSON.parse(JSON.stringify(x)),number=(v,fallback=0,max=1e9)=>Number.isFinite(v)?Math.max(0,Math.min(max,v)):fallback;
 function normalizeAdventure(a){a=a&&typeof a==='object'?a:{};return {version:1,story:['eternals','circus','hub'].includes(a.story)?a.story:'eternals',mode:['circus','entrance','mirror'].includes(a.mode)?a.mode:'circus',eternalsCleared:a.eternalsCleared===true,circusVisited:a.circusVisited===true,circusRouteCleared:a.circusRouteCleared===true,mirrorIndex:a.mirrorIndex===1?1:0,mirrorCheckpoint:a.mirrorCheckpoint===1?1:0}}
 function normalize(record){
  if(!record||typeof record!=='object'||Array.isArray(record))return null;
  const progression=record.progression&&typeof record.progression==='object'?copy(record.progression):null;
  if(progression){progression.level=Math.max(1,Math.floor(number(progression.level,1,1000)));progression.xp=number(progression.xp);progression.totalXP=number(progression.totalXP)}
  const p=record.checkpoint;const checkpoint=p&&typeof p==='object'?{phase:Math.floor(number(p.phase,0,2)),cleared:Math.floor(number(p.cleared,0,6)),x:number(p.x),y:number(p.y),kind:['travel','encounter','boss','victory','mirror','selection'].includes(p.kind)?p.kind:'travel',introSeen:!!p.introSeen,kills:Math.floor(number(p.kills))}:null;
  return {createdAt:number(record.createdAt,Date.now(),1e14),updatedAt:number(record.updatedAt,Date.now(),1e14),playSeconds:number(record.playSeconds,0,1e9),progression,unlocks:{version:1,diamondhead:record.unlocks?.diamondhead===true},checkpoint,adventure:record.adventure?normalizeAdventure(record.adventure):null,imported:!!record.imported};
 }
 class Bank{
  constructor(storage,{now=()=>Date.now()}={}){this.storage=storage;this.now=now;this.slots=[null,null,null];this.active=null;this.loading=false;this.readOnly=false;this.memoryOnly=false;this.error='';
   try{const raw=storage?.getItem(KEY);if(raw!==null&&raw!==undefined){const d=JSON.parse(raw);if(d?.version!==1||!Array.isArray(d.slots)||d.slots.length!==3)throw Error('Invalid save bank');this.slots=d.slots.map(r=>r===null?null:normalize(r));if(d.slots.some((r,i)=>r!==null&&!this.slots[i]))throw Error('Invalid save record');}
    else{const progression=JSON.parse(storage?.getItem(PROGRESSION)||'null'),unlocks=JSON.parse(storage?.getItem(UNLOCKS)||'null');const meaningful=progression&&(number(progression.level,1)>1||number(progression.xp)>0||number(progression.adminPoints)>0||Object.values(progression.owned||{}).some(v=>Array.isArray(v)&&v.length));if(meaningful||unlocks?.diamondhead===true){const at=now();this.slots[0]=normalize({createdAt:at,updatedAt:at,progression,unlocks,checkpoint:{phase:0,cleared:0,kind:'travel',introSeen:true},playSeconds:0,imported:true});this.persist(this.slots)}}
   }catch{this.readOnly=true;this.error='No se pudo leer el guardado. Esta sesión no modificará esos datos.'}
  }
  latest(){if(this.memoryOnly||this.readOnly)return copy(this.slots);try{const d=JSON.parse(this.storage?.getItem(KEY)||'null');if(d?.version===1&&Array.isArray(d.slots)&&d.slots.length===3)return d.slots.map(normalize)}catch{}return copy(this.slots)}
  persist(slots){this.slots=copy(slots);if(this.readOnly)return false;try{if(!this.storage)throw Error('No storage');this.storage.setItem(KEY,JSON.stringify({version:1,slots}));this.memoryOnly=false;this.error='';return true}catch{this.memoryOnly=true;this.error='El guardado solo estará disponible durante esta sesión.';return false}}
  snapshot(){return copy(this.slots)}
  activate(index){if(!Number.isInteger(index)||index<0||index>=3)throw Error('Invalid save slot');this.slots=this.latest();let record=this.slots[index],isNew=!record;if(!record){const at=this.now();record=normalize({createdAt:at,updatedAt:at,playSeconds:0,progression:null,unlocks:{diamondhead:false},checkpoint:null});this.slots[index]=record;this.persist(this.slots)}this.active=index;return {record:copy(record),isNew}}
  commit(data){if(this.active===null||this.loading)return false;const previous=this.slots[this.active],record=normalize({...data,createdAt:previous?.createdAt||this.now(),updatedAt:this.now(),imported:previous?.imported});const slots=this.latest();slots[this.active]=record;return this.persist(slots)}
  remove(index){if(!Number.isInteger(index)||index<0||index>2)throw Error('Invalid save slot');const slots=this.latest();slots[index]=null;if(this.active===index)this.active=null;return this.persist(slots)}
  readLegacy(key){if(this.active===null)return null;const record=this.slots[this.active],value=key===PROGRESSION?record?.progression:key===UNLOCKS?record?.unlocks:null;return value?JSON.stringify(value):null}
  writeLegacy(key,value){if(this.active===null||this.loading)return;try{const record=copy(this.slots[this.active]);if(key===UNLOCKS)record.unlocks=JSON.parse(value);else if(key===PROGRESSION)record.progression=JSON.parse(value);else return;this.commit(record)}catch{}}
 }
 return {KEY,PROGRESSION,UNLOCKS,Bank,normalize,normalizeAdventure};
});
