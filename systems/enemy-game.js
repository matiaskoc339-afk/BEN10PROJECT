// ENEMY_GAME_START
const enemyArt=new Ben10EnemyRenderer(window.BEN10_ENEMY_DATA);
let enemyInvulUntil=0,enemyStaggerUntil=0,enemyBannerLeft=0,enemyHudSignature='',enemyBossSignature='',enemyRouteLeft=0,enemyBannerDuration=1;
const enemyUI={status:document.getElementById('waveStatus'),banner:document.getElementById('waveBanner'),boss:document.getElementById('championHUD'),defeat:document.getElementById('defeatLayer')};
function enemyBanner(title,subtitle,duration=2.3,kind='signal'){enemyUI.banner.querySelector('strong').textContent=title;enemyUI.banner.querySelector('.battle-subtitle').textContent=subtitle;enemyUI.banner.querySelector('small').textContent=kind==='combat'?'SECTOR HOSTIL':kind==='clear'?'VÍA LIBRE':kind==='boss'?'AMENAZA PRINCIPAL':'OMNITRIX';enemyUI.banner.dataset.kind=kind;enemyBannerLeft=enemyBannerDuration=duration;enemyUI.banner.style.setProperty('--banner-time','1');enemyUI.banner.classList.add('show');}
function enemyShowRoute(phaseComplete){const hint=document.getElementById('routeHint');enemyRouteLeft=4.8;hint.querySelector('small').textContent=phaseComplete?['Entrada del castillo','Entrada del laboratorio','Sala del Rey Eterno'][campaign.phaseIndex]:'Siguiente combate';hint.hidden=false;}
function enemyRouteTick(dt){enemyRouteLeft=Math.max(0,enemyRouteLeft-dt);const hint=document.getElementById('routeHint');hint.hidden=enemyRouteLeft<=0||!!encounters.current||!!kingEncounter.boss?.alive||stats.health<=0;if(hint.hidden)return;hint.style.left=(campaignView.x+campaignView.width-86)+'px';hint.style.top=(campaignView.y+campaignView.height*.61)+'px';hint.style.setProperty('--route-drift',Math.sin(t*5)*5+'px');hint.style.opacity=Math.min(1,enemyRouteLeft/.45);}

