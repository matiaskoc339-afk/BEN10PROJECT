const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),book=JSON.parse(fs.readFileSync(path.join(root,'assets/skills/catalog.json'),'utf8'));
const source=fs.readFileSync(path.join(root,'systems/evolution-v32.js'),'utf8').split('// UI:')[0]+'\n'+fs.readFileSync(path.join(root,'systems/skill-choreography-v33.js'),'utf8')+'\n'+fs.readFileSync(path.join(root,'systems/combat-targeting.js'),'utf8');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),statsSource=html.split('<!-- PLAYER_STATS_START -->')[1].split('<script>')[1].split('</script>')[0];
function world(saved=null){
 const storage=new Map(saved?[['ben10.demo.progression.v11',JSON.stringify(saved)]]:[]);
 const c={SKILL_BOOK:book,console,Image:class{},localStorage:{getItem:k=>storage.get(k),setItem:(k,v)=>storage.set(k,v)},t:10,shake:0,impactPause:0,assetsReady:true,adminPanelOpen:false,state:{wheel:false},player:{x:1210,y:915,mode:'idle',dir:'right',faceX:1,faceY:0,lastLight:-100,lastHeavy:-100},dummyList:Array.from({length:4},(_,i)=>({x:1300+i*25,y:915,health:10000,alive:true})),keys:new Set(),pointer:{},Ben10Speed:require('../systems/speed-route.js'),Ben10SkillArt:{layout:()=>({})},dist:(x,y,a,b)=>Math.hypot(x-a,y-b),lerp:(a,b,t)=>a+(b-a)*t,clamp:(v,a,b)=>Math.min(b,Math.max(a,v)),speedWorld:()=>({width:2400,height:1800,obstacles:[]}),actorMetrics:()=>({radius:20,height:112,shadow:28,lightCooldown:.3,heavyCooldown:.7}),speedSafeLanding:p=>p,faceForAction(){},spawnDust(){},showToast(){},showCombo(){},syncHud(){},updateStats(){}};
 const attrs={},classes=new Set();c.document={getElementById:()=>({classList:{remove:n=>classes.delete(n),toggle:(n,on)=>on?classes.add(n):classes.delete(n)},getBoundingClientRect:()=>({})})};c.hudElements=Object.fromEntries(['energyFill','energyTopFill','energyBottomFill'].map(id=>[id,{setAttribute:(k,v)=>attrs[id+':'+k]=v}]));c.hudTest={attrs,classes};c.faceFrom=(dx,dy)=>{c.player.dir=Math.abs(dx)>Math.abs(dy)?dx<0?'left':'right':dy<0?'up':'down';c.player.faceX=Math.abs(dx)>Math.abs(dy)?Math.sign(dx):0;c.player.faceY=Math.abs(dx)>Math.abs(dy)?0:Math.sign(dy)};
 c.startMode=(mode,duration)=>{c.player.mode=mode;c.player.modeDur=duration};c.damageDummy=(d,damage,heavy,feedback)=>{d.health-=Math.max(1,Math.round(damage*(feedback.attackScale??1)));return true};
 vm.createContext(c);vm.runInContext(statsSource,c);c.stats=vm.runInContext('new Ben10Stats.PlayerStats()',c);
 vm.runInContext(source+'\nglobalThis.audit={nodes:evolutionNodes,shape:evolutionShape,bonus:evolutionBonus,earned:evolutionEarnedPoints,free:evolutionFreePoints,load:evolutionLoad,save:evolutionSave,begin:evolutionBeginSkill,tick:evolutionTick,cancel:evolutionCancelSkill,ability:evolutionUseAbility,record:evolutionRecordAttack,targeting:combatTargetState,choose:combatChooseTarget,remember:combatRememberHit,drawTarget:combatDrawTarget,state:progression};',c);
 return c;
}
test('ten different connected maps mix attributes, F and six distinct techniques',()=>{
 const c=world(),shapes=new Set();for(let i=0;i<10;i++){
  const nodes=c.audit.nodes(i);assert.equal(nodes.length,24);assert.equal(new Set(nodes.map(n=>n.id)).size,24);assert.equal(nodes.filter(n=>n.type==='active').length,1);assert.equal(nodes.filter(n=>n.type==='combo').length,6);
  const reachable=new Set();for(let pass=0;pass<25;pass++)for(const n of nodes)if(n.req.every(g=>g.split('|').some(id=>reachable.has(id))))reachable.add(n.id);
  assert.equal(reachable.size,24);assert.ok(nodes.reduce((n,node)=>n+node.req.reduce((m,g)=>m+g.split('|').length,0),0)<=25,'Tree has too many lines');assert.equal(new Set(book[i].skills.map(s=>s.motion)).size,7);shapes.add(JSON.stringify(c.audit.shape(i)));
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
 const saved=JSON.parse(c.localStorage.getItem('ben10.demo.progression.v11'));assert.equal(saved.version,33);
});
test('V32 saves retain learned nodes when tree prerequisites are simplified',()=>{
 const c=world({version:32,level:10,xp:10,totalXP:1200,adminPoints:0,legacyCredit:0,owned:{'four-arms':['core','b0r0','b0r1','b2r5']}});c.audit.load();const own=c.audit.state.owned['four-arms'];assert.ok(own.includes('core')&&own.includes('b0r1'));assert.ok(own.includes('b2r5'));assert.equal(c.audit.free(),1);
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
  const damage=before-c.dummyList.reduce((n,d)=>n+d.health,0);results.push({form:book[i].id,skill:skill.id,damage});if(book[i].id==='diamondhead'&&skill.id==='f'){assert.equal(damage,0)}else assert.ok(damage>0,book[i].id+'/'+skill.id+' must affect an enemy in its path');
 }
 fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});fs.writeFileSync(path.join(root,'artifacts/v33-skill-contacts.json'),JSON.stringify(results,null,2));
});

