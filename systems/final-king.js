/* Boss combat state, using the authored clip contacts and physical movement. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Ben10FinalKing=factory()})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const CONFIG=Object.freeze({health:900,thresholds:[.68,.30],defense:[120,72,0],fireDefenseMultiplier:1.85,exposedSeconds:[6,5],speed:[78,145,92],damage:[8,11,6],helperLimit:3,summonCooldown:7.5});
 const distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.6),unit=(x,y)=>{const n=Math.hypot(x,y)||1;return {x:x/n,y:y/n}},sum=a=>a.reduce((n,v)=>n+v,0),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
 function frameAt(clip,time){let ms=Math.max(0,time)*1000,total=sum(clip.durations);if(clip.loop)ms%=total;else if(ms>=total)return 5;for(let i=0;i<6;i++){if(ms<clip.durations[i])return i;ms-=clip.durations[i]}return 5}
 function motionAt(clip,time){if(!clip.motion)return 0;const f=frameAt(clip,time),start=sum(clip.durations.slice(0,f))/1000,q=clamp((time-start)/(clip.durations[f]/1000),0,1);return clip.motion[f]+((clip.motion[Math.min(5,f+1)]||0)-clip.motion[f])*q}
 class Encounter{
  constructor(art,{onEvent=()=>{},onPlayerHit=()=>false}={}){this.art=art;this.onEvent=onEvent;this.onPlayerHit=onPlayerHit;this.reset()}
  reset(){this.boss=null;this.active=false;this.completed=false;this.rewardGranted=false;this.time=0;this.serial=0;this.helperIds=new Set()}
  clip(){const e=this.boss;return this.art.phases[e.phase-1].animations[e.mode]||this.art.phases[e.phase-1].animations.idle}
  emit(type,extra={}){this.onEvent({type,enemy:this.boss,...extra})}
  setMode(key){const e=this.boss;e.mode=key;e.modeTime=0;e.contactDone=new Set();e.attack=null;e.motionDone=0;e.actionDir=null}
  start(point,id){this.completed=false;this.rewardGranted=false;this.active=true;this.time=0;this.boss={...point,id,enemy:true,kind:'finalboss',role:'king',spriteId:'forever-king',name:'Rey Eterno',phase:1,renderPhase:1,health:CONFIG.health,maxHealth:CONFIG.health,defense:CONFIG.defense[0],maxDefense:CONFIG.defense[0],exposedLeft:0,alive:true,spawnLeft:0,radius:26,bodyHeight:132,rank:6,xp:400,facing:'left',mode:'idle',modeTime:0,animationTime:0,hit:0,shake:0,stunTime:0,deadAge:0,buffLeft:0,guardLeft:0,support:null,knockX:0,knockY:0,cooldown:1.1,dodgeCooldown:1.8,summonLeft:.8,transition:null,contactDone:new Set(),motionDone:0,actionDir:null,tactics:{teamwork:false},order:null};this.emit('king-start');return this.boss}
  vulnerable(){const e=this.boss;return e&&e.alive&&!e.transition&&(e.phase===3||e.exposedLeft>0)}
  damage(amount,{sourceForm=null}={}){
   const e=this.boss;if(!e?.alive||!(amount>0)||!Number.isFinite(amount)||e.transition)return {damage:0,defenseDamage:0};
   const f=frameAt(this.clip(),e.modeTime);if(e.mode==='dodge'&&f>=1&&f<=3)return {damage:0,defenseDamage:0,evaded:true};
   e.hit=.16;e.shake=.65;
   if(!this.vulnerable()){
    const n=Math.min(e.defense,amount*(sourceForm==='heatblast'?CONFIG.fireDefenseMultiplier:1));e.defense=Math.max(0,e.defense-n);
    if(e.defense<=1e-8){e.defense=0;e.exposedLeft=CONFIG.exposedSeconds[e.phase-1]+1.15;this.setMode(e.phase===1?'guard-break':'hurt');this.emit('king-guard-break')}
    else if(e.phase===1&&!e.attack)this.setMode('guard');
    return {damage:0,defenseDamage:n,blocked:true};
   }
   const threshold=e.phase===1?e.maxHealth*CONFIG.thresholds[0]:e.phase===2?e.maxHealth*CONFIG.thresholds[1]:0;
   const before=e.health;e.health=Math.max(threshold,e.health-amount);const dealt=before-e.health;
   if(e.health<=0){e.alive=false;e.defense=0;e.exposedLeft=0;this.active=false;this.setMode('defeat');this.emit('king-defeated')}
   else if(e.health<=threshold&&e.phase<3){const old=e.phase;e.phase++;e.renderPhase=old;e.transition=old===1?'phase-2':'phase-3';e.exposedLeft=0;this.setMode(old===1?'guard-break':'shatter');this.emit('king-phase',{phase:e.phase})}
   else if(!e.attack&&e.mode!=='guard-break'){this.setMode('hurt')}
   return {damage:dealt,defenseDamage:0,killed:!e.alive};
  }
  move(dx,dy,world){const e=this.boss,before={x:e.x,y:e.y},p=world.move?world.move(before,dx,dy,e.radius):{x:e.x+dx,y:e.y+dy};e.x=p.x;e.y=p.y;return Math.hypot(e.x-before.x,e.y-before.y)}
  attack(key,player){const e=this.boss;this.setMode(key);e.actionDir=unit(player.x-e.x,player.y-e.y);e.facing=e.actionDir.x<0?'left':'right';e.attack={dir:e.actionDir,age:0,windup:sum(this.clip().durations.slice(0,this.clip().contactFrames[0]||0))/1000};this.emit('king-windup')}
  contact(player,world,index,before){const e=this.boss,a=e.actionDir||unit(player.x-e.x,player.y-e.y),dx=player.x-e.x,dy=player.y-e.y,along=dx*a.x+dy*a.y,side=Math.abs(dx*a.y-dy*a.x),line=!world.clipSegment?.(e,player,0).blocked;
   const reach=e.mode==='lunge'?155:e.phase===3?88:138,width=e.mode==='lunge'?32:49;
   let swept=false;if(e.mode==='lunge'&&before){const vx=e.x-before.x,vy=e.y-before.y,q=clamp(((player.x-before.x)*vx+(player.y-before.y)*vy)/(vx*vx+vy*vy||1),0,1);swept=Math.hypot(player.x-before.x-vx*q,(player.y-before.y-vy*q)*1.6)<35}
   if(line&&(along>=-12&&along<=reach&&side<width||swept))this.onPlayerHit({enemy:e,damage:CONFIG.damage[e.phase-1]+(e.mode==='lunge'?1:0),origin:{x:e.x,y:e.y},dir:a});
   this.emit('king-contact',{contact:index});
  }
  update(dt,player,world,{helpers=0}={}){
   const e=this.boss;if(!e||!(dt>0)||player.health<=0)return;dt=Math.min(dt,.1);this.time+=dt;e.modeTime+=dt;e.hit=Math.max(0,e.hit-dt);e.shake=Math.max(0,e.shake-dt*5);e.stunTime=0;
   if(!e.alive){e.deadAge+=dt;if(!this.rewardGranted&&e.modeTime>=sum(this.clip().durations)/1000){this.completed=true;this.rewardGranted=true;this.emit('king-reward')}return}
   if(e.transition){const old=this.art.phases[e.renderPhase-1].animations[e.mode],total=sum(old.durations)/1000;if(e.modeTime>=total){e.transition=null;e.renderPhase=e.phase;e.maxDefense=CONFIG.defense[e.phase-1];e.defense=e.maxDefense;this.setMode('idle');e.cooldown=.9;e.summonLeft=.7;this.emit('king-phase-ready')}return}
   e.cooldown-=dt;e.dodgeCooldown-=dt;e.summonLeft-=dt;
   if(e.exposedLeft>0){e.exposedLeft=Math.max(0,e.exposedLeft-dt);if(e.exposedLeft===0){e.defense=e.maxDefense;this.setMode('idle');e.cooldown=.6;this.emit('king-guard-restored')}}
   if(e.skillHidden||e.skillLift>1||world.captured===e){if(e.actionDir||e.attack)this.setMode(e.phase===1?'exposed':'hurt');return}
   const c=this.clip(),total=sum(c.durations)/1000;
   if(e.actionDir){const before={x:e.x,y:e.y},motion=motionAt(c,e.modeTime),delta=motion-e.motionDone;e.motionDone=motion;const dir=e.mode==='dodge'?{x:-e.actionDir.y,y:e.actionDir.x}:e.actionDir;if(delta)this.move(dir.x*delta,dir.y*delta,world);
    for(const [n,f] of c.contactFrames.entries()){const at=sum(c.durations.slice(0,f))/1000;if(e.modeTime>=at&&!e.contactDone.has(n)){e.contactDone.add(n);this.contact(player,world,n,before)}}if(e.attack)e.attack.age=e.modeTime;
    if(e.modeTime>=total){this.setMode('idle');e.cooldown=e.phase===2?.48:e.phase===3?1.5:.95}return}
   if(e.mode==='summon'){const at=sum(c.durations.slice(0,c.eventFrames.summonBasicHelpers))/1000;if(e.modeTime>=at&&!e.contactDone.has('summon')){e.contactDone.add('summon');this.emit('king-summon',{count:Math.max(0,CONFIG.helperLimit-helpers)})}if(e.modeTime>=total){this.setMode('idle');e.summonLeft=CONFIG.summonCooldown}return}
   if(['hurt','guard','guard-break'].includes(e.mode)&&e.modeTime<total)return;
   if(e.exposedLeft>0){if(e.phase===1){if(e.mode!=='exposed')this.setMode('exposed')}else if(e.mode!=='hurt')this.setMode('hurt');return}
   const dist=distance(e,player);e.facing=player.x<e.x?'left':'right';
   if(e.phase===3){
    if(e.summonLeft<=0&&helpers<CONFIG.helperLimit){this.setMode('summon');return}
    const dir=unit(e.x-player.x,e.y-player.y),moved=this.move(dir.x*CONFIG.speed[2]*dt,dir.y*CONFIG.speed[2]*.65*dt,world);
    if(dist<85&&e.cooldown<=0&&moved<1){this.attack('desperate-slash',player);return}
    if(e.mode!==(moved>.1?'retreat':'idle'))this.setMode(moved>.1?'retreat':'idle');if(moved>.1)e.facing=dir.x<0?'left':'right';return;
   }
   if(e.phase===2&&e.dodgeCooldown<=0&&dist<185&&/^(light|heavy|skill)/.test(player.mode||'')&&(player.modeTime||0)<.16){this.setMode('dodge');e.actionDir=unit(player.x-e.x,player.y-e.y);e.dodgeCooldown=3.1;this.emit('king-dodge');return}
   if(e.cooldown<=0&&dist<(e.phase===2?280:150)&&Math.abs(player.y-e.y)<75){this.attack(e.phase===1?'slash':++this.serial%3===0?'double-slash':'lunge',player);return}
   const desired=unit(player.x-e.x,player.y-e.y),moved=dist>110?this.move(desired.x*CONFIG.speed[e.phase-1]*dt,desired.y*CONFIG.speed[e.phase-1]*.75*dt,world):0,key=moved>.1?e.phase===1?'walk':'run':'idle';if(e.mode!==key)this.setMode(key);
  }
 }
 return {CONFIG,Encounter,frameAt,motionAt};
});