function enemyEvent(event){
 const d=event.enemy;
 if(event.type==='defeat'){recoveryDrop(d);state.kills++;stats.awardXP(d.xp);evolutionSave();floatText(d.x,d.y-d.bodyHeight-15,'+'+d.xp+' XP','#f2cc8f',13);spawnDust(d.x,d.y,7,d.tier==='crystal'?'#a1d7c5':'#bba080');}
 else if(event.type==='heal'){floatText(event.target.x,event.target.y-event.target.bodyHeight-14,'+'+Math.round(event.amount),'#97efba',14);}
 else if(event.type==='boost'){floatText(event.target.x,event.target.y-event.target.bodyHeight-14,'POTENCIADO','#eaca89',12);}
 else if(event.type==='guard-break'){floatText(d.x,d.y-d.bodyHeight-13,'GUARDIA ROTA','#edc480',12);}
 else if(event.type==='impact'&&d.role==='champion'){pieces.push({type:'shockwave',x:d.x+d.attack.dir.x*60,y:d.y+d.attack.dir.y*60,vx:0,vy:0,life:.32,max:.32,size:90,color:d.tier==='crystal'?'#9cddc9':'#d6b48b'});shake=Math.max(shake,4);}
}
function enemyPlayerHit(hit){
 const dodging=player.mode==='dash'&&player.modeTime<player.modeDur*.85||cannonAction.kind==='dash'&&['fold','rush'].includes(cannonAction.phase);
 if(stats.health<=0||enemyBattle.time<enemyInvulUntil||dodging||player.mode==='omnitrix'||stats.invulnerable||ghostIntangible()||evolutionSkillIntangible())return false;
 if(hit.nonLethal&&stats.health<=1)return false;const n=stats.damage(hit.nonLethal?Math.min(hit.damage,stats.health-1):hit.damage);if(!n)return false;enemyInvulUntil=enemyBattle.time+.75;enemyStaggerUntil=t+.17;hudHitFlash=.28;
 if(!evolutionCasting()){
  cancelSpeedAbility();cancelCannonAbility();cancelGhostAbility();cancelStinkAction(true);cancelWildAction(true);cancelWolfAction(true);cancelUpgradeAction(true);
  player.mode='idle';player.modeTime=0;player.modeDur=0;player.bufferedAttack=null;player.specialQueued=false;player.specialAnimation=false;player.moving=false;
 }
 if(stats.health>0){const p=campaign.move(player,hit.dir.x*20,hit.dir.y*12,actorMetrics().radius,props);player.x=p.x;player.y=p.y;}
 spawnHit(player.x,player.y-38,false);shake=Math.min(5,shake);updateStats(0);return true;
}
const enemyBattle=new Ben10Circus.Battle({onEvent:enemyEvent,onPlayerHit:enemyPlayerHit});
const encounters=new Ben10Circus.Director(campaign.data,{scale:campaign.scale,onEvent:event=>{
 if(event.type==='wave-start'){enemyRouteLeft=0;document.getElementById('routeHint').hidden=true;enemyBanner('COMBATE '+String(event.encounter.index+1).padStart(2,'0'),(event.encounter.index===encounters.plan.length-1?'GUARDIÁN DEL PASO · ':event.encounter.name+' · ')+'RONDA '+event.wave+' / '+event.total,2.3,'combat');}
 if(event.type==='encounter-clear'){enemyBanner('COMBATE SUPERADO',event.phaseComplete?'El camino a la entrada está libre':'La patrulla ha caído. Sigue avanzando.',2.1,'clear');enemyShowRoute(event.phaseComplete);stats.heal(event.phaseComplete?12:6);stats.energy=Math.min(stats.config.maxEnergy,stats.energy+(event.phaseComplete?18:10));if(typeof gameSaveCurrent==='function')gameSaveCurrent(true);}
}});
function enemyPhysics(){return {move:(p,dx,dy,r)=>campaign.move(p,dx,dy,r,props),clipSegment:(a,b,r)=>campaign.clipSegment(a,b,r,props),clampPoint:(p,r)=>campaign.clampPoint(p,r,props),captured:ghostAction.grab?.target};}
function enemyResetPhase(index){enemyBattle.reset(index);encounters.setPhase(index);campaign.arena=null;kingResetPhase();dummyList=enemyBattle.enemies;enemyInvulUntil=0;enemyStaggerUntil=0;enemyBannerLeft=0;enemyRouteLeft=0;document.getElementById('routeHint').hidden=true;enemyUI.banner.classList.remove('show');enemyUI.defeat.hidden=true;enemySyncUI();}
function enemyDamage(d,amount,heavy,feedback={}){
 if(!d.alive)return false;const attackScale=feedback.attackScale??(stats.form?evolutionBonus().atk:1);amount=Math.max(1,Math.round(amount*(attackScale??1)));
 if(d.kind==='finalboss')return kingDamage(d,amount,feedback);
 const outcome=enemyBattle.damage(d,amount,{heavy,source:player,dot:!!feedback.slime});if(!outcome.damage)return false;
 if(feedback.slime){spawnDust(d.x,d.y-43,3,'#a9d259');}else spawnHit(d.x,d.y-44,heavy);
 floatText(d.x,d.y-d.bodyHeight-6,'-'+outcome.damage,outcome.blocked?'#b8c7c3':heavy?'#ffe0ad':'#d8efba',14);return true;
}
function enemySyncUI(){
 const s=encounters.snapshot(enemyBattle),status=s.active?'<span>COMBATE '+String(s.encounter).padStart(2,'0')+' · RONDA '+s.wave+' / '+s.waves+'</span><em>'+s.living+(s.pending?' + '+s.pending:'')+' ENEMIGOS</em>':'<span>'+(s.complete?'SECTOR DESPEJADO':'EXPLORA · COMBATE '+s.encounter+' / '+s.encounters)+'</span><em>DIFÍCIL</em>';
 const king=kingEncounter.boss;const display=king?.alive?'<span>REY ETERNO · FASE '+king.phase+' / 3</span><em>JEFE FINAL</em>':kingEncounter.rewardGranted?'<span>ADN DE DIAMANTE RECUPERADO</span><em>VICTORIA</em>':status;
 if(display!==enemyHudSignature){enemyHudSignature=display;enemyUI.status.innerHTML=display;}
 campaignUI?.campaignStatus?.classList.toggle('in-combat',s.active||!!king?.alive);
 const boss=enemyBattle.enemies.find(e=>e.alive&&e.kind==='miniboss');enemyUI.boss.hidden=!boss;
 if(boss){const signature=boss.id+'-'+boss.health;if(signature!==enemyBossSignature){enemyBossSignature=signature;enemyUI.boss.classList.toggle('crystal',boss.tier==='crystal');enemyUI.boss.querySelector('span').textContent=boss.tier==='crystal'?'ADN DE DIAMANTE':'GUARDIÁN DEL PASO';enemyUI.boss.querySelector('i').style.width=boss.health/boss.maxHealth*100+'%';}}
 if(stats.health<=0){enemyUI.defeat.hidden=false;keys.clear();pointer.active=false;enemyUI.banner.classList.remove('show');}
}
function enemyGameTick(dt,before){
 encounters.update(dt,player,enemyBattle,campaign);
 kingGameTick(dt);
 if(campaign.arena){const p=campaign.clampPoint(player,actorMetrics().radius,props,{ignoreProps:ghostIntangible()||evolutionSkillIntangible()});if(p){player.x=p.x;player.y=p.y;}}
 enemyBattle.update(dt,player,enemyPhysics());dummyList=enemyBattle.enemies;
 enemyBannerLeft=Math.max(0,enemyBannerLeft-dt);enemyUI.banner.classList.toggle('show',enemyBannerLeft>0&&stats.health>0);enemyUI.banner.style.setProperty('--banner-time',enemyBannerLeft/enemyBannerDuration);enemyRouteTick(dt);enemySyncUI();
}
function enemyDraw(d,options={}){if(d.kind==='finalboss')kingArt.draw(ctx,d,t,options);else enemyArt.draw(ctx,d,t,options);}
function enemyDrawGates(){
 const a=campaign.arena;if(!a)return;ctx.save();ctx.lineWidth=2;
 for(const x of [a.left,a.right]){const lane=campaign.laneAt(x);ctx.strokeStyle='#d9b77b99';ctx.setLineDash([7,5]);ctx.lineDashOffset=-t*12;ctx.beginPath();ctx.moveTo(x,lane.top);ctx.lineTo(x,lane.bottom);ctx.stroke();ctx.setLineDash([]);for(const y of [lane.top,lane.bottom]){ctx.strokeStyle='#f1d498';ctx.beginPath();ctx.moveTo(x-8,y);ctx.lineTo(x+8,y);ctx.stroke();}}
 ctx.restore();
}
function enemyRetry(){
 enemyRouteLeft=0;document.getElementById('routeHint').hidden=true;
 campaignResetEffects();stats.setHealth(stats.config.maxHealth);stats.energy=stats.config.maxEnergy;stats.rechargeLeft=0;stats.rechargeLocked=false;stats.drainEvents();
 const p=kingEncounter.boss&&!kingEncounter.completed?kingRetry():encounters.retry(enemyBattle,campaign),at=campaign.clampPoint(p,HUMAN.radius,props)||p;player.x=at.x;player.y=at.y;player.dir='right';player.faceX=1;player.faceY=0;player.selectedAlien=-1;player.pendingForm=null;player.mode='idle';player.modeTime=0;enemyInvulUntil=enemyBattle.time+1.5;enemyStaggerUntil=0;dummyList=enemyBattle.enemies;
 enemyUI.defeat.hidden=true;keys.clear();hudSignature='';syncHud();campaignAfterUpdate({...player});campaignCamera(0,true);game.focus({preventScroll:true});
}
document.getElementById('retryEncounter').addEventListener('click',enemyRetry);
// ENEMY_GAME_END
