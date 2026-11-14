// FINAL_KING_GAME_START
let campaignUnlockStorage;try{campaignUnlockStorage=localStorage}catch{}
const campaignUnlocks=new Ben10CampaignUnlocks.Unlocks(campaignUnlockStorage);
function campaignAlienUnlocked(id){return campaignUnlocks.has(id);}
function campaignLockedMessage(id){return id==='diamondhead'?'ADN BLOQUEADO · DERROTA AL REY ETERNO':'ADN BLOQUEADO · AÚN NO RECUPERADO';}
const kingArt=new Ben10KingRenderer(window.BEN10_KING_ART);
let kingRewardOpen=false,kingEncounterRoom=null,kingLastHUD='';
const kingUI={hud:document.getElementById('kingHUD'),reward:document.getElementById('kingReward'),health:document.getElementById('kingHealth'),healthText:document.getElementById('kingHealthText'),defense:document.getElementById('kingDefense'),defenseTrack:document.getElementById('kingDefenseRow'),defenseText:document.getElementById('kingDefenseText'),phase:document.getElementById('kingPhase'),state:document.getElementById('kingState')};
const kingEncounter=new Ben10FinalKing.Encounter(window.BEN10_KING_ART,{onPlayerHit:hit=>enemyPlayerHit(hit),onEvent:kingEvent});
function kingArena(){const room=campaign.rooms.at(-1);return {left:(room.x-campaign.phase.x+18)*campaign.scale,right:campaign.walkEnd};}
function kingResetPhase(){kingEncounter.reset();kingEncounterRoom=null;kingUI.hud.hidden=true;kingRewardOpen=false;kingUI.reward.hidden=true;kingLastHUD='';document.body.classList.remove('king-combat');}
function kingCanExit(){return campaign.phaseIndex!==2||kingEncounter.rewardGranted;}
function kingStart(){
 enemyBattle.enemies=enemyBattle.enemies.filter(e=>e.alive);enemyBattle.projectiles.length=0;
 campaign.arena=kingArena();const point=campaign.clampPoint({x:campaign.exit.x-100*campaign.scale,y:campaign.offsetY+282*campaign.scale},26,props);
 const e=kingEncounter.start(point||{x:campaign.exit.x-150,y:campaign.offsetY+285*campaign.scale},++enemyBattle.nextId);enemyBattle.enemies.push(e);kingEncounterRoom=campaign.phaseIndex;dummyList=enemyBattle.enemies;kingSyncUI();
}
function kingDismissHelpers(){for(const e of enemyBattle.enemies)if(e.bossHelper&&e.alive){e.alive=false;e.health=0;e.attack=null;e.support=null;e.mode='defeat';e.modeTime=0;e.deadAge=0;e.stunTime=0;}enemyBattle.projectiles.length=0;}
function kingEvent(event){
 const e=event.enemy;
 if(event.type==='king-start')enemyBanner('REY ETERNO','ROMPE SU DEFENSA · FUEGO DEBILITA EL CRISTAL',3);
 if(event.type==='king-guard-break'){enemyBanner('¡DESCUBIERTO!','AHORA PUEDES DAÑAR SU VIDA',1.7);spawnDust(e.x,e.y-70,18,'#a3ebd1');shake=Math.max(shake,5);}
 if(event.type==='king-phase')enemyBanner('FASE '+event.phase+' / 3',event.phase===2?'EL REY ENTRA EN FURIA':'LA CORAZA DE DIAMANTE SE ROMPE',2.1);
 if(event.type==='king-summon'){
  const allowed=Math.min(event.count,Ben10FinalKing.CONFIG.helperLimit-enemyBattle.living.filter(a=>a.bossHelper).length);
  for(let n=0;n<allowed;n++){const point=campaign.clampPoint({x:campaign.arena[n%2?'right':'left']+(n%2?-40:40),y:campaign.offsetY+(251+n*28)*campaign.scale},16,props);if(point){const helper=enemyBattle.spawn(n===2?'ranged':'melee','recruit',point,.7);helper.bossHelper=true;}}
 }
 if(event.type==='king-defeated'){kingDismissHelpers();progression.comboLog=[];combatTargetState.focus=null;enemyBanner('EL REY HA CAÍDO','EL ADN DE DIAMANTE HA SIDO LIBERADO',2);}
 if(event.type==='king-reward'){
  campaignUnlocks.unlockDiamondhead();state.kills++;stats.awardXP(e.xp);evolutionSave();campaign.arena=null;kingRewardOpen=true;kingUI.reward.hidden=false;keys.clear();pointer.active=false;toggleWheel(false);refreshCampaignAlienLocks();
  const c=document.getElementById('kingRewardPortrait').getContext('2d');c.clearRect(0,0,128,128);const icon=pixelWheelIcons['4'];if(icon?.complete){c.imageSmoothingEnabled=false;c.drawImage(icon,8,8,112,112)}document.getElementById('kingRewardContinue').focus({preventScroll:true});
 }
}
function kingGameTick(dt){
 if(campaign.phaseIndex!==2)return;
 const room=campaign.rooms.at(-1),trigger=(room.x-campaign.phase.x+room.width*.30)*campaign.scale;
 if(!kingEncounter.boss&&encounters.complete&&player.x>=trigger)kingStart();
 if(kingEncounter.boss)kingEncounter.update(dt,player,enemyPhysics(),{helpers:enemyBattle.living.filter(e=>e.bossHelper).length});
 kingSyncUI();
}
function kingSyncUI(){
 const e=kingEncounter.boss;kingUI.hud.hidden=!e||kingEncounter.rewardGranted;document.body.classList.toggle('king-combat',!!e?.alive);
 if(!e)return;const signature=[e.phase,e.health,Math.ceil(e.defense),e.exposedLeft>0,e.transition,kingEncounter.rewardGranted].join('|');if(signature===kingLastHUD)return;kingLastHUD=signature;
 kingUI.health.style.width=100*e.health/e.maxHealth+'%';kingUI.healthText.textContent=Math.ceil(e.health)+' / '+e.maxHealth;kingUI.hud.setAttribute('aria-valuenow',e.health);kingUI.hud.setAttribute('aria-valuemax',e.maxHealth);kingUI.phase.textContent='FASE '+e.phase+' / 3';kingUI.hud.dataset.phase=e.phase;
 kingUI.defenseTrack.hidden=e.phase===3&&!e.transition;kingUI.defense.style.width=e.maxDefense?100*e.defense/e.maxDefense+'%':'0%';kingUI.defenseText.textContent=Math.ceil(e.defense)+' / '+e.maxDefense;
 kingUI.state.textContent=!e.alive?'DERROTADO':e.transition?'CAMBIO DE FASE':e.exposedLeft>0?'DESCUBIERTO · DAÑA SU VIDA':e.phase===3?'SIN CORAZA · NO LO DEJES HUIR':'VIDA PROTEGIDA · ROMPE SU DEFENSA';kingUI.hud.classList.toggle('exposed',e.exposedLeft>0);
}
function kingDamage(e,amount,feedback){
 const outcome=kingEncounter.damage(amount,{sourceForm:feedback.sourceForm??stats.form?.id});
 if(outcome.evaded){floatText(e.x,e.y-e.bodyHeight,'ESQUIVA','#d5e8e5',11);return false}
 if(outcome.defenseDamage){spawnDust(e.x,e.y-65,3,'#a6e8d4');floatText(e.x,e.y-e.bodyHeight-6,'−'+Math.ceil(outcome.defenseDamage)+' DEF','#a6e8d4',12)}
 if(outcome.damage){spawnHit(e.x,e.y-55,true);floatText(e.x,e.y-e.bodyHeight-6,'−'+Math.ceil(outcome.damage),'#ffd4ba',14)}kingSyncUI();return !!(outcome.damage||outcome.defenseDamage);
}
function kingRetry(){enemyBattle.reset(2);kingEncounter.reset();kingLastHUD='';campaign.arena=kingArena();const p=campaign.clampPoint({x:campaign.arena.left+105,y:campaign.offsetY+285*campaign.scale},HUMAN.radius,props);player.x=p.x;player.y=p.y;kingStart();return p}
function kingCloseReward(){kingRewardOpen=false;kingUI.reward.hidden=true;lastTime=performance.now();game.focus({preventScroll:true});campaignUpdateUI();}
document.getElementById('kingRewardContinue').addEventListener('click',kingCloseReward);
document.getElementById('kingRewardTransform').addEventListener('click',()=>{kingCloseReward();returnToBen();stats.energy=stats.config.maxEnergy;stats.rechargeLocked=false;stats.rechargeLeft=0;selectSlot(3)});
document.addEventListener('keydown',event=>{if(!kingRewardOpen)return;event.preventDefault();event.stopImmediatePropagation();if(['Enter','Escape'].includes(event.key))kingCloseReward();},{capture:true});
function refreshCampaignAlienLocks(){document.querySelectorAll('.evo-tab').forEach((el,i)=>{const id=SKILL_BOOK[i].id,locked=!campaignAlienUnlocked(id);el.classList.toggle('dna-locked',locked);el.querySelector('i').textContent=locked?'🔒':ROSTER_KEYS[i];el.setAttribute('aria-label',SKILL_BOOK[i].name+(locked?' · '+campaignLockedMessage(id):' · ADN disponible'));});if(typeof evolutionUpdateDnaStatus==='function')evolutionUpdateDnaStatus();if(state.wheel)drawWheel();}
// FINAL_KING_GAME_END
