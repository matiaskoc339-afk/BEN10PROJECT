// Embedded inside the game closure; geometry lives in speed-route.js.
const speedGuide=document.getElementById('speedGuide'),speedGuideTitle=document.getElementById('speedGuideTitle'),speedGuideHint=document.getElementById('speedGuideHint'),speedGuideFill=document.getElementById('speedGuideFill');
function speedWorld(){return campaignPhysicsWorld();}
function speedPointerWorld(event){const r=game.getBoundingClientRect();return campaignPointerWorld((event.clientX-r.left)*screenW/r.width,(event.clientY-r.top)*screenH/r.height);}
function releaseSpeedCapture(){
 const target=speedAction.capture,id=speedAction.pointerId;speedAction.capture=null;speedAction.pointerId=null;
 try{if(target?.hasPointerCapture?.(id))target.releasePointerCapture(id);}catch{}
}
function syncSpeedGuide(){
 const s=speedAction,planning=s.phase==='plan',charging=s.phase==='charge';
 speedGuide.hidden=!(planning||charging);document.body.classList.toggle('is-speed-planning',planning||charging);
 if(speedGuide.hidden){s.guideStamp='';return;}
 const left=Math.max(0,Ben10Speed.config.holdThreshold+Ben10Speed.config.planningTime-s.time),stamp=s.phase+Math.ceil(left*10)+(s.reservation?'special':'');
 if(s.guideStamp!==stamp){s.guideStamp=stamp;speedGuideTitle.textContent=planning?'TRAZA TU RECORRIDO · '+left.toFixed(1).replace('.',',')+' s':'PREPARANDO IMPULSO';speedGuideHint.textContent=planning?(s.reservation?'COMBO · RECORRIDO + REMATE · ':'')+'Suelta para correr · al terminar el tiempo arranca solo':'Mantén y mueve para trazar · clic breve: ida y vuelta';}
 speedGuideFill.style.transform='scaleX('+(planning?Math.min(1,left/Ben10Speed.config.planningTime):1)+')';
}
function speedSafeLanding(origin,heading){
 if(!collide(origin.x,origin.y))return {...origin};
 for(let radius=8;radius<=72;radius+=8)for(let i=0;i<16;i++){
  const angle=Math.atan2(heading?.y||0,heading?.x||1)+i*Math.PI/8,candidate={x:origin.x+Math.cos(angle)*radius,y:origin.y+Math.sin(angle)*radius};
  if(!collide(candidate.x,candidate.y)&&!Ben10Speed.clipSegment(origin,candidate,speedWorld()).blocked)return candidate;
 }
 return {...origin};
}
function cancelSpeedAbility(){
 if(player.mode==='speedRush'||player.mode==='speedFinish'||player.mode==='speedBrake'){const landing=speedSafeLanding({x:player.x,y:player.y},speedAction.rush?.heading);player.x=landing.x;player.y=landing.y;}
 stats.cancelReservedSpecial(speedAction.reservation);releaseSpeedCapture();
 Object.assign(speedAction,{phase:'idle',time:0,plan:null,rush:null,reservation:null,trail:[],damage:34,lastPointer:null,powered:false,finisherHit:false,passHits:0});
 if(player.mode.startsWith('speed')){player.mode='idle';player.modeTime=0;player.modeDur=0;player.moving=false;player.idleClock=0;}
 syncSpeedGuide();
}
function beginSpeedAbility(event){
 if(!isXLR8()||!assetsReady||state.wheel||stats.health<=0||speedAction.phase!=='idle'||player.mode==='omnitrix'||player.mode==='dash'||player.mode==='hurt'||t-player.lastHeavy<KINECELERAN.heavyCooldown)return false;
 faceForAction();const reservation=stats.reserveComboSpecial();
 Object.assign(speedAction,{phase:'charge',time:0,plan:new Ben10Speed.RoutePlan({x:player.x,y:player.y}),rush:null,reservation,trail:[],damage:34,lastPointer:null,pointerId:event?.pointerId??null,button:event?.button??2,capture:event?.currentTarget||null,guideStamp:'',powered:false,finisherHit:false,passHits:0});
 player.lastHeavy=t;startMode('speedCharge',Ben10Speed.config.holdThreshold+Ben10Speed.config.planningTime);player.moving=false;
 if(event){speedAction.lastPointer=speedPointerWorld(event);speedAction.plan.add(speedAction.lastPointer,speedWorld());try{speedAction.capture?.setPointerCapture?.(event.pointerId);}catch{}}
 syncSpeedGuide();return true;
}
function moveSpeedPointer(event){
 if(!['charge','plan'].includes(speedAction.phase)||event.pointerId!==speedAction.pointerId)return;
 speedAction.lastPointer=speedPointerWorld(event);speedAction.plan.add(speedAction.lastPointer,speedWorld());
}
function releaseSpeedPointer(event){
 if(!['charge','plan'].includes(speedAction.phase)||event.pointerId!==speedAction.pointerId||(event.pointerType==='mouse'&&event.button!==speedAction.button))return;
 moveSpeedPointer(event);startSpeedRush(speedAction.time<Ben10Speed.config.holdThreshold?'tap':'route');
}
function startSpeedRush(kind){
 if(!isXLR8()||!['charge','plan'].includes(speedAction.phase)){cancelSpeedAbility();return;}
 const s=speedAction;
 if(s.lastPointer)s.plan.add(s.lastPointer,speedWorld(),true);
 const points=kind==='route'&&s.plan.length>=24?s.plan.points:Ben10Speed.quickPath({x:player.x,y:player.y},player.actionX,player.actionY,speedWorld());
 const powered=!!stats.useReservedSpecial(s.reservation);s.reservation=null;
 if(!isXLR8()){cancelSpeedAbility();updateStats(0);return;}
 if(!powered)stats.clearCombo();s.powered=powered;s.damage=powered?58:34;s.rush=new Ben10Speed.Rush(points);s.phase='rush';s.time=0;s.trail=[];
 releaseSpeedCapture();startMode('speedRush',Math.max(.01,points.reduce((sum,p,i)=>sum+(i?dist(points[i-1].x,points[i-1].y,p.x,p.y):0),0)/Ben10Speed.config.rushSpeed));player.moving=true;
 showCombo(powered?'VELOCIDAD POTENCIADA · −20 ENERGÍA':kind==='tap'?'XLR8 · IDA Y VUELTA':'XLR8 · RECORRIDO VELOZ');syncSpeedGuide();
}
function speedFinisherTargets(){
 return dummyList.filter(d=>d.alive&&dist(player.x,player.y,d.x,d.y)<=108&&!Ben10Speed.clipSegment({x:player.x,y:player.y},d,speedWorld()).blocked);
}
function beginSpeedBrake(){
 const s=speedAction;s.brakeFrom={x:player.x,y:player.y};s.brakeTo=speedSafeLanding(s.brakeFrom,s.rush.heading);
 s.phase='brake';s.time=0;startMode('speedBrake',.18);player.lastHeavy=t;
}
function beginSpeedFinisher(){
 const s=speedAction,target=speedFinisherTargets().sort((a,b)=>dist(player.x,player.y,a.x,a.y)-dist(player.x,player.y,b.x,b.y))[0];
 if(target&&dist(player.x,player.y,target.x,target.y)>.001)faceFrom(target.x-player.x,target.y-player.y);
 s.phase='finish';s.time=0;s.finisherHit=false;startMode('speedFinish',.3);showCombo('COMBO XLR8 · PATADA RELÁMPAGO');
}
function updateSpeedAbility(dt){
 const s=speedAction;if(s.phase==='idle')return;
 if(!isXLR8()){cancelSpeedAbility();return;}
 s.time+=dt;player.modeTime+=dt;
 for(const point of s.trail)point.age+=dt;s.trail=s.trail.filter(point=>point.age<.14);
 if(s.phase==='charge'||s.phase==='plan'){
  if(s.time>=Ben10Speed.config.holdThreshold)s.phase='plan';
  if(s.time>=Ben10Speed.config.holdThreshold+Ben10Speed.config.planningTime)startSpeedRush('route');
  syncSpeedGuide();return;
 }
 if(s.phase==='rush'){
  s.rush.step(dt,speedWorld(),dummyList,d=>{damageDummy(d,s.damage,false);s.passHits++;if(s.passHits>1)showCombo('XLR8 · '+s.passHits+' IMPACTOS EN RECORRIDO');shake=Math.min(shake,4);spawnDust(d.x,d.y-38,3,'#82dffc');});
  player.x=s.rush.position.x;player.y=s.rush.position.y;faceFrom(s.rush.heading.x,s.rush.heading.y);player.actionDir=player.dir;player.actionX=player.faceX;player.actionY=player.faceY;
  for(const segment of s.rush.segments)s.trail.push({...segment.from,age:0},{...segment.to,age:0});
  if(!s.rush.active){if(s.powered)beginSpeedFinisher();else beginSpeedBrake();}
 }else if(s.phase==='finish'){
  if(!s.finisherHit&&s.time>=.15){
   s.finisherHit=true;
   for(const d of speedFinisherTargets()){
    const dx=d.x-player.x,dy=d.y-player.y,length=Math.hypot(dx,dy),dot=(dx*player.actionX+dy*player.actionY)/(length||1);
    if(length<=32||dot>=.35)damageDummy(d,28,false);
   }
   pieces.push({type:'shockwave',x:player.x,y:player.y,vx:0,vy:0,life:.22,max:.22,size:72,color:'#a1efff'});
  }
  if(s.time>=.3)beginSpeedBrake();
 }else if(s.phase==='brake'){const u=Math.min(1,s.time/.18),ease=1-(1-u)*(1-u);player.x=lerp(s.brakeFrom.x,s.brakeTo.x,ease);player.y=lerp(s.brakeFrom.y,s.brakeTo.y,ease);if(s.time>=.18){s.trail=[];s.phase='idle';s.rush=null;s.plan=null;player.mode='idle';player.modeTime=0;player.modeDur=0;player.moving=false;player.idleClock=0;player.lastHeavy=t;}}
}
function drawSpeedRoute(){
 const s=speedAction;
 if(s.phase==='plan'&&s.plan){
  const points=s.plan.points;ctx.save();ctx.strokeStyle='#84e7ff';ctx.lineWidth=3;ctx.setLineDash([8,6]);ctx.lineDashOffset=-t*45;ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();ctx.setLineDash([]);
  const end=points[points.length-1];ctx.fillStyle=s.plan.blocked?'#ffb080':'#a9f4ff';ctx.beginPath();ctx.arc(end.x,end.y,7,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#124a68';ctx.lineWidth=2;ctx.stroke();
  for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=dist(a.x,a.y,b.x,b.y);if(length<50)continue;const angle=Math.atan2(b.y-a.y,b.x-a.x),x=(a.x+b.x)/2,y=(a.y+b.y)/2;ctx.save();ctx.translate(x,y);ctx.rotate(angle);ctx.beginPath();ctx.moveTo(-5,-4);ctx.lineTo(2,0);ctx.lineTo(-5,4);ctx.strokeStyle='#baf8ff';ctx.stroke();ctx.restore();}ctx.restore();
 }
 ctx.save();ctx.lineCap='round';
 for(let i=1;i<s.trail.length;i++){const a=s.trail[i-1],b=s.trail[i];ctx.globalAlpha=Math.max(0,1-b.age/.14)*.65;ctx.strokeStyle='#70d8ff';ctx.lineWidth=5;ctx.beginPath();ctx.moveTo(a.x,a.y-24);ctx.lineTo(b.x,b.y-24);ctx.stroke();ctx.strokeStyle='#d2fbff';ctx.lineWidth=1.5;ctx.stroke();}ctx.restore();
}
