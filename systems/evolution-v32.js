// V33: sparse alien trees and new drawn attack key poses.
const EVOLUTION_COMBO_SEQUENCES=['LHL','HLL','LLHH','LHH','HLHL','HHLH'];
const EVOLUTION_PANEL_KEY='ben10.demo.progression.v11';
const EVOLUTION_COLORS=SKILL_BOOK.map(s=>s.color),EVOLUTION_SPECS=SKILL_BOOK;
const evolutionIndex=Object.fromEntries(SKILL_BOOK.map((s,i)=>[s.id,i]));
const progression={selected:0,focused:'core',owned:{},adminPoints:0,legacyCredit:0,comboLog:[],abilityTimes:{},cooldown:6,skill:null,casts:[],fields:[],fx:[],buffs:{},boostTime:0,migrated:false};
let progressionPanelOpen=false;
const evolutionNodeCache=new Map(),skillTextures=new Map();
const EVO_SEQUENCE_BRANCHES=[[0,2,4],[1,3,5],[2,5,0],[0,4,1],[3,1,5],[4,0,2],[2,1,4],[1,5,3],[0,3,4],[4,2,5]];
const EVO_PATH_CURVES=[[-26,12,-20,25,-12,15],[15,-30,9,-18,25,-12],[-35,26,-28,30,-19,27],[0,30,-30,28,-28,0],[25,-28,32,-20,15,-10],[-18,-35,18,35,-20,10],[24,-32,30,-16,10,-24],[-26,17,34,-14,-32,8],[-34,20,-22,34,-11,18],[0,26,0,-26,0,22]];
function evolutionShape(index){
 if(index===0)return Array.from({length:18},(_,i)=>{const a=Math.PI/2+i*Math.PI*2/18;return [380+285*Math.cos(a),680+490*Math.sin(a)]});
 if(index===1)return [[150,1120],[100,965],[130,790],[90,630],[200,705],[185,505],[285,595],[270,370],[370,500],[395,155],[465,350],[510,540],[605,415],[580,665],[665,770],[625,960],[555,1110],[380,1170]];
 if(index===2)return [[500,170],[395,290],[290,410],[185,530],[345,545],[280,695],[210,845],[140,995],[300,1005],[245,1180],[405,1030],[565,875],[660,750],[490,735],[550,585],[620,435],[460,420],[500,300]];
 if(index===3)return Array.from({length:18},(_,i)=>{const a=Math.PI/2+i*Math.PI*2/18,co=Math.cos(a),si=Math.sin(a),k=1/(Math.abs(co)+Math.abs(si));return [380+300*co*k,680+510*si*k]});
 if(index===4)return Array.from({length:18},(_,i)=>{const a=.6+i*Math.PI*2.45/17,r=145+i*8;return [380+Math.cos(a)*r,690+Math.sin(a)*r*1.6]});
 if(index===5)return [[250,1130],[150,1010],[225,870],[150,720],[160,540],[220,380],[300,230],[400,155],[475,310],[530,470],[570,650],[630,790],[560,930],[650,1080],[505,1100],[420,1190],[345,1050],[305,900]];
 if(index===6)return [[105,260],[150,440],[105,630],[180,825],[280,990],[265,760],[255,540],[300,360],[380,195],[460,360],[505,540],[495,760],[480,990],[580,825],[655,630],[610,440],[655,260],[380,1160]];
 if(index===7)return [[135,1120],[250,990],[200,820],[95,690],[175,530],[145,350],[280,430],[320,255],[400,150],[450,350],[590,285],[565,470],[675,615],[550,750],[600,930],[490,1050],[380,1160],[345,850]];
 if(index===8)return Array.from({length:18},(_,i)=>{const lane=Math.floor(i/6),n=i%6;return [145+lane*225+n*12,1140-n*185+(lane===1?-30:0)]});
 return [[135,1160],[135,980],[280,980],[280,810],[135,810],[135,610],[280,610],[280,410],[135,410],[135,200],[380,200],[625,200],[625,410],[480,410],[480,610],[625,610],[625,810],[625,1080]];
}
function evolutionNodes(index){
 if(evolutionNodeCache.has(index))return evolutionNodeCache.get(index);
 const spec=SKILL_BOOK[index],nodes=[{id:'core',title:'ADN latente',type:'stat',cost:1,x:380,y:1260,req:[],fx:{atk:.04,vel:.04,def:.04},description:'Despierta el potencial de '+spec.name+'. Un recorrido de atributos y técnicas entrelazados.'}];
 const assignment=[0,1,2,3,4,5],shift=EVO_SEQUENCE_BRANCHES[index][0]%6;
 const map=assignment.map((_,i)=>(i+shift)%6);
 const paths=[
  [{atk:.10},map[0],{vel:.09},map[1],{atk:.15,def:.04},{atk:.17,vel:.06}],
  [{def:.10},'f',{atk:.10},map[2],{def:.17},{def:.18,atk:.08}],
  [{vel:.10},map[3],{atk:.08,vel:.04},map[4],{vel:.15},map[5]]
 ];
 for(let branch=0;branch<3;branch++)for(let rank=0;rank<6;rank++){
  const value=paths[branch][rank],skill=typeof value==='number'?spec.skills[value+1]:value==='f'?spec.skills[0]:null;
  let x=[150,380,610][branch]+EVO_PATH_CURVES[index][rank]*(branch===1?.4:branch===0?1:-1),y=1092-rank*155;
  if(index===4)x+=Math.sin(rank*.95+branch*2)*20;
  if(index===7)x+=Math.sin(rank*.78+branch)*23;
  if(index===5)y+=Math.sin(branch*1.4+rank)*15;
  if(index===2)y-=branch===1?rank%2*13:0;
  const id='b'+branch+'r'+rank,prev=rank?'b'+branch+'r'+(rank-1):'core';
  const statLabel=branch===0?['Fibra de combate','','Reflejos de apoyo','','Potencia entrenada','Dominio de fuerza'][rank]:branch===1?['Resistencia inicial','','Control corporal','','Defensa adaptada','Dominio del cuerpo'][rank]:['Paso aprendido','','Coordinación','','Fluidez avanzada',''][rank];
  nodes.push({id,title:skill?skill.name:statLabel,type:skill?skill.id==='f'?'active':'combo':'stat',cost:[1,2,2,3,3,4][rank],x,y,req:[prev],branch,rank,skill:skill?.id,fx:skill?skill.id==='f'?{active:true}:{combo:skill.sequence}:value,description:skill?.description||'Entrenamiento de '+spec.branches[branch].toLowerCase()+'. Mejora permanente y acumulativa.'});
 }
 for(let b=0;b<3;b++)nodes.push({id:'master'+b,title:['Maestría · '+spec.branches[b]][0],type:'mastery',cost:5,x:[150,380,610][b],y:135,req:['b'+b+'r5'],branch:b,fx:b===0?{atk:.22,amp:.12}:b===1?{def:.22,atk:.08}: {vel:.22,def:.08},description:'Culmina esta disciplina. Potencia sus atributos sin desbloquear ataques automáticamente.'});
 for(let b=0;b<2;b++)nodes.push({id:'link'+b,title:b===0?'Sinergia ofensiva':'Instinto adaptable',type:'stat',cost:4,x:265+b*230,y:560+(index%3)*16,req:[b===0?'b0r2|b1r2':'b1r2|b2r2'],fx:b===0?{atk:.15,vel:.08}:{def:.15,vel:.09},description:'Un desvío entre disciplinas. Puedes llegar desde cualquiera de los dos caminos conectados.'});
 const counts=[0,0,0];for(const n of nodes)if(n.type==='stat'&&n.branch!==undefined&&spec.statNames){const values=[n.fx.atk||0,n.fx.vel||0,n.fx.def||0],lane=values.indexOf(Math.max(...values)),rank=counts[lane]++;n.title=spec.statNames[lane][rank%4]+(rank>=4?' II':'')}
 const shape=evolutionShape(index),positions=shape.map(p=>[...p]).sort((a,b)=>b[1]-a[1]||a[0]-b[0]);
 const primary=nodes.filter(n=>n.id.startsWith('b')).sort((a,b)=>a.rank-b.rank||a.branch-b.branch);
 primary.forEach((n,j)=>{[n.x,n.y]=positions[j]});
 for(const n of primary)if(n.rank){const candidates=primary.filter(p=>p.rank===n.rank-1).sort((a,b)=>Math.hypot(a.x-n.x,a.y-n.y)-Math.hypot(b.x-n.x,b.y-n.y));n.req=[candidates[0].id];}
 for(const n of nodes.filter(n=>n.id.startsWith('link')))n.req=[primary.filter(p=>p.rank===2).sort((a,b)=>Math.abs(a.x-n.x)-Math.abs(b.x-n.x))[0].id];
 const occupied=[...primary,nodes[0]];
 for(const n of nodes.filter(n=>n.id.startsWith('master')||n.id.startsWith('link'))){const choices=[];for(const y of [470,650,840,1010,310])for(const x of [380,230,530])choices.push([x,y]);const candidate=choices.find(([x,y])=>occupied.every(p=>Math.abs(x-p.x)>144||Math.abs(y-p.y)>112))||[n.x,n.y];[n.x,n.y]=candidate;occupied.push(n)}
 evolutionNodeCache.set(index,nodes);return nodes;
}
function evolutionOwned(id,node){return !!progression.owned[id]?.includes(node)}
function evolutionSpent(){return SKILL_BOOK.reduce((sum,s,i)=>sum+evolutionNodes(i).filter(n=>evolutionOwned(s.id,n.id)).reduce((v,n)=>v+n.cost,0),0)}
function evolutionLevelReward(level){return level<2?0:level<=12?1:level<=25?2:3}
function evolutionEarnedPoints(level){const n=Math.max(0,Math.floor(level)-1);return Math.min(n,11)+Math.min(Math.max(n-11,0),13)*2+Math.max(n-24,0)*3}
function evolutionFreePoints(){return Math.max(0,evolutionEarnedPoints(stats.level)+progression.legacyCredit+progression.adminPoints-evolutionSpent())}
function evolutionReqMet(spec,node){return node.req.every(group=>group.split('|').some(id=>evolutionOwned(spec.id,id)))}
function evolutionSave(){try{localStorage.setItem(EVOLUTION_PANEL_KEY,JSON.stringify({version:33,owned:progression.owned,level:stats.level,xp:stats.xp,totalXP:stats.totalXP,adminPoints:progression.adminPoints,legacyCredit:progression.legacyCredit,migrated:progression.migrated}))}catch{}}
function evolutionLoad(){try{
 const data=JSON.parse(localStorage.getItem(EVOLUTION_PANEL_KEY)||'null');if(!data||![11,13,32,33].includes(data.version))return;
 if(Number.isFinite(data.level))stats.level=clamp(Math.floor(data.level),1,1000);
 if(Number.isFinite(data.xp))stats.xp=clamp(Math.floor(data.xp),0,stats.xpNeeded-1);
 if(Number.isFinite(data.totalXP))stats.totalXP=Math.max(0,Math.floor(data.totalXP));
 progression.adminPoints=Number.isSafeInteger(data.adminPoints)?clamp(data.adminPoints,0,999999):0;
 progression.legacyCredit=data.version===11?Math.max(0,(stats.level-1)*2-evolutionEarnedPoints(stats.level)):Number.isSafeInteger(data.legacyCredit)?clamp(data.legacyCredit,0,999999):0;
 if(data.version>=32){
  SKILL_BOOK.forEach((spec,i)=>{const valid=new Set(evolutionNodes(i).map(n=>n.id));progression.owned[spec.id]=[...new Set(Array.isArray(data.owned?.[spec.id])?data.owned[spec.id]:[])].filter(id=>valid.has(id));}); // Preserve learned V32 nodes when paths are simplified.

  progression.migrated=!!data.migrated;
 }else{progression.owned={};progression.migrated=true;} // Old purchases are refunded in full: the wallet is not reduced.
 if(evolutionSpent()>evolutionEarnedPoints(stats.level)+progression.legacyCredit+progression.adminPoints)progression.owned={};
 evolutionSave();
 }catch{}}
