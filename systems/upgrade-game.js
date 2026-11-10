// Upgrade deforms during attacks and reforms onto clear ground after a blade rush.
function upgradeLanding(origin,heading){
 if(!collide(origin.x,origin.y))return {...origin};
 for(let radius=8;radius<=96;radius+=8)for(let i=0;i<16;i++){const angle=Math.atan2(heading?.y??0,heading?.x??1)+i*Math.PI/8,point={x:origin.x+Math.cos(angle)*radius,y:origin.y+Math.sin(angle)*radius};if(!collide(point.x,point.y)&&!Ben10Speed.clipSegment(origin,point,speedWorld(),Ben10Upgrade.config.radius).blocked)return point;}
 return upgradeAction.origin&&!collide(upgradeAction.origin.x,upgradeAction.origin.y)?{...upgradeAction.origin}:{...origin};
}
function cancelUpgradeAction(resetMode=false){
 if(upgradeAction.rush){const p=upgradeLanding({x:player.x,y:player.y},upgradeAction.rush.heading);player.x=p.x;player.y=p.y;}
 stats.cancelReservedSpecial(upgradeAction.reservation);Object.assign(upgradeAction,{reservation:null,rush:null,phase:'idle',time:0,origin:null});
 if(resetMode&&isUpgrade()&&/^(light|heavy)/.test(player.mode)){player.mode='idle';player.modeTime=0;player.modeDur=0;player.bufferedAttack=null;player.specialQueued=false;player.specialAnimation=false;player.moving=false;player.idleClock=0;}
}
function upgradeHeavyAttack(){
 if(!isUpgrade()||!assetsReady||state.wheel||stats.health<=0)return;
 if(bufferAttack('heavy'))return;
 if(player.mode!=='idle'||t-player.lastHeavy<GALVANIC.heavyCooldown)return;
 cancelUpgradeAction();faceForAction();upgradeAction.reservation=stats.reserveComboSpecial();player.lastHeavy=t;player.specialAnimation=!!upgradeAction.reservation;player.specialQueued=player.specialAnimation;startMode('heavy1',player.specialAnimation?1:GALVANIC.heavyDuration);
 showCombo(player.specialAnimation?'COMBO ULTRA T · MOLDEANDO CUCHILLA':'ULTRA T · RAYO OCULAR');
}
function emitUpgradeLaser(){
 const direction={down:0,up:1,right:2,left:3}[player.actionDir],eye=UPGRADE_EYES[direction][3],scale=GALVANIC.scale/upgradeAtlas.resolutionScale;
 eyeBeams.fire({x:player.x,y:player.y},player.actionX,player.actionY,speedWorld(),dummyList,(d,damage)=>{damageDummy(d,damage,true);shake=Math.min(shake,5);},{x:eye.x*scale,y:eye.y*scale});stats.clearCombo();spawnDust(player.x+eye.x*scale,player.y+eye.y*scale,3,'#a5ee58');
}
function upgradeCalculateHit(){
 if(player.mode.startsWith('heavy')){
  if(player.specialAnimation&&stats.useReservedSpecial(upgradeAction.reservation)){
   upgradeAction.reservation=null;upgradeAction.origin={x:player.x,y:player.y};upgradeAction.rush=new Ben10Upgrade.BladeRush(upgradeAction.origin,player.actionX,player.actionY,speedWorld());upgradeAction.phase='rush';upgradeAction.time=0;player.specialQueued=false;showCombo('COMBO ULTRA T · CUCHILLA · −20 ENERGÍA');
  }else{stats.cancelReservedSpecial(upgradeAction.reservation);upgradeAction.reservation=null;player.specialAnimation=false;player.specialQueued=false;player.modeDur=GALVANIC.heavyDuration;emitUpgradeLaser();}
  return;
 }
 const mass=player.lightN===3,damage=Ben10Upgrade.config.lightDamage[player.lightN-1],reach=mass?Ben10Upgrade.config.massReach:Ben10Upgrade.config.lightReach;let hit=false;
 for(const d of dummyList){const n=dist(player.x,player.y,d.x,d.y);if(!d.alive||n>reach||((d.x-player.x)*player.actionX+(d.y-player.y)*player.actionY)/(n||1)<.35||Ben10Speed.clipSegment({x:player.x,y:player.y},d,speedWorld(),0).blocked)continue;hit=damageDummy(d,damage,mass)||hit;}
 if(hit){stats.recordLightHit();impactPause=mass?.05:.03;shake=Math.min(shake,mass?6:4);if(stats.specialReady)showCombo('COMBO ULTRA T LISTO · FUERTE: CUCHILLA');}else stats.clearCombo();
}
function updateUpgradeAction(dt){
 const s=upgradeAction;if(!s.rush)return;
 if(!isUpgrade()||!player.mode.startsWith('heavy')){cancelUpgradeAction();return;}
 s.time+=dt;
 if(s.phase==='rush'){
  s.rush.step(dt,speedWorld(),dummyList,(d,damage)=>{damageDummy(d,damage,true);spawnDust(d.x,d.y-35,6,'#b9eb83');shake=Math.min(shake,6);});player.x=s.rush.position.x;player.y=s.rush.position.y;
  if(!s.rush.active){s.from={x:player.x,y:player.y};s.to=upgradeLanding(s.from,s.rush.heading);s.phase='reform';s.time=0;}
 }else if(s.phase==='reform'){const u=clamp(s.time/.2,0,1);player.x=lerp(s.from.x,s.to.x,u);player.y=lerp(s.from.y,s.to.y,u);if(u>=1){s.phase='done';s.rush=null;s.origin=null;}}
}
function updateUpgradeEffects(dt){eyeBeams.tick(dt);}
function drawUpgradeLaser(b){
 const cfg=Ben10Upgrade.config,fade=1-b.age/cfg.laserDuration,fx=b.offset.x,fy=b.offset.y;
 ctx.save();ctx.lineCap='round';ctx.globalAlpha=fade;const x=b.origin.x+fx,y=b.origin.y+fy,ex=b.end.x+fx,ey=b.end.y+fy;
 for(const [width,color,alpha] of [[12,'#72e329',.2],[6,'#9bfa49',.8],[2,'#ecffd5',1]]){ctx.globalAlpha=fade*alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(ex,ey);ctx.stroke();}
 ctx.globalAlpha=fade;ctx.fillStyle='#d3ff92';ctx.beginPath();ctx.arc(x,y,4+Math.sin(b.age*60),0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(ex,ey,b.target?7:4,0,Math.PI*2);ctx.fill();ctx.restore();
}
const UPGRADE_MOTION={};
for(const [direction,index] of [['down',0],['up',1],['right',2],['left',3]])UPGRADE_MOTION[direction]={light1:combatClip(index,12+index,[1,2,3,4,5,6],2),light2:combatClip(index,16+index,[1,2,3,4,5,6],2),light3:combatClip(index,20+index,[1,2,3,4,4,5,6],3),laser:combatClip(index,24+index,[1,2,3,3,4,4,5,6],2),blade:combatClip(index,28+index,[1,2,3,4,4,5,6],2),dash:combatClip(index,8+index,[1,2,3,4,5,6],0)};
function upgradeActionClip(){return UPGRADE_MOTION[player.actionDir][player.mode.startsWith('heavy')?(player.specialAnimation?'blade':'laser'):player.mode];}
function upgradePose(){
 const direction=player.mode==='idle'?player.dir:player.actionDir,index={down:0,up:1,right:2,left:3}[direction];let row=index,frame=0,flip=false;
 if(player.mode==='idle'){row=index+(player.moving?4:0);frame=Math.floor((player.moving?player.runClock*GALVANIC.speed/(1.1*GALVANIC.stride):player.idleClock*.8)*8)%8;}
 else if(player.mode.startsWith('heavy')&&player.specialAnimation&&upgradeAction.phase==='rush'){row=28+index;frame=3+Math.floor(upgradeAction.time*24)%2;}
 else if(player.mode.startsWith('heavy')&&player.specialAnimation&&upgradeAction.phase==='reform'){row=28+index;frame=upgradeAction.time<.1?5:6;}
 else{const clip=upgradeActionClip();if(clip){const phase=clamp(Math.floor(player.modeTime/(player.modeDur||1)*clip.poses.length),0,clip.poses.length-1);[row,frame,flip]=clip.poses[phase];}}
 return {atlas:upgradeAtlas,row,frame,flip,idle:player.mode==='idle'&&!player.moving,direction,alien:true,scale:GALVANIC.scale/upgradeAtlas.resolutionScale,lift:0};
}
