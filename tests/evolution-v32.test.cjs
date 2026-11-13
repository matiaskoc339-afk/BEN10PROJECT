const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),book=JSON.parse(fs.readFileSync(path.join(root,'assets/skills/catalog.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'systems/evolution-v32.js'),'utf8').split('// UI:')[0];
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),statsSource=html.split('<!-- PLAYER_STATS_START -->')[1].split('<script>')[1].split('</script>')[0];
function world(saved=null){
 const storage=new Map(saved?[['ben10.demo.progression.v11',JSON.stringify(saved)]]:[]);
 const c={SKILL_BOOK:book,console,Image:class{},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},t:10,shake:0,impactPause:0,assetsReady:true,adminPanelOpen:false,state:{wheel:false},player:{x:1210,y:915,mode:'idle',dir:'right',faceX:1,faceY:0,lastLight:-100,lastHeavy:-100},dummyList:Array.from({length:4},(_,i)=>({x:1300+i*25,y:915,health:10000,alive:true})),keys:new Set(),pointer:{},Ben10Speed:require('../systems/speed-route.js'),Ben10SkillArt:{layout:()=>({})},dist:(x,y,a,b)=>Math.hypot(x-a,y-b),lerp:(a,b,t)=>a+(b-a)*t,clamp:(v,a,b)=>Math.min(b,Math.max(a,v)),speedWorld:()=>({width:2400,height:1800,obstacles:[]}),actorMetrics:()=>({radius:20,height:112,shadow:28,lightCooldown:.3,heavyCooldown:.7}),speedSafeLanding:p=>p,faceForAction(){},spawnDust(){},showToast(){},showCombo(){},syncHud(){},updateStats(){}};
 c.startMode=(mode,duration)=>{c.player.mode=mode;c.player.modeDur=duration};c.damageDummy=(d,damage,heavy,feedback)=>{d.health-=Math.max(1,Math.round(damage*(feedback.attackScale??1)));return true};
 vm.createContext(c);vm.runInContext(statsSource,c);c.stats=vm.runInContext('new Ben10Stats.PlayerStats()',c);
 vm.runInContext(source+'\nglobalThis.audit={nodes:evolutionNodes,shape:evolutionShape,bonus:evolutionBonus,earned:evolutionEarnedPoints,free:evolutionFreePoints,load:evolutionLoad,save:evolutionSave,begin:evolutionBeginSkill,tick:evolutionTick,cancel:evolutionCancelSkill,ability:evolutionUseAbility,record:evolutionRecordAttack,state:progression};',c);
 return c;
}
test('ten different connected maps mix attributes, F and six distinct techniques',()=>{
 const c=world(),shapes=new Set();for(let i=0;i<10;i++){
  const nodes=c.audit.nodes(i);assert.equal(nodes.length,24);assert.equal(new Set(nodes.map(n=>n.id)).size,24);assert.equal(nodes.filter(n=>n.type==='active').length,1);assert.equal(nodes.filter(n=>n.type==='combo').length,6);
  const reachable=new Set();for(let pass=0;pass<25;pass++)for(const n of nodes)if(n.req.every(g=>g.split('|').some(id=>reachable.has(id))))reachable.add(n.id);
  assert.equal(reachable.size,24);assert.equal(new Set(book[i].skills.map(s=>s.motion)).size,7);shapes.add(JSON.stringify(c.audit.shape(i)));
  assert.ok(nodes.every(n=>n.x>=50&&n.x<=710&&n.y>=80&&n.y<=1300));
 }assert.equal(shapes.size,10);
});
test('aliens begin below normal power and gain real statistics without passive combo bonuses',()=>{
 const c=world();for(let i=0;i<10;i++){
  const id=book[i].id,base=c.audit.bonus(id);assert.ok(base.atk<1&&base.vel<1&&base.def<1);assert.equal(base.active,false);assert.equal(base.combos.length,0);
  c.audit.state.owned[id]=c.audit.nodes(i).filter(n=>n.type==='combo').map(n=>n.id);const justCombos=c.audit.bonus(id);assert.equal(justCombos.atk,base.atk);assert.equal(justCombos.vel,base.vel);assert.equal(justCombos.def,base.def);
  c.audit.state.owned[id]=c.audit.nodes(i).map(n=>n.id);const max=c.audit.bonus(id);assert.ok(max.atk>base.atk*2);assert.ok(max.vel>base.vel);assert.ok(max.def>base.def);assert.equal(max.combos.length,6);assert.equal(max.active,true);
 }
});
test('old saved progression keeps level and XP and refunds the former purchases',()=>{
 const c=world({version:13,level:20,xp:123,totalXP:3600,adminPoints:25,legacyCredit:0,owned:{'four-arms':['a','c','h']}});c.audit.load();assert.equal(c.stats.level,20);assert.equal(c.stats.xp,123);assert.equal(c.stats.totalXP,3600);assert.equal(c.audit.free(),52);assert.equal(c.audit.state.migrated,true);assert.equal(Object.keys(c.audit.state.owned).length,0);
 const saved=JSON.parse(c.localStorage.getItem('ben10.demo.progression.v11'));assert.equal(saved.version,32);
});
test('new saves restore valid prerequisites and reject orphaned purchases',()=>{
 const c=world({version:32,level:10,xp:10,totalXP:1200,adminPoints:0,legacyCredit:0,owned:{'four-arms':['core','b0r0','b0r1','b2r5']}});c.audit.load();const own=c.audit.state.owned['four-arms'];assert.ok(own.includes('core')&&own.includes('b0r1'));assert.ok(!own.includes('b2r5'));assert.equal(c.audit.free(),5);
});
test('F stays locked and a skill pays once, prevents overlapping casts and cleans its target',()=>{
 const c=world();c.stats.transform(book[0]);c.audit.ability();assert.equal(c.stats.energy,100);assert.equal(c.audit.state.skill,null);
 c.audit.state.owned[book[0].id]=c.audit.nodes(0).map(n=>n.id);assert.equal(c.audit.begin(0,book[0].skills[5]),true);const energy=c.stats.energy;assert.equal(c.audit.begin(0,book[0].skills[5]),false);assert.equal(c.stats.energy,energy);
 c.audit.tick(.5);c.audit.cancel();assert.equal(c.audit.state.skill,null);assert.ok(c.dummyList.every(d=>(d.skillLift||0)===0));
});
test('all seventy skills have timed contacts, end cleanly and retain a snapshot of attack power',()=>{
 const results=[];for(let i=0;i<10;i++)for(const skill of book[i].skills){
  const c=world();c.stats.transform(book[i]);c.audit.state.owned[book[i].id]=c.audit.nodes(i).map(n=>n.id);const before=c.dummyList.reduce((n,d)=>n+d.health,0);
  assert.equal(c.audit.begin(i,skill),true);assert.equal(c.stats.energy,100-skill.cost);assert.ok(c.audit.state.skill.power.atk>0);
  for(let n=0;n<180;n++){c.t+=.02;c.audit.tick(.02)}
  assert.equal(c.audit.state.skill,null,book[i].id+'/'+skill.id);assert.equal(c.player.mode,'idle');assert.ok(c.dummyList.every(d=>(d.skillLift||0)===0));
  const damage=before-c.dummyList.reduce((n,d)=>n+d.health,0);results.push({form:book[i].id,skill:skill.id,damage});assert.ok(damage>0,book[i].id+'/'+skill.id+' must affect an enemy in its path');
 }
 fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/v32-skill-contacts.json'),JSON.stringify(results,null,2));
});