function evolutionBonus(id=stats.form?.id){
 const index=evolutionIndex[id];if(index===undefined)return {atk:1,vel:1,def:1,amp:1,active:false,combos:[]};
 let [atk,vel,def]=SKILL_BOOK[index].start,amp=.82,active=false;const combos=[];
 for(const n of evolutionNodes(index))if(evolutionOwned(id,n.id)){atk+=n.fx.atk||0;vel+=n.fx.vel||0;def+=n.fx.def||0;amp+=n.fx.amp||0;active=active||!!n.fx.active;if(n.fx.combo)combos.push(n.fx.combo)}
 const buff=progression.buffs[id];if(buff?.time>0){atk+=buff.atk||0;vel+=buff.vel||0;def+=buff.def||0}
 return {atk:Math.min(2.1,atk),vel:Math.min(1.7,vel),def:Math.min(1.9,def),amp,active,combos};
}
function evolutionActorMetrics(base){if(!stats.form)return base;const b=evolutionBonus();return {...base,speed:base.speed*b.vel,dash:{...base.dash,startSpeed:base.dash.startSpeed*Math.min(1.65,b.vel),endSpeed:base.dash.endSpeed*Math.min(1.65,b.vel)}}}
function evolutionStats(index){const b=evolutionBonus(SKILL_BOOK[index].id);return [b.atk,b.vel,b.def]}
function evolutionCasting(){return !!progression.skill}
function evolutionPrepareModels(){Ben10SkillArt.registerModels([
 {id:'four-arms',atlas:fourArmsAtlas,motion:FOUR_ARMS_MOTION},{id:'heatblast',atlas:heatblastAtlas,motion:HEATBLAST_MOTION},
 {id:'xlr8',atlas:xlr8Atlas,motion:XLR8_MOTION},{id:'diamondhead',atlas:diamondheadAtlas,motion:DIAMONDHEAD_MOTION},
 {id:'cannonbolt',atlas:cannonboltAtlas,motion:CANNONBOLT_MOTION},{id:'ghostfreak',atlas:ghostfreakAtlas,motion:GHOSTFREAK_MOTION},
 {id:'stinkfly',atlas:stinkflyAtlas,motion:STINKFLY_MOTION},{id:'wildvine',atlas:wildvineAtlas,motion:WILDVINE_MOTION},
 {id:'blitzwolfer',atlas:blitzwolferAtlas,motion:BLITZWOLFER_MOTION},{id:'upgrade',atlas:upgradeAtlas,motion:UPGRADE_MOTION}]);}
