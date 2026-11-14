const {test}=require('node:test'),assert=require('node:assert/strict');
const data=require('../mapas/data/recorrido.json'),{Level}=require('../systems/campaign-world.js');
const Speed=require('../systems/speed-route.js'),Cannon=require('../systems/cannonbolt-physics.js'),Fire=require('../systems/fire-projectiles.js'),Stink=require('../systems/stinkfly-field.js'),Ghost=require('../systems/ghostfreak-ability.js');
const physics=(level,obstacles=level.props)=>({width:level.width,height:level.height,obstacles,clipSegment:(a,b,r,world)=>level.clipSegment(a,b,r,world.obstacles),clampPoint:(p,r)=>level.clampPoint(p,r,obstacles,{ignoreProps:true})});
test('Ben and the widest aliens can walk every phase but cannot cross a gate automatically',()=>{
 const level=new Level(data);for(let phase=0;phase<3;phase++)for(const radius of [14,21]){
  level.setPhase(phase);let p=level.spawn(radius),previous=p.x;
  for(let i=0;i<5000;i++){p=level.move(p,5,0,radius);assert.ok(level.onFloor(p,radius));assert.ok(p.x>=previous-1e-6);if(Math.abs(p.x-previous)<1e-5)break;previous=p.x;}
  assert.ok(level.atExit(p));assert.equal(level.phaseIndex,phase);assert.ok(p.x<=level.walkEnd-radius+.001);assert.ok(p.x>level.exit.x-level.exit.range);
 }
});
test('rear walls, front railings and phase edges stop swept movement for every alien radius',()=>{
 const level=new Level(data);for(let phase=0;phase<3;phase++){
  level.setPhase(phase);for(const radius of [14,16,18,20,21])for(const room of level.rooms){
   const x=(room.x-level.phase.x+room.width/2)*level.scale,start={x,y:level.offsetY+280*level.scale};
   for(const [dx,dy] of [[0,-1000],[0,1000],[-50000,0],[50000,0]]){const clip=level.clipSegment(start,{x:x+dx,y:start.y+dy},radius,[]);assert.ok(clip.blocked);assert.ok(level.onFloor(clip.end,radius));}
  }
 }
});
test('a fast route cannot cross a narrow bridge even when both endpoints are on wide ground',()=>{
 const level=new Level(data),room=level.rooms.find(r=>r.walkBottom===310);
 const a={x:(room.x-level.phase.x-120)*level.scale,y:level.offsetY+330*level.scale},b={x:(room.x-level.phase.x+room.width+120)*level.scale,y:a.y};
 assert.ok(level.onFloor(a,14)&&level.onFloor(b,14));const clip=level.clipSegment(a,b,14,[]);assert.ok(clip.blocked);assert.ok(clip.end.x<b.x);assert.ok(level.onFloor(clip.end,14));
});
test('a foreground planter blocks its real ground footprint, without blocking its entire image',()=>{
 const level=new Level(data),p=level.props.find(p=>p.art.name==='jardinera'&&!p.art.behind),radius=14;
 const a={x:p.x,y:p.y-80},b={x:p.x,y:level.laneAt(p.x).bottom-radius*.35};
 const solid=level.clipSegment(a,b,radius),floorOnly=level.clipSegment(a,b,radius,[]);
 assert.ok(level.onFloor(a,radius));assert.ok(solid.blocked);assert.ok(solid.end.y<floorOnly.end.y-1);assert.ok(!level.blocked({x:p.x,y:p.y-65},radius));
});
test('XLR8 and Cannonbolt stop at a thin object even on one very long frame',()=>{
 const level=new Level(data),a=level.spawn(),obstacle={x:a.x+95,y:a.y,rx:3,ry:8,r:3,mapFootprint:true,block:true},world=physics(level,[obstacle]);
 const rush=new Speed.Rush([a,{x:a.x+400,y:a.y}]);rush.step(1,world);assert.ok(rush.position.x<obstacle.x);assert.equal(rush.active,false);
 const ball=Cannon.createRush(a,1,0,world,Cannon.chargedAttack(1.15));ball.step(1,world);assert.ok(ball.position.x<obstacle.x);assert.ok(level.onFloor(ball.position,21));
});
test('fire and slime respect the same rear wall and cannot damage a target behind it',()=>{
 const level=new Level(data),a=level.spawn(),world=physics(level,[]),target={x:a.x,y:level.laneAt(a.x).top-60,alive:true,health:100};world.targets=[target];
 const fire=new Fire.ProjectileField(),hits=[];fire.launch({...a,dx:0,dy:-1});fire.tick(1,world,s=>hits.push(s));assert.equal(hits.length,1);assert.equal(hits[0].reason,'wall');assert.equal(hits[0].target,null);
 const slime=new Stink.SlimeField(),burst=slime.beginBurst(1),spits=[];slime.spit({...a,dx:0,dy:-1,burst});slime.closeBurst(burst);slime.tick(1,world,s=>spits.push(s));assert.equal(spits[0].reason,'wall');assert.equal(spits[0].target,null);
});
test('intangible movement and materialisation stay in the active phase',()=>{
 const level=new Level(data);for(let phase=0;phase<3;phase++){level.setPhase(phase);const world=physics(level);
  for(const p of [{x:-1000,y:-1000},{x:50000,y:50000}]){const at=Ghost.bounds(p,world);assert.ok(level.onFloor(at,16));}
  const start=level.spawn(),land=Ghost.safeLanding({x:start.x,y:0},start,(x,y)=>level.blocked({x,y},16),world);assert.ok(land&&level.onFloor(land,16));
 }
});
test('poison cannot leak through the wide footprint of a map object',()=>{
 const level=new Level(data),a=level.spawn(),obstacle={x:a.x+50,y:a.y,rx:50,ry:5,r:5,mapFootprint:true,block:true};
 const world=physics(level,[obstacle]);world.targets=[{x:a.x+62,y:a.y+10,alive:true}];const slime=new Stink.SlimeField();slime.addPool(a.x,a.y);let damage=0;
 slime.tick(1,world,()=>{},()=>{},(_,n)=>damage+=n);assert.equal(damage,0);
});
