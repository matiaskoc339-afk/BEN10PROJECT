// Wildvine keeps rooted movement; committed thorn waves can outlive the form.
function cancelWildAction(resetMode=false){
 stats.cancelReservedSpecial(wildAction.reservation);wildAction.reservation=null;
 if(resetMode&&isWildvine()&&/^(light|heavy)/.test(player.mode)){player.mode='idle';player.modeTime=0;player.modeDur=0;player.bufferedAttack=null;player.specialAnimation=false;player.specialQueued=false;player.moving=false;player.idleClock=0;}
}
function wildHeavyAttack(){
 if(!isWildvine()||!assetsReady||state.wheel||stats.health<=0)return;
 if(bufferAttack('heavy'))return;
 if(player.mode!=='idle'||t-player.lastHeavy<FLORAUNA.heavyCooldown)return;
 cancelWildAction();faceForAction();wildAction.reservation=stats.reserveComboSpecial();player.lastHeavy=t;player.specialAnimation=!!wildAction.reservation;player.specialQueued=player.specialAnimation;startMode('heavy1',player.specialAnimation?1:FLORAUNA.heavyDuration);
 showCombo(player.specialAnimation?'COMBO WILDVINE · BRAZOS A LA TIERRA':'WILDVINE · GIRO DE ENREDADERAS');
}
function wildCalculateHit(){
 const heavy=player.mode.startsWith('heavy');
 if(heavy){
  const ticket=wildAction.reservation,powered=!!stats.useReservedSpecial(ticket);wildAction.reservation=null;
  if(powered){
   thorns.launch({x:player.x,y:player.y},player.actionX,player.actionY,speedWorld());spawnDust(player.x,player.y,12,'#6e8150');showCombo('COMBO WILDVINE · ESPINAS · −20 ENERGÍA');player.specialQueued=false;return;
  }
  stats.cancelReservedSpecial(ticket);stats.clearCombo();player.specialAnimation=false;
 }
 const damage=heavy?Ben10Wild.config.spinDamage:Ben10Wild.config.lightDamage[player.lightN-1],reach=heavy?Ben10Wild.config.spinReach:player.lightN===3?Ben10Wild.config.doubleReach:Ben10Wild.config.lightReach;
 let hit=false;
 for(const d of dummyList){
  const length=dist(player.x,player.y,d.x,d.y);if(!d.alive||length>reach||Ben10Speed.clipSegment({x:player.x,y:player.y},d,speedWorld(),0).blocked)continue;
  const dot=((d.x-player.x)*player.actionX+(d.y-player.y)*player.actionY)/(length||1);if(!heavy&&dot<.3)continue;
  hit=damageDummy(d,damage,heavy)||hit;spawnDust(d.x,d.y-42,4,'#87b04d');
 }
 if(!heavy&&hit){stats.recordLightHit();if(stats.specialReady)showCombo('COMBO WILDVINE LISTO · FUERTE: ESPINAS');}else if(!hit)stats.clearCombo();
 if(hit){impactPause=heavy?.04:.025;shake=Math.min(shake,heavy?7:4);}player.specialQueued=false;
}
function updateWildEffects(dt){
 thorns.tick(dt,speedWorld(),dummyList,(d,damage,node)=>{damageDummy(d,damage,true);spawnDust(node.x,node.y,8,'#718447');shake=Math.min(shake,6);});
}
function drawWildTrails(){
 ctx.save();ctx.lineWidth=2;ctx.strokeStyle='#65583b';
 for(const w of thorns.waves){
  const duration=Ben10Wild.config.nodeDuration+(w.nodes.length-1)*Ben10Wild.config.delay;ctx.globalAlpha=Math.min(1,Math.max(0,(duration-w.age)/.3))*.7;
  for(const node of w.nodes){
   const u=clamp((w.age-node.delay*.6)/.14,0,1);if(!u)continue;const start=node.index?w.nodes[node.index-1]:w.origin,end={x:lerp(start.x,node.x,u),y:lerp(start.y,node.y,u)};
   ctx.beginPath();ctx.moveTo(start.x,start.y);for(let i=1;i<=5;i++){const r=i/5,bend=Math.sin(i*2.1+w.id+node.index)*3;ctx.lineTo(lerp(start.x,end.x,r)-w.heading.y*bend,lerp(start.y,end.y,r)+w.heading.x*bend);}ctx.stroke();
   ctx.fillStyle='#65563d';ctx.fillRect(Math.round(end.x-3),Math.round(end.y-2),5,3);
  }
 }
 ctx.restore();
}
function drawWildThorn(node,wave){
 const age=wave.age-node.delay;if(age<0||age>=Ben10Wild.config.nodeDuration||!wildThornAtlas)return;
 const phase=Math.min(15,Math.floor(age/Ben10Wild.config.nodeDuration*16)),f=wildThornAtlas.rows[Math.floor(phase/4)][phase%4],scale=.5;
 ctx.save();ctx.translate(Math.round(node.x),Math.round(node.y));if(node.index%2)ctx.scale(-1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';drawRegisteredFrame(ctx,f,-f.anchorX*scale,-f.anchorY*scale,scale);ctx.restore();
}