function evolutionTexture(index,skill){
 const key=SKILL_BOOK[index].id+'-'+skill.id;let entry=skillTextures.get(key);
 if(!entry){const image=new Image();entry={image,ready:false};image.onload=()=>entry.ready=true;image.src='assets/skills/'+key+'.png';skillTextures.set(key,entry);
  if(skillTextures.size>12){const first=skillTextures.keys().next().value;skillTextures.delete(first)}
 }return entry;
}
function evolutionPaintSkill(c,index,skill,p,dir,x,y,height){
 const entry=evolutionTexture(index,skill),art=Ben10SkillArt,box=skill.layout;
 if(entry.ready&&box){
  const keys=skill.frameTimes||[0,.14,.3,.49,.7,.88];let frame=0;for(let i=0;i<keys.length;i++)if(p>=keys[i])frame=i;
  frame=skill.frameMap?.[frame]??frame;const d={down:0,up:1,right:2,left:2}[dir]??2,n=d*art.frames+frame,scale=height/box.bodyHeight;
  c.save();c.translate(x,y);if(dir==='left')c.scale(-1,1);c.imageSmoothingEnabled=false;
  c.drawImage(entry.image,n%art.columns*box.cellWidth,Math.floor(n/art.columns)*box.cellHeight,box.cellWidth,box.cellHeight,-box.anchorX*scale,-box.anchorY*scale,box.cellWidth*scale,box.cellHeight*scale);c.restore();
 }else art.draw(c,SKILL_BOOK[index].id,'idle',p,dir,x,y,height);
}
function evolutionUseAbility(){if(progressionPanelOpen||adminPanelOpen||state.wheel||!stats.form||!assetsReady||player.mode!=='idle')return;const b=evolutionBonus(),i=evolutionIndex[stats.form.id];if(!b.active){showToast('DESBLOQUEA '+SKILL_BOOK[i].skills[0].name.toUpperCase()+' EN EL ÁRBOL · K');return}evolutionBeginSkill(i,SKILL_BOOK[i].skills[0])}
function evolutionRecordAttack(type){
 if(!assetsReady||!stats.form||state.wheel||progressionPanelOpen||progression.skill||player.mode!=='idle')return false;
 const a=actorMetrics();if(t-(type==='L'?player.lastLight:player.lastHeavy)<(type==='L'?a.lightCooldown:a.heavyCooldown))return false;
 progression.comboLog=progression.comboLog.filter(e=>t-e.t<3.2);progression.comboLog.push({type,t});progression.comboLog=progression.comboLog.slice(-6);
 const log=progression.comboLog.map(e=>e.type).join(''),b=evolutionBonus(),i=evolutionIndex[stats.form.id];
 const skill=SKILL_BOOK[i].skills.slice(1).filter(s=>b.combos.includes(s.sequence)&&log.endsWith(s.sequence)).sort((a,b)=>b.sequence.length-a.sequence.length)[0];
 if(skill){evolutionBeginSkill(i,skill);return true;}return false;
}
function evolutionHit(c,d,damage,heavy=true){if(!d.alive)return false;return damageDummy(d,Math.round(damage*c.power.amp),heavy,{attackScale:c.power.atk,rememberTarget:false})}
function evolutionArea(c,x,y,radius,damage,{front=false,stun=0}={}){
 let hits=0;for(const d of dummyList){if(!d.alive||dist(x,y,d.x,d.y)>radius)continue;if(front&&(d.x-c.x)*c.dx+(d.y-c.y)*c.dy<0)continue;if(Ben10Speed.clipSegment({x:c.x,y:c.y},d,speedWorld(),0).blocked)continue;if(evolutionHit(c,d,damage)){hits++;if(stun)d.stunTime=Math.max(d.stunTime||0,stun)}}
 return hits;
}
function evolutionForward(c,damage,reach,width=65,once=false){let hits=0;for(const d of dummyList){if(!d.alive||(once&&c.hit.has(d)))continue;const dx=d.x-player.x,dy=d.y-player.y,along=dx*c.dx+dy*c.dy,side=Math.abs(dx*c.dy-dy*c.dx);if(along>=0&&along<=reach&&side<=width&&!Ben10Speed.clipSegment({x:player.x,y:player.y},d,speedWorld(),0).blocked){evolutionHit(c,d,damage);if(once)c.hit.add(d);hits++}}return hits}
function evolutionEffect(c,kind,x,y,radius=100,duration=.48){const z=kind==='beam'||kind==='sweep'?82:kind==='sonic'?81:kind==='flame'?25:kind==='wave'?54:38;progression.fx.push({kind,x,y,z,dx:c.dx,dy:c.dy,color:c.color,form:c.form,life:duration,duration,radius,angle:Math.atan2(c.dy,c.dx),seed:progression.fx.length})}
function smoothSkill(a,b,p){const u=clamp((p-a)/(b-a),0,1);return u*u*(3-2*u)}
function evolutionDrawBaseEffects(){
 for(const f of progression.fields){ctx.save();const color=f.source.color;if(f.kind==='pool'){ctx.fillStyle=f.source.form==='heatblast'?'#e283343d':'#9fba494a';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.x,f.y-3,f.radius,f.radius*.44,0,0,7);ctx.fill();ctx.stroke();for(let i=0;i<4;i++){ctx.fillStyle=color;ctx.fillRect(f.x+Math.sin(f.age*3+i*2)*f.radius*.65,f.y-8+Math.cos(i*3)*f.radius*.25,3,3)}}
  else{const z=f.style==='seed'?Math.sin(clamp(f.travel/f.range,0,1)*Math.PI)*55:35;ctx.translate(f.x,f.y-z);ctx.rotate(Math.atan2(f.dy,f.dx));if(f.style==='crystal')skillGem(ctx,0,0,15,color);else{ctx.fillStyle=f.style==='rock'?'#b5a78d':color;ctx.strokeStyle='#18221c';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,f.radius+3,f.radius,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#f5f5cc';ctx.fillRect(-3,-3,4,3)}}ctx.restore();
 }
 for(const e of progression.fx){const q=1-e.life/e.duration;ctx.save();ctx.globalAlpha=Math.min(1,e.life*5);ctx.strokeStyle=e.color;ctx.fillStyle=e.color;ctx.lineWidth=3;ctx.translate(e.x,e.y);
  if(e.kind==='pillar'||e.kind==='prison'){const count=e.kind==='pillar'?3:7;for(let i=0;i<count;i++){const x=(i-(count-1)/2)*17,y=Math.sin(i*2)*7,h=(e.kind==='pillar'?62:47)*(Math.sin(Math.PI*Math.min(1,q*1.6))*.45+.55);if(e.form==='wildvine'){ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x-15,-h*.7,x+5,-h);ctx.stroke();skillGem(ctx,x+5,-h,7,e.color)}else skillGem(ctx,x,y-h*.45,h*.55,e.color)}}
  else if(['beam','sweep','wave','sonic','flame'].includes(e.kind)){ctx.translate(0,-e.z);ctx.rotate(e.angle);if(e.kind==='sonic'){for(let i=0;i<3;i++){const x=(q*.8+i*.17)*e.radius;ctx.beginPath();ctx.ellipse(x,0,10+q*15,18+q*38,0,-1.4,1.4);ctx.stroke()}}else if(e.kind==='beam'||e.kind==='sweep'){ctx.strokeStyle=e.color;ctx.lineWidth=12*(1-q)+3;ctx.beginPath();ctx.moveTo(20,0);ctx.lineTo(e.radius,0);ctx.stroke();ctx.strokeStyle='#edffe0';ctx.lineWidth=3;ctx.stroke()}else{ctx.beginPath();ctx.moveTo(15,0);ctx.lineTo(e.radius,0);ctx.stroke();for(let i=0;i<8;i++){ctx.fillRect(30+i*22,-Math.sin(q*25+i)*18,5,11)}}}
  else if(e.kind==='slash'){ctx.translate(0,-e.z);ctx.rotate(e.angle);ctx.beginPath();ctx.ellipse(40,0,45+q*40,25+q*20,0,-1.3,1.3);ctx.stroke()}
  else{ctx.beginPath();ctx.ellipse(0,-4,Math.max(4,e.radius*(.2+q*.8)),Math.max(3,e.radius*(.2+q*.8)*.45),0,0,7);ctx.stroke();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=e.radius*q;ctx.fillRect(Math.cos(a)*r,Math.sin(a)*r*.45-5,4,4)}}ctx.restore();
 }
}
function skillGem(c,x,y,r,color){c.beginPath();c.moveTo(x,y-r);c.lineTo(x+r*.45,y);c.lineTo(x,y+r*.5);c.lineTo(x-r*.45,y);c.closePath();c.fillStyle=color;c.fill();c.strokeStyle='#19352e';c.lineWidth=2;c.stroke();c.strokeStyle='#e4ffe0';c.beginPath();c.moveTo(x,y-r*.8);c.lineTo(x,y+r*.3);c.stroke()}
// UI: constellation map, a live preview, clear costs and before/after statistics.
function evolutionPanelPortrait(canvas,index){if(!canvas)return;const c=canvas.getContext('2d');c.clearRect(0,0,canvas.width,canvas.height);const icon=pixelWheelIcons[ROSTER_KEYS[index]];if(icon?.complete){c.imageSmoothingEnabled=false;c.drawImage(icon,0,0,canvas.width,canvas.height)}}
function evolutionSetPortraits(){document.querySelectorAll('.evo-face').forEach(c=>evolutionPanelPortrait(c,+c.dataset.index))}
function evolutionSelectedNode(){return evolutionNodes(progression.selected).find(n=>n.id===progression.focused)||evolutionNodes(progression.selected)[0]}
function evolutionSkillForNode(n){return SKILL_BOOK[progression.selected].skills.find(s=>s.id===n.skill)}
function evolutionInputHTML(sequence){return sequence.split('').map(s=>'<kbd>'+({L:'LEVE',H:'FUERTE',F:'F'}[s])+'</kbd>').join('<span>→</span>')}
function evolutionUpdateDetails(){
 const i=progression.selected,s=SKILL_BOOK[i],n=evolutionSelectedNode(),owned=evolutionOwned(s.id,n.id),met=evolutionReqMet(s,n),skill=evolutionSkillForNode(n),b=evolutionBonus(s.id),free=evolutionFreePoints();
 document.getElementById('evoPointCount').textContent=free;document.getElementById('evoLevel').textContent='NIVEL '+stats.level;
 document.getElementById('evoInfoTitle').textContent=n.title;document.getElementById('evoNodeType').textContent=({stat:'ATRIBUTO PERMANENTE',combo:'NUEVA TÉCNICA',active:'HABILIDAD · F',mastery:'MAESTRÍA'}[n.type]);
 document.getElementById('evoInfoDescription').textContent=n.description;
 document.getElementById('evoInput').innerHTML=skill?evolutionInputHTML(skill.sequence):'<span>Entrenamiento pasivo · siempre activo</span>';
 document.getElementById('evoSkillMeta').textContent=skill?skill.cost+' ENERGÍA · '+skill.duration.toFixed(2)+' s · '+(skill.style==='barrier'?'DEFENSA':skill.contacts.length+' CONTACTO'+(skill.contacts.length>1?'S':'')):'POTENCIA TU FORMA · SIN COSTE DE ENERGÍA';
 const reqNames=n.req.map(g=>g.split('|').map(id=>evolutionNodes(i).find(n=>n.id===id)?.title).join(' o '));
 document.getElementById('evoInfoRequirements').textContent=owned?'✓ MEJORA APRENDIDA':!met?'Requiere: '+reqNames.join(' + '):'Camino disponible · '+n.cost+' punto'+(n.cost>1?'s':'');
 const buy=document.getElementById('evoBuy');buy.textContent=owned?'APRENDIDO':!met?'CAMINO BLOQUEADO':free<n.cost?'FALTAN '+(n.cost-free)+' PUNTOS':'APRENDER · '+n.cost+' PT';buy.disabled=owned||!met||free<n.cost;
 const changes=[];for(const [key,label] of [['atk','ATQ'],['vel','VEL'],['def','DEF']]){const value=b[key],add=!owned?(n.fx[key]||0):0;changes.push('<div class="evo-attribute"><span>'+label+'</span><div class="evo-meter"><i style="width:'+Math.min(100,value/2*100)+'%"></i>'+(add?'<em style="left:'+Math.min(100,value/2*100)+'%;width:'+Math.min(100,add/2*100)+'%"></em>':'')+'</div><b>'+Math.round(value*100)+'%'+(add?'<small> +'+Math.round(add*100)+'</small>':'')+'</b></div>')}
 document.getElementById('evoStats').innerHTML=changes.join('');
 document.getElementById('evoProgress').textContent=(progression.owned[s.id]?.length||0)+' / '+evolutionNodes(i).length+' APRENDIDOS';
 document.getElementById('evoMigration').hidden=!progression.migrated;
 document.querySelectorAll('.evo-node').forEach(el=>el.classList.toggle('focused',el.dataset.id===n.id));
 document.querySelectorAll('#evoLines path[data-node]').forEach(el=>el.classList.toggle('selected-path',el.dataset.node===n.id));
 if(skill)evolutionTexture(i,skill);
}
function evolutionFocusNode(id){const overview=(progression.zoom||1)<.7;progression.focused=id;progression.previewStart=performance.now();if(overview){evolutionZoom(1);requestAnimationFrame(()=>document.querySelector('.evo-node[data-id="'+id+'"]').scrollIntoView({block:'center',inline:'center',behavior:'smooth'}))}evolutionUpdateDetails()}
function evolutionZoom(value){const scroller=document.getElementById('evoGraphScroll'),viewport=document.getElementById('evoGraphViewport'),graph=document.getElementById('evoGraph');const fit=value==='fit';const z=fit?Math.min(.8,(scroller.clientWidth-24)/760,(scroller.clientHeight-18)/1360):clamp(value,.35,1.2);progression.zoom=z;viewport.style.height=1360*z+'px';viewport.style.width=Math.max(scroller.clientWidth,760*z)+'px';graph.style.transform='translateX(-50%) scale('+z+')';document.querySelector('.evo-map').classList.toggle('overview',z<.7);document.getElementById('evoFit').textContent=z<.7?'VER DETALLE':'VER FORMA';if(fit)scroller.scrollTo({top:0,left:0});else scroller.scrollTo({top:Math.max(0,evolutionSelectedNode().y*z-scroller.clientHeight*.55),left:Math.max(0,(760*z-scroller.clientWidth)/2)})}
function evolutionTreePath(index,a,b){if(index===9)return 'M'+a.x+' '+a.y+' V'+((a.y+b.y)/2)+' H'+b.x+' V'+b.y;if(index===2||index===3)return 'M'+a.x+' '+a.y+' L'+((a.x+b.x)/2)+' '+((a.y+b.y)/2)+' L'+b.x+' '+b.y;return 'M'+a.x+' '+a.y+' C'+a.x+' '+(a.y-90)+','+b.x+' '+(b.y+90)+','+b.x+' '+b.y}
function evolutionDrawTree(){
 const i=progression.selected,s=SKILL_BOOK[i],nodes=evolutionNodes(i),graph=document.getElementById('evoGraph');graph.querySelectorAll('.evo-node,.evo-branch-name').forEach(el=>el.remove());
 const shape=evolutionShape(i),lines=[];for(const n of nodes)for(const req of n.req)for(const id of req.split('|')){const parent=nodes.find(p=>p.id===id),owned=evolutionOwned(s.id,n.id),available=evolutionOwned(s.id,id);lines.push('<path d="'+evolutionTreePath(i,parent,n)+'" data-node="'+n.id+'" class="'+(owned?'learned':available?'reachable':'dormant')+'"/>')}
 document.getElementById('evoLines').innerHTML=lines.join('');
 for(const n of nodes){const el=document.createElement('button');el.type='button';el.dataset.id=n.id;el.title=n.title;el.className='evo-node '+n.type+(evolutionOwned(s.id,n.id)?' owned':evolutionReqMet(s,n)?' available':' locked');el.style.left=n.x+'px';el.style.top=n.y+'px';const icon=n.type==='active'?'F':n.type==='combo'?'✦':n.type==='mastery'?'♜':n.fx.atk?'✧':n.fx.vel?'»':'◇';el.innerHTML='<span class="evo-node-orb">'+icon+'</span><span class="evo-node-name">'+n.title+'</span><small>'+(evolutionOwned(s.id,n.id)?'✓':n.cost+' PT')+'</small>';el.setAttribute('aria-label',n.title+', '+n.cost+' puntos'+(evolutionOwned(s.id,n.id)?', aprendido':''));el.addEventListener('click',()=>evolutionFocusNode(n.id));graph.appendChild(el)}
 evolutionUpdateDetails();
}
function evolutionChangeAlien(index){progression.selected=index;progression.focused='core';progression.previewStart=performance.now();const s=SKILL_BOOK[index];document.getElementById('evolutionShell').style.setProperty('--alien',s.color);document.getElementById('evoTreeLabel').textContent=s.name;document.getElementById('evoSubtitle').textContent=s.subtitle;document.getElementById('evoGraph').dataset.form=s.id;document.querySelectorAll('.evo-tab').forEach((el,i)=>{el.classList.toggle('current',i===index);el.setAttribute('aria-selected',String(i===index))});evolutionDrawTree();const scroller=document.getElementById('evoGraphScroll');if(scroller.clientHeight)evolutionZoom(progression.zoom||1)}
function evolutionPurchase(){const s=SKILL_BOOK[progression.selected],n=evolutionSelectedNode();if(evolutionOwned(s.id,n.id)||!evolutionReqMet(s,n)||evolutionFreePoints()<n.cost)return;progression.owned[s.id]??=[];progression.owned[s.id].push(n.id);evolutionSave();evolutionDrawTree();const el=document.querySelector('.evo-node[data-id="'+n.id+'"]');el?.classList.add('just-learned');showToast(n.title.toUpperCase()+' · APRENDIDO')}
function toggleProgressionPanel(force){const open=force===undefined?!progressionPanelOpen:!!force;if(open===progressionPanelOpen)return;if(open){toggleWheel(false);keys.clear();evolutionSetPortraits();evolutionChangeAlien(evolutionIndex[stats.form?.id]??progression.selected)}progressionPanelOpen=open;const layer=document.getElementById('evolutionLayer');layer.classList.toggle('open',open);layer.setAttribute('aria-hidden',String(!open));if(open)requestAnimationFrame(()=>evolutionZoom(progression.zoom||1));lastTime=performance.now();if(!open)document.activeElement?.blur()}
function evolutionDrawPreview(now){if(!progressionPanelOpen)return;const canvas=document.getElementById('evoPreview'),c=canvas.getContext('2d'),i=progression.selected,n=evolutionSelectedNode(),s=SKILL_BOOK[i],skill=evolutionSkillForNode(n)||s.skills[0];
 c.clearRect(0,0,canvas.width,canvas.height);c.strokeStyle=s.color+'28';c.lineWidth=1;for(let j=0;j<4;j++){c.beginPath();c.ellipse(canvas.width/2,205,40+j*23,10+j*6,0,0,7);c.stroke()}
 const seconds=(now-(progression.previewStart||0))/1000,cycle=skill.duration+.65,p=Math.min(1,(seconds%cycle)/skill.duration);
 c.fillStyle='#0005';c.beginPath();c.ellipse(canvas.width/2,205,44,10,0,0,7);c.fill();if(n.skill&&skill.layout){const box=skill.layout,scale=Math.min((canvas.width-28)/box.cellWidth,178/box.cellHeight,150/160),x=(canvas.width-box.cellWidth*scale)/2+box.anchorX*scale,y=18+box.anchorY*scale;evolutionPaintSkill(c,i,skill,p,'right',x,y,160*scale)}else Ben10SkillArt.draw(c,s.id,'idle',(seconds%2)/2,'right',canvas.width/2,205,150);
 c.font='10px Consolas';c.textAlign='center';c.fillStyle='#bed0c1';c.fillText(n.skill?'ANIMACIÓN DE LA TÉCNICA':'VISTA DE '+s.name.toUpperCase(),canvas.width/2,231);
}
function evolutionInstallPanel(){const host=document.getElementById('evoTabs');SKILL_BOOK.forEach((s,i)=>{const b=document.createElement('button');b.type='button';b.className='evo-tab';b.setAttribute('role','tab');b.innerHTML='<canvas width="42" height="42" class="evo-face" data-index="'+i+'"></canvas><span>'+s.name+'<small>'+s.subtitle.split(' ')[0]+'</small></span><i>'+ROSTER_KEYS[i]+'</i>';b.addEventListener('click',()=>evolutionChangeAlien(i));host.appendChild(b)});document.getElementById('evoClose').addEventListener('click',()=>toggleProgressionPanel(false));document.getElementById('evoBuy').addEventListener('click',evolutionPurchase);document.getElementById('evoFit').addEventListener('click',()=>evolutionZoom((progression.zoom||1)<.7?1:'fit'));document.getElementById('evoZoomOut').addEventListener('click',()=>evolutionZoom((progression.zoom||1)-.15));document.getElementById('evoZoomIn').addEventListener('click',()=>evolutionZoom((progression.zoom||1)+.15));evolutionChangeAlien(0)}
evolutionLoad();evolutionInstallPanel();
const nativeDrawDummy=drawDummy;drawDummy=function(d){if(d.skillHidden)return;ctx.save();ctx.translate(0,-(d.skillLift||0));nativeDrawDummy(d);ctx.restore()};
