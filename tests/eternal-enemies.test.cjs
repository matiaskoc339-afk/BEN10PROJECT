const {test}=require('node:test'),assert=require('node:assert/strict');
const {Battle,Director,statsFor,encounterPlan}=require('../systems/eternal-enemies.js');
const {Level}=require('../systems/campaign-world.js'),data=require('../mapas/data/recorrido.json');
const player=()=>({x:400,y:265,health:100});
const world={move:(p,dx,dy,r)=>({x:Math.max(20+r,Math.min(980-r,p.x+dx)),y:Math.max(205+r*.35,Math.min(342-r*.35,p.y+dy))}),clipSegment:(a,b)=>({end:{...b},blocked:false}),clampPoint:p=>({...p})};
function ready(b,role,tier,x,y=265){const e=b.spawn(role,tier,{x,y});e.spawnLeft=0;e.mode='idle';e.cooldownLeft=0;return e;}
function advance(b,seconds,p,geo=world){for(let n=0;n<Math.ceil(seconds*60);n++)b.update(1/60,p,geo)}
test('every role becomes stronger by tier; champions substantially outlast a soldier',()=>{
 for(const role of ['melee','ranged','support','agile','defender']){const s=['recruit','elite','crystal'].map(t=>statsFor(role,t));assert.ok(s[0].maxHealth<s[1].maxHealth&&s[1].maxHealth<s[2].maxHealth);assert.ok(s[0].armor<s[1].armor&&s[1].armor<s[2].armor);assert.ok(s[2].damage>=s[1].damage&&s[1].damage>=s[0].damage);}
 assert.ok(statsFor('champion','normal').maxHealth>statsFor('defender','crystal').maxHealth*2);assert.ok(statsFor('champion','crystal',2).maxHealth>statsFor('champion','normal').maxHealth);
});
test('phase plans contain the requested ranks, five roles, exactly one champion per phase and rising pressure',()=>{
 let previous=0;for(let phase=0;phase<3;phase++){const plan=encounterPlan(data,phase),flat=plan.flatMap(p=>p.waves.flat()),soldiers=flat.filter(e=>e.role!=='champion');assert.equal(flat.filter(e=>e.role==='champion').length,1);assert.equal(plan.at(-1).waves[0][0].role,'champion');assert.deepEqual(new Set(soldiers.map(e=>e.role)),new Set(['melee','ranged','support','agile','defender']));
  if(phase===0){assert.ok(soldiers.some(e=>e.tier==='elite'));assert.ok(soldiers.filter(e=>e.tier==='recruit').length>soldiers.length*.6);assert.ok(!soldiers.some(e=>e.tier==='crystal'));}
  else{assert.ok(soldiers.some(e=>e.tier==='elite')&&soldiers.some(e=>e.tier==='crystal'));assert.ok(!soldiers.some(e=>e.tier==='recruit'));}
  const pressure=soldiers.reduce((n,e)=>n+statsFor(e.role,e.tier,phase).maxHealth,0);if(phase===1)assert.ok(pressure>previous);previous=pressure;assert.ok(plan.every(p=>p.right-p.left>500));assert.ok(plan.every((p,i)=>!i||p.trigger>plan[i-1].trigger));
 }
});
test('a melee attack has a readable windup and one contact, and commits its direction',()=>{
 const p=player(),hits=[],b=new Battle({onPlayerHit:h=>{hits.push(h);return true}}),e=ready(b,'melee','recruit',p.x-52);b.startAttack(e,p,world);advance(b,.25,p);assert.equal(hits.length,0);advance(b,.4,p);assert.equal(hits.length,1);advance(b,.25,p);assert.equal(hits.length,1);
 const p2=player(),b2=new Battle({onPlayerHit:()=>{throw Error('Escaped attack hit')}}),e2=ready(b2,'melee','recruit',p2.x-50);b2.startAttack(e2,p2,world);advance(b2,.3,p2);p2.y=335;advance(b2,.45,p2);
});
test('ranged knights back away, aim, then fire an actual travelling projectile',()=>{
 const p=player(),hits=[],b=new Battle({onPlayerHit:h=>hits.push(h)}),e=ready(b,'ranged','elite',p.x+70);advance(b,.35,p);assert.ok(e.x>p.x+70);e.x=650;e.y=p.y;e.cooldownLeft=0;b.startAttack(e,p,world);advance(b,.65,p);assert.equal(hits.length,0);advance(b,.4,p);assert.ok(b.projectiles.length);advance(b,.5,p);assert.ok(hits.length>0);
});
test('projectiles respect map walls and do not hit through a solid segment',()=>{
 const p=player(),hits=[],b=new Battle({onPlayerHit:h=>hits.push(h)}),e=ready(b,'ranged','crystal',650);b.projectiles.push({x:620,y:265,dx:-1,dy:0,speed:450,life:2,owner:e,damage:10});const wall={...world,clipSegment:(a,z)=>a.x>=530&&z.x<530?{end:{x:530,y:z.y},blocked:true}:{end:z,blocked:false}};advance(b,.7,p,wall);assert.equal(hits.length,0);assert.equal(b.projectiles.length,0);
});
test('a cornered archer and an isolated support still defend themselves',()=>{
 const p={x:910,y:265,health:100},events=[],b=new Battle({onEvent:e=>events.push(e),onPlayerHit:()=>true});ready(b,'ranged','elite',964);advance(b,1.4,p);assert.ok(events.some(e=>e.type==='shot'));
 const hits=[],b2=new Battle({onPlayerHit:h=>hits.push(h)});ready(b2,'support','elite',850);advance(b2,1.1,p);assert.ok(hits.length>0);
});
test('support prioritises a wounded crystal officer over a recruit and heals only after channel contact',()=>{
 const p={x:700,y:270,health:100},events=[],b=new Battle({onEvent:e=>events.push(e)}),s=ready(b,'support','elite',150),weak=ready(b,'melee','recruit',200),strong=ready(b,'defender','crystal',230);weak.health=4;strong.health*=.7;s.supportLeft=0;weak.cooldownLeft=strong.cooldownLeft=100;assert.equal(b.chooseAlly(s,world,true),strong);b.update(1/60,p,world);assert.equal(s.support.target,strong);const before=strong.health;advance(b,.5,p);assert.equal(strong.health,before);advance(b,.45,p);assert.ok(strong.health>before);assert.ok(strong.health<=strong.maxHealth);assert.equal(events.filter(e=>e.type==='heal').length,1);
});
test('a support boost chooses the strongest available ally and cannot revive a dead one',()=>{
 const b=new Battle(),s=ready(b,'support','recruit',100),weak=ready(b,'melee','recruit',150),strong=ready(b,'champion','normal',200);assert.equal(b.chooseAlly(s,world,false),strong);strong.alive=false;assert.equal(b.chooseAlly(s,world,false),weak);weak.alive=false;assert.equal(b.chooseAlly(s,world,false),null);
});
test('hitting a support interrupts its heal and costs the cast; boosts expire',()=>{
 const p=player(),events=[],b=new Battle({onEvent:e=>events.push(e)}),s=ready(b,'support','elite',120),ally=ready(b,'melee','crystal',180);ally.health=50;ally.buffLeft=.2;s.support={target:ally,kind:'heal',age:.3,applied:false};s.mode='secondary';b.damage(s,8,{source:p,heavy:true});assert.equal(s.support,null);advance(b,.5,p);assert.equal(ally.buffLeft,0);assert.ok(!events.some(e=>e.type==='heal'));
});
test('shield protection works from the front, leaves the rear vulnerable and heavy attacks break it',()=>{
 const b=new Battle(),a=ready(b,'defender','elite',250);a.facing='right';a.guardLeft=2;const front=b.damage(a,30,{source:{x:300,y:265}});const back=b.damage(a,30,{source:{x:180,y:265}});assert.ok(front.blocked);assert.ok(!back.blocked);assert.ok(back.damage>front.damage*2);a.guardLeft=2;b.damage(a,30,{source:{x:300,y:265},heavy:true});assert.equal(a.guardLeft,0);assert.ok(a.stunTime>=.6);
});
test('agile knights lunge on the ground with a single hit instead of teleporting',()=>{
 const p=player(),hits=[],b=new Battle({onPlayerHit:h=>{hits.push(h);return true}}),e=ready(b,'agile','elite',290);b.startAttack(e,p,world);advance(b,.3,p);assert.equal(e.x,290);advance(b,.32,p);assert.ok(e.x>330);assert.equal(hits.length,1);assert.ok(e.x<430);
});
test('champions resist light stun locks and commit a slow dodgeable axe attack',()=>{
 const p=player(),hits=[],b=new Battle({onPlayerHit:h=>hits.push(h)}),e=ready(b,'champion','normal',315);b.startAttack(e,p,world);b.damage(e,4,{source:p});assert.ok(e.attack);advance(b,.8,p);assert.equal(hits.length,0);p.y=337;advance(b,.45,p);assert.equal(hits.length,0);assert.ok(e.alive);
});
test('attack slots limit simultaneous aggression while independent support channels remain possible',()=>{
 const p=player(),b=new Battle();for(let i=0;i<8;i++)ready(b,'melee','elite',p.x+40+i*2,p.y);b.update(1/60,p,world);assert.ok(b.enemies.filter(e=>e.attack).length<=2);b.maxAttackers=3;advance(b,.02,p);assert.ok(b.enemies.filter(e=>e.attack).length<=3);
});
test('defeated knights never respawn, cannot attack or award experience twice, and finish their fall',()=>{
 const p=player(),events=[],b=new Battle({onEvent:e=>events.push(e)}),e=ready(b,'melee','recruit',450);b.damage(e,999,{heavy:true});assert.equal(e.mode,'defeat');assert.equal(b.damage(e,999).damage,0);advance(b,7,p);assert.ok(!b.enemies.includes(e));assert.equal(events.filter(e=>e.type==='defeat').length,1);assert.equal(events.filter(e=>e.type==='player-hit').length,0);
});
test('waves hold both gates until all pending reinforcements and all waves are defeated',()=>{
 const level=new Level(data),b=new Battle(),d=new Director(data),p={...level.spawn(),health:100};p.x=d.plan[0].trigger;d.update(.02,p,b,level);assert.ok(level.arena);assert.ok(d.pending.length);const blocked=level.clipSegment(p,{x:50000,y:p.y},14,[],{ignoreProps:true});assert.ok(blocked.blocked&&blocked.end.x<level.arena.right);assert.ok(!d.complete);
 for(let t=0;t<800&&d.current;t++){d.update(1/60,p,b,level);for(const e of b.living)b.damage(e,9999,{heavy:true});b.update(1/60,p,{move:(a,dx,dy,r)=>level.move(a,dx,dy,r),clampPoint:(a,r)=>level.clampPoint(a,r),clipSegment:(a,z,r)=>level.clipSegment(a,z,r)});}
 assert.equal(d.cleared,1);assert.equal(level.arena,null);assert.equal(d.current,null);assert.equal(d.complete,false);
 d.activate(2,b,level);assert.equal(d.current.waves.length,2);d.pending=[];b.enemies=[];d.update(1.2,p,b,level);assert.equal(d.wave,1);assert.ok(d.pending.length&&level.arena);
});
test('all three phases finish only after their champion is defeated; retries preserve the checkpoint',()=>{
 for(let phase=0;phase<3;phase++){const level=new Level(data);level.setPhase(phase);const b=new Battle();b.reset(phase);const d=new Director(data);d.setPhase(phase);const p={...level.spawn(),health:100};let champions=0;b.onEvent=e=>{if(e.type==='spawn'&&e.enemy.role==='champion')champions++};
  for(let index=0;index<d.plan.length;index++){p.x=d.plan[index].trigger;for(let t=0;t<2400;t++){d.update(1/60,p,b,level);for(const e of b.living)b.damage(e,99999,{heavy:true});if(!d.current&&d.index>index)break;}assert.equal(d.cleared,index+1);}
  assert.equal(champions,1);assert.equal(d.complete,true);assert.equal(level.arena,null);
  d.setPhase(phase);d.activate(2,b,level);d.cleared=2;p.health=0;const at=d.retry(b,level);assert.equal(d.current.index,2);assert.equal(d.cleared,2);assert.ok(at.x>level.arena.left&&at.x<level.arena.right);assert.equal(d.wave,0);assert.ok(d.pending.length);
 }
});