function cast(index,id,targets){
 const c=world();c.stats.transform(book[index]);c.audit.state.owned[book[index].id]=c.audit.nodes(index).map(n=>n.id);
 if(targets)c.dummyList=targets.map(p=>({...p,health:10000,alive:true}));
 c.hits=[];const damage=c.damageDummy;c.damageDummy=(d,...args)=>{c.hits.push(d);return damage(d,...args)};
 assert.equal(c.audit.begin(index,book[index].skills.find(s=>s.id===id)),true);return c;
}
function finish(c){for(let j=0;j<220;j++){c.t+=.016;c.audit.tick(.016)}}
test('Quartz barrier hardens only its owner, with no damaging wall',()=>{
 const c=cast(3,'f');c.audit.tick(.6);assert.equal(c.hits.length,0);assert.equal(c.audit.state.buffs.diamondhead.def,.4);assert.ok(c.audit.bonus().def>1);
 finish(c);assert.equal(c.audit.state.buffs.diamondhead,undefined);
});
test('Four Arms actually lifts a front target, slams it, and never grabs behind',()=>{
 const c=cast(0,'c4',[{x:1300,y:915},{x:1190,y:915}]);c.audit.tick(.9);assert.ok(c.dummyList[0].skillLift>50);assert.equal(c.dummyList[1].skillLift||0,0);
 finish(c);assert.ok(c.dummyList[0].health<10000);assert.equal(c.dummyList[1].health,10000);assert.equal(c.dummyList[0].skillLift,0);
});
test('XLR8 completes one orbit and hits each crossed opponent once',()=>{
 const targets=Array.from({length:12},(_,j)=>{const a=j*Math.PI/6;return {x:1210+Math.sin(a)*140,y:915+(1-Math.cos(a))*84}}),c=cast(2,'c3',targets);
 finish(c);assert.ok(c.hits.length>=8);for(const d of c.dummyList)assert.ok(c.hits.filter(hit=>hit===d).length<=1);assert.ok(Math.abs(c.player.x-1210)<1&&Math.abs(c.player.y-915)<1);
});
test('ghost claw vanishes before its attack; burrow strikes repeatedly and returns',()=>{
 const c=cast(5,'c0');c.audit.tick(.6);assert.equal(c.stats.invulnerable,true);assert.ok(c.audit.state.skill.alpha<.1);assert.equal(c.hits.length,0);finish(c);assert.equal(c.stats.invulnerable,false);assert.ok(c.hits.length>0);
 const b=cast(5,'c3',[{x:1360,y:915}]);b.audit.tick(1.1);assert.equal(b.audit.state.skill.alpha,0);finish(b);assert.equal(b.hits.length,3);assert.equal(b.stats.invulnerable,false);
});
test('Cannonbolt revs in place; its bounce lands three times without horizontal travel',()=>{
 for(const id of ['c0','c3']){const c=cast(4,id);finish(c);assert.equal(c.player.x,1210);assert.equal(c.player.y,915);assert.ok(c.hits.length>=3);}
});
test('Ultra T cannon pierces several front targets and a solid wall blocks the rest',()=>{
 const c=cast(9,'c2',[{x:1290,y:915},{x:1370,y:915},{x:1510,y:915},{x:1200,y:915}]);
 c.speedWorld=()=>({width:2400,height:1800,obstacles:[{x:1430,y:915,r:30,block:true}]});finish(c);
 assert.ok(c.dummyList[0].health<10000);assert.ok(c.dummyList[1].health<10000);assert.equal(c.dummyList[2].health,10000);assert.equal(c.dummyList[3].health,10000);
});
test('liquid torpedo uses its fixed emergence point and misses an enemy to the side',()=>{
 const c=cast(9,'c5',[{x:1380,y:1060}]);finish(c);assert.equal(c.hits.length,0);assert.equal(c.player.x,1390);assert.equal(c.player.y,915);
 const b=cast(9,'c5',[{x:1390,y:915}]);finish(b);assert.equal(b.hits.length,1);
});
test('new wind projectile keeps the power snapshot when Ben returns',()=>{
 const c=cast(2,'c4',[{x:1440,y:915}]);for(let j=0;j<43;j++)c.audit.tick(.016);assert.equal(c.audit.state.fields.length,1);const power=c.audit.state.fields[0].source.power.atk;
 c.stats.returnToBen('manual');finish(c);assert.ok(c.hits.length>0);assert.ok(power>.55);
});

