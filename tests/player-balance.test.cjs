const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const Balance=require('../systems/combat-balance.js');
// Exercise the actual release stats module, including the red watch lock.
const html=fs.readFileSync(require('node:path').resolve(__dirname,'../index.html'),'utf8'),source=html.match(/<!-- PLAYER_STATS_START -->\s*<script>([\s\S]*?)<\/script>\s*<!-- PLAYER_STATS_END -->/)[1],scope={module:{exports:{}}};vm.runInNewContext(source,scope);const Stats=scope.module.exports;
const create=()=>Balance.createPlayerStats(Stats),close=(a,b)=>assert.ok(Math.abs(a-b)<1e-7,`${a} != ${b}`);
const forms=['four-arms','heatblast','xlr8','diamondhead','cannonbolt','ghostfreak','stinkfly','wildvine','blitzwolfer','upgrade'];
test('Ben and all ten aliens have 50 maximum HP and begin at the current human health fraction',()=>{
 const s=create();assert.equal(s.health,50);assert.equal(s.snapshot().maxHealth,50);s.damage(13);
 for(const id of forms){assert.equal(s.transform({id,name:id}),true);assert.equal(s.health,37);assert.equal(s.snapshot().maxHealth,50);s.returnToBen();assert.equal(s.health,37);assert.equal(s.snapshot().maxHealth,50);}
 s.setHealth(999);assert.equal(s.health,50);s.transform({id:forms[0]});s.setHealth(999);assert.equal(s.health,50);
});
test('the 90-energy watch lasts 60 seconds at the original passive drain, independently of frame rate',()=>{
 for(const frames of [1,60,600]){const s=create();assert.equal(s.energy,90);assert.equal(s.snapshot().maxEnergy,90);s.transform({id:'heatblast'});for(let n=0;n<frames;n++)s.tick(60/frames);close(s.energy,0);assert.equal(s.form,null);assert.equal(s.health,50);assert.equal(s.rechargeLocked,true);}
});
test('empty energy preserves the shared injury and the red lock clears at the new maximum',()=>{
 const s=create();s.damage(17);s.transform({id:'ghostfreak'});s.tick(60);assert.equal(s.health,33);assert.equal(s.form,null);assert.equal(s.rechargeLocked,true);assert.equal(s.transform({id:'xlr8'}),false);s.tick(3);assert.equal(s.energy,0);s.tick(11);assert.equal(s.energy,88);assert.equal(s.rechargeLocked,true);s.tick(.25);assert.equal(s.energy,90);assert.equal(s.rechargeLocked,false);assert.equal(s.transform({id:'xlr8'}),true);assert.equal(s.health,33);
});
test('an alien knocked out restores Ben\'s reserved health and empties and locks the watch',()=>{
 const s=create();s.damage(25);s.transform({id:'four-arms'});s.recordLightHit();s.recordLightHit();assert.equal(s.useComboSpecial().cost,20);assert.equal(s.energy,70);assert.equal(s.damage(100),25);assert.equal(s.health,25);assert.equal(s.benHealth,25);assert.equal(s.form,null);assert.equal(s.energy,0);assert.equal(s.rechargeLocked,true);assert.equal(s.transform({id:'heatblast'}),false);assert.ok(!s.drainEvents().some(e=>e.type==='defeated'));s.damage(100);assert.equal(s.health,0);assert.ok(s.drainEvents().some(e=>e.type==='defeated'));
});
test('manual return and energy exhaustion restore the exact health Ben had before transforming',()=>{
 for(const id of forms)for(const reason of ['manual','empty']){const s=create();s.setHealth(25);s.transform({id});s.damage(9);assert.equal(s.health,16);assert.equal(s.benHealth,25);if(reason==='empty')s.tick(60);else s.returnToBen();assert.equal(s.health,25);assert.equal(s.form,null);assert.equal(s.snapshot().maxHealth,50)}
});
test('human finishers are weaker than V35 while the light chain still builds in power',()=>{
 const damage=Balance.humanAttackDamage;assert.deepEqual([1,2,3].map(combo=>damage({combo})),[4,5,6]);assert.equal(damage({heavy:true}),9);assert.equal(damage({special:true}),18);assert.ok(damage({heavy:true})<20);assert.ok(damage({special:true})<75);assert.equal(damage({combo:3}),6);
});
