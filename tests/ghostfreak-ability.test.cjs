const test=require('node:test'),assert=require('node:assert/strict');
const Ghost=require('../systems/ghostfreak-ability.js'),{PlayerStats}=require('../systems/player-stats.js');
const world={width:2400,height:1800};
test('intangibility begins after the hold threshold and ends at a short fixed limit',()=>{
 for(const t of [-1,0,.159,1.8,2,NaN,Infinity])assert.equal(Ghost.intangible(t),false);
 for(const t of [.16,.5,1.799])assert.equal(Ghost.intangible(t),true);
 assert.equal(Ghost.config.phaseSpeed,1.15);
});
test('the same tentacle attack is used for tap and held release; only a prepared combo changes its damage',()=>{
 assert.deepEqual(Ghost.attack(),{damage:44,reach:140});assert.deepEqual(Ghost.attack(true),{damage:72,reach:160});
});
test('phasing stays inside all four map boundaries',()=>{
 assert.deepEqual(Ghost.bounds({x:-500,y:-500},world),{x:126,y:101});
 assert.deepEqual(Ghost.bounds({x:9999,y:9999},world),{x:2289,y:1689});
});
test('materialisation keeps a free location unchanged',()=>{assert.deepEqual(Ghost.safeLanding({x:600,y:500},{x:400,y:400},()=>false,world),{x:600,y:500});});
test('materialising inside a prop finds nearby free ground instead of leaving the player stuck',()=>{
 const blocked=(x,y)=>Math.hypot(x-600,y-500)<65,p=Ghost.safeLanding({x:600,y:500},{x:400,y:500},blocked,world);
 assert.equal(blocked(p.x,p.y),false);assert.ok(Math.hypot(p.x-600,p.y-500)<=73);
});
test('if the local area is enclosed, materialisation falls back to the last safe position',()=>{
 const blocked=(x,y)=>Math.hypot(x-600,y-500)<300;
 assert.deepEqual(Ghost.safeLanding({x:600,y:500},{x:1000,y:500},blocked,world),{x:1000,y:500});
 assert.equal(Ghost.safeLanding({x:600,y:500},{x:600,y:500},()=>true,world),null);
});
test('intangibility blocks damage and ends on reset, form change and return to Ben',()=>{
 const s=new PlayerStats();s.setInvulnerable(true);assert.equal(s.invulnerable,false);s.transform({id:'ghostfreak'});s.setInvulnerable(true);
 assert.equal(s.damage(1000),0);assert.equal(s.health,100);s.setInvulnerable(false);assert.equal(s.damage(7),7);
 s.setInvulnerable(true);s.transform({id:'cannonbolt'});assert.equal(s.invulnerable,false);assert.equal(s.damage(10),10);
 s.setInvulnerable(true);s.returnToBen();assert.equal(s.invulnerable,false);s.transform({id:'ghostfreak'});s.setInvulnerable(true);s.reset();assert.equal(s.invulnerable,false);
});
test('an exhausted watch ends invulnerability as well as the active transformation',()=>{
 const s=new PlayerStats();s.transform({id:'ghostfreak'});s.setInvulnerable(true);s.energy=.15;s.tick(.2);assert.equal(s.form,null);assert.equal(s.invulnerable,false);assert.equal(s.damage(12),12);
});
