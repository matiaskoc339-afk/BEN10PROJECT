/* Zombozo's encounter. All releases follow the authored animation event frames. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Ben10Zombozo=factory()})(globalThis,function(){
'use strict';
const CONFIG=Object.freeze({health:1100,rageThreshold:.42,helperWaves:[4,5],speed:[0,91,142],bombDamage:[0,10,13],bombRadius:[0,73,83],knifeDamage:[0,7,9],tricycleDamage:[0,15,18],boxHealth:85,boxSeconds:8,boxDamage:30,boxRadius:345,boxCooldown:12,rewardRange:53,xp:600});
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sum=a=>a.reduce((s,n)=>s+n,0),duration=c=>sum(c.durations)/1000;
const unit=(x,y)=>{const n=Math.hypot(x,y)||1;return{x:x/n,y:y/n}},distance=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.6);
function frameAt(c,t){let ms=Math.max(0,t)*1000,total=sum(c.durations);if(c.loop)ms%=total;else ms=Math.min(ms,total-1);for(let n=0;n<c.frames.length;n++){if(ms<c.durations[n])return n;ms-=c.durations[n]}return c.frames.length-1}
function segmentDistance(a,b,p){const vx=b.x-a.x,vy=(b.y-a.y)*1.6,px=p.x-a.x,py=(p.y-a.y)*1.6,q=clamp((px*vx+py*vy)/(vx*vx+vy*vy||1),0,1);return Math.hypot(px-vx*q,py-vy*q)}
class Encounter{
 constructor(art,{onEvent=()=>{},onPlayerHit=()=>false}={}){this.art=art;this.onEvent=onEvent;this.onPlayerHit=onPlayerHit;this.reset()}
 reset(){this.boss=null;this.box=null;this.bombs=[];this.knives=[];this.effects=[];this.reward=null;this.active=false;this.completed=false;this.rewardReady=false;this.rewardGranted=false;this.time=0;this.serial=0;this.appearanceSerial=0;this.ids=0;this.helperWave=0;this.helpersSent=false;this.rest=0;this.boxCooldown=3.5;this.dodgeCooldown=3;this.telegraph=null}
 emit(type,extra={}){this.onEvent({type,enemy:this.boss,...extra})}
 clip(){const e=this.boss;return this.art.phases[e.renderPhase-1].animations[e.mode]}
 setMode(key){const e=this.boss;e.renderPhase=this.art.phases[e.phase-1].animations[key]?e.phase:2;e.mode=key;e.modeTime=0;e.eventsDone=new Set();e.attack=null;e.hidden=false;e.intangible=this.isIntangible()}
 start(point,id,{arena,rewardOnly=false}={}){
  this.reset();this.arena={...arena};this.origin={...point};this.active=!rewardOnly;
  this.boss={...point,id,enemy:true,zombozo:true,kind:'circusboss',role:'zombozo',spriteId:'zombozo',name:'Zombozo',phase:1,renderPhase:1,health:CONFIG.health,maxHealth:CONFIG.health,alive:true,radius:26,bodyHeight:128,xp:CONFIG.xp,rank:6,armor:0,facing:'left',mode:'summon',modeTime:0,animationTime:0,spawnLeft:0,hit:0,shake:0,stunTime:0,skillLift:0,deadAge:0,buffLeft:0,knockX:0,knockY:0,respawn:Infinity,attack:null,transition:false,eventsDone:new Set(),cooldown:.7,intangible:true,hidden:false};
  if(rewardOnly){const e=this.boss;e.phase=3;e.alive=false;e.health=0;this.setMode('defeat');e.modeTime=duration(this.clip());this.completed=true;this.rewardReady=true;this.reward={x:e.x-68,y:e.y,age:0,ready:true};this.emit('zombozo-reward-ready')}
  else this.emit('zombozo-start');return this.boss;
 }
 isIntangible(){const e=this.boss;if(!e?.alive)return false;if(e.phase===1||e.transition||e.hidden||this.box?.alive)return true;const f=frameAt(this.art.phases[e.renderPhase-1].animations[e.mode],e.modeTime);return e.mode==='sink'&&f>=1||e.mode==='vanish'&&f>=2||e.mode==='ground-bomb'&&f<3||e.mode==='reappear'&&f<4||e.mode==='side-rift'&&f<3||e.mode==='from-above'&&f<4||e.mode==='ghost-dodge'&&f>=1&&f<=3}
 vulnerable(){return !!this.boss?.alive&&!this.isIntangible()}
 damage(amount){const e=this.boss;if(!e?.alive||!Number.isFinite(amount)||amount<=0)return{damage:0};if(this.isIntangible())return{damage:0,evaded:true};
  const floor=e.phase===2?e.maxHealth*CONFIG.rageThreshold:0,before=e.health;e.health=Math.max(floor,e.health-amount);e.hit=.16;e.shake=.8;
  if(e.health<=0){e.alive=false;this.active=false;e.intangible=false;this.setMode('defeat');this.bombs=[];this.knives=[];this.effects=[];this.box=null;this.telegraph=null;this.emit('zombozo-defeated')}
  else if(e.phase===2&&e.health<=floor){e.phase=3;e.transition=true;this.setMode('anger');e.intangible=true;this.telegraph=null;this.emit('zombozo-phase',{phase:3})}
  else if(['idle','walk','rage-idle','run'].includes(e.mode)){this.setMode(e.phase===2?'hurt':'rage-hurt');e.cooldown=Math.max(e.cooldown,.45)}
  return{damage:before-e.health,killed:!e.alive};
 }
 damageBox(amount){const b=this.box;if(!b?.alive||b.flightLeft>0||!Number.isFinite(amount)||amount<=0)return{damage:0};const before=b.health;b.health=Math.max(0,b.health-amount);b.hit=.18;
  if(b.health===0){b.alive=false;b.mode='box-break';b.modeTime=0;b.deadAge=0;this.boxCooldown=CONFIG.boxCooldown;this.boss.intangible=false;this.setMode('rage-hurt');this.boss.cooldown=2.3;this.emit('zombozo-box-broken',{box:b})}
  return{damage:before-b.health,killed:!b.alive};
 }
 safe(p,world,r=26){if(r===26&&this.arena)p={...p,x:clamp(p.x,this.arena.left+100,this.arena.right-100)};return world.clampPoint?.(p,r)||p}
 move(dx,dy,world){const e=this.boss,p=this.safe(world.move?.(e,dx,dy,e.radius)||{x:e.x+dx,y:e.y+dy},world);const n=Math.hypot(p.x-e.x,p.y-e.y);e.x=p.x;e.y=p.y;return n}
 aim(player,world){return this.safe({x:player.x,y:player.y},world,8)}
 attack(key,player,world){this.setMode(key);const e=this.boss;e.facing=player.x<e.x?'left':'right';e.aim=this.aim(player,world);const events=Object.values(this.clip().eventFrames),first=events.length?Math.min(...events):2;e.attack={age:0,windup:sum(this.clip().durations.slice(0,first))/1000,dir:unit(e.aim.x-e.x,e.aim.y-e.y)};this.emit('zombozo-windup',{action:key})}
 chooseAppearance(player,world,kind){const side=++this.appearanceSerial%2?1:-1,p=this.safe({x:player.x+side*(kind==='from-above'?65:150),y:player.y+(this.appearanceSerial%3-1)*30},world);this.appearAt=p;this.appearKind=kind;this.telegraph={...p,radius:kind==='from-above'?80:45,kind,age:0};this.emit('zombozo-portal',{point:p})}
 throwBomb(player,world){const e=this.boss,target=this.safe({...e.aim},world,0),flight=e.phase===3?.86:1.05;this.bombs.push({id:++this.ids,start:{x:e.x+(e.facing==='left'?-25:25),y:e.y},target,x:e.x,y:e.y,age:0,duration:flight,phase:e.phase,damage:CONFIG.bombDamage[e.phase-1],radius:CONFIG.bombRadius[e.phase-1]});this.emit('zombozo-bomb')}
 throwKnives(){const e=this.boss,base=Math.atan2(e.aim.y-e.y,e.aim.x-e.x),angles=e.phase===3?[-.22,-.11,0,.11,.22]:[-.12,0,.12];for(const angle of angles){const a=base+angle;this.knives.push({x:e.x,y:e.y,dx:Math.cos(a),dy:Math.sin(a),life:1.7,age:0,speed:e.phase===3?530:430,damage:CONFIG.knifeDamage[e.phase-1]})}this.emit('zombozo-knives')}
 throwBox(world){if(this.box?.alive)return;const e=this.boss,p=this.safe({x:(this.arena.left+this.arena.right)/2,y:this.origin.y},world,24);this.box={...p,id:++this.ids,enemy:true,surpriseBox:true,kind:'zombozo-box',role:'box',name:'Caja sorpresa',alive:true,health:CONFIG.boxHealth,maxHealth:CONFIG.boxHealth,radius:24,bodyHeight:54,rank:6,spawnLeft:0,hit:0,shake:0,stunTime:0,deadAge:0,mode:'box-idle',modeTime:0,age:0,flightLeft:.5,flightDuration:.5,from:{x:e.x,y:e.y},anchored:true,noCapture:true,knockX:0,knockY:0,respawn:Infinity};e.intangible=true;this.emit('zombozo-box',{box:this.box})}
 releaseEvents(player,world){const e=this.boss,c=this.clip(),cycle=c.loop?Math.floor(e.modeTime/duration(c)):0;for(const [name,f]of Object.entries(c.eventFrames)){const at=cycle*duration(c)+sum(c.durations.slice(0,f))/1000,key=cycle+':'+name;if(e.modeTime+1e-8<at||e.eventsDone.has(key))continue;e.eventsDone.add(key);
   if(name==='summonHelpers'){this.helpersSent=true;this.helperWave++;this.emit('zombozo-summon',{wave:this.helperWave,count:CONFIG.helperWaves[this.helperWave-1]})}
   if(/^release(Bomb|SecondBomb|ThirdBomb)$/.test(name)){if(e.mode==='box-shield')e.aim=this.aim(player,world);this.throwBomb(player,world);}
   if(name==='releaseKnives')this.throwKnives();if(name==='releaseBox')this.throwBox(world);
   if(name==='land'&&e.mode==='from-above'){if(distance(e,player)<85)this.hit(player,14);this.effects.push({kind:'ghost-burst',x:e.x,y:e.y,age:0,duration:.8});this.emit('zombozo-land')}
   if(name==='hatFalls')this.emit('zombozo-fall');
  }}
 hit(player,damage,origin=this.boss){return this.onPlayerHit({enemy:this.boss,damage,origin:{x:origin.x,y:origin.y},dir:unit(player.x-origin.x,player.y-origin.y)})}
 hazards(dt,player,world){
  for(const b of this.bombs){b.age+=dt;const q=Math.min(1,b.age/b.duration);b.x=b.start.x+(b.target.x-b.start.x)*q;b.y=b.start.y+(b.target.y-b.start.y)*q;if(b.age>=b.duration){if(distance(b.target,player)<b.radius)this.hit(player,b.damage,b.target);this.effects.push({kind:'shared-explosion',...b.target,age:0,duration:.65});this.emit('zombozo-explosion',{point:b.target})}}this.bombs=this.bombs.filter(b=>b.age<b.duration);
  for(const k of this.knives){const a={x:k.x,y:k.y},end={x:k.x+k.dx*k.speed*dt,y:k.y+k.dy*k.speed*dt},clip=world.clipSegment?.(a,end,2)||{end,blocked:false};k.x=clip.end.x;k.y=clip.end.y;k.life-=dt;k.age+=dt;if(segmentDistance(a,k,player)<20){this.hit(player,k.damage,a);k.life=0}if(clip.blocked)k.life=0}this.knives=this.knives.filter(k=>k.life>0);
  const b=this.box;if(b){b.modeTime+=dt;b.hit=Math.max(0,b.hit-dt);if(!b.alive)b.deadAge+=dt;else if(b.flightLeft>0){b.flightLeft=Math.max(0,b.flightLeft-dt);if(b.flightLeft===0){b.mode='box-arming';b.modeTime=0;this.emit('zombozo-box-land',{box:b})}}else{b.age+=dt;if(b.age>=CONFIG.boxSeconds){b.alive=false;b.mode='box-explosion';b.modeTime=0;b.deadAge=0;this.boxCooldown=CONFIG.boxCooldown;this.boss.intangible=false;this.setMode('mock-angry');this.boss.cooldown=1.5;if(distance(b,player)<CONFIG.boxRadius)this.hit(player,CONFIG.boxDamage,b);this.emit('zombozo-box-explosion',{box:b})}}}
  for(const f of this.effects)f.age+=dt;this.effects=this.effects.filter(f=>f.age<f.duration);if(this.telegraph)this.telegraph.age+=dt;
 }
 update(dt,player,world,{helpers=0}={}){const e=this.boss;if(!e||!(dt>0)||player.health<=0)return;dt=Math.min(dt,.05);this.time+=dt;e.hit=Math.max(0,e.hit-dt);e.shake=Math.max(0,e.shake-dt*5);e.stunTime=0;
  const playback=e.phase===3&&e.renderPhase===2&&!e.transition?1.16:1;e.modeTime+=dt*playback;if(e.attack)e.attack.age=e.modeTime;
  if(!e.alive){e.deadAge+=dt;this.releaseEvents(player,world);if(!this.rewardReady&&e.modeTime>=duration(this.clip())){this.completed=true;this.rewardReady=true;this.reward=this.safe({x:e.x+(e.facing==='left'?-68:68),y:e.y},world,0);this.reward.age=0;this.emit('zombozo-reward-ready')}if(this.reward){this.reward.age+=dt;if(!this.rewardGranted&&distance(this.reward,player)<CONFIG.rewardRange){this.rewardGranted=true;this.emit('zombozo-reward')}}return}
  this.hazards(dt,player,world);this.boxCooldown=Math.max(0,this.boxCooldown-dt);this.dodgeCooldown=Math.max(0,this.dodgeCooldown-dt);e.cooldown=Math.max(0,e.cooldown-dt);
  if(world.captured===e||e.skillHidden||e.skillLift>1){e.attack=null;return}
  this.releaseEvents(player,world);e.intangible=this.isIntangible();const total=duration(this.clip());
  if(e.phase===1){
   if(e.mode==='wake'&&e.modeTime>=total){this.setMode('stand');return}
   if(e.mode==='stand'&&e.modeTime>=total){e.phase=2;e.transition=false;this.setMode('idle');e.cooldown=1;this.emit('zombozo-phase',{phase:2});return}
   if(e.mode==='summon'&&e.modeTime>=total){this.setMode('seated');this.rest=0;return}
   if(!['summon','wake','stand'].includes(e.mode)){
    if(this.helpersSent&&helpers===0){this.rest+=dt;if(this.rest>.8){if(this.helperWave<CONFIG.helperWaves.length){this.helpersSent=false;this.setMode('summon')}else this.setMode('wake')}return}
    this.rest+=dt;if(this.rest>3.2){this.rest=0;this.setMode(e.mode==='seated'?(this.helperWave%2?'sleep':'mock-seated'):'seated')}
   }return;
  }
  if(e.transition){if(e.modeTime>=total){e.transition=false;this.setMode('rage-idle');e.cooldown=.85;this.boxCooldown=2.6;this.emit('zombozo-rage-ready')}return}
  if(e.hidden){this.hiddenLeft-=dt;if(this.hiddenLeft<=0){const p=this.appearAt;e.x=p.x;e.y=p.y;const key=this.appearKind;this.attack(key,player,world);e.intangible=true;this.telegraph=null}return}
  if(this.box?.alive){if(e.mode==='box-throw'&&e.modeTime<total)return;if(e.mode!=='box-shield'){this.attack('box-shield',player,world)}return}
  if(e.mode==='sink'||e.mode==='vanish'){if(e.modeTime>=total){this.chooseAppearance(player,world,e.mode==='vanish'?'reappear':'ground-bomb');e.hidden=true;e.intangible=true;e.attack=null;this.hiddenLeft=e.phase===3?.46:.7}return}
  if(e.mode==='mount'){if(e.modeTime>=total){const heading=unit(e.aim.x-e.x,(e.aim.y-e.y)*.65);this.setMode('tricycle');e.rushDir=heading;e.rushAge=0;e.rushHit=false;e.facing=heading.x<0?'left':'right';this.emit('zombozo-rush')}return}
  if(e.mode==='tricycle'){e.rushAge+=dt;const before={x:e.x,y:e.y},speed=e.phase===3?660:535,n=this.move(e.rushDir.x*speed*dt,e.rushDir.y*speed*dt,world);if(!e.rushHit&&segmentDistance(before,e,player)<42){e.rushHit=true;this.hit(player,CONFIG.tricycleDamage[e.phase-1])}if(e.rushAge>(e.phase===3?.94:1.12)||n<.1){this.setMode(e.phase===3?'rage-idle':'idle');e.cooldown=1.05;this.emit('zombozo-skid')}return}
  if(e.mode==='ghost-dodge'){const sign=e.facing==='left'?1:-1;this.move(sign*75*dt,(this.serial%2?1:-1)*35*dt,world)}
  const busy=!['idle','walk','rage-idle','run'].includes(e.mode);
  if(busy){if(e.modeTime>=total){this.setMode(e.phase===3?'rage-idle':'idle');e.cooldown=Math.max(e.cooldown,e.phase===3?.45:.82)}return}
  const d=distance(e,player);e.facing=player.x<e.x?'left':'right';
  if(e.phase===3&&this.dodgeCooldown===0&&d<165&&/^(light|heavy|skill)/.test(player.mode||'')&&(player.modeTime||0)<.19){this.attack('ghost-dodge',player,world);this.dodgeCooldown=4.2;this.emit('zombozo-dodge');return}
  if(e.cooldown===0){
   if(e.phase===3&&this.boxCooldown===0){this.attack('box-throw',player,world);return}
   const moves=e.phase===3?['bomb-volley','side-rift','knife-fan','from-above','mount','sink','bomb-volley','vanish','mock-angry']:['bomb','knives','sink','bomb','vanish','mount'];const key=moves[this.serial++%moves.length];
   if(key==='side-rift'||key==='from-above'){this.chooseAppearance(player,world,key);e.hidden=true;e.intangible=true;this.hiddenLeft=.65;e.attack=null;return}
   this.attack(key,player,world);return;
  }
  const toward=unit(player.x-e.x,player.y-e.y),retreat=d<160?-1:d>285?1:0,moved=retreat?this.move(toward.x*CONFIG.speed[e.phase-1]*retreat*dt,toward.y*CONFIG.speed[e.phase-1]*retreat*.65*dt,world):0,key=moved>.1?e.phase===3?'run':'walk':e.phase===3?'rage-idle':'idle';if(e.mode!==key)this.setMode(key);
 }
}
return{CONFIG,Encounter,frameAt,duration,distance,segmentDistance};
});
