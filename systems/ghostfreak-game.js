// Embedded inside the game closure; an intangible ghost still obeys map bounds.
const ghostGuide=document.getElementById('ghostGuide'),ghostGuideTitle=document.getElementById('ghostGuideTitle'),ghostGuideFill=document.getElementById('ghostGuideFill');
function ghostIntangible(){return isGhostfreak()&&ghostAction.phase==='hold'&&Ben10Ghost.intangible(ghostAction.time);}
function releaseGhostCapture(){
 const s=ghostAction,target=s.capture,id=s.pointerId;s.capture=null;s.pointerId=null;
 try{if(target?.hasPointerCapture?.(id))target.releasePointerCapture(id);}catch{}
}
function syncGhostGuide(){
 const active=ghostAction.phase==='hold';ghostGuide.hidden=!active;document.body.classList.toggle('is-ghost-phasing',active);
 if(active){const left=Math.max(0,Ben10Ghost.config.maxPhase-ghostAction.time);ghostGuideTitle.textContent=(ghostIntangible()?'INTANGIBLE':'DESVANECIÉNDOSE')+' · '+left.toFixed(1).replace('.',',')+' s';ghostGuideFill.style.transform='scaleX('+(left/Ben10Ghost.config.maxPhase)+')';}
}
function materialiseGhost(){
 const s=ghostAction,p=Ben10Ghost.safeLanding({x:player.x,y:player.y},s.lastSafe||s.origin||{x:1210,y:915},(x,y)=>collide(x,y,ECTONURITE.radius),speedWorld());
 if(p){player.x=p.x;player.y=p.y;return true;}return false;
}
function cancelGhostAbility(){
 const s=ghostAction;
 if(s.phase==='hold')materialiseGhost();
 stats.setInvulnerable(false);stats.cancelReservedSpecial(s.reservation);releaseGhostCapture();
 Object.assign(s,{phase:'idle',time:0,reservation:null,hit:false,powered:false,origin:null,lastSafe:null,released:false});
 if(player.mode.startsWith('ghost')){player.mode='idle';player.modeTime=0;player.modeDur=0;player.moving=false;player.idleClock=0;}
 syncGhostGuide();
}
function beginGhostAbility(event){
 if(!isGhostfreak()||!assetsReady||state.wheel||stats.health<=0||ghostAction.phase!=='idle'||player.mode!=='idle'||t-player.lastHeavy<Ben10Ghost.config.cooldown)return false;
 faceForAction();const origin={x:player.x,y:player.y};
 Object.assign(ghostAction,{phase:'hold',time:0,origin,lastSafe:{...origin},reservation:stats.reserveComboSpecial(),pointerId:event?.pointerId??null,button:event?.button??2,capture:event?.currentTarget||null,released:!event,hit:false,powered:false});
 player.lastHeavy=t;startMode('ghostHold',Ben10Ghost.config.maxPhase);player.moving=false;
 try{ghostAction.capture?.setPointerCapture?.(event.pointerId);}catch{}
 if(!event)startGhostReveal();else syncGhostGuide();return true;
}
function releaseGhostAbility(event){
 const s=ghostAction;if(s.phase!=='hold'||event.pointerId!==s.pointerId||(event.pointerType==='mouse'&&event.button!==s.button))return;
 s.released=true;startGhostReveal();
}
function startGhostReveal(){
 const s=ghostAction;if(!isGhostfreak()||s.phase!=='hold'){cancelGhostAbility();return;}
 if(!materialiseGhost()){cancelGhostAbility();return;}
 stats.setInvulnerable(false);releaseGhostCapture();
 s.phase='reveal';s.time=0;s.hit=false;startMode('ghostReveal',Ben10Ghost.config.revealDuration);player.moving=false;
 showCombo('FANTASMÁTICO · TENTÁCULOS');syncGhostGuide();
}
function ghostTentacleHit(){
 const s=ghostAction;if(s.hit||!isGhostfreak())return;s.hit=true;
 // The prepared combo is independent of how long intangibility was held.
 s.powered=!!stats.useReservedSpecial(s.reservation);s.reservation=null;
 if(!s.powered)stats.clearCombo();
 const attack=Ben10Ghost.attack(s.powered);
 for(const d of dummyList){
  if(!d.alive||dist(player.x,player.y,d.x,d.y)>attack.reach)continue;
  const dx=d.x-player.x,dy=d.y-player.y,length=Math.hypot(dx,dy),dot=(dx*player.actionX+dy*player.actionY)/(length||1);
  if((length>30&&dot<-.1)||Ben10Speed.clipSegment({x:player.x,y:player.y},d,speedWorld(),0).blocked)continue;
  damageDummy(d,attack.damage,true);
 }
 if(s.powered)showCombo('COMBO FANTASMÁTICO · TENTÁCULOS · −20 ENERGÍA');
 spawnDust(player.x+player.actionX*38,player.y-46+player.actionY*25,9,'#bda7dd');shake=Math.min(shake,5);
}
function updateGhostAbility(dt){
 const s=ghostAction;if(s.phase==='idle')return;
 if(!isGhostfreak()){cancelGhostAbility();return;}
 s.time+=dt;player.modeTime+=dt;
 if(s.phase==='hold'){
  const input=moveInput(),active=ghostIntangible();stats.setInvulnerable(active);
  if(input.x||input.y){faceFrom(input.x,input.y);player.actionDir=player.dir;player.actionX=player.faceX;player.actionY=player.faceY;}
  const speed=ECTONURITE.speed*(active?Ben10Ghost.config.phaseSpeed:1),p=Ben10Ghost.bounds({x:player.x+input.x*speed*dt,y:player.y+input.y*speed*dt},speedWorld());
  const before={x:player.x,y:player.y};
  if(active){player.x=p.x;player.y=p.y;}else{if(!collide(p.x,player.y))player.x=p.x;if(!collide(player.x,p.y))player.y=p.y;}
  const moved=dist(before.x,before.y,player.x,player.y);player.moving=moved>.001;if(moved)player.runClock+=moved/ECTONURITE.speed*1.1;
  if(!collide(player.x,player.y))s.lastSafe={x:player.x,y:player.y};
  if(s.released||s.time>=Ben10Ghost.config.maxPhase)startGhostReveal();else syncGhostGuide();
 }else if(s.phase==='reveal'){
  stats.setInvulnerable(false);
  if(!s.hit&&s.time>=Ben10Ghost.config.contactTime)ghostTentacleHit();
  if(s.time>=Ben10Ghost.config.revealDuration){stats.cancelReservedSpecial(s.reservation);s.reservation=null;s.phase='idle';s.time=0;player.mode='idle';player.modeTime=0;player.modeDur=0;player.moving=false;player.idleClock=0;player.lastHeavy=t;}
 }
}
