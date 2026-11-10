// Blitzwolfer's stance, claw rush and sonic howl live inside the demo closure.
function cancelWolfAction(resetMode=false){
 stats.cancelReservedSpecial(wolfAction.reservation);wolfAction.reservation=null;wolfAction.rush=null;
 if(resetMode&&isBlitzwolfer()&&/^(light|heavy)/.test(player.mode)){player.mode='idle';player.modeTime=0;player.modeDur=0;player.bufferedAttack=null;player.specialQueued=false;player.specialAnimation=false;player.moving=false;player.idleClock=0;}
}
function wolfHeavyAttack(){
 if(!isBlitzwolfer()||!assetsReady||state.wheel||stats.health<=0)return;
 if(bufferAttack('heavy'))return;
 if(player.mode!=='idle'||t-player.lastHeavy<LOBOAN.heavyCooldown)return;
 cancelWolfAction();faceForAction();wolfAction.reservation=stats.reserveComboSpecial();player.lastHeavy=t;player.specialAnimation=!!wolfAction.reservation;player.specialQueued=player.specialAnimation;startMode('heavy1',player.specialAnimation?1.16:LOBOAN.heavyDuration);
 if(!player.specialAnimation){stats.clearCombo();wolfAction.rush=new Ben10Wolf.ClawRush({x:player.x,y:player.y},player.actionX,player.actionY);}
 showCombo(player.specialAnimation?'COMBO BLITZWOLFER · AULLIDO SÓNICO':'BLITZWOLFER · EMBESTIDA CON GARRAS');
}
function wolfCalculateHit(){
 if(player.mode.startsWith('heavy')){
  if(!player.specialAnimation)return;
  const powered=stats.useReservedSpecial(wolfAction.reservation);stats.cancelReservedSpecial(wolfAction.reservation);wolfAction.reservation=null;player.specialQueued=false;
  if(powered){const direction={down:0,up:1,right:2,left:3}[player.actionDir],mouth=BLITZ_MOUTHS[direction][3],scale=LOBOAN.scale/blitzwolferAtlas.resolutionScale;
   sonics.launch({x:player.x,y:player.y},player.actionX,player.actionY,{x:mouth.x*scale,y:mouth.y*scale});showCombo('COMBO BLITZWOLFER · AULLIDO SÓNICO · −20 ENERGÍA');shake=Math.min(shake,7);
  }else{stats.clearCombo();player.specialAnimation=false;wolfAction.rush=new Ben10Wolf.ClawRush({x:player.x,y:player.y},player.actionX,player.actionY);startMode('heavy1',LOBOAN.heavyDuration);showCombo('BLITZWOLFER · EMBESTIDA CON GARRAS');}
  return;
 }
 const damage=Ben10Wolf.config.lightDamage[player.lightN-1],reach=player.lightN===3?Ben10Wolf.config.biteReach:Ben10Wolf.config.lightReach;let hit=false;
 for(const d of dummyList){const n=dist(player.x,player.y,d.x,d.y);if(!d.alive||n>reach||((d.x-player.x)*player.actionX+(d.y-player.y)*player.actionY)/(n||1)<.35||Ben10Speed.clipSegment({x:player.x,y:player.y},d,speedWorld(),0).blocked)continue;hit=damageDummy(d,damage,false)||hit;}
 if(hit){stats.recordLightHit();impactPause=.035;shake=Math.min(shake,4);if(stats.specialReady)showCombo('COMBO BLITZWOLFER LISTO · FUERTE: AULLIDO');}else stats.clearCombo();
}
function updateWolfAction(dt){
 if(!isBlitzwolfer()||!player.mode.startsWith('heavy')||player.specialAnimation){wolfAction.rush=null;return;}
 const rush=wolfAction.rush;if(!rush)return;
 rush.tick(dt,speedWorld(),dummyList,(d,damage)=>{damageDummy(d,damage,true);stats.clearCombo();shake=Math.min(shake,7);spawnDust(d.x,d.y-8,6,'#b9bec6');});player.x=rush.position.x;player.y=rush.position.y;
}
function updateSonicEffects(dt){sonics.tick(dt,speedWorld(),dummyList,(d,damage)=>{damageDummy(d,damage,true);spawnDust(d.x,d.y-40,7,'#c7ef91');shake=Math.min(shake,6);});}
function drawSonicWave(w){
 const cfg=Ben10Wolf.config,front=Math.min(cfg.sonicRange,w.age*cfg.sonicSpeed),fade=clamp((cfg.sonicRange/cfg.sonicSpeed+cfg.sonicTail-w.age)/cfg.sonicTail,0,1),angle=Math.atan2(w.heading.y,w.heading.x);
 ctx.save();ctx.translate(w.origin.x+w.offset.x,w.origin.y+w.offset.y);ctx.rotate(angle);ctx.lineCap='round';
 // Receding rings show the cone opening from the split muzzle.
 for(let i=4;i>=0;i--){const d=front-i*40;if(d<=0)continue;const width=13+d*cfg.sonicSpread,alpha=fade*(1-i*.13)*(1-d/cfg.sonicRange*.45),position={x:w.origin.x+w.heading.x*d,y:w.origin.y+w.heading.y*d};if(Ben10Speed.clipSegment(w.origin,position,speedWorld(),0).blocked)continue;
  ctx.globalAlpha=alpha*.15;ctx.fillStyle='#bcff63';ctx.beginPath();ctx.ellipse(d,0,9+i,width,0,0,Math.PI*2);ctx.fill();
  ctx.globalAlpha=alpha;ctx.strokeStyle=i%2?'#a4e95d':'#d7ffac';ctx.lineWidth=i===0?3:2;ctx.beginPath();ctx.ellipse(d,0,7+width*.14,width,0,0,Math.PI*2);ctx.stroke();
 }
 ctx.restore();
}
const BLITZWOLFER_MOTION={};
for(const [direction,index] of [['down',0],['up',1],['right',2],['left',3]])BLITZWOLFER_MOTION[direction]={light1:combatClip(index,12+index,[1,2,3,4,5,6],2),light2:combatClip(index,16+index,[1,2,2,3,4,5,6],2),light3:combatClip(index,20+index,[1,2,3,3,4,5,6],2),rush:combatClip(index,24+index,[1,2,3,4,4,5,6],2),howl:combatClip(index,28+index,[1,2,3,3,4,4,4,5,6],2),dash:combatClip(index,8+index,[1,2,3,4,5,6],0)};
function blitzwolferActionClip(){return BLITZWOLFER_MOTION[player.actionDir][player.mode.startsWith('heavy')?(player.specialAnimation?'howl':'rush'):player.mode];}
function blitzwolferPose(){
 const direction=player.mode==='idle'?player.dir:player.actionDir,index={down:0,up:1,right:2,left:3}[direction];let row=index,frame=0,lift=0;
 if(player.mode==='idle'){row=index+(player.moving?4:0);frame=Math.floor((player.moving?player.runClock*LOBOAN.speed/(1.1*LOBOAN.stride):player.idleClock*.8)*8)%8;}
 else{const clip=blitzwolferActionClip();if(clip){const phase=clamp(Math.floor(player.modeTime/(player.modeDur||1)*clip.poses.length),0,clip.poses.length-1);[row,frame]=clip.poses[phase];}if(player.mode==='dash')lift=Math.sin(Math.PI*clamp(player.modeTime/player.modeDur,0,1))*9;}
 return {atlas:blitzwolferAtlas,row,frame,flip:false,idle:player.mode==='idle'&&!player.moving,direction,alien:true,scale:LOBOAN.scale/blitzwolferAtlas.resolutionScale,lift};
}
