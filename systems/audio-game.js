// AUDIO_GAME_START
const gameAudio={cues:[],damage:null,swing:null,enemySteps:new Map(),steps:0,previous:null,transform:null,lastZ:0,enemyFalls:new Set(),bossFall:null};
function audioOptions(point=player,extra={}){const distance=Math.hypot((point.x-player.x)||0,((point.y-player.y)||0)*1.4),gain=distance>1000?0:Math.max(.08,1-distance/1100);return {gain,pan:clamp(((point.x-player.x)||0)/550,-.7,.7),gameTime:t,...extra};}
function audioPlay(cue,point=player,extra={}){if(!cue)return false;gameAudio.cues.push({cue,time:t,mode:player.mode,modeTime:player.modeTime,...extra});if(gameAudio.cues.length>320)gameAudio.cues.shift();const options=audioOptions(point,extra);return options.gain>.08?Ben10Audio.play(cue,options):false;}
function audioLoop(key,cue,active,extra={}){if(active)Ben10Audio.keepLoop(key,cue,audioOptions(player,extra));else Ben10Audio.stopLoop(key)}
function audioSkillPrepare(c){const plan=Ben10SoundDesign.skill(c.form,c.definition.id);if(plan)audioPlay(plan.prepare,player,{source:c.form,skill:c.definition.id,key:'skill-prepare',gain:.6})}
function audioSkillContact(c,index){const plan=Ben10SoundDesign.skill(c.form,c.definition.id);if(!plan)return;let cue=plan.contact;if(c.definition.style==='grab'&&!combatTargetInReach(c))cue=c.form==='ghostfreak'?'ghost.whip':'body.swing';audioPlay(cue,player,{source:c.form,skill:c.definition.id,contact:index,key:'skill-contact:'+c.form,interval:Math.max(.045,Ben10SoundDesign.cues[cue].interval),gain:c.definition.contacts.length>3?.65:.85})}
function audioModeStarted(mode){
 if(gameAudio.swing){if(t<gameAudio.swing.contact)Ben10Audio._stop(gameAudio.swing.group,.015);gameAudio.swing=null}
 const form=stats.form?.id||'ben',heavy=mode.startsWith('heavy');
 const physical=/^(light|heavy)/.test(mode)&&form!=='stinkfly'&&!(heavy&&['heatblast','diamondhead','upgrade','blitzwolfer','cannonbolt','xlr8','ghostfreak'].includes(form))&&!(form==='four-arms'&&heavy&&player.specialQueued)&&!(form==='blitzwolfer'&&player.lightN===3);
 if(physical){const contact=attackContactTime(),lead=Math.max(0,contact-.055),group=audioPlay(Ben10SoundDesign.basic(form,heavy,player.lightN,false),player,{source:form,key:'player-swing',when:(Ben10Audio.context?.currentTime||0)+lead,gameTime:t+lead});if(group)gameAudio.swing={mode,form,group,contact:t+contact};}
 if(mode==='omnitrix'){gameAudio.transform=audioPlay('watch.charge',player,{source:'omnitrix',key:'transform-charge'});return}
 if(mode==='dash'){const form=stats.form?.id||'ben',cue=({ghostfreak:'ghost.phase',wildvine:'vine.whip',stinkfly:'body.swing',upgrade:'tech.morph'})[form]||'speed.rush';audioPlay(cue,player,{source:form,gain:.65});return}
 const cues={speedCharge:'speed.charge',speedRush:'speed.rush',speedFinish:'body.swing',speedBrake:'speed.skid',cannonFold:'ball.fold',cannonRush:'speed.rush',cannonBrake:'speed.skid',ghostHold:'ghost.phase'};
 if(cues[mode])audioPlay(cues[mode],player,{source:stats.form?.id||'ben'});
}
function audioPlayerHit(form,heavy,feedback,d){let cue=Ben10SoundDesign.hit(form,heavy,{slime:feedback.slime,combo:player.lightN});if(d.enemy&&!feedback.slime&&!['heatblast','diamondhead','ghostfreak','stinkfly','cannonbolt'].includes(form))cue=d.tier==='crystal'||d.kind==='finalboss'&&d.phase<3?'crystal.hit':form==='four-arms'?'metal.heavy':'metal.hit';audioPlay(cue,d,{source:form,key:'impact-material:'+cue,interval:feedback.slime?.16:.055,gain:feedback.slime?.35:1,pitch:form==='four-arms'?.88:form==='ben'?1.2:1})}
function audioEnemyEvent(event){const e=event.enemy;if(!e)return;const context=gameAudio.damage;
 if(event.type==='block'){if(context)context.blocked=true;audioPlay('metal.block',e,{source:'enemy',key:'impact:'+e.id})}
 if(event.type==='guard-break')audioPlay('metal.break',e,{source:'enemy',key:'guard-break:'+e.id});
 if(event.type==='shot')audioPlay(e.tier==='crystal'?'crystal.grow':'enemy.shot',e,{source:'enemy',key:'enemy-shot:'+e.id});
 if(event.type==='impact'&&e.role!=='ranged')audioPlay(e.role==='champion'?'boss.slash':'enemy.swing',e,{source:'enemy',key:'enemy-swing:'+e.id});
 if(event.type==='channel-start')audioPlay('enemy.support',e,{source:'enemy',key:'support:'+e.id});
 if(['heal','boost'].includes(event.type))audioPlay('enemy.support',e,{source:'enemy',key:'support-contact:'+e.id,gain:.6});
 if(event.type==='channel-interrupted')audioPlay('ui.denied',e,{source:'enemy',gain:.2,key:'channel-stop:'+e.id});
}
function audioKingEvent(event){const e=event.enemy;if(!e)return;const map={'king-start':'ui.combat','king-windup':'boss.draw','king-contact':'boss.slash','king-guard-break':'crystal.break','king-guard-restored':'crystal.grow','king-summon':'boss.command','king-dodge':'speed.skid','king-reward':'ui.unlock'};if(map[event.type])audioPlay(map[event.type],e,{source:'king',key:event.type,interval:.07});if(event.type==='king-phase')audioPlay(event.phase===3?'crystal.break':'boss.command',e,{source:'king'});if(event.type==='king-defeated')gameAudio.bossFall={enemy:e,at:kingEncounter.time+.96};}
function audioGameTick(dt){
 const active=Ben10MainMenu.state.screen==='game'&&!comicOpen&&!state.wheel&&!progressionPanelOpen&&!adminPanelOpen&&!kingRewardOpen;Ben10Audio.setGameActive(active);Ben10Audio.setRoom(campaign.phaseIndex);if(!active)return;
 const form=stats.form?.id||'ben',c=progression.skill,p=c?c.age/c.duration:0,plan=c?Ben10SoundDesign.skill(c.form,c.definition.id):null;
 audioLoop('skill',plan?.sustain,!!plan?.sustain&&p>=.18&&p<(plan.sustain==='ball.charge'?.58:.84),{gain:.6,source:form});
 audioLoop('speed-wind','speed.wind',!!c&&c.form==='xlr8'&&['rush','kickRush','drift','orbitOnce','zigzag','flurry'].includes(c.route)&&p>.22&&p<.8,{gain:.6,source:form});
 audioLoop('hot-rush','ball.roll',!!c&&c.form==='cannonbolt'&&c.route==='hotRush'&&p>=.58&&p<.84,{gain:.7,source:form});
 audioLoop('rolling','ball.roll',isCannonbolt()&&(cannonAction.phase==='rush'||player.mode==='idle'&&player.moving)||isXLR8()&&player.mode==='idle'&&player.moving,{gain:isXLR8()?.4:.7,pitch:isXLR8()?1.7:1,source:form});
 audioLoop('ball-charge','ball.charge',cannonAction.phase==='charge',{gain:.7,source:form});
 audioLoop('wings','insect.wings',isStinkfly()&&(player.mode==='dash'||!!c&&c.z>5),{gain:.65,source:form});
 audioLoop('flame-idle','fire.crackle',isHeatblast()&&!c&&player.mode==='idle',{gain:.5,source:form});
 if(gameAudio.swing&&player.mode!==gameAudio.swing.mode){if(t<gameAudio.swing.contact)Ben10Audio._stop(gameAudio.swing.group,.02);gameAudio.swing=null}
 if(gameAudio.transform&&player.mode!=='omnitrix'){Ben10Audio._stop(gameAudio.transform,.04);gameAudio.transform=null}
 const previous=gameAudio.previous;gameAudio.previous={x:player.x,y:player.y};const moved=previous?Math.hypot(player.x-previous.x,player.y-previous.y):0;
 if(player.mode==='idle'&&player.moving&&moved<80&&!isGhostfreak()&&!isCannonbolt()&&!isXLR8()){
  gameAudio.steps+=moved;const stride=isFourArms()?43:isWildvine()?35:30;if(gameAudio.steps>=stride){gameAudio.steps%=stride;const cue=isFourArms()?'ground.heavy':isWildvine()?'ground.root':isUpgrade()?'ground.gel':campaign.phaseIndex===2?'ground.metal':'ground.step';audioPlay(cue,player,{source:form,key:'player-step',pitch:isHeatblast()?1.1:1})}
 }else gameAudio.steps=0;
 if(c){if(gameAudio.lastZ>12&&(c.z||0)<2&&p>.5&&!['meteor','comet','bounce'].includes(c.route))audioPlay('ground.land',player,{gain:.35,source:form});gameAudio.lastZ=c.z||0}else gameAudio.lastZ=0;
 for(const e of enemyBattle.enemies){if(!e.alive)continue;const last=gameAudio.enemySteps.get(e.id),moved=last?Math.hypot(e.x-last.x,e.y-last.y):0;const walked=(last?.walked||0)+(moved<50?moved:0);gameAudio.enemySteps.set(e.id,{x:e.x,y:e.y,walked});if(walked>46&&['walk','idle'].includes(e.mode)){audioPlay(e.role==='champion'||e.kind==='finalboss'?'ground.heavy':'ground.metal',e,{source:'enemy-step',key:'enemy-footsteps',interval:.16,gain:.2});gameAudio.enemySteps.set(e.id,{x:e.x,y:e.y,walked:0})}}
 for(const e of enemyBattle.enemies)if(!e.alive&&!gameAudio.enemyFalls.has(e.id)&&e.deadAge>=.35){gameAudio.enemyFalls.add(e.id);if(e.kind!=='finalboss')audioPlay('enemy.fall',e,{key:'enemy-fall:'+e.id,gain:.55})}
 if(gameAudio.enemyFalls.size>300)gameAudio.enemyFalls.clear();if(gameAudio.bossFall&&kingEncounter.time>=gameAudio.bossFall.at){audioPlay('boss.fall',gameAudio.bossFall.enemy,{source:'king'});gameAudio.bossFall=null}Ben10Audio.prune();
}
// Wrap successful simulation events; views and skill previews remain silent.
const soundStartMode=startMode;startMode=function(mode,duration){const r=soundStartMode(mode,duration);audioModeStarted(mode);return r};
const soundCalculateHit=calculateHit;calculateHit=function(){const form=stats.form?.id||'ben',heavy=player.mode.startsWith('heavy');if(!gameAudio.swing&&!(heavy&&['heatblast','diamondhead','upgrade','blitzwolfer'].includes(form)))audioPlay(Ben10SoundDesign.basic(form,heavy,player.lightN,player.specialAnimation||player.specialQueued),player,{source:form,key:'basic-contact'});gameAudio.swing=null;return soundCalculateHit()};
const soundDamageDummy=damageDummy;damageDummy=function(d,amount,heavy,feedback={}){const old=gameAudio.damage,context={form:feedback.sourceForm||stats.form?.id||'ben',blocked:false};gameAudio.damage=context;try{const hit=soundDamageDummy(d,amount,heavy,feedback);if(hit&&!context.blocked&&!gameAudio.projectileImpact)audioPlayerHit(context.form,heavy,feedback,d);return hit}finally{gameAudio.damage=old}};
const soundEnemyEvent=enemyBattle.onEvent;enemyBattle.onEvent=function(event){audioEnemyEvent(event);return soundEnemyEvent(event)};
const soundKingEvent=kingEncounter.onEvent;kingEncounter.onEvent=function(event){audioKingEvent(event);return soundKingEvent(event)};
const soundDirectorEvent=encounters.onEvent;encounters.onEvent=function(event){const r=soundDirectorEvent(event);if(event.type==='wave-start')audioPlay('ui.combat',player,{key:'combat-signal',interval:1});if(event.type==='encounter-clear')audioPlay('ui.clear',player,{key:'combat-clear'});return r};
const soundEnemyPlayerHit=enemyPlayerHit;enemyPlayerHit=function(hit){const before=stats.form?.id||'ben',r=soundEnemyPlayerHit(hit);if(r)audioPlay(before==='diamondhead'?'crystal.hit':before==='cannonbolt'?'ball.impact':'body.hit',player,{source:'player-hurt',key:'player-hurt',priority:8,gain:.9,pitch:before==='ben'?1.12:.9});return r};enemyBattle.onPlayerHit=hit=>enemyPlayerHit(hit);kingEncounter.onPlayerHit=hit=>enemyPlayerHit(hit);
const soundDrainEvents=stats.drainEvents.bind(stats);stats.drainEvents=function(){const events=soundDrainEvents();for(const event of events){if(event.type==='form-started'){if(gameAudio.transform)Ben10Audio._stop(gameAudio.transform,.04);gameAudio.transform=null;audioPlay('watch.transform',player,{source:event.form.id,key:'form-start'})}if(event.type==='form-ended'){for(const key of [...Ben10Audio.loops.keys()])Ben10Audio.stopLoop(key);audioPlay('watch.revert',player,{source:event.previous?.id,key:'form-end'});if(['empty','alien-defeated'].includes(event.reason))audioPlay('watch.empty',player,{key:'watch-empty'})}if(event.type==='watch-recharged')audioPlay('watch.ready');if(event.type==='level-up')audioPlay('ui.level');if(event.type==='defeated'){Ben10Audio.stopGame();audioPlay('ui.defeat')}}return events};
const soundSkillBegin=evolutionBeginSkill;evolutionBeginSkill=function(index,skill){const ok=soundSkillBegin(index,skill);if(ok)audioSkillPrepare(progression.skill);return ok};
const soundSkillContact=evolutionContact;evolutionContact=function(c,k){audioSkillContact(c,k);return soundSkillContact(c,k)};
const soundSkillCancel=evolutionCancelSkill;evolutionCancelSkill=function(){Ben10Audio.stopLoop('skill');return soundSkillCancel()};
const soundFireLaunch=fire.launch.bind(fire);fire.launch=function(options){const shot=soundFireLaunch(options);audioPlay(shot.kind==='crystal'?'crystal.grow':'fire.launch',shot,{source:shot.sourceForm,key:'projectile-release'});return shot};
const soundFireImpact=fireImpact;fireImpact=function(shot){audioPlay(shot.kind==='crystal'?'crystal.break':shot.special?'fire.burst':'fire.hit',shot,{source:shot.sourceForm,key:'projectile-impact',gain:shot.special?.8:.5});gameAudio.projectileImpact=true;try{return soundFireImpact(shot)}finally{gameAudio.projectileImpact=false}};
const soundSpit=slime.spit.bind(slime);slime.spit=function(options){const shot=soundSpit(options);audioPlay('slime.spit',shot,{source:'stinkfly',key:'spit-port',interval:.035,gain:.65});return shot};
const soundPool=slime.addPool.bind(slime);slime.addPool=function(...args){const pool=soundPool(...args);audioPlay('slime.splat',pool,{source:'stinkfly',key:'pool-born',gain:.7});return pool};
const soundSonic=sonics.launch.bind(sonics);sonics.launch=function(origin,...args){const wave=soundSonic(origin,...args);audioPlay('wolf.howl',origin,{source:'blitzwolfer'});return wave};
const soundThorns=thorns.launch.bind(thorns);thorns.launch=function(origin,...args){const wave=soundThorns(origin,...args);audioPlay('vine.roots',origin,{source:'wildvine'});return wave};
const soundLaser=emitUpgradeLaser;emitUpgradeLaser=function(){const r=soundLaser();audioPlay('tech.laser',player,{source:'upgrade',key:'eye-laser'});return r};
const soundGhostHit=ghostTentacleHit;ghostTentacleHit=function(){if(!ghostAction.hit)audioPlay('ghost.reveal',player,{source:'ghostfreak'});return soundGhostHit()};
const soundGhostGrab=beginGhostGrab;beginGhostGrab=function(){const r=soundGhostGrab();if(ghostAction.grab)audioPlay('ghost.reveal',player,{source:'ghostfreak'});return r};
const soundProjectile=evolutionProjectile;evolutionProjectile=function(c,k,kind,angle){const r=soundProjectile(c,k,kind,angle);if(kind==='rock')audioPlay('body.throw',player,{source:c.form,skill:c.definition.id,key:'skill-contact:'+c.form});return r};
const soundEvolutionEffect=evolutionEffect;evolutionEffect=function(c,kind,x,y,...args){if(kind==='impact'&&c.definition?.style==='rock')audioPlay('body.slam',{x,y},{source:c.form,key:'rock-impact',gain:.65});if(kind==='impact'&&c.form==='wildvine'&&['pillars','seed'].includes(c.definition?.style))audioPlay('vine.bloom',{x,y},{source:c.form,key:'flower-pop',gain:.5});if(['fire','crystal','slime','sticky','seed'].includes(kind))audioPlay(({fire:'fire.hit',crystal:'crystal.hit',slime:'slime.splat',sticky:'slime.splat',seed:'vine.bloom'})[kind],{x,y},{source:c.form,key:'impact-material:'+(({fire:'fire.hit',crystal:'crystal.hit',slime:'slime.splat',sticky:'slime.splat',seed:'vine.bloom'})[kind]),gain:.35});return soundEvolutionEffect(c,kind,x,y,...args)};
const soundRecovery=recoveryTick;recoveryTick=function(dt){const before=stats.health,ben=stats.benHealth,count=healthPickups.items.length,r=soundRecovery(dt);if(healthPickups.items.length<count&&(stats.health>before||stats.benHealth>ben))audioPlay('ui.heal');return r};
document.addEventListener('click',event=>{if(event.target.closest?.('#evoBuy')){const before=evolutionSpent();setTimeout(()=>{if(evolutionSpent()>before)audioPlay('ui.buy')},0)}},{capture:true});
const soundPurchase=evolutionPurchase;evolutionPurchase=function(){const before=evolutionSpent(),r=soundPurchase();if(evolutionSpent()>before)audioPlay('ui.buy');return r};
const soundEnergyDenied=combatEnergyDenied;combatEnergyDenied=function(){audioPlay('ui.denied');return soundEnergyDenied()};
const soundCampaignSetPhase=campaignSetPhase;campaignSetPhase=function(index,initial){Ben10Audio.stopGame();gameAudio.previous=null;gameAudio.enemyFalls.clear();gameAudio.enemySteps.clear();gameAudio.bossFall=null;const r=soundCampaignSetPhase(index,initial);Ben10Audio.setRoom(index);if(!initial&&!Ben10SaveBank.loading)audioPlay('watch.select',player,{key:'enter-phase'});return r};
const soundUpdate=update;update=function(dt){const r=soundUpdate(dt);audioGameTick(dt);return r};
// Overlay changes stop world sounds immediately, including during a held charge.
const soundSetScreen=Ben10MainMenu.setScreen;Ben10MainMenu.setScreen=function(screen){Ben10Audio.setGameActive(screen==='game'&&!comicOpen);return soundSetScreen(screen)};
const soundWheel=toggleWheel;toggleWheel=function(force){const was=state.wheel,r=soundWheel(force);if(state.wheel!==was){Ben10Audio.setGameActive(!state.wheel&&Ben10MainMenu.state.screen==='game'&&!comicOpen);audioPlay(state.wheel?'watch.select':'ui.back',player,{gain:.6})}return r};
const soundTree=toggleProgressionPanel;toggleProgressionPanel=function(force){const was=progressionPanelOpen,r=soundTree(force);if(was!==progressionPanelOpen){Ben10Audio.setGameActive(!progressionPanelOpen&&Ben10MainMenu.state.screen==='game'&&!comicOpen);audioPlay(progressionPanelOpen?'ui.accept':'ui.back',player,{gain:.55})}return r};
Ben10Audio.setGameActive(false);
// AUDIO_GAME_END
