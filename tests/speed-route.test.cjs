const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {config,RoutePlan,Rush,quickPath,clipSegment,distanceToSegment}=require('../systems/speed-route.js');
const world={width:2400,height:1800,obstacles:[]},close=(a,b)=>assert.ok(Math.abs(a-b)<1e-6,`${a} != ${b}`);
test('route planning starts at the player and keeps ordered mouse waypoints',()=>{
 const p=new RoutePlan({x:600,y:600});for(const v of [{x:800,y:600},{x:800,y:800},{x:600,y:800}])p.add(v,world);
 assert.deepEqual(p.points,[{x:600,y:600},{x:800,y:600},{x:800,y:800},{x:600,y:800}]);assert.equal(p.length,600);
});
test('route length, point count and tiny pointer jitter are bounded',()=>{
 const p=new RoutePlan({x:600,y:600},{maxLength:100,maxPoints:4});assert.equal(p.add({x:601,y:601},world),false);p.add({x:800,y:600},world);close(p.length,100);assert.equal(p.points[1].x,700);assert.equal(p.add({x:800,y:800},world),false);
 const q=new RoutePlan({x:600,y:600},{maxPoints:3});q.add({x:630,y:600},world);q.add({x:660,y:600},world);assert.equal(q.add({x:690,y:600},world),false);
});
test('tap rush follows facing and returns exactly to the origin while hitting a crossed enemy once',()=>{
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
  const a={x:900,y:900},near={x:a.x+dx*100,y:a.y+dy*100,alive:true},behind={x:a.x-dx*100,y:a.y-dy*100,alive:true},hits=[];
  const r=new Rush(quickPath(a,dx,dy,world));r.step(1,world,[near,behind],p=>hits.push(p));
  assert.deepEqual(r.position,a);assert.equal(r.active,false);assert.deepEqual(hits,[near]);close(r.distance,config.tapDistance*2);
 }
});
test('a drawn multi-turn route hits every crossed target and ignores enemies outside the route',()=>{
 const points=[{x:600,y:600},{x:900,y:600},{x:900,y:900},{x:600,y:900}],targets=[{x:750,y:600,alive:true},{x:900,y:750,alive:true},{x:750,y:900,alive:true},{x:750,y:750,alive:true}],hits=[];
 const r=new Rush(points);r.step(1,world,targets,p=>hits.push(p));assert.deepEqual(hits,targets.slice(0,3));assert.deepEqual(r.position,points.at(-1));
});
test('swept hits cannot tunnel through a target on a single long frame',()=>{
 const target={x:800,y:600,alive:true},hits=[],r=new Rush([{x:600,y:600},{x:1500,y:600}]);r.step(.5,world,[target],p=>hits.push(p));assert.deepEqual(hits,[target]);
});
test('loops, return paths and dead targets cannot multiply damage',()=>{
 const target={x:750,y:600,alive:true},dead={x:850,y:600,alive:false},hits=[],r=new Rush([{x:600,y:600},{x:900,y:600},{x:600,y:600},{x:900,y:600}]);
 for(let i=0;i<100;i++)r.step(.01,world,[target,dead],p=>hits.push(p));assert.deepEqual(hits,[target]);
});
test('solid cover clips the plan and rush before enemies behind the wall',()=>{
 const blocked={...world,obstacles:[{x:800,y:600,r:30,block:true}]},target={x:900,y:600,alive:true},hits=[];
 const p=new RoutePlan({x:600,y:600});p.add({x:1000,y:600},blocked);assert.equal(p.blocked,true);assert.ok(p.points[1].x<756);
 const r=new Rush([{x:600,y:600},{x:1000,y:600}]);r.step(1,blocked,[target],p=>hits.push(p));assert.equal(hits.length,0);assert.ok(r.position.x<756);assert.equal(r.active,false);
 const tap=new Rush(quickPath({x:600,y:600},1,0,blocked));tap.step(1,blocked,[],()=>{});close(tap.position.x,600);
});
test('a route can go around solid obstacles and ignores decorative nonblocking props',()=>{
 const w={...world,obstacles:[{x:800,y:600,r:30,block:true},{x:800,y:450,r:30,block:false}]},p=new RoutePlan({x:600,y:600});
 p.add({x:600,y:450},w);p.add({x:1000,y:450},w);p.add({x:1000,y:600},w);assert.equal(p.blocked,false);
 const r=new Rush(p.points);r.step(1,w,[]);assert.deepEqual(r.position,{x:1000,y:600});
});
test('planning and rushing obey the same map margins',()=>{
 const p=new RoutePlan({x:130,y:200});p.add({x:-900,y:200},world);assert.ok(p.points.at(-1).x>=124);assert.equal(p.blocked,true);
 const r=new Rush([{x:600,y:600},{x:3000,y:600}]);r.step(3,world,[]);assert.ok(r.position.x<=2291);assert.equal(r.active,false);
});
test('position and swept hits are independent of 30, 60 or 120 updates per second',()=>{
 const results=[];for(const fps of [30,60,120]){const hits=[],target={x:800,y:600,alive:true},r=new Rush([{x:600,y:600},{x:1000,y:600},{x:1000,y:900},{x:700,y:900}]);for(let i=0;i<fps;i++)r.step(1/fps,world,[target],p=>hits.push(p));results.push(r.position);assert.equal(hits.length,1);}
 assert.deepEqual(results,[{x:700,y:900},{x:700,y:900},{x:700,y:900}]);
});
test('zero-length points and invalid inputs cannot stall or corrupt a rush',()=>{
 const r=new Rush([{x:600,y:600},{x:600,y:600},{x:700,y:600}]);r.step(NaN,world,[]);assert.equal(r.position.x,600);r.step(1,world,[]);assert.equal(r.position.x,700);assert.equal(r.active,false);
 assert.throws(()=>new Rush([{x:NaN,y:0}]));assert.throws(()=>clipSegment({x:1,y:1},{x:Infinity,y:2}));close(distanceToSegment({x:0,y:0},{x:100,y:0},{x:50,y:25}),25);
});
test('the standalone embeds exactly the tested route physics',()=>{
 const root=path.resolve(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),source=fs.readFileSync(path.join(root,'systems/speed-route.js'),'utf8');
 assert.ok(html.includes('<!-- SPEED_ROUTE_START -->\n<script>\n'+source+'\n</script>\n<!-- SPEED_ROUTE_END -->'));
});
