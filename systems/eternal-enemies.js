/* Deterministic ground-plane enemy AI and encounter director. No browser globals. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Ben10Eternals=factory()})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),length=(a,b)=>Math.hypot(a.x-b.x,(a.y-b.y)*1.6),unit=(x,y)=>{const n=Math.hypot(x,y)||1;return {x:x/n,y:y/n}};
 const ROLES={
  melee:{name:'Espadachín',health:78,damage:7,speed:100,reach:68,width:28,cooldown:1.55,windup:.5,xp:22},
  ranged:{name:'Ballestero',health:58,damage:8,speed:86,reach:360,width:16,cooldown:2.5,windup:.75,xp:24},
  support:{name:'Artificiero',health:64,damage:5,speed:91,reach:165,width:28,cooldown:2.3,windup:.7,xp:28},
  agile:{name:'Explorador',health:52,damage:5,speed:155,reach:86,width:25,cooldown:1.35,windup:.4,xp:25},
  defender:{name:'Baluarte',health:108,damage:9,speed:67,reach:78,width:34,cooldown:2.25,windup:.72,xp:30},
  champion:{name:'Campeón del hacha',health:580,damage:18,speed:71,reach:122,width:53,cooldown:2.55,windup:1.05,xp:180}
 };
 const TIERS={recruit:{health:1,damage:1,speed:1,armor:.02,rank:1},elite:{health:1.55,damage:1.22,speed:1.06,armor:.13,rank:2},crystal:{health:2.05,damage:1.48,speed:1.10,armor:.24,rank:3},normal:{health:1,damage:1,speed:1,armor:.16,rank:4}};
 function statsFor(role,tier,phase=0,progress=0){const r=ROLES[role],t=TIERS[tier];if(!r||!t)throw Error('Unknown knight role/tier');const boss=role==='champion',phaseHP=1+phase*.09+progress*.10;return {name:r.name,maxHealth:Math.round(r.health*(boss&&tier==='crystal'?1.48:t.health)*phaseHP),damage:Math.round(r.damage*t.damage*(1+phase*.04)),speed:r.speed*t.speed,armor:t.armor,rank:boss?5:t.rank,reach:r.reach+(tier==='crystal'?8:0),attackWidth:r.width,cooldown:r.cooldown,windup:r.windup,xp:Math.round(r.xp*(boss?(1+phase*.25):(tier==='crystal'?2.1:tier==='elite'?1.5:1))),radius:boss?27:role==='defender'?21:16,bodyHeight:boss?(tier==='crystal'?148:142):tier==='recruit'?88:tier==='elite'?98:104};}
 function makeEnemy(id,role,tier,position,phase=0,progress=0){const s=statsFor(role,tier,phase,progress);return {...s,...position,id,role,tier,enemy:true,kind:role==='champion'?'miniboss':'soldier',spriteId:role+'-'+tier,health:s.maxHealth,alive:true,respawn:Infinity,mode:'spawn',modeTime:0,animationTime:0,spawnLeft:.7,cooldownLeft:.65+(id%5)*.13,supportLeft:1.4,decisionLeft:0,facing:position.facing||'left',hit:0,shake:0,stunTime:0,poise:0,poiseLeft:0,buffLeft:0,guardLeft:0,guardCooldown:1.5,strafe:(id%2?1:-1),deadAge:0,attack:null,support:null,knockX:0,knockY:0};}
 const seen=(world,a,b)=>!world.clipSegment||!world.clipSegment(a,b,0).blocked;
 function moveEnemy(e,dx,dy,world,avoid=true){
  const old={x:e.x,y:e.y},point=world.move?world.move(old,dx,dy,e.radius):{x:e.x+dx,y:e.y+dy};e.x=point.x;e.y=point.y;
  if(avoid&&Math.hypot(dx,dy)>1&&Math.hypot(e.x-old.x,e.y-old.y)<Math.hypot(dx,dy)*.28&&world.move){
   const direction=e.strafe||1,p=world.move(old,dx*.2,Math.abs(dx)*direction+dy*.2,e.radius),q=world.move(old,dx*.2,-Math.abs(dx)*direction+dy*.2,e.radius);
   const best=Math.hypot(p.x-old.x,p.y-old.y)>Math.hypot(q.x-old.x,q.y-old.y)?p:q;e.x=best.x;e.y=best.y;
  }
  if(Math.abs(e.x-old.x)>.02)e.facing=e.x>old.x?'right':'left';
  const moved=Math.hypot(e.x-old.x,e.y-old.y);e.animationTime+=moved/Math.max(1,e.speed);return moved;
 }
 class Battle{
  constructor({seed=1051,onEvent=()=>{},onPlayerHit=()=>false}={}){this.seed=seed;this.onEvent=onEvent;this.onPlayerHit=onPlayerHit;this.time=0;this.nextId=0;this.enemies=[];this.projectiles=[];this.phase=0;this.maxAttackers=2;this.events=[];}
  random(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296}
  emit(event){this.events.push({...event,time:this.time});if(this.events.length>180)this.events.shift();this.onEvent(event)}
  reset(phase=0){this.phase=phase;this.enemies.length=0;this.projectiles.length=0;this.events.length=0;this.maxAttackers=phase===2?3:2;}
  spawn(role,tier,point,progress=0){const e=makeEnemy(++this.nextId,role,tier,point,this.phase,progress);this.enemies.push(e);this.emit({type:'spawn',enemy:e});return e;}
  get living(){return this.enemies.filter(e=>e.alive)}
  chooseAlly(e,world,healing=true){
   const allies=this.enemies.filter(a=>a!==e&&a.alive&&a.spawnLeft<=0&&length(e,a)<340&&seen(world,e,a)&&(healing?a.health<a.maxHealth*.88:a.buffLeft<1));
   // A wounded recruit does not consume a cast while a wounded officer is in reach.
   const priority=allies.some(a=>a.rank>=2)?allies.filter(a=>a.rank>=2):allies;
   priority.sort((a,b)=>((b.rank*100+(1-b.health/b.maxHealth)*70+b.maxHealth*.02)-(a.rank*100+(1-a.health/a.maxHealth)*70+a.maxHealth*.02))||length(e,a)-length(e,b));return priority[0]||null;
  }
  damage(e,amount,{heavy=false,source={x:e.x-1,y:e.y},dot=false}={}){
   if(!e?.alive||!(amount>0))return {damage:0,killed:false,blocked:false};
   const wasChannel=!!e.support,front=(source.x-e.x)*(e.facing==='right'?1:-1)>0,guard=e.role==='defender'&&e.guardLeft>0&&front;
   const blocked=guard&&!heavy&&!dot,armor=clamp(e.armor+(e.buffLeft>0?.08:0),0,.5);let damage=Math.max(1,Math.round(amount*(1-armor)*(blocked?.3:1)));
   e.health=Math.max(0,e.health-damage);e.hit=.2;e.shake=heavy?1.4:.6;e.poise+=heavy?2:dot?.15:1;e.poiseLeft=1.3;
   if(e.health<=0){e.alive=false;e.mode='defeat';e.modeTime=0;e.deadAge=0;e.attack=null;e.support=null;e.guardLeft=0;this.emit({type:'defeat',enemy:e,damage});return {damage,killed:true,blocked};}
   const stagger=(!blocked&&(e.role!=='champion'||e.poise>=7))||(guard&&heavy);
   if(stagger){
    const canInterrupt=e.role!=='champion'||!e.attack||e.attack.age<e.attack.windup*.65;
    if(canInterrupt){e.mode='hurt';e.modeTime=0;e.attack=null;e.support=null;e.cooldownLeft=Math.max(e.cooldownLeft,.35);}
    if(guard&&heavy){e.guardLeft=0;e.guardCooldown=3.5;e.stunTime=Math.max(e.stunTime,.65);this.emit({type:'guard-break',enemy:e});}
    const push=heavy?e.role==='champion'?45:115:22,v=unit(e.x-source.x,e.y-source.y);e.knockX=v.x*push;e.knockY=v.y*push*.5;
    if(e.role==='champion')e.poise=0;
   }
   if(wasChannel){e.support=null;e.mode='hurt';e.modeTime=0;e.supportLeft=2;this.emit({type:'channel-interrupted',enemy:e});}
   this.emit({type:blocked?'block':'hit',enemy:e,damage});return {damage,killed:false,blocked};
  }
  slotsAvailable(e){return this.enemies.reduce((n,a)=>n+(a.alive&&a.attack?(a.role==='champion'?2:1):0),0)+(e.role==='champion'?2:1)<=this.maxAttackers+(e.role==='champion'?1:0);}
  startAttack(e,player,world){
   if(!this.slotsAvailable(e)||!seen(world,e,player))return false;
   const secondary=e.role==='champion'?this.random()<.45:e.role==='melee'?this.random()<.3:e.role==='ranged'?this.random()<.35:false;
   const aim={x:player.x,y:player.y},dir=unit(aim.x-e.x,aim.y-e.y);
   e.facing=dir.x>=0?'right':'left';e.mode=secondary?'secondary':'attack';e.modeTime=0;e.guardLeft=0;
   e.attack={age:0,windup:e.windup+(secondary&&e.role==='ranged'?.12:0),active:e.role==='agile'?.20:.12,recovery:e.role==='champion'?.65:.42,origin:{x:e.x,y:e.y},aim,dir,hit:false,secondary};
   this.emit({type:'windup',enemy:e});return true;
  }
  attackTick(e,dt,player,world){
   const a=e.attack;a.age+=dt;e.modeTime=a.age;
   // Aim is committed early; moving or dashing can make the attack miss.
   if(a.age<a.windup*.35&&e.role!=='champion'){a.aim={x:player.x,y:player.y};a.dir=unit(player.x-e.x,player.y-e.y);e.facing=a.dir.x>=0?'right':'left';}
   if(e.role==='agile'&&a.age>=a.windup&&a.age<a.windup+a.active){const before={x:e.x,y:e.y};moveEnemy(e,a.dir.x*475*dt,a.dir.y*300*dt,world,false);if(!a.hit&&this.segmentDistance(before,e,player)<26){a.hit=true;this.strike(e,player,e.damage,a.dir);}}
   if(!a.hit&&a.age>=a.windup){
    if(e.role==='ranged'){
     a.hit=true;const origin={x:e.x+a.dir.x*28,y:e.y+a.dir.y*28};this.projectiles.push({...origin,origin,dx:a.dir.x,dy:a.dir.y,speed:e.tier==='crystal'?480:410,life:1.35,damage:e.damage,owner:e,kind:e.tier==='crystal'?'crystal':'bolt'});this.emit({type:'shot',enemy:e});
    }else if(e.role!=='agile'){
     a.hit=true;const dx=player.x-e.x,dy=player.y-e.y,along=dx*a.dir.x+dy*a.dir.y,side=Math.abs(dx*a.dir.y-dy*a.dir.x),reach=e.reach+(a.secondary&&e.role==='melee'?19:0),width=e.attackWidth+(a.secondary&&e.role==='champion'?15:0);
     if(along>=-16&&along<=reach&&side<=width&&seen(world,e,player))this.strike(e,player,e.damage,a.dir);
     this.emit({type:'impact',enemy:e,aim:a.aim});
    }
   }
   if(a.age>=a.windup+a.active+a.recovery){e.attack=null;e.mode='idle';e.modeTime=0;e.cooldownLeft=e.cooldown*(.85+this.random()*.35);}
  }
  strike(e,player,damage,dir){const amount=Math.round(damage*(e.buffLeft>0?1.22:1));const hit=this.onPlayerHit({enemy:e,damage:amount,origin:{x:e.x,y:e.y},dir});if(hit)this.emit({type:'player-hit',enemy:e,damage:amount});return hit;}
  segmentDistance(a,b,p){const dx=b.x-a.x,dy=b.y-a.y,q=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-dx*q,(p.y-a.y-dy*q)*1.5)}
  supportTick(e,dt,player,world){
   const c=e.support;c.age+=dt;e.modeTime=c.age;
   if(!c.target.alive||length(e,c.target)>365||!seen(world,e,c.target)){e.support=null;e.mode='idle';e.supportLeft=1.2;return;}
   if(!c.applied&&c.age>=.8){c.applied=true;if(c.kind==='heal'){const n=Math.min(c.target.maxHealth-c.target.health,Math.min(34,c.target.maxHealth*.2));c.target.health+=n;this.emit({type:'heal',enemy:e,target:c.target,amount:n});}else{c.target.buffLeft=6;this.emit({type:'boost',enemy:e,target:c.target});}}
   if(c.age>=1.2){e.support=null;e.mode='idle';e.supportLeft=4.8;}
  }
  tickEnemy(e,dt,player,world){
   e.modeTime+=dt;e.hit=Math.max(0,e.hit-dt);e.shake=Math.max(0,e.shake-dt*5);e.stunTime=Math.max(0,(e.stunTime||0)-dt);e.buffLeft=Math.max(0,e.buffLeft-dt);e.poiseLeft-=dt;if(e.poiseLeft<=0)e.poise=0;
   if(!e.alive){e.deadAge+=dt;return;}
   if(e.spawnLeft>0){e.spawnLeft-=dt;if(e.spawnLeft<=0){e.mode='idle';e.modeTime=0;}return;}
   if(e.skillHidden||e.skillLift>1||world.captured===e){e.attack=null;e.support=null;e.stunTime=Math.max(e.stunTime,.16);return;}
   if(Math.hypot(e.knockX,e.knockY)>2){moveEnemy(e,e.knockX*dt,e.knockY*dt,world,false);const decay=Math.exp(-dt*12);e.knockX*=decay;e.knockY*=decay;}
   if(world.clampPoint){const p=world.clampPoint(e,e.radius);if(p){e.x=p.x;e.y=p.y;}}
   if(e.stunTime>0||(e.mode==='hurt'&&e.modeTime<.26)){e.mode='hurt';return;}
   if(e.mode==='hurt'){e.mode='idle';e.modeTime=0;}
   e.cooldownLeft-=dt;e.supportLeft-=dt;e.guardCooldown-=dt;e.guardLeft=Math.max(0,e.guardLeft-dt);
   if(e.attack){this.attackTick(e,dt,player,world);return;}
   if(e.support){this.supportTick(e,dt,player,world);return;}
   if(player.health<=0)return;
   const distance=length(e,player);let goal={x:player.x+(e.id%2?1:-1)*48,y:player.y+((e.id%3)-1)*19},wantAttack=distance<=e.reach+12,retreat=false;
   if(e.role==='ranged'){const heading=unit(e.x-player.x,e.y-player.y);if(distance<190){goal={x:e.x+heading.x*100,y:e.y+heading.y*45+e.strafe*24};retreat=true;}else if(distance>335){goal={x:player.x+heading.x*275,y:player.y+e.strafe*23}}else goal={x:e.x,y:player.y+e.strafe*24};wantAttack=distance>=135&&distance<=e.reach&&Math.abs(e.y-player.y)<75;
    if(retreat&&world.move){const escape=world.move(e,heading.x*25,heading.y*20,e.radius);if(Math.hypot(escape.x-e.x,escape.y-e.y)<5){retreat=false;wantAttack=distance<e.reach&&distance>15;}}
   }
   if(e.role==='support'){
    if(e.supportLeft<=0){const target=this.chooseAlly(e,world,true)||this.chooseAlly(e,world,false);if(target){e.support={target,kind:target.health<target.maxHealth*.88?'heal':'boost',age:0,applied:false};e.mode='secondary';e.modeTime=0;e.facing=target.x>e.x?'right':'left';this.emit({type:'channel',enemy:e,target});return;}}
    const leader=this.enemies.filter(a=>a!==e&&a.alive).sort((a,b)=>b.rank-a.rank||b.maxHealth-a.maxHealth)[0];
    const side=player.x<e.x?1:-1;goal=leader?{x:leader.x+side*145,y:leader.y+e.strafe*25}:{x:player.x+side*115,y:player.y+e.strafe*18};if(leader&&distance<155){goal={x:e.x+side*115,y:e.y+e.strafe*25};retreat=true;}wantAttack=!leader&&distance<e.reach;
   }
   if(e.role==='agile'){goal={x:player.x+(e.id%2?1:-1)*68,y:player.y+e.strafe*24};wantAttack=distance<142&&distance>25;}
   if(e.role==='defender'){
    const ally=this.enemies.filter(a=>a.alive&&['support','ranged'].includes(a.role)&&length(e,a)<320).sort((a,b)=>length(e,a)-length(e,b))[0];if(ally&&distance>105)goal={x:ally.x+(player.x-ally.x)*.45,y:ally.y+(player.y-ally.y)*.45};
    if(e.guardCooldown<=0&&distance<190){e.guardLeft=1.4;e.guardCooldown=3.2;}if(e.guardLeft>0){e.mode='guard';e.facing=player.x>e.x?'right':'left';if(distance<e.reach&&e.cooldownLeft<=0&&this.random()<dt*2.5)this.startAttack(e,player,world);return;}
   }
   if(e.role==='champion'){goal={x:player.x+(player.x<e.x?82:-82),y:player.y};wantAttack=distance<e.reach+20;}
   if(wantAttack&&!retreat&&e.cooldownLeft<=0&&this.startAttack(e,player,world))return;
   const delta=unit(goal.x-e.x,goal.y-e.y);let vx=delta.x,vy=delta.y;
   // Soft separation gives every knight a route instead of forming one stacked cutout.
   for(const a of this.enemies){if(a===e||!a.alive||a.spawnLeft>0)continue;const dx=e.x-a.x,dy=e.y-a.y,ds=Math.hypot(dx,dy*1.8),safe=e.radius+a.radius+8;if(ds<safe&&ds>.1){const w=(safe-ds)/safe;vx+=dx/ds*w*1.8;vy+=dy/ds*w*2.2;}}
   const speed=e.speed*(e.buffLeft>0?1.08:1),travel=Math.min(speed*dt,Math.hypot(goal.x-e.x,goal.y-e.y));const moved=travel>1e-4?moveEnemy(e,vx*travel,vy*travel*.8,world):0;e.mode=moved>.1?'walk':'idle';if(!moved)e.facing=player.x>e.x?'right':'left';
  }
  update(dt,player,world){
   if(!(dt>0))return;dt=Math.min(dt,.1);this.time+=dt;
   for(const e of this.enemies)this.tickEnemy(e,dt,player,world);
   for(const shot of this.projectiles){const a={x:shot.x,y:shot.y},b={x:shot.x+shot.dx*shot.speed*dt,y:shot.y+shot.dy*shot.speed*dt},clip=world.clipSegment?world.clipSegment(a,b,3):{end:b,blocked:false};shot.x=clip.end.x;shot.y=clip.end.y;shot.life-=dt;if(this.segmentDistance(a,shot,player)<19&&seen(world,a,player)){this.strike(shot.owner,player,shot.damage,{x:shot.dx,y:shot.dy});shot.life=0;}if(clip.blocked)shot.life=0;}
   this.projectiles=this.projectiles.filter(s=>s.life>0);this.enemies=this.enemies.filter(e=>e.alive||e.deadAge<5);
  }
 }
 const ROLE_ORDER=['melee','ranged','agile','defender','support','melee','ranged','agile'];
 function encounterPlan(data,phase,scale=1.25){
  const chapter=data.chapters[phase],rooms=data.rooms.filter(r=>r.chapter===chapter.id),ids=phase===0?[0,2,4,6,8,11]:phase===1?[0,2,4,6,8,9]:[0,1,3,5],count=ids.length;
  return ids.map((roomIndex,index)=>{
   const room=rooms[roomIndex],last=index===count-1,trigger=((room.x-chapter.x)+Math.min(last?room.width*.17:room.width*.35,320))*scale;
   const waves=last?1:phase===0&&index<2?1:phase===2&&index===2?3:2,waveSize=last?phase+3:4+Math.min(3,index+phase);
   const plan={id:chapter.id+'-'+index,index,phase,name:room.name,trigger,left:Math.max(24*scale,trigger-145*scale),right:Math.min((chapter.end-chapter.x-[170,205,68][phase])*scale,trigger+455*scale),waves:[]};
   if(plan.right-plan.left<460*scale)plan.left=Math.max(24*scale,plan.right-580*scale);
   for(let w=0;w<waves;w++){
    const units=[];if(last)units.push({role:'champion',tier:phase===2?'crystal':'normal'});
    for(let i=0;i<waveSize;i++){
     let role=ROLE_ORDER[(i+index+w+phase)%ROLE_ORDER.length];if(phase===0&&index===0)role=i===3?'ranged':'melee';if(last&&i===waveSize-1)role='support';
     let tier=phase===0?((index>=1&&(i+index+w)%4===0)?'elite':'recruit'):phase===1?((index>=1&&(i+index+w)%4===0)?'crystal':'elite'):((i+index+w)%3===0?'elite':'crystal');
     if(role==='support'&&phase===0&&index<2)role='ranged';units.push({role,tier});
    }
    plan.waves.push(units);
   }
   return plan;
  });
 }
 class Director{
  constructor(data,{scale=1.25,onEvent=()=>{}}={}){this.data=data;this.scale=scale;this.onEvent=onEvent;this.setPhase(0)}
  setPhase(phase){this.phase=phase;this.plan=encounterPlan(this.data,phase,this.scale);this.index=0;this.current=null;this.wave=0;this.pending=[];this.spawnClock=0;this.between=0;this.complete=false;this.cleared=0;this.lastClear=null;}
  activate(index,battle,level){this.index=index;this.current=this.plan[index];this.wave=0;this.pending=[];this.between=0;level.arena={left:this.current.left,right:this.current.right};this.queueWave(battle);this.onEvent({type:'encounter-start',encounter:this.current});}
  queueWave(battle){this.pending=this.current.waves[this.wave].map((s,i)=>({...s,slot:i}));this.spawnClock=.45;battle.projectiles.length=0;this.onEvent({type:'wave-start',encounter:this.current,wave:this.wave+1,total:this.current.waves.length});}
  spawnNext(battle,level,player){
   const entry=this.pending.shift(),slot=entry.slot,fromRight=entry.role==='support'||entry.role==='ranged'||slot%3!==2;
   let point={x:fromRight?this.current.right-32:this.current.left+32,y:level.offsetY+(246+(slot*31)%79)*this.scale};
   if(Math.abs(point.x-player.x)<140)point.x=player.x<(this.current.left+this.current.right)/2?this.current.right-32:this.current.left+32;
   point=level.clampPoint(point,entry.role==='champion'?27:16,level.props)||level.spawn(16);
   battle.spawn(entry.role,entry.tier,point,this.index/this.plan.length);
  }
  update(dt,player,battle,level){
   if(this.complete||player.health<=0)return;
   if(!this.current){if(this.index<this.plan.length&&player.x>=this.plan[this.index].trigger)this.activate(this.index,battle,level);else return;}
   if(this.pending.length){this.spawnClock-=dt;if(this.spawnClock<=0){this.spawnNext(battle,level,player);this.spawnClock=.28;}return;}
   if(battle.living.length)return;
   this.between+=dt;if(this.between<1.1)return;this.between=0;
   if(this.wave+1<this.current.waves.length){this.wave++;this.queueWave(battle);return;}
   const cleared=this.current;this.current=null;this.index++;this.cleared++;level.arena=null;this.lastClear=cleared;this.complete=this.index>=this.plan.length;battle.projectiles.length=0;this.onEvent({type:'encounter-clear',encounter:cleared,phaseComplete:this.complete});
  }
  retry(battle,level){const index=this.current?.index??Math.min(this.index,this.plan.length-1);battle.reset(this.phase);this.current=null;this.pending=[];this.between=0;this.complete=false;this.activate(index,battle,level);return {x:this.current.left+110,y:level.offsetY+285*this.scale};}
  snapshot(battle){return {phase:this.phase,encounter:this.current?this.current.index+1:Math.min(this.index+1,this.plan.length),encounters:this.plan.length,active:!!this.current,wave:this.current?this.wave+1:0,waves:this.current?.waves.length||0,living:battle.living.length,pending:this.pending.length,complete:this.complete,cleared:this.cleared,arena:this.current?{left:this.current.left,right:this.current.right}:null};}
 }
 return {ROLES,TIERS,statsFor,makeEnemy,Battle,Director,encounterPlan};
});
