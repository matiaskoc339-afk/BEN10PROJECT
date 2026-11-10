// Embedded inside the game closure. Cannonbolt's normal movement is a ball.
const cannonGuide=document.getElementById('cannonGuide'),cannonGuideTitle=document.getElementById('cannonGuideTitle'),cannonGuideFill=document.getElementById('cannonGuideFill');
function resetCannonMotion(){Object.assign(cannonMotion,{curl:0,closing:false,fullOpening:false,distance:0});}
function updateCannonMotion(dt,moving,moved){
 if(!isCannonbolt()||cannonAction.phase!=='idle')return;
 if(player.mode!=='idle'&&player.mode!=='omnitrix')return;
 const closing=moving&&player.mode==='idle';
 if(!closing&&cannonMotion.closing)cannonMotion.fullOpening=cannonMotion.curl>=.999;
 cannonMotion.closing=closing;cannonMotion.curl=clamp(cannonMotion.curl+(closing?1:-1)*dt/(closing?.18:.2),0,1);cannonMotion.distance+=moved;
}
function syncCannonGuide(){
 const charging=cannonAction.phase==='charge';cannonGuide.hidden=!charging;document.body.classList.toggle('is-cannon-charging',charging);
 if(charging){const power=Ben10Cannon.chargedAttack(cannonAction.time,!!cannonAction.reservation).power;cannonGuideTitle.textContent=(cannonAction.reservation?'COMBO · IDA Y VUELTA':'EMBESTIDA · CARGANDO')+' · '+Math.round(power*100)+'%';cannonGuideFill.style.transform='scaleX('+Math.max(.04,power)+')';}
}
function releaseCannonCapture(){
 const target=cannonAction.capture,id=cannonAction.pointerId;cannonAction.capture=null;cannonAction.pointerId=null;
 try{if(target?.hasPointerCapture?.(id))target.releasePointerCapture(id);}catch{}
}
function cannonLanding(origin,heading){
 if(!collide(origin.x,origin.y))return {...origin};
 for(let radius=8;radius<=88;radius+=8)for(let i=0;i<16;i++){
  const angle=Math.atan2(heading?.y??0,heading?.x??1)+i*Math.PI/8,point={x:origin.x+Math.cos(angle)*radius,y:origin.y+Math.sin(angle)*radius};
  if(!collide(point.x,point.y)&&!Ben10Speed.clipSegment(origin,point,speedWorld(),Ben10Cannon.config.radius).blocked)return point;
 }
 return {...origin};
}
function cancelCannonAbility(){
 const active=cannonAction.phase!=='idle';
 if(player.mode==='cannonRush'||player.mode==='cannonRecover'){const p=cannonLanding({x:player.x,y:player.y},cannonAction.rush?.heading);player.x=p.x;player.y=p.y;}
 stats.cancelReservedSpecial(cannonAction.reservation);releaseCannonCapture();
 Object.assign(cannonAction,{phase:'idle',time:0,rush:null,reservation:null,released:false,kind:null,attack:null,hitCount:0,impactTime:0});
 if(player.mode.startsWith('cannon')){player.mode='idle';player.modeTime=0;player.modeDur=0;player.moving=false;player.idleClock=0;}
 if(active){cannonMotion.closing=false;cannonMotion.fullOpening=true;}
 syncCannonGuide();
}
function cannonCanStart(){return isCannonbolt()&&assetsReady&&!state.wheel&&stats.health>0&&cannonAction.phase==='idle'&&player.mode!=='omnitrix'&&player.mode!=='hurt';}
function cannonLightAttack(){
 if(!cannonCanStart())return;
 if(bufferAttack('light'))return;
 if(player.mode!=='idle'||t-player.lastLight<ARBURIAN.lightCooldown)return;
 faceForAction();player.lightN=t-player.lastLight<.8?player.lightN%3+1:1;player.lastLight=t;
 const s=cannonAction,n=player.lightN;
 if(n===3){Object.assign(s,{phase:'fold',time:0,kind:'light',initialCurl:cannonMotion.curl,rush:null,reservation:null,hitCount:0,impactTime:0});startMode('cannonFold',Math.max(.04,.18*(1-cannonMotion.curl)));showCombo('CANNONBOLT · GARRA, GARRA Y EMBESTIDA');}
 else if(cannonMotion.curl>.001){Object.assign(s,{phase:'clawUnfold',time:0,initialCurl:cannonMotion.curl,pendingClaw:n});startMode('cannonClawUnfold',Math.max(.04,.16*cannonMotion.curl));}
 else{cannonMotion.curl=0;startMode('light'+n,ARBURIAN.lightDurations[n-1]);showCombo('CANNONBOLT · GARRA '+(n===1?'IZQUIERDA':'DERECHA'));}
}
function beginCannonCharge(event){
 if(!cannonCanStart()||t-player.lastHeavy<ARBURIAN.heavyCooldown)return false;
 faceForAction();Object.assign(cannonAction,{phase:'charge',time:0,kind:'heavy',initialCurl:cannonMotion.curl,reservation:stats.reserveComboSpecial(),released:!event,releaseTime:event?null:0,pointerId:event?.pointerId??null,button:event?.button??2,capture:event?.currentTarget||null,rush:null,hitCount:0,impactTime:0});
 player.lastHeavy=t;startMode('cannonCharge',Ben10Cannon.config.maxCharge);player.moving=false;
 try{cannonAction.capture?.setPointerCapture?.(event.pointerId);}catch{}syncCannonGuide();return true;
}
function releaseCannonCharge(event){
 const s=cannonAction;if(s.phase!=='charge'||event.pointerId!==s.pointerId||(event.pointerType==='mouse'&&event.button!==s.button))return;
 s.released=true;s.releaseTime=s.time;releaseCannonCapture();if(s.time>=Ben10Cannon.config.minCharge)startCannonRush();
}
function cannonDodge(){
 if(cannonAction.phase!=='idle')cancelCannonAbility();
 if(!cannonCanStart()||t-player.lastDash<ARBURIAN.dash.cooldown)return;
 faceForAction();player.lastDash=t;Object.assign(cannonAction,{phase:'fold',time:0,kind:'dash',initialCurl:cannonMotion.curl,reservation:null,hitCount:0,impactTime:0});startMode('cannonFold',Math.max(.04,.12*(1-cannonMotion.curl)));
}
function startCannonRush(){
 const s=cannonAction;if(!isCannonbolt()||!['charge','fold'].includes(s.phase)){cancelCannonAbility();return;}
 const powered=s.kind==='heavy'&&!!stats.useReservedSpecial(s.reservation);s.reservation=null;
 if(!isCannonbolt()){cancelCannonAbility();updateStats(0);return;}
 const chargeTime=s.released?Math.max(Ben10Cannon.config.minCharge,s.releaseTime??0):Ben10Cannon.config.maxCharge;
 s.attack=s.kind==='heavy'?Ben10Cannon.chargedAttack(chargeTime,powered):s.kind==='light'?Ben10Cannon.lightAttack():Ben10Cannon.dodgeAttack();
 if(s.kind==='heavy'&&!powered)stats.clearCombo();
 s.rush=Ben10Cannon.createRush({x:player.x,y:player.y},player.actionX,player.actionY,speedWorld(),s.attack);s.phase='rush';s.time=0;s.hitCount=0;s.impactTime=0;s.distance=0;cannonMotion.curl=1;
 releaseCannonCapture();startMode('cannonRush',Math.max(.01,s.rush.points.reduce((sum,p,i)=>sum+(i?dist(p.x,p.y,s.rush.points[i-1].x,s.rush.points[i-1].y):0),0)/s.attack.speed));
 showCombo(powered?'COMBO CANNONBOLT · IDA Y VUELTA · −20 ENERGÍA':s.kind==='light'?'CANNONBOLT · EMBESTIDA DE COMBO':s.kind==='heavy'?'CANNONBOLT · EMBESTIDA CARGADA':'CANNONBOLT · ESQUIVA RODANTE');syncCannonGuide();
}
function beginCannonRecovery(){
 const s=cannonAction,input=moveInput();if(s.kind==='light'&&!s.hitCount)stats.clearCombo();
 s.keepBall=!!(input.x||input.y);s.from={x:player.x,y:player.y};s.to=cannonLanding(s.from,s.rush.heading);s.phase='recover';s.time=0;
 startMode('cannonRecover',s.keepBall?.1:.2);if(s.kind==='heavy')player.lastHeavy=t;
}
function updateCannonAbility(dt){
 const s=cannonAction;if(s.phase==='idle')return;
 if(!isCannonbolt()){cancelCannonAbility();return;}
 s.time+=dt;player.modeTime+=dt;s.impactTime=Math.max(0,s.impactTime-dt);
 if(s.phase==='clawUnfold'){
  cannonMotion.curl=s.initialCurl*(1-clamp(s.time/player.modeDur,0,1));
  if(s.time>=player.modeDur){s.phase='idle';cannonMotion.curl=0;startMode('light'+s.pendingClaw,ARBURIAN.lightDurations[s.pendingClaw-1]);}
 }else if(s.phase==='fold'){
  cannonMotion.curl=lerp(s.initialCurl,1,clamp(s.time/player.modeDur,0,1));if(s.time>=player.modeDur)startCannonRush();
 }else if(s.phase==='charge'){
  cannonMotion.curl=lerp(s.initialCurl,1,clamp(s.time/.22,0,1));syncCannonGuide();
  if((s.released&&s.time>=Ben10Cannon.config.minCharge)||s.time>=Ben10Cannon.config.maxCharge)startCannonRush();
 }else if(s.phase==='rush'){
  const previous=s.rush.distance;
  s.rush.step(dt,speedWorld(),dummyList,d=>{
   if(!s.attack.damage)return;damageDummy(d,s.attack.damage,true);s.hitCount++;s.impactTime=.1;shake=Math.min(shake,7);spawnDust(d.x,d.y-22,5,'#f5ca69');
   if(s.kind==='light'&&s.hitCount===1){stats.recordLightHit();if(stats.specialReady)showCombo('COMBO CANNONBOLT LISTO · CLIC DERECHO');}
  });
  s.distance+=s.rush.distance-previous;player.x=s.rush.position.x;player.y=s.rush.position.y;faceFrom(s.rush.heading.x,s.rush.heading.y);player.actionDir=player.dir;player.actionX=player.faceX;player.actionY=player.faceY;
  if(!s.rush.active)beginCannonRecovery();
 }else if(s.phase==='recover'){
  const u=clamp(s.time/player.modeDur,0,1),ease=1-(1-u)*(1-u);player.x=lerp(s.from.x,s.to.x,ease);player.y=lerp(s.from.y,s.to.y,ease);cannonMotion.curl=s.keepBall?1:1-u;
  if(u>=1){const kind=s.kind;cannonMotion.distance+=s.distance||0;cannonMotion.fullOpening=false;cannonMotion.closing=s.keepBall;s.phase='idle';s.rush=null;s.kind=null;player.mode='idle';player.modeTime=0;player.modeDur=0;player.moving=false;player.idleClock=0;if(kind==='heavy')player.lastHeavy=t;}
 }
}
function drawCannonCharge(){
 if(cannonAction.phase!=='charge')return;
 const attack=Ben10Cannon.chargedAttack(cannonAction.time,!!cannonAction.reservation),start={x:player.x,y:player.y},end=Ben10Speed.clipSegment(start,{x:start.x+player.actionX*attack.distance,y:start.y+player.actionY*attack.distance},speedWorld(),21).end;
 ctx.save();ctx.strokeStyle='#ffd77b';ctx.lineWidth=3;ctx.setLineDash([8,8]);ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,end.y);ctx.stroke();ctx.setLineDash([]);ctx.fillStyle='#ffdc82';ctx.beginPath();ctx.arc(end.x,end.y,6,0,Math.PI*2);ctx.fill();ctx.restore();
}
