// DESERT_V47_GAME_START
// V47 is layered on top of the existing V44 story, Omnitrix, combat and saves.
const desertArt=new Ben10DesertRenderer(Ben10Desert);
const desertState={visited:false,defeated:false,boss:null,rewardReady:false,rewardOpen:false,stun:0,worms:[],wormClock:5,testing:false,bossClock:0};
const desertUI={hud:document.getElementById('alphaHUD'),phase:document.getElementById('alphaPhase'),health:document.getElementById('alphaHealth'),state:document.getElementById('alphaState'),reward:document.getElementById('alphaReward'),stun:document.getElementById('v47Stun'),dev:document.getElementById('v47Developer')};
const desertActive=()=>adventure.story==='desert';
const desertRand=()=>enemyBattle.random();
const desertClamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const desertDir=(a,b)=>{const n=Math.hypot(b.x-a.x,b.y-a.y)||1;return{x:(b.x-a.x)/n,y:(b.y-a.y)/n}};
const desertDistance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.6);
const desertTitle=['PUEBLO ABANDONADO','MAR DE ARENA','CUEVA DEL ALFA'];
function desertReset(){desertState.boss=null;desertState.rewardReady=false;desertState.rewardOpen=false;desertState.stun=0;desertState.worms=[];desertState.wormClock=4.2;desertUI.hud.hidden=true;desertUI.reward.hidden=true;desertUI.stun.hidden=true;}
function desertPlan(phase,scale){
 const width=(Ben10Desert.level.chapters[phase].end-Ben10Desert.level.chapters[phase].x)*scale;
 const count=phase===1?4:3;
 return Array.from({length:count},(_,index)=>{
  const trigger=(380+(index*(phase===1?640:820)))*scale, left=Math.max(22*scale,trigger-125*scale);
  const right=Math.min(width-110*scale,trigger+470*scale);
  const waves=Array.from({length:index===0&&phase===0?1:index===count-1&&phase===2?2:2+(phase>0?1:0)},(_,w)=>{
   const size=phase===0?3+index:phase===1?4+Math.min(2,index):5+Math.min(2,index);
   return Array.from({length:size},(_,n)=>({role:['physical','ranged','mixed'][(n+w+index)%3],tier:phase===0?(index===0?'weak':n%3===0?'mid':'weak'):phase===1?(n%4===0?'strong':'mid'):(n%3===0?'mid':'strong')}));
  });
  return{id:'desert-'+phase+'-'+index,index,phase,name:desertTitle[phase]+' · PATRULLA '+(index+1),trigger,left,right,waves};
 });
}
const desertUseBase=adventureUseData;
adventureUseData=function(){
 desertUseBase();
 const active=desertActive();
 if(active){
  campaign.data=Ben10Desert.level;
  enemyBattle.circus=false;encounters.circus=false;encounters.entrance=false;encounters.data=campaign.data;
 }
 document.body.classList.toggle('desert-active',active);
};
const desertSnapshotBase=adventureSnapshot;
adventureSnapshot=function(){return{...desertSnapshotBase(),desertVisited:desertState.visited,desertDefeated:desertState.defeated};};
const desertRestoreBase=adventureRestore;
adventureRestore=function(record){
 desertState.visited=record.adventure?.desertVisited===true;
 desertState.defeated=record.adventure?.desertDefeated===true;
 desertState.testing=false;
 desertReset();desertRestoreBase(record);
};
const desertResumeBase=adventureResumeCheckpoint;
adventureResumeCheckpoint=function(record){
 if(desertActive()){
  const kind=record.checkpoint?.kind;
  if(kind==='alpha'){encounters.index=encounters.cleared=encounters.plan.length;encounters.complete=true;desertStartAlpha();return;}
  if(kind==='alpha-victory'){desertState.defeated=true;desertState.rewardReady=false;campaign.arena=null;return;}
  return;
 }
 return desertResumeBase(record);
};
const desertHubBase=adventureShowHub;
adventureShowHub=function(save=true){
 const r=desertHubBase(save);
 if(r){
  const subtitle=document.getElementById('desertRouteState');
  if(subtitle)subtitle.textContent=desertState.defeated?'Alfa derrotado · ADN recuperado':desertState.visited?'Ruta descubierta · La cueva aguarda':'Pueblo · Desierto · Cueva';
 }
 return r;
};
(function installDesertCard(){
 const grid=document.querySelector('.villain-grid');
 if(!grid||document.getElementById('chooseBlitzwolfer'))return;
 const card=document.createElement('button');card.id='chooseBlitzwolfer';card.className='villain-card v47-desert-card';card.type='button';
 card.innerHTML='<img src="'+Ben10Desert.ASSET+Ben10Desert.portrait+'" alt="Blitzwolfer Alfa"><span>EL AULLIDO DEL DESIERTO</span><strong>BLITZWOLFER ALFA</strong><small id="desertRouteState">Pueblo · Desierto · Cueva</small><b>EXPLORAR LA RUTA →</b>';
 const future=grid.querySelector('.villain-future');grid.insertBefore(card,future||null);
 card.addEventListener('click',desertChoose);
})();
function desertChoose(){
 if(!adventure.eternalsCleared)return false;
 adventureHideHub();returnToBen();desertState.visited=true;desertReset();
 adventure.story='desert';adventure.mode='desert';adventureUseData();campaignSetPhase(0);gameSaveCurrent();
 enemyBanner('NUEVO DESTINO','EL AULLIDO DEL DESIERTO · SIGUE EL RASTRO DEL ALFA',2.7,'boss');
 return true;
}
const desertDirectorBase=encounters.setPhase;
encounters.setPhase=function(index){
 desertDirectorBase.call(this,index);
 if(desertActive()){
  this.phase=index;this.plan=desertPlan(index,campaign.scale);this.index=0;this.current=null;this.wave=0;this.pending=[];this.between=0;this.complete=false;this.cleared=0;this.spawnClock=0;
 }
};
const desertSpawnBase=enemyBattle.spawn;
enemyBattle.spawn=function(role,tier,point,progress=0,boss=false){
 if(!desertActive()||!['physical','ranged','mixed'].includes(role))return desertSpawnBase.call(this,role,tier,point,progress,boss);
 const mapped={physical:'melee',ranged:'ranged',mixed:'agile'}[role],grade={weak:'recruit',mid:'elite',strong:'crystal'}[tier]||'recruit';
 const e=desertSpawnBase.call(this,mapped,grade,point,progress);
 const rank={weak:0,mid:1,strong:2}[tier]||0;
 Object.assign(e,{robot:true,robotType:role,robotTier:rank,name:'ROBOT DE VILGAX · '+(role==='physical'?'ASALTO':role==='ranged'?'TIRADOR':'HÍBRIDO'),bodyHeight:rank===0?75:rank===1?96:123,radius:rank===0?13:rank===1?17:22,maxHealth:Math.round((rank===0?64:rank===1?105:160)*(1+progress*.25)),armor:rank===0?.04:rank===1?.13:.22,damage:Math.round((rank===0?7:rank===1?10:15)*(role==='mixed'?1.14:1)),speed:rank===0?130:rank===1?118:108,xp:rank===0?25:rank===1?43:70,attackWidth:role==='ranged'?22:34,reach:role==='ranged'?350:role==='mixed'?105:77});
 e.health=e.maxHealth;e.originalRobotRole=role;
 if(role==='mixed')e.speed=150;
 return e;
};
const desertTickEnemyBase=enemyBattle.tickEnemy;
enemyBattle.tickEnemy=function(e,dt,hero,world){
 if(e.robot&&e.originalRobotRole==='mixed'){
  const ranged=desertDistance(e,hero)>165;
  e.role=ranged?'ranged':'melee';e.reach=ranged?350:87;e.attackWidth=ranged?23:35;e.speed=ranged?137:169;e.cooldown=ranged?1.95:1.25;
 }
 return desertTickEnemyBase.call(this,e,dt,hero,world);
};
const desertPhaseBase=campaignSetPhase;
campaignSetPhase=function(index,initial=false){
 const r=desertPhaseBase(index,initial);
 if(desertActive()){
  desertReset();campaign.exit={x:campaign.width-80*campaign.scale,y:campaign.offsetY+287*campaign.scale,range:100*campaign.scale};
  campaign.walkEnd=campaign.width-19*campaign.scale;campaignUpdateUI();
 }
 return r;
};
const desertEnterBase=campaignEnter;
campaignEnter=function(){
 if(!desertActive())return desertEnterBase();
 if(adventure.hubOpen||!campaignExitReady||!campaignCanEnter())return false;
 if(campaign.phaseIndex<2){
  campaignSetPhase(campaign.phaseIndex+1);
  enemyBanner(desertTitle[campaign.phaseIndex],campaign.phaseIndex===1?'NO BAJES LA GUARDIA · GUSANOS DE ARENA':'LAS MARCAS DEL ALFA SE HACEN MÁS PROFUNDAS',2.5,'signal');
  gameSaveCurrent();return true;
 }
 if(desertState.defeated)return adventureShowHub();
 return false;
};
const desertKingTickBase=kingGameTick;
kingGameTick=function(dt){if(desertActive())return;return desertKingTickBase(dt);};
const desertKingExitBase=kingCanExit;
kingCanExit=function(){return desertActive()?(campaign.phaseIndex!==2||desertState.defeated):desertKingExitBase();};
const desertCampaignUIBase=campaignUpdateUI;
campaignUpdateUI=function(){
 desertCampaignUIBase();
 if(!desertActive())return;
 campaignUI.campaignPhase.textContent='RUTA DEL ALFA · '+(campaign.phaseIndex+1)+' / 3';
 campaignUI.campaignExitLabel.textContent=['SALIDA DEL PUEBLO','ENTRADA A LA CUEVA','GUARIDA DEL ALFA'][campaign.phaseIndex];
 campaignUI.campaignExitTitle.textContent=['El mar de arena','Cueva de los aullidos','ADN recuperado'][campaign.phaseIndex];
 campaignUI.campaignEnter.querySelector('span').textContent=['Salir del pueblo','Entrar a la cueva','Volver al selector'][campaign.phaseIndex];
 campaignExitReady=campaign.atExit(player)&&encounters.complete&&(campaign.phaseIndex<2||desertState.defeated);
 campaignUI.campaignExit.hidden=!campaignExitReady;campaignUI.campaignEnter.disabled=!campaignCanEnter();
};
const desertBackgroundBase=campaignArt.background.bind(campaignArt);
campaignArt.background=function(ctx,level,view){if(desertActive())return desertArt.background(ctx,level,view,t);return desertBackgroundBase(ctx,level,view);};
const desertAmbientBase=campaignArt.ambient.bind(campaignArt);
campaignArt.ambient=function(ctx,level,time,view){
 if(desertActive()){desertArt.ambience(ctx,level,time,view);if(campaign.phaseIndex===1)for(const w of desertState.worms)desertArt.worm(ctx,w,time);return;}
 return desertAmbientBase(ctx,level,time,view);
};
const desertDrawBase=enemyDraw;
enemyDraw=function(e,options){if(e.alpha)return desertArt.alpha(ctx,e,t);if(e.robot)return desertArt.robot(ctx,e,t);return desertDrawBase(e,options);};
const desertDamageBase=enemyDamage;
enemyDamage=function(e,amount,heavy,feedback){
 if(!e.alpha)return desertDamageBase(e,amount,heavy,feedback);
 if(!e.alive||!(amount>0))return false;
 const attackScale=feedback?.attackScale??(stats.form?evolutionBonus().atk:1);
 const armor=e.phase===3?.03:.17,damage=Math.max(1,Math.round(amount*attackScale*(1-armor)));
 e.health=Math.max(0,e.health-damage);e.hit=.18;spawnHit(e.x,e.y-65,!!heavy);floatText(e.x,e.y-e.bodyHeight-9,'-'+damage,heavy?'#ffd1a7':'#e7def4',14);
 if(e.health<=0)desertDefeatAlpha();
 else{const phase=e.health>e.maxHealth*2/3?1:e.health>e.maxHealth/3?2:3;if(phase!==e.phase){e.phase=phase;e.alphaMode='recover';e.alphaClock=0;e.attackClock=1.05;enemyBanner('ALFA · FASE '+phase+' / 3',phase===2?'¡AULLIDO SÓNICO! · EVITA LAS ONDAS':'FURIA TOTAL · MÁS RÁPIDO, MENOS DEFENSA',2.4,'boss');}}
 return true;
};
function desertStartAlpha(){
 if(!desertActive()||campaign.phaseIndex!==2||desertState.defeated||desertState.boss)return;
 enemyBattle.projectiles.length=0;
 const arena={left:campaign.width-760*campaign.scale,right:campaign.walkEnd};
 campaign.arena=arena;
 const at=campaign.clampPoint({x:arena.right-155,y:campaign.offsetY+284*campaign.scale},29,props)||{x:arena.right-155,y:campaign.offsetY+284*campaign.scale};
 const boss={...at,alpha:true,enemy:true,kind:'finalboss',role:'alpha',name:'Blitzwolfer Alfa',id:++enemyBattle.nextId,phase:1,alphaMode:'circle',alphaClock:0,attackClock:1.8,health:2450,maxHealth:2450,armor:.17,radius:31,bodyHeight:176,alive:true,mode:'idle',modeTime:0,deadAge:0,hit:0,shake:0,stunTime:0,cooldownLeft:0,knockX:0,knockY:0,poise:0,poiseLeft:0,facing:'left',xp:430,turn:1,chainLeft:0,moveDir:{x:-1,y:0},target:{x:player.x,y:player.y},damage:22};
 desertState.boss=boss;enemyBattle.enemies.push(boss);dummyList=enemyBattle.enemies;
 enemyBanner('BLITZWOLFER ALFA','CUEVA DE LA MANADA · DERROTA AL ALFA PARA ESCANEAR SU ADN',3.2,'boss');
 desertUpdateHud();gameSaveCurrent();
}
function desertDefeatAlpha(){
 const e=desertState.boss;if(!e||!e.alive)return;
 e.alive=false;e.mode='defeat';e.alphaMode='defeat';e.alphaClock=0;e.health=0;e.deadAge=0;
 desertState.rewardReady=true;campaign.arena=null;desertState.stun=0;enemyBattle.projectiles.length=0;
 desertUI.stun.hidden=true;enemyBanner('¡ALFA DERROTADO!','ACÉRCATE Y PRESIONA E PARA ESCANEAR EL ADN',3.5,'clear');
 gameSaveCurrent();
}
function desertHitPlayer(e,amount,dir,stun=0){
 if(stats.health<=0)return false;
 const ok=enemyPlayerHit({enemy:e,damage:Math.max(1,Math.round(amount)),origin:{x:e.x,y:e.y},dir});
 if(ok&&stun)desertState.stun=Math.max(desertState.stun,stun);
 return ok;
}
function desertMoveBoss(e,dt,dx,dy){
 const next=campaign.move(e,dx*dt,dy*dt,e.radius,props);
 e.x=next.x;e.y=next.y;if(Math.abs(dx)>1)e.facing=dx>=0?'right':'left';
}
function desertAlphaTick(dt){
 const e=desertState.boss;if(!e||!e.alive)return;
 const dir=desertDir(e,player),dist=desertDistance(e,player);
 e.hit=Math.max(0,(e.hit||0)-dt);e.alphaClock+=dt;e.attackClock-=dt;
 const phase=e.phase,speed=phase===1?185:phase===2?240:332;
 const state=e.alphaMode;
 if(state==='circle'||state==='hunt'){
  const turn=(Math.floor(enemyBattle.time/3)%2)?1:-1,goal={x:player.x+Math.cos(enemyBattle.time*1.7*turn)*(phase===3?118:145),y:player.y+Math.sin(enemyBattle.time*1.7*turn)*42};
  const d=desertDir(e,goal);desertMoveBoss(e,dt,d.x*speed,d.y*speed*.8);
  if(e.attackClock<=0){
   e.alphaClock=0;e.target={x:player.x,y:player.y};
   const pick=desertRand();
   e.alphaMode=phase===1?(pick<.65?'windup':'charge'):phase===2?(pick<.52?'howl':pick<.77?'leap':'charge'):(pick<.55?'chain':pick<.8?'leap':'charge');
   e.attackClock=phase===3?.75:phase===2?1.25:1.5;e.hitOnce=false;e.chainLeft=phase===3?3:1;
  }
 }else if(state==='windup'){
  e.facing=dir.x>=0?'right':'left';if(e.alphaClock>.34){e.alphaMode='charge';e.alphaClock=0;e.moveDir=desertDir(e,e.target);}
 }else if(state==='charge'){
  if(e.alphaClock<.09)e.moveDir=desertDir(e,e.target);
  desertMoveBoss(e,dt,e.moveDir.x*(phase===3?770:phase===2?615:565),e.moveDir.y*(phase===3?560:420));
  if(!e.hitOnce&&dist<56){desertHitPlayer(e,phase===3?33:24,dir);e.hitOnce=true;}
  if(e.alphaClock>.32){e.alphaMode='claw';e.alphaClock=0;e.hitOnce=false;}
 }else if(state==='claw'){
  const a=desertDir(e,player);if(e.alphaClock<.30){desertMoveBoss(e,dt,a.x*speed*.72,a.y*speed*.55);}
  if(!e.hitOnce&&dist<90&&e.alphaClock>.17){desertHitPlayer(e,phase===3?26:18,a);e.hitOnce=true;}
  if(e.alphaClock>.46){e.alphaMode='recover';e.alphaClock=0;}
 }else if(state==='leap'){
  if(e.alphaClock<.4){const a=desertDir(e,player);desertMoveBoss(e,dt,a.x*speed*1.8,a.y*speed*1.25);}
  if(!e.hitOnce&&dist<68){desertHitPlayer(e,phase===3?27:19,dir);e.hitOnce=true;}
  if(e.alphaClock>.48){e.alphaMode='claw';e.hitOnce=false;e.alphaClock=0;}
 }else if(state==='howl'||state==='chain'){
  const duration=phase===3?.24:.65;
  if(e.alphaClock<.1){e.facing=dir.x>=0?'right':'left';}
  if(e.alphaClock>=duration&&!e.hitOnce){
   e.hitOnce=true;
   const distance=Math.hypot(e.x-player.x,(e.y-player.y)*1.4);
   if(distance<370){
    const facing=e.facing==='right'?1:-1,dx=(player.x-e.x),dy=(player.y-e.y);
    if(dx*facing>0&&Math.abs(dy)<95+Math.abs(dx)*.19)desertHitPlayer(e,phase===3?18:12,dir,phase===3?1.25:1.4);
   }
   if(state==='chain'&&e.chainLeft>1){
    e.chainLeft--;e.alphaClock=-.15;e.hitOnce=false;
    const x=desertClamp(player.x+(e.chainLeft%2?1:-1)*180,campaign.arena.left+50,campaign.arena.right-50);
    const at=campaign.clampPoint({x,y:campaign.offsetY+(e.chainLeft%2?250:310)*campaign.scale},e.radius,props);
    if(at){e.x=at.x;e.y=at.y;}
   }
  }
  if(e.alphaClock>duration+.35){e.alphaMode='recover';e.alphaClock=0;}
 }else if(state==='recover'){
  if(e.alphaClock>(phase===3?.22:phase===2?.55:.8)){e.alphaMode='circle';e.alphaClock=0;}
 }
 e.mode=e.alphaMode==='charge'?'attack':e.alphaMode==='howl'||e.alphaMode==='chain'?'secondary':'walk';
 e.modeTime=e.alphaClock;e.animationTime=(e.animationTime||0)+dt;
}
function desertWormTick(dt){
 if(!desertActive()||campaign.phaseIndex!==1||stats.health<=0||desertUI.dev&&!desertUI.dev.hidden)return;
 desertState.wormClock-=dt;
 if(desertState.wormClock<=0){
  desertState.wormClock=3.9+desertRand()*3.1;
  const at=campaign.clampPoint({x:player.x+((desertRand()-.5)*240),y:player.y+(desertRand()-.5)*75},20,props);
  if(at)desertState.worms.push({...at,stage:'warning',age:0,hit:false});
 }
 for(const w of desertState.worms){
  w.age+=dt;
  if(w.stage==='warning'&&w.age>.88){w.stage='emerge';w.age=0;}
  if(w.stage==='emerge'&&w.age>.32){w.stage='strike';w.age=0;}
  if(w.stage==='strike'&&w.age>.24&&!w.hit){
   w.hit=true;
   if(desertDistance(w,player)<75)desertHitPlayer({x:w.x,y:w.y,name:'Gusano de arena'},9,desertDir(w,player));
  }
  if(w.stage==='strike'&&w.age>.68){w.stage='retreat';w.age=0;}
 }
 desertState.worms=desertState.worms.filter(w=>w.stage!=='retreat'||w.age<.5);
}
function desertScanAlpha(){
 if(!desertActive()||!desertState.rewardReady||desertState.defeated||!desertState.boss)return false;
 const e=desertState.boss;if(desertDistance(player,e)>155){showToast('ACÉRCATE AL ADN DEL ALFA');return false;}
 desertState.rewardReady=false;desertState.defeated=true;desertState.rewardOpen=true;
 campaignUnlocks.unlockBlitzwolfer();stats.awardXP(e.xp);evolutionSave();
 desertUI.reward.hidden=false;keys.clear();pointer.active=false;toggleWheel(false);refreshCampaignAlienLocks();
 enemyBanner('ADN DE BLITZWOLFER','TRANSFORMACIÓN DISPONIBLE EN EL OMNITRIX',3,'clear');
 document.getElementById('alphaRewardContinue').focus({preventScroll:true});
 gameSaveCurrent();return true;
}
function desertCloseReward(transform=false){
 desertState.rewardOpen=false;desertUI.reward.hidden=true;lastTime=performance.now();game.focus({preventScroll:true});
 if(transform){returnToBen();stats.energy=stats.config.maxEnergy;stats.rechargeLocked=false;stats.rechargeLeft=0;selectSlot(8);}
 else adventureShowHub();
 gameSaveCurrent();
}
document.getElementById('alphaRewardContinue').addEventListener('click',()=>desertCloseReward(false));
document.getElementById('alphaRewardTransform').addEventListener('click',()=>desertCloseReward(true));
const desertTickBase=enemyGameTick;
enemyGameTick=function(dt,before){
 const r=desertTickBase(dt,before);
 if(desertActive()&&Ben10MainMenu.state.screen==='game'&&stats.health>0){
  desertState.stun=Math.max(0,desertState.stun-dt);
  if(campaign.phaseIndex===1)desertWormTick(dt);
  if(campaign.phaseIndex===2&&encounters.complete&&!desertState.boss&&!desertState.defeated&&player.x>=campaign.width-650*campaign.scale)desertStartAlpha();
  desertAlphaTick(dt);
  desertUpdateHud();
 }
 return r;
};
function desertUpdateHud(){
 const e=desertState.boss,visible=desertActive()&&!!e&&!desertState.defeated;
 desertUI.hud.hidden=!visible;
 if(visible){desertUI.phase.textContent='FASE '+e.phase+' / 3';desertUI.health.style.width=Math.max(0,e.health/e.maxHealth*100)+'%';desertUI.state.textContent=desertState.rewardReady?'ACÉRCATE Y PRESIONA E PARA ESCANEAR':e.alphaMode==='chain'?'¡CADENA DE AULLIDOS! · ESCONDETE':e.alphaMode==='howl'?'¡AULLIDO SÓNICO! · ESQUIVA':'ALFA · '+e.alphaMode.toUpperCase();}
 desertUI.stun.hidden=desertState.stun<=0||!desertActive();
}
const desertMoveBase=campaignMovePlayer;
campaignMovePlayer=function(x,y){if(desertActive()&&desertState.stun>0)return;return desertMoveBase(x,y);};
for(const action of ['lightAttack','heavyAttack','dodge']){
 const fn=action==='lightAttack'?lightAttack:action==='heavyAttack'?heavyAttack:dodge;
 if(action==='lightAttack')lightAttack=function(){if(desertActive()&&desertState.stun>0)return;return fn();};
 else if(action==='heavyAttack')heavyAttack=function(){if(desertActive()&&desertState.stun>0)return;return fn();};
 else dodge=function(){if(desertActive()&&desertState.stun>0)return;return fn();};
}
const desertRouteHintBase=enemyShowRoute;
enemyShowRoute=function(clear){desertRouteHintBase(clear);if(desertActive())document.querySelector('#routeHint small').textContent=clear?['Salida del pueblo','Entrada a la cueva','La guarida del Alfa'][campaign.phaseIndex]:'Siguiente patrulla de Vilgax';};
const desertSaveBase=gameSaveCurrent;
gameSaveCurrent=function(notify=false){if(desertState.testing)return false;return desertSaveBase(notify);};
const desertRetryBase=enemyRetry;
enemyRetry=function(){
 if(desertActive()&&desertState.boss&&!desertState.defeated){
  stats.setHealth(stats.config.maxHealth);stats.energy=stats.config.maxEnergy;stats.rechargeLeft=0;stats.rechargeLocked=false;
  desertReset();enemyBattle.reset(2);dummyList=enemyBattle.enemies;encounters.index=encounters.cleared=encounters.plan.length;encounters.complete=true;encounters.current=null;encounters.pending=[];
  desertStartAlpha();const a=campaign.arena;player.x=a.left+95;player.y=campaign.offsetY+290*campaign.scale;enemyUI.defeat.hidden=true;keys.clear();campaignCamera(0,true);return;
 }
 return desertRetryBase();
};
// Existing V44 retry button is bound to the original function: intercept only desert boss retries.
document.getElementById('retryEncounter').addEventListener('click',event=>{
 if(desertActive()&&desertState.boss&&!desertState.defeated){event.stopImmediatePropagation();enemyRetry();}
},{capture:true});
function v47DevSet(open){
 if(open){if(Ben10MainMenu.state.screen!=='game'||comicOpen||desertState.rewardOpen)return false;keys.clear();pointer.active=false;toggleWheel(false);toggleProgressionPanel(false);toggleAdminPanel(false);v47DevFillZones();}
 desertUI.dev.hidden=!open;
 if(open){document.getElementById('v47DevZone').focus({preventScroll:true});}
 else game.focus({preventScroll:true});
 return true;
}
function v47DevFillZones(){
 const select=document.getElementById('v47DevZone');select.replaceChildren();
 const names=desertActive()?['Pueblo del desierto','Mar de arena','Cueva del Alfa']:adventure.story==='circus'?['Vestíbulo del circo','Obstáculos del circo','Escenario de Zombozo']:['Calles de Bellwood','Castillo de los Eternos','Laboratorio del Rey'];
 for(let i=0;i<3;i++){const option=document.createElement('option');option.value=String(i);option.textContent=names[i];select.appendChild(option);}
 select.value=String(campaign.phaseIndex);
}
function v47DevJump(){
 if(Ben10MainMenu.state.screen!=='game'||adventure.hubOpen)return;
 const phase=+document.getElementById('v47DevZone').value,stage=document.getElementById('v47DevStage').value;
 if(!Number.isInteger(phase)||phase<0||phase>2)return;
 desertState.testing=true;v47DevSet(false);
 if(adventure.mode==='mirror'&&typeof adventureLeaveMirror==='function'){adventure.mode='circus';mirrorRun=null;document.body.classList.remove('mirror-active');document.getElementById('mirrorHUD').hidden=true;adventureUseData();}
 if(adventure.story==='circus'&&adventure.mode==='entrance'){adventure.mode='circus';adventureUseData();}
 campaignSetPhase(phase);
 enemyBattle.reset(phase);dummyList=enemyBattle.enemies;encounters.current=null;encounters.pending=[];encounters.wave=0;encounters.between=0;encounters.index=0;encounters.cleared=0;encounters.complete=false;campaign.arena=null;
 const plan=encounters.plan,idx=stage==='last'?Math.max(0,plan.length-1):stage==='middle'?Math.floor(plan.length/2):stage==='start'?0:plan.length;
 if(stage==='start'){player.x=campaign.spawn(HUMAN.radius).x;}
 else if(stage==='exit'||stage==='boss'){encounters.index=encounters.cleared=plan.length;encounters.complete=true;player.x=stage==='boss'?campaign.width-660*campaign.scale:campaign.exit.x-25;}
 else {encounters.index=encounters.cleared=idx;player.x=desertClamp(plan[idx]?.trigger-115*campaign.scale||campaign.spawn().x,50,campaign.walkEnd-40);}
 if(stage==='boss'){
  if(desertActive()&&phase===2){desertStartAlpha();}
  else if(adventure.story==='circus'&&phase===2&&typeof zombozoStart==='function'){zombozoStart();}
  else if(adventure.story==='eternals'&&phase===2&&typeof kingStart==='function'){kingStart();}
 }
 const at=campaign.clampPoint({x:player.x,y:campaign.offsetY+290*campaign.scale},HUMAN.radius,props);
 if(at){player.x=at.x;player.y=at.y;}
 stats.setHealth(stats.config.maxHealth);stats.energy=stats.config.maxEnergy;player.mode='idle';player.modeTime=0;
 campaignUpdateUI();campaignCamera(0,true);enemySyncUI();enemyBanner('MODO DE PRUEBA','ZONA '+(phase+1)+' · NO SE GUARDARÁ EL PROGRESO',2.7,'signal');
}
function v47DevRestore(){
 const slot=Ben10SaveBank.active;if(slot===null)return;
 desertState.testing=false;v47DevSet(false);gameLoadSlot(slot);
}
document.querySelectorAll('[data-v47-points]').forEach(b=>b.addEventListener('click',()=>{
 const n=Number(b.dataset.v47Points);if(!Number.isFinite(n))return;
 progression.adminPoints=Math.min(999999,progression.adminPoints+n);evolutionSave();
 if(typeof evolutionUpdateDetails==='function')evolutionUpdateDetails();
 showToast('+'+n+' PUNTOS DE HABILIDAD');
}));
document.getElementById('v47DevClose').addEventListener('click',()=>v47DevSet(false));
document.getElementById('v47DevJump').addEventListener('click',v47DevJump);
document.getElementById('v47DevRestore').addEventListener('click',v47DevRestore);
addEventListener('keydown',event=>{
 if(Ben10MainMenu.state.screen!=='game')return;
 const k=event.key.toLowerCase();
 if(k==='u'&&!event.repeat){v47DevSet(desertUI.dev.hidden);event.preventDefault();event.stopImmediatePropagation();return;}
 if(!desertUI.dev.hidden){if(k==='escape')v47DevSet(false);if(!['tab','shift'].includes(k)){event.preventDefault();event.stopImmediatePropagation();}return;}
 if(desertState.rewardOpen){if(k==='escape'){event.preventDefault();event.stopImmediatePropagation();}return;}
 if(k==='e'&&!event.repeat&&desertState.rewardReady){desertScanAlpha();event.preventDefault();event.stopImmediatePropagation();}
},true);
// DESERT_V47_GAME_END
