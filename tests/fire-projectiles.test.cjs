const test=require('node:test'),assert=require('node:assert/strict');
const {ProjectileField}=require('../systems/fire-projectiles.js');
const world=(targets=[],obstacles=[])=>({targets,obstacles,width:2400,height:1800});
test('a fireball travels before dealing damage and impacts a target only once',()=>{
  const field=new ProjectileField(),target={x:300,y:200,alive:true},hits=[];
  field.launch({x:100,y:200,dx:1,dy:0});field.tick(.1,world([target]),hit=>hits.push(hit));
  assert.equal(hits.length,0);assert.ok(field.shots[0].x>100);
  for(let i=0;i<20;i++)field.tick(.1,world([target]),hit=>hits.push(hit));
  assert.equal(hits.length,1);assert.equal(hits[0].target,target);assert.equal(hits[0].damage,32);assert.equal(field.shots.length,0);
});
test('swept collision never skips a target on a long frame',()=>{
  const field=new ProjectileField(),target={x:200,y:100,alive:true},hits=[];
  field.launch({x:100,y:100,dx:1,dy:0});field.tick(.8,world([target]),hit=>hits.push(hit));
  assert.equal(hits.length,1);assert.ok(hits[0].x<target.x);
});
test('a nearer solid stops the fireball before the target behind it',()=>{
  const field=new ProjectileField(),target={x:300,y:100,alive:true},hits=[];
  field.launch({x:100,y:100,dx:1,dy:0});field.tick(1,world([target],[{x:200,y:100,r:24,block:true}]),hit=>hits.push(hit));
  assert.equal(hits[0].reason,'wall');assert.equal(hits[0].target,null);
});
test('the closest target wins even if targets are stored in the opposite order',()=>{
  const field=new ProjectileField(),near={x:230,y:100,alive:true},far={x:350,y:100,alive:true},hits=[];
  field.launch({x:100,y:100,dx:1,dy:0});field.tick(1,world([far,near]),hit=>hits.push(hit));
  assert.equal(hits[0].target,near);
});
test('front, back and both side shots respect their locked direction',()=>{
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const field=new ProjectileField(),front={x:600+dx*200,y:600+dy*200,alive:true},rear={x:600-dx*100,y:600-dy*100,alive:true},hits=[];
    field.launch({x:600,y:600,dx,dy});field.tick(.6,world([rear,front]),hit=>hits.push(hit));
    assert.equal(hits[0].target,front);
  }
});
test('flight and collision positions agree at 30, 60 and 120 updates per second',()=>{
  const positions=[];
  for(const fps of [30,60,120]){
    const field=new ProjectileField(),hits=[],target={x:400,y:300,alive:true};
    field.launch({x:100,y:300,dx:1,dy:0});for(let i=0;i<fps;i++)field.tick(1/fps,world([target]),hit=>hits.push(hit));
    positions.push(hits[0].x);
  }
  assert.ok(Math.max(...positions)-Math.min(...positions)<1e-6);
});
test('untransformed owners do not change the damage or identity of an emitted special',()=>{
  const field=new ProjectileField(),hits=[],target={x:300,y:100,alive:true};
  const shot=field.launch({x:100,y:100,dx:1,dy:0,special:true});
  field.tick(1,world([target]),hit=>hits.push(hit));
  assert.equal(hits[0].id,shot.id);assert.equal(hits[0].damage,70);assert.equal(hits[0].splash,86);
});
test('misses expire at their range and do not accumulate shots',()=>{
  const field=new ProjectileField(),hits=[];
  for(let i=0;i<20;i++)field.launch({x:100,y:100,dx:1,dy:0});
  field.tick(2,world(),hit=>hits.push(hit));assert.equal(field.shots.length,0);assert.equal(hits.length,20);assert.ok(hits.every(h=>h.reason==='range'));
});
test('dead targets are ignored and world boundaries end a shot',()=>{
  const field=new ProjectileField(),hits=[];
  field.launch({x:10,y:100,dx:-1,dy:0});field.tick(.5,world([{x:5,y:100,alive:false}]),hit=>hits.push(hit));
  assert.equal(hits[0].reason,'edge');assert.equal(hits[0].x,0);
});
test('the standalone embeds exactly the tested fire model',()=>{
  const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),source=fs.readFileSync(path.join(root,'systems/fire-projectiles.js'),'utf8');
  assert.ok(html.includes('<!-- FIRE_PROJECTILES_START -->\n<script>\n'+source+'\n</script>\n<!-- FIRE_PROJECTILES_END -->'));
});
test('crystal shards have their own speed and damage and hit once in every facing direction',()=>{
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
    const field=new ProjectileField(),hits=[],target={x:600+dx*240,y:600+dy*240,alive:true};
    const shot=field.launch({x:600,y:600,dx,dy,kind:'crystal'});
    assert.equal(shot.speed,600);assert.equal(shot.damage,28);assert.equal(shot.kind,'crystal');
    field.tick(.1,world([target]),hit=>hits.push(hit));assert.equal(hits.length,0);
    field.tick(1,world([target]),hit=>hits.push(hit));field.tick(1,world([target]),hit=>hits.push(hit));
    assert.equal(hits.length,1);assert.equal(hits[0].target,target);assert.equal(hits[0].splash,0);
  }
});
test('crystal burst retains its identity and splash after emission and respects solid cover',()=>{
  const field=new ProjectileField(),hits=[],target={x:500,y:200,alive:true};
  const shot=field.launch({x:100,y:200,dx:1,dy:0,kind:'crystal',special:true});
  field.tick(1,world([target],[{x:300,y:200,r:24,block:true}]),hit=>hits.push(hit));
  assert.equal(hits.length,1);assert.equal(hits[0].id,shot.id);assert.equal(hits[0].reason,'wall');
  assert.equal(hits[0].damage,72);assert.equal(hits[0].splash,95);assert.equal(hits[0].kind,'crystal');assert.equal(hits[0].target,null);
});
test('crystal collision position and range are stable at 30, 60 and 120 updates per second',()=>{
  const results=[];
  for(const fps of [30,60,120]){
    const field=new ProjectileField(),hits=[],target={x:450,y:200,alive:true};
    field.launch({x:100,y:200,dx:1,dy:0,kind:'crystal'});
    for(let i=0;i<fps;i++)field.tick(1/fps,world([target]),hit=>hits.push(hit));
    assert.equal(hits.length,1);results.push(hits[0].x);
    field.launch({x:100,y:600,dx:1,dy:0,kind:'crystal'});field.tick(2,world(),hit=>hits.push(hit));
    assert.equal(hits[1].reason,'range');assert.equal(hits[1].x,740);assert.equal(field.shots.length,0);
  }
  assert.ok(Math.max(...results)-Math.min(...results)<1e-6);
});
