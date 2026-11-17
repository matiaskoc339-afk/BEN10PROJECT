// MAIN_MENU_GAME_START
let gamePlaySeconds=0,gameSaveClock=0;
function gameSaveCurrent(notify=false){
 if(Ben10SaveBank.active===null||Ben10SaveBank.loading)return false;
 const boss=kingEncounter.boss,kind=adventure.hubOpen?'selection':adventure.story==='desert'&&desertState.defeated?'alpha-victory':adventure.story==='desert'&&desertState.boss?'alpha':adventure.mode==='mirror'?'mirror':adventure.story==='circus'&&zombozoEncounter.rewardGranted?'zombozo-victory':adventure.story==='circus'&&zombozoEncounter.rewardReady?'zombozo-reward':adventure.story==='circus'&&zombozoEncounter.boss?'zombozo':kingEncounter.rewardGranted?'victory':boss&&!kingEncounter.rewardGranted?'boss':encounters.current?'encounter':'travel';
 const saved=Ben10SaveBank.commit({playSeconds:gamePlaySeconds,progression:{version:33,owned:progression.owned,level:stats.level,xp:stats.xp,totalXP:stats.totalXP,adminPoints:progression.adminPoints,legacyCredit:progression.legacyCredit,migrated:progression.migrated},unlocks:{version:1,diamondhead:campaignUnlocks.diamondhead,ghostfreak:campaignUnlocks.ghostfreak,blitzwolfer:campaignUnlocks.blitzwolfer},adventure:adventureSnapshot(),checkpoint:{phase:campaign.phaseIndex,cleared:encounters.cleared,x:player.x,y:player.y,kind,introSeen:!comicOpen,kills:state.kills}});
 if(notify)Ben10MainMenu.notify(saved?'PARTIDA GUARDADA · ESPACIO '+(Ben10SaveBank.active+1):Ben10SaveBank.error);
 return saved;
}
function gameSaveTick(dt){gamePlaySeconds+=dt;gameSaveClock+=dt;if(gameSaveClock>=3){gameSaveClock=0;gameSaveCurrent()}}
function gameSetComic(show){comicOpen=show;comicUI.layer.hidden=!show;comicUI.layer.setAttribute('aria-hidden',String(!show));document.body.classList.toggle('comic-active',show);if(show){Object.assign(comicState,{index:0,elapsed:0,reveal:0,paused:false,lastFrame:performance.now(),lastAdvance:-Infinity});comicUpdateUI();comicDraw(performance.now())}}
function gameLoadSlot(index){
 Ben10SaveBank.loading=true;const {record,isNew}=Ben10SaveBank.activate(index);
 try{
  keys.clear();pointer.active=false;toggleWheel(false);toggleProgressionPanel(false);toggleAdminPanel(false);campaignResetEffects();kingResetPhase();
  adventureRestore(record);stats.reset();Object.assign(progression,{selected:0,focused:'core',owned:{},adminPoints:0,legacyCredit:0,comboLog:[],abilityTimes:{},skill:null,casts:[],fields:[],fx:[],buffs:{},boostTime:0,migrated:false});
  progression.zoom=1;campaignUnlocks.diamondhead=record.unlocks.diamondhead;campaignUnlocks.ghostfreak=record.unlocks.ghostfreak;campaignUnlocks.blitzwolfer=record.unlocks.blitzwolfer;evolutionLoad();
  const point=record.checkpoint;campaignSetPhase(Math.min(point?.phase||0,campaign.data.chapters.length-1));
  if(point){
   encounters.index=encounters.cleared=Math.min(point.cleared,encounters.plan.length);encounters.complete=encounters.index>=encounters.plan.length;encounters.current=null;encounters.pending=[];encounters.wave=0;encounters.between=0;
   let location=point.x||point.y?{x:point.x,y:point.y}:campaign.spawn(HUMAN.radius);
   if(point.kind==='encounter'&&!encounters.complete){const encounter=encounters.plan[encounters.index];location={x:Math.max(encounter.trigger,encounter.left+110),y:campaign.offsetY+285*campaign.scale}}
   if(point.kind==='boss'&&adventure.story!=='circus'&&campaign.phaseIndex===2){encounters.index=encounters.cleared=encounters.plan.length;encounters.complete=true;location=kingRetry()}
   if(point.kind==='victory'&&adventure.story!=='circus'&&campaign.phaseIndex===2){kingEncounter.completed=true;kingEncounter.rewardGranted=true;kingEncounter.boss=null;campaign.arena=null}
   const at=campaign.clampPoint(location,HUMAN.radius,props)||campaign.spawn(HUMAN.radius);player.x=at.x;player.y=at.y;
  }
  Object.assign(player,{selectedAlien:-1,pendingForm:null,mode:'idle',modeTime:0,modeDur:0,dir:'right',actionDir:'right',faceX:1,faceY:0,actionX:1,actionY:0,moving:false});
  stats.health=stats.config.maxHealth;stats.energy=stats.config.maxEnergy;stats.form=null;stats.clearCombo();stats.rechargeLocked=false;stats.rechargeLeft=0;stats.drainEvents();player.health=stats.health;
  state.kills=point?.kills||0;gamePlaySeconds=record.playSeconds;gameSaveClock=0;hudSignature='';hudHitFlash=0;hudLevelFlash=0;enemyHudSignature='';enemyBossSignature='';enemyInvulUntil=enemyBattle.time+1.5;enemyStaggerUntil=0;
  refreshCampaignAlienLocks();evolutionChangeAlien(0);syncHud();enemySyncUI();campaignUpdateUI();campaignCamera(0,true);lastTime=performance.now();
  gameSetComic(isNew||!point?.introSeen);Ben10MainMenu.setScreen('game');adventureResumeCheckpoint(record);game.focus({preventScroll:true});
 }finally{Ben10SaveBank.loading=false}
 gameSaveCurrent();
}
function gameCanPause(){return !adventure.hubOpen&&!comicOpen&&!state.wheel&&!progressionPanelOpen&&!adminPanelOpen&&!kingRewardOpen&&!zombozoRewardOpen&&!desertState.rewardOpen}
function gamePause(){if(Ben10MainMenu.state.screen!=='game'||!gameCanPause())return;keys.clear();pointer.active=false;gameSaveCurrent();Ben10MainMenu.setScreen('pause')}
function gameResume(){keys.clear();pointer.active=false;lastTime=performance.now();Ben10MainMenu.setScreen('game');game.focus({preventScroll:true})}
function gameSaveExit(){gameSaveCurrent();Ben10SaveBank.active=null;keys.clear();pointer.active=false;Ben10MainMenu.setScreen('home')}
Ben10MainMenu.bind({start:gameLoadSlot,pause:gamePause,resume:gameResume,exit:gameSaveExit,canPause:gameCanPause});
gameSetComic(false);Ben10MainMenu.setScreen('home');
addEventListener('pagehide',()=>gameSaveCurrent());
addEventListener('blur',()=>gameSaveCurrent());
document.addEventListener('visibilitychange',()=>{if(document.hidden)gameSaveCurrent()});
// MAIN_MENU_GAME_END
