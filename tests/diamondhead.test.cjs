const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {instrument}=require('./demo-fixture.cjs');
const server=http.createServer((req,res)=>res.end(instrument(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'))));
let browser,count=0;
async function check(name,fn){await fn();count++;console.log('PASS',name);}
const close=(a,b)=>assert.ok(Math.abs(a-b)<.02,`${a} != ${b}`);
(async()=>{
 await new Promise(r=>server.listen(8782,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;});await page.goto('http://127.0.0.1:8782');await page.evaluate(()=>__demo.readyPromise);
 const tick=sec=>page.evaluate(sec=>__demo.tick(sec),sec),reset=()=>page.evaluate(()=>__demo.reset());
 async function transform(slot='4'){await page.keyboard.press('r');await page.keyboard.press(slot);await tick(1.05);}
 async function face(key){await page.keyboard.down(key);await tick(.01);await page.keyboard.up(key);}
 await check('R then 4 activates Diamondhead after Ben touches the watch and updates the crystal HUD button',async()=>{
  await reset();await page.keyboard.press('r');await page.keyboard.press('4');await tick(.5);
  assert.equal(await page.evaluate(()=>__demo.stats.form),null);assert.equal(await page.evaluate(()=>__demo.player.mode),'omnitrix');
  await tick(.55);assert.equal(await page.evaluate(()=>__demo.stats.form.id),'diamondhead');
  assert.equal(await page.locator('#formName').textContent(),'DIAMANTE');assert.equal(await page.locator('#btnHeavy').textContent(),'CRISTAL');
  assert.equal(await page.evaluate(()=>__demo.player.selectedAlien),3);assert.equal(await page.evaluate(()=>__demo.framePlayer().atlas===__demo.diamondheadAtlas),true);
 });
 await check('all 256 HD Diamondhead frames have complete silhouettes, transparent margins and registered feet',async()=>{
  const result=await page.evaluate(()=>{const frames=__demo.diamondheadAtlas.rows.flat(),bad=[];
   for(const f of frames){const p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data;let mass=0,edge=0,bottom=0;
    for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++)if(p[(y*f.w+x)*4+3]>100){mass++;bottom=Math.max(bottom,y);if(x<2||y<2||x>=f.w-2||y>=f.h-2)edge++;}
    if(mass<700||edge||Math.abs(bottom+1-f.anchorY)>2)bad.push({row:f.row,col:f.col,mass,edge,bottom,anchor:f.anchorY});
   }return {count:frames.length,bad,native:frames[0].bodyHeight};});
  assert.equal(result.count,256);assert.equal(result.native,160);assert.deepEqual(result.bad,[]);
 });
 await check('Diamondhead has a moderate height between Heatblast and Four Arms and keeps the camera fixed',async()=>{
  await reset();await transform('2');const fire=await page.evaluate(()=>__demo.actorMetrics());await transform('1');const four=await page.evaluate(()=>__demo.actorMetrics());await transform();
  const diamond=await page.evaluate(()=>__demo.actorMetrics());assert.ok(diamond.height>fire.height&&diamond.height<four.height);assert.equal(diamond.zoom,1.125);
  const rendered=await page.evaluate(()=>{const pose=__demo.framePlayer();return pose.atlas.rows[0][0].bodyHeight*pose.scale;});close(rendered,102);
  const x=await page.evaluate(()=>__demo.player.x);await page.keyboard.down('d');await tick(1);await page.keyboard.up('d');close((await page.evaluate(()=>__demo.player.x))-x,230);
 });
 for(const [key,dir,idx] of [['s','down',0],['w','up',1],['d','right',2],['a','left',3]])await check('Diamondhead walks, guards and connects three different melee attacks toward '+dir,async()=>{
  await reset();await transform();await page.keyboard.down(key);await tick(.12);assert.equal(await page.evaluate(()=>__demo.framePlayer().row),idx+4);await page.keyboard.up(key);
  assert.equal(await page.evaluate(()=>__demo.framePlayer().idle),true);assert.equal(await page.evaluate(()=>__demo.framePlayer().row),idx);
  await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+p.faceX*90,y:p.y+p.faceY*90,health:500,alive:true},{x:p.x-p.faceX*90,y:p.y-p.faceY*90,health:500,alive:true});});
  const rows=[];for(const [n,duration] of [[1,.36],[2,.4],[3,.62]]){
   await page.mouse.click(900,300);await tick(duration*.55);rows.push(await page.evaluate(()=>__demo.framePlayer().row));
   assert.equal(await page.evaluate(()=>__demo.framePlayer().direction),dir);await tick(duration*.45+.04);
  }
  assert.deepEqual(rows,[12+idx,16+idx,20+idx]);assert.deepEqual(await page.evaluate(()=>__demo.dummies.map(d=>d.health)),[432,500]);
  assert.equal(await page.evaluate(()=>__demo.projectiles.length),0);assert.equal(await page.evaluate(()=>__demo.player.mode),'idle');
 });
 await check('eight run poses and five attack contacts have different drawings in each view',async()=>{
  const report=await page.evaluate(()=>{const bad=[];for(let d=0;d<4;d++){
   const run=__demo.diamondheadAtlas.rows[4+d].map(f=>f.canvas.toDataURL());
   const contact=[12,16,20,24,28].map(row=>__demo.diamondheadAtlas.rows[row+d][4].canvas.toDataURL());
   if(new Set(run).size!==8||new Set(contact).size!==5)bad.push({d,run:new Set(run).size,contact:new Set(contact).size});
  }return bad;});assert.deepEqual(report,[]);
 });
 await check('running cadence follows distance consistently at 30, 60 and 120 Hz and returns to an animated guard',async()=>{
  for(const fps of [30,60,120]){const r=await page.evaluate(fps=>{__demo.reset();__demo.stats.transform({id:'diamondhead'});const x=__demo.player.x;__demo.keys.add('d');
   for(let left=90/230;left>1e-10;){const dt=Math.min(left,1/fps);__demo.update(dt);left-=dt;}return {distance:__demo.player.x-x,frame:__demo.framePlayer().frame};},fps);close(r.distance,90);assert.equal(r.frame,4);}
  await reset();await transform();const frame=await page.evaluate(()=>__demo.framePlayer().frame);await tick(.4);assert.notEqual(await page.evaluate(()=>__demo.framePlayer().frame),frame);
 });
 await check('all actions begin and finish in the same directional guard without a stacked second body',async()=>{
  await reset();await transform();const bad=await page.evaluate(()=>{const p=__demo.player,bad=[];
   function pixels(){const cv=document.createElement('canvas');cv.width=400;cv.height=300;__demo.paintPlayerSprite(cv.getContext('2d'),__demo.framePlayer(),200,250);return cv.getContext('2d').getImageData(0,0,400,300).data;}
   for(const dir of ['down','up','right','left']){Object.assign(p,{dir,actionDir:dir,mode:'idle',moving:false,idleClock:0});const idle=pixels();
    for(const mode of ['light1','light2','light3','heavy1','heavy2','dash'])for(const t of [0,.999]){Object.assign(p,{mode,modeDur:1,modeTime:t});if(pixels().some((v,i)=>v!==idle[i]))bad.push({dir,mode,t});}}
   return bad;});assert.deepEqual(bad,[]);
 });
 await check('melee weight shifts advance 4, 6 and 9 units and respect solid scenery at 30, 60 and 120 Hz',async()=>{
  for(const fps of [30,60,120]){
   const result=await page.evaluate(fps=>{
    __demo.reset();__demo.stats.transform({id:'diamondhead'});const p=__demo.player;p.dir='right';p.faceX=1;p.faceY=0;const steps=[];
    for(const duration of [.36,.4,.62]){const x=p.x;__demo.lightAttack();for(let left=duration+.03;left>1e-10;){const dt=Math.min(left,1/fps);__demo.update(dt);left-=dt;}steps.push(p.x-x);}
    return steps;
   },fps);result.forEach((v,i)=>close(v,[4,6,9][i]));
  }
  const blocked=await page.evaluate(()=>{
   __demo.reset();__demo.stats.transform({id:'diamondhead'});const p=__demo.player;p.dir='right';p.faceX=1;p.faceY=0;const x=p.x;
   __demo.props.push({x:x+50,y:p.y,r:20,block:true});for(const duration of [.36,.4,.62]){__demo.lightAttack();__demo.tick(duration+.03);}return p.x-x;
  });assert.ok(blocked>0&&blocked<=12);
 });
 await check('buffered punches complete the full three-hit chain without restarting an active drawing',async()=>{
  await reset();await transform();await face('d');await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+90,y:p.y,health:500,alive:true});});
  await page.mouse.click(900,300);
  for(const n of [1,2]){
   for(let i=0;i<100;i++){if(await page.evaluate(()=>__demo.player.modeTime>=__demo.player.modeDur*.65))break;await tick(.01);}
   const time=await page.evaluate(()=>__demo.player.modeTime);await page.mouse.click(900,300);assert.equal(await page.evaluate(()=>__demo.player.modeTime),time);
   assert.equal(await page.evaluate(()=>__demo.player.mode),'light'+n);
   for(let i=0;i<100;i++){if(await page.evaluate(n=>__demo.player.mode==='light'+(n+1),n))break;await tick(.01);}
   assert.equal(await page.evaluate(()=>__demo.player.mode),'light'+(n+1));
  }
  await tick(.7);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),432);assert.equal(await page.evaluate(()=>__demo.player.mode),'idle');
 });
 await check('attacks are a little slower and the blade formation and impact each remain visible for at least 100 ms in every view',async()=>{
  await reset();await transform();
  const metrics=await page.evaluate(()=>__demo.actorMetrics());assert.deepEqual(metrics.lightDurations,[.36,.4,.62]);assert.equal(metrics.heavyDuration,.8);
  const result=await page.evaluate(()=>{
   const p=__demo.player,result=[];
   for(const [dir,index] of [['down',0],['up',1],['right',2],['left',3]]){
    Object.assign(p,{mode:'light3',modeDur:.62,modeTime:0,actionDir:dir});const clip=__demo.diamondheadActionClip();
    const held=frame=>clip.poses.filter(pose=>pose[0]===20+index&&pose[1]===frame).length/clip.poses.length*p.modeDur;
    result.push({formation:held(2),impact:held(4),visible:held(2)+held(4)+held(5),contactFrame:clip.poses[clip.contact][1],contact:__demo.attackContactTime()});
   }return result;
  });
  for(const r of result){assert.ok(r.formation>=.1);assert.ok(r.impact>=.1);assert.ok(r.visible>=.32);assert.equal(r.contactFrame,4);assert.ok(r.contact>.27&&r.contact<.3);}
 });
 await check('the held blade damages once and early buffered punches and casts survive the longer recovery at 30, 60 and 120 Hz',async()=>{
  for(const fps of [30,60,120]){
   const result=await page.evaluate(fps=>{
    function step(seconds){for(let left=seconds;left>1e-10;){const dt=Math.min(left,1/fps);__demo.update(dt);left-=dt;}}
    function setup(){__demo.reset();__demo.stats.transform({id:'diamondhead'});const p=__demo.player;p.dir='right';p.faceX=1;p.faceY=0;return p;}
    let p=setup();__demo.dummies.push({x:p.x+90,y:p.y,health:1000,alive:true});
    for(const d of [.36,.4]){__demo.lightAttack();step(d+.07);}
    __demo.lightAttack();step(.25);const before=__demo.dummies[0].health;step(.04);__demo.lightAttack();const time=p.modeTime;
    step(.29);const held={mode:p.mode,hp:__demo.dummies[0].health};step(.5);const blade={before,time,held,hp:__demo.dummies[0].health,mode:p.mode};
    p=setup();__demo.dummies.push({x:p.x+300,y:p.y,health:100,alive:true});__demo.heavyAttack();step(.368);__demo.heavyAttack();step(.5);const followup=p.mode;step(1.2);
    return {blade,followup,castHP:__demo.dummies[0].health,castMode:p.mode};
   },fps);
   assert.equal(result.blade.before,960);assert.ok(result.blade.time>.27&&result.blade.time<=.29+.00001);
   assert.deepEqual(result.blade.held,{mode:'light3',hp:932});assert.equal(result.blade.hp,914);assert.equal(result.blade.mode,'idle');
   assert.equal(result.followup,'heavy2');assert.equal(result.castHP,44);assert.equal(result.castMode,'idle');
  }
 });
 await check('normal shards emit at the palm contact, keep their facing and deal 28 damage once at impact',async()=>{
  for(const key of ['d','a','w','s']){
   await reset();await transform();await face(key);await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+p.faceX*260,y:p.y+p.faceY*260,health:100,alive:true},{x:p.x-p.faceX*150,y:p.y-p.faceY*150,health:100,alive:true});});
   await page.mouse.click(900,300,{button:'right'});await tick(.39);assert.equal(await page.evaluate(()=>__demo.projectiles.length),0);
   await tick(.04);assert.equal(await page.evaluate(()=>__demo.projectiles[0].kind),'crystal');assert.deepEqual(await page.evaluate(()=>__demo.dummies.map(d=>d.health)),[100,100]);
   await tick(.7);assert.deepEqual(await page.evaluate(()=>__demo.dummies.map(d=>d.health)),[72,100]);assert.equal(await page.evaluate(()=>__demo.projectiles.length),0);
  }
 });
 await check('two connected melee hits unlock one crystal burst with a 20-energy emission cost and 72 splash damage',async()=>{
  await reset();await transform();await face('d');await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+85,y:p.y,health:500,alive:true});});
  for(const duration of [.36,.4]){await page.mouse.click(900,300);await tick(duration+.06);}
  assert.equal(await page.evaluate(()=>__demo.stats.specialReady),true);
  await page.evaluate(()=>{const p=__demo.player;__demo.dummies[0].x=p.x+260;__demo.dummies.push({x:p.x+275,y:p.y+25,health:100,alive:true});});
  const energy=await page.evaluate(()=>__demo.stats.energy);await page.mouse.click(900,300,{button:'right'});await tick(.39);close(await page.evaluate(()=>__demo.stats.energy),energy-.585);
  await tick(.04);close(await page.evaluate(()=>__demo.stats.energy),energy-.645-20);assert.equal(await page.evaluate(()=>__demo.projectiles[0].special),true);assert.equal(await page.evaluate(()=>__demo.framePlayer().row),30);
  await tick(.8);assert.deepEqual(await page.evaluate(()=>__demo.dummies.map(d=>d.health)),[388,28]);assert.equal(await page.evaluate(()=>__demo.stats.specialReady),false);assert.equal(await page.evaluate(()=>__demo.projectiles.length),0);
 });
 await check('dash cancels a pending crystal burst before spending charge and covers its measured distance',async()=>{
  await reset();await transform();await face('d');await page.evaluate(()=>{__demo.stats.recordLightHit();__demo.stats.recordLightHit();});const e=await page.evaluate(()=>__demo.stats.energy);
  await page.mouse.click(900,300,{button:'right'});await tick(.2);const x=await page.evaluate(()=>__demo.player.x);await page.keyboard.press('Space');await tick(.38);
  close((await page.evaluate(()=>__demo.player.x))-x,174.8);close(await page.evaluate(()=>__demo.stats.energy),e-.58*1.5);assert.equal(await page.evaluate(()=>__demo.projectiles.length),0);
 });
 await check('crystal shots stop at solid scenery and a real ranged defeat awards XP once',async()=>{
  await reset();await transform();await face('d');await page.evaluate(()=>{const p=__demo.player;__demo.props.push({x:p.x+100,y:p.y,r:24,block:true});__demo.dummies.push({x:p.x+240,y:p.y,health:100,alive:true});});
  await page.mouse.click(900,300,{button:'right'});await tick(1.1);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),100);
  await page.evaluate(()=>{__demo.props.length=0;__demo.dummies[0].health=28;});await page.mouse.click(900,300,{button:'right'});await tick(1.1);await tick(1);
  assert.deepEqual(await page.evaluate(()=>[__demo.dummies[0].alive,__demo.stats.totalXP,__demo.state.kills]),[false,40,1]);
 });
 await check('exhausting the last special charge returns to Ben while the emitted crystal finishes its flight',async()=>{
  await reset();await transform();await face('d');await page.evaluate(()=>{const p=__demo.player;__demo.stats.energy=20.66;__demo.stats.recordLightHit();__demo.stats.recordLightHit();__demo.dummies.push({x:p.x+300,y:p.y,health:100,alive:true});});
  await page.mouse.click(900,300,{button:'right'});await tick(.47);assert.equal(await page.evaluate(()=>__demo.stats.form),null);assert.equal(await page.evaluate(()=>__demo.projectiles[0].kind),'crystal');
  await tick(.7);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),28);assert.equal(await page.locator('#formName').textContent(),'BEN');
 });
 await check('switching among all three aliens preserves life, XP and remaining energy, with six classic slots locked',async()=>{
  await reset();await transform();await page.evaluate(()=>{__demo.stats.damage(15);__demo.stats.awardXP(130);});const energy=await page.evaluate(()=>__demo.stats.energy);
  await transform('2');await transform('1');await transform();assert.ok((await page.evaluate(()=>__demo.stats.energy))<energy);
  for(const key of ['6','7','8','9','0','u']){await page.keyboard.press('r');await page.keyboard.press(key);assert.equal(await page.evaluate(()=>__demo.state.wheel),true);assert.equal(await page.evaluate(()=>__demo.player.mode),'idle');await page.keyboard.press('Escape');}
  await page.keyboard.press('t');assert.deepEqual(await page.evaluate(()=>[__demo.stats.form,__demo.stats.health,__demo.stats.level,__demo.stats.xp,__demo.cam.zoom]),[null,85,2,30,1.125]);
 });
 await check('touch users select slot 4, launch a crystal and return through the watch centre',async()=>{
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await mobile.newPage();await p.addInitScript(()=>{requestAnimationFrame=()=>0;});await p.goto('http://127.0.0.1:8782');await p.evaluate(()=>__demo.readyPromise);
  await p.locator('#watchShortcut').tap();const box=await p.locator('#wheelCanvas').boundingBox();await p.touchscreen.tap(box.x+box.width*.8,box.y+box.height*.598);await p.evaluate(()=>__demo.tick(1.05));
  assert.equal(await p.locator('#formName').textContent(),'DIAMANTE');await p.locator('#btnHeavy').tap();await p.evaluate(()=>__demo.tick(.44));assert.equal(await p.evaluate(()=>__demo.projectiles[0].kind),'crystal');
  await p.locator('#watchShortcut').tap();await p.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);assert.equal(await p.evaluate(()=>__demo.stats.form),null);await mobile.close();
 });
 assert.deepEqual(errors,[]);console.log(`${count} Diamondhead checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.close();});
