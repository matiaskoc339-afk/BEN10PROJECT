const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {config,chargedAttack,lightAttack,dodgeAttack,createRush}=require('../systems/cannonbolt-physics.js');
const world={width:2400,height:1800,obstacles:[]};
test('charge scales damage, distance and speed between measured minimum and maximum',()=>{
 const min=chargedAttack(config.minCharge),mid=chargedAttack((config.minCharge+config.maxCharge)/2),max=chargedAttack(config.maxCharge);
 assert.equal(min.damage,40);assert.equal(max.damage,72);assert.equal(min.distance,230);assert.equal(max.distance,460);assert.equal(min.speed,950);assert.equal(max.speed,1450);
 assert.ok(mid.damage>min.damage&&mid.damage<max.damage);assert.ok(Math.abs(mid.power-.5)<1e-8);
});
test('charge cannot exceed its maximum or accept invalid time',()=>{
 assert.deepEqual(chargedAttack(-10),chargedAttack(0));assert.deepEqual(chargedAttack(100),chargedAttack(config.maxCharge));assert.throws(()=>chargedAttack(NaN));
});
test('third light attack is a short one-way ball ram',()=>{
 const a=lightAttack(),r=createRush({x:600,y:600},1,0,world,a),hits=[],target={x:700,y:600,alive:true};r.step(1,world,[target],p=>hits.push(p));assert.equal(a.damage,32);assert.equal(a.returns,false);assert.equal(r.position.x,790);assert.equal(hits.length,1);
});
test('normal charged ram goes one way while the powered combo returns and hits on both legs',()=>{
 const start={x:900,y:900};for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const a=chargedAttack(config.maxCharge,true),target={x:start.x+dx*150,y:start.y+dy*150,alive:true},hits=[],r=createRush(start,dx,dy,world,a);r.step(1,world,[target],p=>hits.push(p));assert.deepEqual(r.position,start);assert.equal(hits.length,2);assert.equal(a.damage,90);
  const normal=createRush(start,dx,dy,world,chargedAttack(config.maxCharge));normal.step(1,world,[]);assert.equal(Math.round(Math.hypot(normal.position.x-start.x,normal.position.y-start.y)),460);
 }
});
test('wide shell sweeps nearby targets and respects expanded obstacle clearance',()=>{
 const start={x:600,y:600},target={x:700,y:638,alive:true},hits=[],r=createRush(start,1,0,world,lightAttack());r.step(1,world,[target],p=>hits.push(p));assert.equal(hits.length,1);
 const w={...world,obstacles:[{x:800,y:600,r:30,block:true}]},blocked=createRush(start,1,0,w,chargedAttack(1));blocked.step(1,w,[]);assert.ok(blocked.position.x<749);assert.ok(blocked.position.x>748);
});
test('defensive rolling dash moves without an attack payload',()=>{
 const a=dodgeAttack(),r=createRush({x:600,y:600},1,0,world,a);r.step(1,world,[]);assert.equal(a.damage,0);assert.equal(r.position.x,800);
});
test('powered return distance and hit count agree at 30, 60 and 120 updates per second',()=>{
 for(const fps of [30,60,120]){const start={x:900,y:900},target={x:1100,y:900,alive:true},hits=[],r=createRush(start,1,0,world,chargedAttack(config.maxCharge,true));for(let i=0;i<fps;i++)r.step(1/fps,world,[target],p=>hits.push(p));assert.deepEqual(r.position,start);assert.equal(hits.length,2);}
});
test('the standalone embeds the tested Cannonbolt physics',()=>{
 const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),source=fs.readFileSync(path.join(root,'systems/cannonbolt-physics.js'),'utf8');assert.ok(html.includes('<!-- CANNONBOLT_PHYSICS_START -->\n<script>\n'+source+'\n</script>\n<!-- CANNONBOLT_PHYSICS_END -->'));
});