test('elbow, unfurling claw rush and bite stop before their front target',()=>{for(const [index,id]of [[0,'c0'],[4,'c1'],[8,'c1']]){const c=cast(index,id,[{x:1295,y:915}]);finish(c);assert.ok(c.dummyList[0].health<10000,book[index].id);assert.ok(c.player.x<1295);}});

test('a real basic hit remembers the combo victim ahead of a nearer enemy',()=>{
 const c=world();c.stats.transform(book[0]);c.audit.record('L');const victim=c.dummyList[3];c.damageDummy(victim,1,false,{});
 assert.equal(c.audit.targeting.focus.target,victim);c.audit.begin(0,book[0].skills.find(s=>s.id==='c0'));
 assert.equal(c.audit.state.skill.target,victim);
});
test('mouse aim accounts for camera, zoom, DPR and the enemy body; facing beats nearest fallback',()=>{
 const c=world();c.stats.transform(book[0]);c.cam={x:1000,y:700,zoom:1.25};c.dpr=2;
 c.dummyList=[{x:1310,y:970,alive:true,health:1000},{x:1290,y:915,alive:true,health:1000}];
 c.pointer={active:true,x:(1310-1000)*2*1.25,y:(970-60-700)*2*1.25};
 const q={x:1210,y:915,dx:1,dy:0,form:'four-arms'};
 assert.equal(c.audit.choose(q,200),c.dummyList[0]);c.pointer.active=false;
 assert.equal(c.audit.choose(q,200),c.dummyList[1]);
 c.dummyList=[{x:1260,y:965,alive:true},{x:1300,y:990,alive:true}];assert.equal(c.audit.choose(q,200),c.dummyList[0]);
});
test('target acquisition excludes dead, behind, far and obstructed enemies even with remembered focus',()=>{
 const c=world();c.stats.transform(book[0]);c.dummyList=[{x:1380,y:915,alive:true},{x:1270,y:965,alive:true},{x:1200,y:915,alive:true},{x:1260,y:915,alive:false},{x:1700,y:915,alive:true}];
 c.audit.targeting.focus={target:c.dummyList[0],form:'four-arms',time:c.t};
 c.speedWorld=()=>({width:2400,height:1800,obstacles:[{x:1310,y:915,r:25,block:true}]});
 const q={x:1210,y:915,dx:1,dy:0,form:'four-arms'};assert.equal(c.audit.choose(q,200),c.dummyList[1]);
 c.dummyList[1].alive=false;assert.equal(c.audit.choose(q,200),null);
});
test('stale focus and a different form do not steal the next combo',()=>{
 const c=world(),q={x:1210,y:915,dx:1,dy:0,form:'four-arms'};
 c.audit.targeting.focus={target:c.dummyList[3],form:'four-arms',time:c.t-3.3};assert.equal(c.audit.choose(q,200),c.dummyList[0]);
 c.audit.targeting.focus={target:c.dummyList[3],form:'heatblast',time:c.t};assert.equal(c.audit.choose(q,200),c.dummyList[0]);
});
test('a multi-victim basic attack remembers the aimed victim rather than array iteration order',()=>{
 const c=world();c.stats.transform(book[0]);c.audit.record('L');c.cam={x:1000,y:700,zoom:1};c.dpr=1;
 c.pointer={active:true,x:1375-1000,y:915-60-700};c.damageDummy(c.dummyList[3],1,false,{});c.damageDummy(c.dummyList[0],1,false,{});
 assert.equal(c.audit.targeting.focus.target,c.dummyList[3]);
});
test('ground summons and liquid emergence aim at a victim anywhere inside their own reach',()=>{
 for(const [index,id,x]of [[1,'c5',1450],[3,'c5',1510],[5,'c3',1440],[7,'c5',1440],[9,'c5',1340]]){
  const c=cast(index,id,[{x,y:915}]);assert.equal(c.audit.state.skill.aim.x,x);finish(c);assert.ok(c.dummyList[0].health<10000,book[index].id+'/'+id);
 }
});
test('summoned attacks commit to one ground point and a moving enemy can evade',()=>{
 const c=cast(1,'c5',[{x:1420,y:915}]);assert.equal(c.audit.state.skill.aim.x,1420);c.dummyList[0].y+=200;
 finish(c);assert.equal(c.hits.length,0);assert.ok(c.audit.state.fx.length===0);
 const b=cast(9,'c5',[{x:1340,y:915}]);b.dummyList[0].y+=120;finish(b);assert.equal(b.hits.length,0);assert.equal(b.player.x,1340);
});
test('an enemy can evade before the grab; a dead lock is never replaced by another victim',()=>{
 const c=cast(0,'c4',[{x:1300,y:915}]);c.dummyList[0].x=1900;finish(c);assert.equal(c.hits.length,0);
 const b=cast(5,'c2',[{x:1300,y:915},{x:1330,y:915}]);b.dummyList[0].alive=false;finish(b);assert.equal(b.dummyList[1].health,10000);
});
test('skill projectiles and passive poison cannot change the current combo focus',()=>{
 const c=world();c.stats.transform(book[1]);c.audit.record('L');c.damageDummy(c.dummyList[0],1,false,{});
 c.damageDummy(c.dummyList[3],1,false,{rememberTarget:false});assert.equal(c.audit.targeting.focus.target,c.dummyList[0]);
});
test('denied energy flashes only the HUD watch, consumes no energy and shows no text',()=>{
 const c=world(),toasts=[];c.showToast=s=>toasts.push(s);c.stats.transform(book[0]);c.stats.energy=3;
 const skill=book[0].skills[0];assert.equal(c.audit.begin(0,skill),false);assert.equal(c.stats.energy,3);assert.equal(c.player.mode,'idle');assert.equal(c.audit.state.skill,null);
 assert.ok(c.hudTest.classes.has('is-energy-denied'));assert.equal(c.hudTest.attrs['energyFill:fill'],'url(#hudRed)');assert.deepEqual(toasts,[]);
 c.t+=.8;c.syncHud();assert.ok(!c.hudTest.classes.has('is-energy-denied'));assert.equal(c.hudTest.attrs['energyFill:fill'],'url(#hudGreen)');
});
test('an unaffordable learned combo is handled without falling through to a basic special',()=>{
 const c=world();c.stats.transform(book[0]);c.audit.state.owned[book[0].id]=c.audit.nodes(0).map(n=>n.id);c.stats.energy=2;
 c.audit.state.comboLog=[{type:'L',t:c.t-.6},{type:'H',t:c.t-.3}];assert.equal(c.audit.record('L'),true);assert.equal(c.audit.state.skill,null);assert.equal(c.stats.energy,2);assert.ok(c.hudTest.classes.has('is-energy-denied'));
});

test('an empty flurry completes its route and returns without hitting an escaped target',()=>{const c=cast(2,'c1',[{x:1310,y:915}]);c.dummyList[0].x=1900;finish(c);assert.equal(c.hits.length,0);assert.ok(Math.abs(c.player.x-1210)<1&&Math.abs(c.player.y-915)<1);});

test('insufficient energy takes precedence over cooldown without a toast',()=>{const c=world(),toasts=[];c.showToast=s=>toasts.push(s);c.stats.transform(book[0]);c.stats.energy=1;c.audit.state.abilityTimes['four-armsf']=c.t;assert.equal(c.audit.begin(0,book[0].skills[0]),false);assert.deepEqual(toasts,[]);assert.ok(c.hudTest.classes.has('is-energy-denied'));});

test('Ben can render a frame with no focus or active transformation',()=>{const c=world();assert.equal(c.stats.form,null);assert.doesNotThrow(()=>c.audit.drawTarget());});
