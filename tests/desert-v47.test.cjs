const test=require('node:test');
const assert=require('node:assert/strict');
const desert=require('../systems/desert-world.js');
const Campaign=require('../systems/campaign-world.js');
const Unlocks=require('../systems/campaign-unlocks.js');
const Slots=require('../systems/save-slots.js');

test('V47 desert route has three connected map sections',()=>{
 const data=desert.level;
 assert.equal(data.chapters.length,3);
 assert.deepEqual(data.chapters.map(x=>x.id),['desert-village','desert-wastes','desert-cavern']);
 for(let n=0;n<3;n++){
  const level=new Campaign.Level(data);
  const at=level.setPhase(n);
  assert.ok(at&&Number.isFinite(at.x)&&Number.isFinite(at.y));
  assert.ok(level.rooms.length>=6);
  assert.equal(level.props.length,0);
 }
});

test('new DNA is locked until the Alpha is defeated',()=>{
 const save=new Map(),storage={getItem:k=>save.get(k)||null,setItem:(k,v)=>save.set(k,v)};
 const unlocks=new Unlocks.Unlocks(storage);
 assert.equal(unlocks.has('blitzwolfer'),false);
 assert.equal(unlocks.unlockBlitzwolfer(),true);
 assert.equal(unlocks.unlockBlitzwolfer(),false);
 assert.equal(new Unlocks.Unlocks(storage).has('blitzwolfer'),true);
 assert.equal(unlocks.has('four-arms'),true);
 assert.equal(unlocks.has('heatblast'),true);
});

test('desert checkpoint and earlier Zombozo saves remain valid',()=>{
 const a=Slots.normalizeAdventure({story:'desert',mode:'desert',desertVisited:true,desertDefeated:false});
 assert.equal(a.story,'desert');
 assert.equal(a.mode,'desert');
 assert.equal(a.desertVisited,true);
 assert.equal(a.desertDefeated,false);
 const old=Slots.normalizeAdventure({story:'circus',mode:'mirror',zombozoDefeated:true});
 assert.equal(old.story,'circus');assert.equal(old.zombozoDefeated,true);
 const r=Slots.normalize({adventure:a,checkpoint:{phase:2,cleared:3,kind:'alpha',x:120,y:300},unlocks:{ghostfreak:true,blitzwolfer:false}});
 assert.equal(r.checkpoint.kind,'alpha');assert.equal(r.unlocks.blitzwolfer,false);assert.equal(r.unlocks.ghostfreak,true);
});
