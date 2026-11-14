// CAMPAIGN_GAME_START
const campaignArt=new Ben10CampaignRenderer(campaign.data);
let campaignView={x:0,y:0,width:screenW,height:screenH},campaignExitReady=false;
const campaignUI=Object.fromEntries(['campaignStatus','campaignPhase','campaignPlace','campaignProgress','campaignExit','campaignExitLabel','campaignExitTitle','campaignEnter'].map(id=>[id,document.getElementById(id)]));
function campaignPhysicsWorld(){
 return {width:WORLD.w,height:WORLD.h,obstacles:props,bounds:campaign.bounds(0),
  clipSegment:(a,b,radius,world)=>campaign.clipSegment(a,b,radius,world?.obstacles||props),
  clampPoint:(point,radius)=>campaign.clampPoint(point,radius,props,{ignoreProps:true})};
}
function campaignGroundPoint(point,origin=player){return campaign.clipSegment(origin,point,0,props).end;}
function campaignCollide(x,y,radius){
 if(campaign.blocked({x,y},radius,props))return true;
 for(const d of dummyList)if(d!==ghostAction.grab?.target&&d.alive&&d.spawnLeft<=0&&((x-d.x)/((d.radius||16)+radius))**2+((y-d.y)/((d.radius||16)*.4+radius*.4))**2<1)return true;
 return false;
}
function campaignMovePlayer(x,y){
 const before={x:player.x,y:player.y},radius=actorMetrics().radius;
 const next=campaign.move(before,x-before.x,y-before.y,radius,props);
 const hit=dummyList.find(d=>d.alive&&d.spawnLeft<=0&&d!==ghostAction.grab?.target&&((next.x-d.x)/((d.radius||16)+radius))**2+((next.y-d.y)/((d.radius||16)*.4+radius*.4))**2<1);
 if(!hit){player.x=next.x;player.y=next.y;}else{const slide=campaign.move(before,0,y-before.y,radius,props);player.y=slide.y;}
}
function campaignCanEnter(){return assetsReady&&!comicOpen&&!state.wheel&&!progressionPanelOpen&&!adminPanelOpen&&player.mode==='idle'&&!evolutionCasting()&&speedAction.phase==='idle'&&cannonAction.phase==='idle'&&ghostAction.phase==='idle'&&stats.health>0;}
function campaignResetEffects(){
 evolutionCancelSkill();cancelSpeedAbility();cancelCannonAbility();cancelGhostAbility();cancelStinkAction(true);cancelWildAction(true);cancelWolfAction(true);cancelUpgradeAction(true);
 fire.clear();slime.clear();thorns.clear();sonics.clear();eyeBeams.clear();pieces=[];dummyList=[];
 progression.fields=[];progression.fx=[];progression.comboLog=[];combatTargetState.focus=null;stats.clearCombo();
 player.bufferedAttack=null;player.specialQueued=false;player.specialAnimation=false;player.pendingForm=null;
 player.mode='idle';player.modeTime=0;player.modeDur=0;player.hit=false;player.moving=false;player.runClock=0;player.idleClock=0;impactPause=0;flash=0;shake=0;
 clearTimeout(state.toastTimer);clearTimeout(state.comboTimer);
 for(const id of ['toast','combo']){const el=document.getElementById(id);el.classList.remove('show');el.textContent='';}
}
function campaignSetPhase(index,initial=false){
 if(!initial)campaignResetEffects();
 campaign.setPhase(index);WORLD.w=campaign.width;WORLD.h=campaign.height;props=campaign.props;
 const position=campaign.spawn(initial?HUMAN.radius:actorMetrics().radius);player.x=position.x;player.y=position.y;
 player.dir='right';player.faceX=1;player.faceY=0;player.actionDir='right';player.actionX=1;player.actionY=0;
 enemyResetPhase(index);
 campaignExitReady=false;campaignUI.campaignExit.hidden=true;keys.clear();pointer.active=false;
 cam.x=0;cam.y=campaign.offsetY;
 if(!initial){campaignUpdateUI();campaignCamera(0,true);game.focus({preventScroll:true});}
}
function campaignEnter(){
 if(!campaignExitReady||!campaignCanEnter())return false;
 campaignSetPhase((campaign.phaseIndex+1)%campaign.data.chapters.length);return true;
}
function campaignUpdateUI(){
 const logical=campaign.logical(player),room=Ben10MapWorld.roomAt(campaign.data,logical.x);
 campaignUI.campaignPhase.textContent='FASE '+(campaign.phaseIndex+1)+' / 3';
 campaignUI.campaignPlace.textContent=room.name;campaignUI.campaignProgress.style.width=campaign.progress(player.x)*100+'%';
 campaignExitReady=campaign.atExit(player)&&encounters.complete;campaignUI.campaignExit.hidden=!campaignExitReady;
 campaignUI.campaignEnter.disabled=!campaignCanEnter();
 const end=campaign.phaseIndex===2;
 campaignUI.campaignExitLabel.textContent=end?'LABORATORIO PRINCIPAL':campaign.phaseIndex===0?'ENTRADA DEL CASTILLO':'ENTRADA DEL LABORATORIO';
 campaignUI.campaignExitTitle.textContent=end?'Sala del Rey Eterno':campaign.phaseIndex===0?'Castillo de los Eternos':'El laboratorio oculto';
 campaignUI.campaignEnter.querySelector('span').textContent=end?'Volver al inicio':campaign.phase.entry;
}
function campaignAfterUpdate(before){
 const radius=actorMetrics().radius,intangible=ghostIntangible()||evolutionSkillIntangible();
 if(campaign.onFloor(before,radius)){
  const p=campaign.clipSegment(before,player,radius,props,{ignoreProps:intangible}).end;player.x=p.x;player.y=p.y;
 }
 if(campaign.blocked(player,radius,props,{ignoreProps:intangible})){
  const safe=campaign.clampPoint(player,radius,props,{ignoreProps:intangible})||campaign.spawn(radius);player.x=safe.x;player.y=safe.y;
 }
 for(const f of progression.fields)if(f.kind==='pool'&&!campaign.onFloor(f,0)){const point=campaignGroundPoint(f,f.source);f.x=point.x;f.y=point.y;}
 campaignUpdateUI();
}
function campaignCamera(dt=1/60,snap=false){
 const worldWidth=640*campaign.scale,worldHeight=360*campaign.scale,zoom=Math.min(screenW/worldWidth,screenH/worldHeight);
 campaignView={x:(screenW-worldWidth*zoom)/2,y:(screenH-worldHeight*zoom)/2,width:worldWidth*zoom,height:worldHeight*zoom};
 cam.zoom=zoom;cam.y=campaign.offsetY;
 if(speedAction.phase==='charge'||speedAction.phase==='plan')return;
 const arena=campaign.arena,arenaCamera=arena?(arena.right-arena.left<=worldWidth?(arena.left+arena.right-worldWidth)/2:clamp(player.x-worldWidth*.42,arena.left,arena.right-worldWidth)):player.x-worldWidth*.42;
 const wanted=clamp(arenaCamera,0,Math.max(0,WORLD.w-worldWidth));
 cam.x=snap?wanted:lerp(cam.x,wanted,1-Math.exp(-((speedAction.phase==='rush'||cannonAction.phase==='rush')?24:8)*dt));
 cam.x=clamp(cam.x,0,Math.max(0,WORLD.w-worldWidth));
}
function campaignPointerWorld(x,y){return {x:cam.x+(x-campaignView.x)/cam.zoom,y:cam.y+(y-campaignView.y)/cam.zoom};}
function campaignDrawWorld(){
 ctx.fillStyle='#0c1717';ctx.fillRect(0,0,screenW,screenH);
 ctx.save();ctx.beginPath();ctx.rect(campaignView.x,campaignView.y,campaignView.width,campaignView.height);ctx.clip();
 ctx.translate(campaignView.x-cam.x*cam.zoom,campaignView.y-cam.y*cam.zoom);ctx.scale(cam.zoom,cam.zoom);
 const view={left:cam.x,right:cam.x+campaignView.width/cam.zoom},visible=props.filter(p=>p.type==='campaign'&&p.x+p.width/2>=view.left-50&&p.x-p.width/2<=view.right+50);
 campaignArt.background(ctx,campaign,view);
 enemyArt.ground(ctx,enemyBattle);enemyDrawGates();
 ctx.save();ctx.beginPath();ctx.rect(0,campaign.offsetY+208*campaign.scale,WORLD.w,152*campaign.scale);ctx.clip();drawWildTrails();drawStinkPools();ctx.restore();
 drawSpeedRoute();drawCannonCharge();
 for(const p of visible)if(p.art.behind)campaignArt.sprite(ctx,p,t);
 campaignArt.ambient(ctx,campaign,t,view);
 const items=visible.filter(p=>!p.art.behind).map(p=>({y:p.y,draw:()=>campaignArt.sprite(ctx,p,t)}));
 for(const d of dummyList)if(d!==ghostAction.grab?.target)items.push({y:d.y,draw:()=>drawDummy(d)});
 for(const wave of thorns.waves)for(const node of wave.nodes)items.push({y:node.y,draw:()=>drawWildThorn(node,wave)});
 for(const wave of sonics.waves)items.push({y:wave.origin.y,draw:()=>drawSonicWave(wave)});
 for(const beam of eyeBeams.beams)items.push({y:beam.origin.y,draw:()=>drawUpgradeLaser(beam)});
 for(const shot of slime.shots)items.push({y:shot.y,draw:()=>drawStinkShot(shot)});
 for(const shot of fire.shots)items.push({y:shot.y,draw:()=>shot.kind==='crystal'?drawCrystalShard(shot):drawFireball(shot)});
 items.push({y:player.y,draw:()=>{ctx.save();if(stats.health>0&&enemyBattle.time<enemyInvulUntil)ctx.globalAlpha=.65+.3*Math.sin(t*38);drawPlayer();ctx.restore();}});items.sort((a,b)=>a.y-b.y);for(const item of items)item.draw();enemyArt.effects(ctx,enemyBattle,t);drawParticles();evolutionDrawEffects();
 ctx.restore();if(flash>0){ctx.fillStyle=`rgba(148,255,85,${Math.pow(flash,2)*.24})`;ctx.fillRect(0,0,screenW,screenH);}
}
campaignUI.campaignEnter.addEventListener('click',()=>campaignEnter());
game.tabIndex=0;campaignSetPhase(0,true);
// CAMPAIGN_GAME_END
