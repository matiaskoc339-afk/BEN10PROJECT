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
 releaseGhostTarget();
 if(s.phase==='hold')materialiseGhost();
 stats.setInvulnerable(false);stats.cancelReservedSpecial(s.reservation);releaseGhostCapture();
 Object.assign(s,{phase:'idle',time:0,reservation:null,hit:false,powered:false,origin:null,lastSafe:null,released:false,pendingPress:null,committed:false,struck:false});
 if(player.mode.startsWith('ghost')){player.mode='idle';player.modeTime=0;player.modeDur=0;player.moving=false;player.idleClock=0;}
 syncGhostGuide();
}
function beginGhostAbility(event){
 if(!isGhostfreak()||!assetsReady||state.wheel||stats.health<=0||ghostAction.phase!=='idle'||t-player.lastHeavy<Ben10Ghost.config.cooldown)return false;
 if(player.mode.startsWith('light')){
  bufferAttack('heavy');
  if(player.bufferedAttack?.type!=='heavy')return false;
  ghostAction.pendingPress=event?{pointerId:event.pointerId,button:event.button,pointerType:event.pointerType,currentTarget:event.currentTarget,released:false,expires:player.bufferedAttack.expires}:null;return true;
 }
 if(player.mode!=='idle')return false;
 const pending=ghostAction.pendingPress;ghostAction.pendingPress=null;
 if(!event&&pending&&pending.expires>=t&&!pending.released)event=pending;
 faceForAction();const origin={x:player.x,y:player.y};
 Object.assign(ghostAction,{phase:'hold',time:0,origin,lastSafe:{...origin},reservation:stats.reserveComboSpecial(),pointerId:event?.pointerId??null,button:event?.button??2,capture:event?.currentTarget||null,released:!event,hit:false,powered:false,grab:null,committed:false,struck:false});
 player.lastHeavy=t;startMode('ghostHold',Ben10Ghost.config.maxPhase);player.moving=false;
 try{ghostAction.capture?.setPointerCapture?.(event.pointerId);}catch{}
 if(!event)startGhostReveal();else syncGhostGuide();return true;
}
function releaseGhostAbility(event){
 const s=ghostAction;
 if(s.phase==='idle'&&s.pendingPress&&event.pointerId===s.pendingPress.pointerId&&(event.pointerType!=='mouse'||event.button===s.pendingPress.button)){s.pendingPress.released=true;return;}
 if(s.phase!=='hold'||event.pointerId!==s.pointerId||(event.pointerType==='mouse'&&event.button!==s.button))return;
 s.released=true;startGhostReveal();
}
function startGhostReveal(){
 const s=ghostAction;if(!isGhostfreak()||s.phase!=='hold'){cancelGhostAbility();return;}
 if(!materialiseGhost()){cancelGhostAbility();return;}
 stats.setInvulnerable(false);releaseGhostCapture();
 const combo=!!s.reservation&&s.reservation===stats.specialReservation&&stats.energy>=stats.config.specialCost;
 s.phase=combo?'combo':'reveal';s.time=0;s.hit=false;s.committed=false;s.struck=false;
 startMode(combo?'ghostCombo':'ghostReveal',combo?Ben10Ghost.config.comboDuration:Ben10Ghost.config.revealDuration);player.moving=false;
 showCombo(combo?'COMBO FANTASMÁTICO · ATRAPAR Y EXPULSAR':'FANTASMÁTICO · TENTÁCULOS');syncGhostGuide();
}
function ghostTentacleHit(){
 const s=ghostAction;if(s.hit||!isGhostfreak())return;s.hit=true;
 stats.cancelReservedSpecial(s.reservation);s.reservation=null;s.powered=false;stats.clearCombo();
 const attack=Ben10Ghost.attack();
 for(const d of dummyList){
  if(!d.alive||dist(player.x,player.y,d.x,d.y)>attack.reach)continue;
  const dx=d.x-player.x,dy=d.y-player.y,length=Math.hypot(dx,dy),dot=(dx*player.actionX+dy*player.actionY)/(length||1);
  if((length>30&&dot<-.1)||Ben10Speed.clipSegment({x:player.x,y:player.y},d,speedWorld(),0).blocked)continue;
  damageDummy(d,attack.damage,true);
 }
 spawnDust(player.x+player.actionX*38,player.y-46+player.actionY*25,9,'#bda7dd');shake=Math.min(shake,5);
}
function ghostCavity(){
 return {down:{x:-4,y:-54,rx:11,ry:16},up:{x:0,y:-52,rx:6,ry:14},right:{x:-9,y:-53,rx:8,ry:16},left:{x:9,y:-53,rx:8,ry:16}}[player.actionDir];
}
function releaseGhostTarget(){
 const g=ghostAction.grab;if(g){g.target.x=g.origin.x;g.target.y=g.origin.y;ghostAction.grab=null;}
}
function beginGhostGrab(){
 const s=ghostAction;s.committed=true;s.powered=!!stats.useReservedSpecial(s.reservation);s.reservation=null;
 if(!isGhostfreak()){cancelGhostAbility();updateStats(0);return;}
 if(!s.powered){stats.clearCombo();s.phase='reveal';s.hit=false;player.mode='ghostReveal';player.modeDur=Ben10Ghost.config.revealDuration;return;}
 const cavity=ghostCavity(),inside=Ben10Ghost.bounds({x:player.x+cavity.x+player.actionX*9,y:player.y+player.actionY*18},speedWorld());
 const candidates=dummyList.filter(d=>{
  if(!d.alive)return false;const dx=d.x-player.x,dy=d.y-player.y,length=Math.hypot(dx,dy),dot=(dx*player.actionX+dy*player.actionY)/(length||1);
  if(length>Ben10Ghost.config.comboReach||(length>30&&dot<.2)||Ben10Speed.clipSegment({x:player.x,y:player.y},d,speedWorld(),0).blocked)return false;
  const world={...speedWorld(),obstacles:[...props,...dummyList.filter(other=>other!==d&&other.alive).map(other=>({x:other.x,y:other.y,r:16,block:true}))]};
  return !Ben10Speed.clipSegment(d,inside,world,16).blocked;
 }).sort((a,b)=>dist(player.x,player.y,a.x,a.y)-dist(player.x,player.y,b.x,b.y));
 if(candidates[0]){const target=candidates[0];s.grab={target,origin:{x:target.x,y:target.y},inside,pull:0,scale:1,lift:0};}
 showCombo('COMBO FANTASMÁTICO · CAPTURA · −20 ENERGÍA');
}
function updateGhostGrab(){
 const s=ghostAction,g=s.grab;if(!g)return;
 if(!dummyList.includes(g.target)||(!g.target.alive&&!s.struck)){releaseGhostTarget();return;}
 g.pull=Ben10Ghost.comboPose(s.time).pull;g.scale=lerp(1,.78,g.pull);
 g.target.x=lerp(g.origin.x,g.inside.x,g.pull);g.target.y=lerp(g.origin.y,g.inside.y,g.pull);
 const cavity=ghostCavity(),float=9+Math.sin(t*4)*2.5,insideY=player.y-float+cavity.y+50*g.scale;
 g.lift=g.target.y-lerp(g.origin.y,insideY,g.pull);
 if(!s.struck&&s.time+1e-8>=Ben10Ghost.config.releaseTime){s.struck=true;damageDummy(g.target,Ben10Ghost.config.comboDamage,true);shake=Math.min(shake,5);}
}
function finishGhostAttack(){
 const s=ghostAction;releaseGhostTarget();stats.cancelReservedSpecial(s.reservation);s.reservation=null;s.phase='idle';s.time=0;
 player.mode='idle';player.modeTime=0;player.modeDur=0;player.moving=false;player.idleClock=0;player.lastHeavy=t;
}
function drawGhostGrabTarget(){
 const g=ghostAction.grab;if(!g||ghostAction.phase!=='combo')return;
 ctx.save();ctx.translate(g.target.x,g.target.y-g.lift);ctx.scale(g.scale,g.scale);
 drawDummy({...g.target,x:0,y:0,shake:0,health:100,alive:true},{airborne:true,hideHealth:true});ctx.restore();
}
function drawGhostGrabOverlay(){
 const s=ghostAction,g=s.grab;if(!g||s.phase!=='combo')return;
 const c=ghostCavity(),float=9+Math.sin(t*4)*2.5,cx=player.x+c.x,cy=player.y-float+c.y;
 // A small view into the hollow shows part of the target inside; the coat and
 // existing coils still cover the rest of the body instead of drawing it twice.
 if(g.pull>.45){ctx.save();ctx.beginPath();ctx.ellipse(cx,cy,c.rx,c.ry,0,0,Math.PI*2);ctx.clip();drawGhostGrabTarget();ctx.restore();}
 const tx=g.target.x,ty=g.target.y-g.lift-50*g.scale,extension=lerp(29,10,g.pull);
 ctx.save();ctx.lineCap='round';
 for(const side of [-1,1]){
  const sx=cx+player.actionX*extension+player.actionY*side*8,sy=cy+side*7;
  const bend=side*(12+Math.sin(t*12)*2)*(1-g.pull*.6);ctx.beginPath();ctx.moveTo(sx,sy);ctx.bezierCurveTo(sx+player.actionX*14,sy+bend,tx-player.actionX*20,ty+bend,tx+side*8*g.scale,ty+side*5);
  ctx.setLineDash([]);ctx.strokeStyle='#060b13';ctx.lineWidth=8;ctx.stroke();ctx.strokeStyle='#253d52';ctx.lineWidth=6;ctx.stroke();ctx.strokeStyle='#d0d9cf';ctx.lineWidth=4;ctx.setLineDash([6,7]);ctx.lineDashOffset=-s.time*14;ctx.stroke();
 }
 ctx.restore();
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
  if(s.time+1e-8>=Ben10Ghost.config.revealDuration)finishGhostAttack();
 }else if(s.phase==='combo'){
  stats.setInvulnerable(false);
  if(!s.committed&&s.time+1e-8>=Ben10Ghost.config.grabTime)beginGhostGrab();
  if(s.phase!=='combo')return;
  updateGhostGrab();
  if(s.time+1e-8>=Ben10Ghost.config.comboDuration)finishGhostAttack();
 }
}
