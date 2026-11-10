// Embedded in the game closure. Slime remains active after changing form.
function cancelStinkAction(resetMode=false){
 slime.closeBurst(stinkAction.burst);stinkAction.burst=null;stats.cancelReservedSpecial(stinkAction.reservation);stinkAction.reservation=null;stinkAction.emitted=0;
 if(resetMode&&isStinkfly()&&/^(light|heavy)/.test(player.mode)){player.mode='idle';player.modeTime=0;player.modeDur=0;player.bufferedAttack=null;player.specialQueued=false;player.specialAnimation=false;player.moving=false;player.idleClock=0;}
}
function syncStinkForm(){
 const id=stats.form?.id||null;if(id!==stinkAction.form){cancelStinkAction();stinkAction.form=id;stinkAction.session++;stinkAction.lastOutcome=0;stinkAction.creditFrom=slime.burstSerial+1;}
}
function stinkCanAct(){return isStinkfly()&&assetsReady&&!state.wheel&&stats.health>0&&speedAction.phase==='idle'&&cannonAction.phase==='idle'&&ghostAction.phase==='idle';}
function stinkLightAttack(){
 if(!stinkCanAct())return;if(bufferAttack('light'))return;
 if(player.mode!=='idle'||t-player.lastLight<LETOPTERAN.lightCooldown)return;
 syncStinkForm();cancelStinkAction();faceForAction();player.lightN=t-player.lastLight<.85?player.lightN%3+1:1;player.lastLight=t;startMode('light'+player.lightN,LETOPTERAN.lightDurations[player.lightN-1]);stinkAction.burst=slime.beginBurst(stinkAction.session);stinkAction.emitted=0;
 showCombo('INSECTOIDE · RÁFAGA DE CUATRO ORIFICIOS');
}
function stinkHeavyAttack(){
 if(!stinkCanAct())return;if(bufferAttack('heavy'))return;
 if(player.mode!=='idle'||t-player.lastHeavy<LETOPTERAN.heavyCooldown)return;
 syncStinkForm();cancelStinkAction();faceForAction();stinkAction.reservation=stats.reserveComboSpecial();stinkAction.creditFrom=slime.burstSerial+1;player.lastHeavy=t;player.specialAnimation=!!stinkAction.reservation;player.specialQueued=player.specialAnimation;startMode('heavy1',player.specialAnimation?.88:LETOPTERAN.heavyDuration);
 showCombo(player.specialAnimation?'COMBO INSECTOIDE · VENENO AL SUELO':'INSECTOIDE · AGUIJÓN DE COLA');
}
function stinkPort(row,frame,port){
 const point=STINKFLY_PORTS[row][frame][port],scale=LETOPTERAN.scale/2,x=player.x+point.x*scale,y=player.y+player.actionY*14;
 return {x,y,height:Math.max(4,y-(player.y+point.y*scale))};
}
function updateStinkAnimation(dt){
 if(!isStinkfly()||!player.mode.startsWith('light')||!stinkAction.burst||stinkAction.burst.closed)return;
 const b=stinkAction.burst,index={down:0,up:1,right:2,left:3}[player.actionDir],row=12+(player.lightN-1)*4+index;
 while(stinkAction.emitted<4){
  const i=stinkAction.emitted,at=(2+i)/8*player.modeDur;if(player.modeTime+dt+1e-8<at)break;
  const port=Ben10Stink.orders[player.lightN-1][i],p=stinkPort(row,2+i,port),aim={x:player.x+player.actionX*145,y:player.y+player.actionY*145};
  slime.spit({...p,dx:aim.x-p.x,dy:aim.y-p.y,port,burst:b,delay:Math.max(0,at-player.modeTime)});stinkAction.emitted++;spawnDust(p.x,p.y-p.height,1,'#b6e562');
 }
 if(stinkAction.emitted===4)slime.closeBurst(b);
}
function stinkHeavyHit(){
 const ticket=stinkAction.reservation,powered=!!stats.useReservedSpecial(ticket);stinkAction.reservation=null;
 if(powered){
  const index={down:0,up:1,right:2,left:3}[player.actionDir],ports=[0,1,2,3].map(i=>stinkPort(28+index,4,i)),p={x:ports.reduce((s,p)=>s+p.x,0)/4,y:ports[0].y,height:ports.reduce((s,p)=>s+p.height,0)/4};
  const end=Ben10Speed.clipSegment({x:player.x,y:player.y},{x:player.x+player.actionX*100,y:player.y+player.actionY*100},speedWorld(),8).end;
  slime.glob({...p,endX:end.x,endY:end.y});showCombo('COMBO INSECTOIDE · CHARCO VENENOSO · −20 ENERGÍA');
 }else{
  stats.cancelReservedSpecial(ticket);stats.clearCombo();player.specialAnimation=false;let hit=false;
  for(const d of dummyList){const length=dist(player.x,player.y,d.x,d.y),dot=((d.x-player.x)*player.actionX+(d.y-player.y)*player.actionY)/(length||1);if(d.alive&&length<=Ben10Stink.config.tailReach&&dot>=.2&&!Ben10Speed.clipSegment({x:player.x,y:player.y},d,speedWorld(),0).blocked)hit=damageDummy(d,Ben10Stink.config.tailDamage,true)||hit;}
  if(hit){shake=Math.min(shake,6);impactPause=.035;}showCombo('INSECTOIDE · IMPACTO DEL AGUIJÓN');
 }
 player.specialQueued=false;
}
function updateStinkEffects(dt){
 syncStinkForm();
 if(stinkAction.burst&&!stinkAction.burst.closed&&(!isStinkfly()||!player.mode.startsWith('light'))){slime.closeBurst(stinkAction.burst);stinkAction.burst=null;}
 const creditable=b=>isStinkfly()&&b.session===stinkAction.session&&b.id>=stinkAction.creditFrom&&b.id>=stinkAction.lastOutcome;
 slime.tick(dt,{targets:dummyList,obstacles:props,width:WORLD.w,height:WORLD.h},s=>{
  if(s.target){damageDummy(s.target,s.damage,false,{slime:true,port:s.port});const b=s.burst;if(b&&!b.credited&&creditable(b)){b.credited=true;stinkAction.lastOutcome=b.id;stats.recordLightHit();if(stats.specialReady)showCombo('COMBO INSECTOIDE LISTO · FUERTE: VENENO');}}
  else if(s.kind==='spit')spawnDust(s.x,s.y-s.height,2,'#a6d35c');
 },b=>{if(b.launched&&!b.hit&&creditable(b)){stinkAction.lastOutcome=b.id;stats.clearCombo();}},(d,damage)=>damageDummy(d,damage,false,{slime:true,port:1}));
}
function drawStinkShot(s){
 const x=Math.round(s.x),y=Math.round(s.y-s.height),r=s.kind==='glob'?7:3;ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(s.dy,s.dx));
 ctx.fillStyle='#263918';ctx.fillRect(-r*2,-r,r*3,r*2);ctx.fillRect(-r,-r-1,r*2,r*2+2);ctx.fillStyle=s.kind==='glob'?'#93c33c':'#aad65c';ctx.fillRect(-r*1.5,-r+1,r*2.5,r*2-2);ctx.fillStyle='#e4f29b';ctx.fillRect(0,-Math.max(1,r*.4),r,Math.max(1,r*.5));
 if(s.kind==='glob'){ctx.fillStyle='#91bd42';ctx.fillRect(-15,-5,4,4);ctx.fillRect(-12,5,3,3);}ctx.restore();
}
function drawStinkPools(){
 for(const p of slime.pools){
  const fade=Math.min(1,(p.duration-p.age)/.6),grow=Math.min(1,p.age/.16);ctx.save();ctx.globalAlpha=fade;ctx.translate(p.x,p.y);ctx.scale(grow,grow);ctx.beginPath();
  for(let i=0;i<=24;i++){const a=i/24*Math.PI*2,shape=1+Math.sin(i*2.7+p.id)*.07,x=Math.round(Math.cos(a)*p.radius*shape),y=Math.round(Math.sin(a)*p.depth*shape);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);}ctx.closePath();ctx.fillStyle='#314315';ctx.fill();ctx.lineWidth=3;ctx.strokeStyle='#6c8f29';ctx.stroke();
  ctx.beginPath();ctx.ellipse(0,-2,p.radius*.85,p.depth*.78,0,0,Math.PI*2);ctx.fillStyle='#78a52d';ctx.fill();ctx.beginPath();ctx.ellipse(-7,-5,p.radius*.6,p.depth*.48,-.1,0,Math.PI*2);ctx.fillStyle='#a2c94f';ctx.fill();
  for(let i=0;i<6;i++){const phase=(p.age*.9+i*.173)%1,bx=Math.sin(i*3.7+p.id)*p.radius*.65,by=Math.cos(i*2.2)*p.depth*.6,r=1+Math.sin(phase*Math.PI)*3;ctx.beginPath();ctx.arc(Math.round(bx),Math.round(by),r,0,Math.PI*2);ctx.strokeStyle=phase>.75?'#d8ec82':'#527820';ctx.lineWidth=1.5;ctx.stroke();}ctx.restore();
 }
}
