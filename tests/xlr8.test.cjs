const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {instrument}=require('./demo-fixture.cjs');
const server=http.createServer((q,r)=>resEnd(r,instrument(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'))));function resEnd(r,s){r.setHeader('Content-Type','text/html');r.end(s)}
let browser,count=0;async function check(name,fn){await fn();count++;console.log('PASS',name)}const close=(a,b)=>assert.ok(Math.abs(a-b)<.03,`${a} != ${b}`);
(async()=>{
 await new Promise(r=>server.listen(8783,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0});await page.goto('http://127.0.0.1:8783');await page.evaluate(()=>__demo.readyPromise);
 const tick=sec=>page.evaluate(sec=>__demo.tick(sec),sec),reset=()=>page.evaluate(()=>__demo.reset());
 async function transform(){await page.keyboard.press('r');await page.keyboard.press('3');await tick(1.05);await page.evaluate(()=>{for(let i=0;i<90;i++)__demo.render()});}
 async function face(key){await page.keyboard.down(key);await tick(.01);await page.keyboard.up(key)}
 const position=()=>page.evaluate(()=>({x:__demo.player.x,y:__demo.player.y}));
 async function moveWorld(x,y){const s=await page.evaluate(p=>({x:(p.x-__demo.cam.x)*__demo.cam.zoom,y:(p.y-__demo.cam.y)*__demo.cam.zoom}),{x,y});await page.mouse.move(s.x,s.y);}
 await check('R then 3 activates XLR8 with his own HUD, modest height and fixed camera',async()=>{
  await reset();await transform();assert.equal(await page.evaluate(()=>__demo.stats.form.id),'xlr8');assert.equal(await page.locator('#formName').textContent(),'XLR8');assert.equal(await page.locator('#btnHeavy').textContent(),'RUTA');
  const a=await page.evaluate(()=>__demo.actorMetrics());assert.equal(a.height,88);assert.equal(a.zoom,1.125);assert.equal(a.speed,380);
 });
 await check('all 256 HD XLR8 frames keep their full tails, feet and transparent margins',async()=>{
  const report=await page.evaluate(()=>{const frames=__demo.xlr8Atlas.rows.flat(),bad=[];for(const f of frames){const p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data;let n=0,edge=0,bottom=0;for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++)if(p[(y*f.w+x)*4+3]>100){n++;bottom=Math.max(bottom,y);if(x<2||y<2||x>=f.w-2||y>=f.h-2)edge++;}if(n<400||edge||Math.abs(bottom+1-f.anchorY)>2)bad.push({r:f.row,c:f.col,n,edge,bottom,anchor:f.anchorY});}return {n:frames.length,bad,height:frames[0].bodyHeight};});assert.equal(report.n,256);assert.equal(report.height,160);assert.deepEqual(report.bad,[]);
 });
 for(const [key,dir,i] of [['d','right',2],['a','left',3],['w','up',1],['s','down',0]])await check('fast movement and three rapid melee strikes keep their '+dir+' view',async()=>{
  await reset();await transform();const p=await position();await page.keyboard.down(key);await tick(.19);assert.equal(await page.evaluate(()=>__demo.framePlayer().row),4+i);await page.keyboard.up(key);const after=await position();close(Math.hypot(after.x-p.x,after.y-p.y),72.2);
  await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+p.faceX*78,y:p.y+p.faceY*78,health:500,alive:true},{x:p.x-p.faceX*78,y:p.y-p.faceY*78,health:500,alive:true});});
  const rows=[];for(const d of [.18,.2,.26]){await page.mouse.click(1100,300);await tick(d*.6);rows.push(await page.evaluate(()=>__demo.framePlayer().row));assert.equal(await page.evaluate(()=>__demo.framePlayer().direction),dir);await tick(d*.4+.03);}
  assert.deepEqual(rows,[12+i,16+i,20+i]);assert.deepEqual(await page.evaluate(()=>__demo.dummies.map(d=>d.health)),[462,500]);assert.equal(await page.evaluate(()=>__demo.projectiles.length),0);
 });
 await check('a brief right click rushes forward and returns to the exact origin in all four facings, hitting on both passes',async()=>{
  for(const key of ['d','a','w','s']){await reset();await transform();await face(key);const p=await position();await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+p.faceX*100,y:p.y+p.faceY*100,health:100,alive:true},{x:p.x-p.faceX*100,y:p.y-p.faceY*100,health:100,alive:true});});
   await page.mouse.move(1100,300);await page.mouse.down({button:'right'});await tick(.06);await page.mouse.up({button:'right'});assert.equal(await page.evaluate(()=>__demo.speedAction.phase),'rush');await tick(.6);const end=await position();close(end.x,p.x);close(end.y,p.y);assert.deepEqual(await page.evaluate(()=>__demo.dummies.map(d=>d.health)),[32,100]);assert.equal(await page.evaluate(()=>__demo.player.mode),'idle');}
 });
 await check('holding right click draws an ordered route and automatically executes it when the visible timer ends',async()=>{
  await reset();await transform();const p=await position();await page.evaluate(()=>{const p=__demo.player;for(const [dx,dy] of [[140,0],[260,90],[140,160],[60,70]])__demo.dummies.push({x:p.x+dx,y:p.y+dy,health:100,alive:true});});
  await moveWorld(p.x+260,p.y);await page.mouse.down({button:'right'});await tick(.2);assert.equal(await page.locator('#speedGuide').isVisible(),true);assert.equal(await page.evaluate(()=>__demo.speedAction.phase),'plan');
  await moveWorld(p.x+260,p.y+160);await moveWorld(p.x+20,p.y+160);assert.equal(await page.evaluate(()=>__demo.speedAction.plan.points.length),4);await tick(1.59);assert.equal(await page.evaluate(()=>__demo.speedAction.phase),'rush');await page.mouse.up({button:'right'});await tick(.8);
  const end=await position();close(end.x,p.x+20);close(end.y,p.y+160);assert.deepEqual(await page.evaluate(()=>__demo.dummies.map(d=>d.health)),[66,66,66,100]);assert.equal(await page.locator('#speedGuide').isVisible(),false);
 });
 await check('releasing a held right click early executes the selected route rather than the tap return',async()=>{
  await reset();await transform();const p=await position();await moveWorld(p.x+240,p.y);await page.mouse.down({button:'right'});await tick(.25);await page.mouse.up({button:'right'});await tick(.5);const end=await position();close(end.x,p.x+240);close(end.y,p.y);
 });
 await check('movement and camera stay fixed while planning and unrelated left clicks cannot release right hold',async()=>{
  await reset();await transform();const p=await position();await moveWorld(p.x+200,p.y);await page.mouse.down({button:'right'});await tick(.22);const cam=await page.evaluate(()=>({...__demo.cam}));
  await page.keyboard.down('d');await tick(.3);await page.keyboard.up('d');assert.deepEqual(await position(),p);assert.deepEqual(await page.evaluate(()=>({...__demo.cam})),cam);
  await page.mouse.click(900,300,{button:'left'});assert.equal(await page.evaluate(()=>__demo.speedAction.phase),'plan');await page.mouse.up({button:'right'});await tick(.6);
 });
 await check('a looping route damages again on each crossing and still stops at solid cover',async()=>{
  await reset();await transform();const p=await position();await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+100,y:p.y,health:500,alive:true});});
  await moveWorld(p.x+200,p.y);await page.mouse.down({button:'right'});await tick(.2);await moveWorld(p.x,p.y);await moveWorld(p.x+200,p.y);await page.mouse.up({button:'right'});await tick(.8);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),398);
  await reset();await transform();const q=await position();await page.evaluate(()=>{const p=__demo.player;__demo.props.push({x:p.x+110,y:p.y,r:24,block:true});__demo.dummies.push({x:p.x+240,y:p.y,health:100,alive:true});});
  await moveWorld(q.x+300,q.y);await page.mouse.down({button:'right'});await tick(.25);assert.equal(await page.evaluate(()=>__demo.speedAction.plan.blocked),true);await page.mouse.up({button:'right'});await tick(.7);assert.ok((await position()).x<q.x+72);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),100);
 });
 await check('two melee hits reserve the powered route through the planning timer and spend 20 only on execution',async()=>{
  await reset();await transform();await face('d');await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+80,y:p.y,health:500,alive:true});});
  for(const d of [.18,.2]){await page.mouse.click(1100,300);await tick(d+.03);}const p=await position(),energy=await page.evaluate(()=>__demo.stats.energy);await moveWorld(p.x+220,p.y);await page.mouse.down({button:'right'});await tick(1.4);close(await page.evaluate(()=>__demo.stats.energy),energy-2.1);assert.equal(await page.evaluate(()=>__demo.speedAction.phase),'plan');
  await tick(.7);await page.mouse.up({button:'right'});close(await page.evaluate(()=>__demo.stats.energy),energy-20-2.1*1.5);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),420);
 });
 await check('T, the wheel, Space and blur cancel planning without a hidden launch or special energy cost',async()=>{
  for(const action of ['t','r','Space','blur']){await reset();await transform();const p=await position();await page.evaluate(()=>{__demo.stats.recordLightHit();__demo.stats.recordLightHit();});const energy=await page.evaluate(()=>__demo.stats.energy);await moveWorld(p.x+200,p.y);await page.mouse.down({button:'right'});await tick(.3);
   if(action==='blur')await page.evaluate(()=>window.dispatchEvent(new Event('blur')));else await page.keyboard.press(action);await page.mouse.up({button:'right'});assert.equal(await page.evaluate(()=>__demo.speedAction.phase),'idle');assert.equal(await page.locator('#speedGuide').isVisible(),false);assert.ok((await page.evaluate(()=>__demo.stats.energy))>=energy-.5);
   if(action==='r')await page.keyboard.press('Escape');await tick(.5);assert.notEqual(await page.evaluate(()=>__demo.player.mode),'speedRush');}
 });
 await check('returning to Ben mid-rush stops the route and prevents hits farther along it',async()=>{
  await reset();await transform();const p=await position();await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+300,y:p.y,health:100,alive:true});});await moveWorld(p.x+450,p.y);await page.mouse.down({button:'right'});await tick(.22);await page.mouse.up({button:'right'});await tick(.04);await page.keyboard.press('t');const stop=await position();await tick(.7);assert.deepEqual(await position(),stop);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),100);assert.equal(await page.evaluate(()=>__demo.stats.form),null);
 });
 await check('energy exhaustion during planning cancels the guide and leaves Ben stationary',async()=>{
  await reset();await transform();const p=await position();await page.evaluate(()=>{__demo.stats.energy=.3});await moveWorld(p.x+260,p.y);await page.mouse.down({button:'right'});await tick(.4);await page.mouse.up({button:'right'});assert.equal(await page.evaluate(()=>__demo.stats.form),null);assert.equal(await page.evaluate(()=>__demo.speedAction.phase),'idle');assert.equal(await page.locator('#speedGuide').isVisible(),false);assert.deepEqual(await position(),p);
 });
 await check('ending directly on a surviving target brakes onto free ground so XLR8 can move away',async()=>{
  await reset();await transform();const p=await position();await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+150,y:p.y,health:100,alive:true});});await moveWorld(p.x+150,p.y);await page.mouse.down({button:'right'});await tick(.22);await page.mouse.up({button:'right'});await tick(.5);assert.equal(await page.evaluate(()=>__demo.collide(__demo.player.x,__demo.player.y)),false);const before=await position();await page.keyboard.down('d');await tick(.2);await page.keyboard.up('d');assert.ok((await position()).x>before.x+50);
 });
 await check('cancelling while crossing a living target places Ben on free ground rather than trapping him inside it',async()=>{
  await reset();await transform();const p=await position();await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+95,y:p.y,health:100,alive:true});});
  await moveWorld(p.x+350,p.y);await page.mouse.down({button:'right'});await tick(.22);await page.mouse.up({button:'right'});await tick(.05);await page.keyboard.press('t');
  assert.equal(await page.evaluate(()=>__demo.collide(__demo.player.x,__demo.player.y)),false);const start=await position();await page.keyboard.down('d');await tick(.2);await page.keyboard.up('d');assert.ok((await position()).x>start.x+40);
 });
 await check('rush cooldown prevents repeated clicks from restarting or stacking the active ability',async()=>{
  await reset();await transform();await face('d');const p=await position();await page.mouse.click(1100,300,{button:'right'});await tick(.6);await page.mouse.click(1100,300,{button:'right'});assert.equal(await page.evaluate(()=>__demo.speedAction.phase),'idle');await tick(1.1);await page.mouse.click(1100,300,{button:'right'});assert.equal(await page.evaluate(()=>__demo.speedAction.phase),'rush');await tick(.6);const end=await position();close(end.x,p.x);close(end.y,p.y);
 });
 await check('touch users can choose XLR8 and use a brief attack from the RUTA button',async()=>{
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await mobile.newPage();await p.addInitScript(()=>{requestAnimationFrame=()=>0});await p.goto('http://127.0.0.1:8783');await p.evaluate(()=>__demo.readyPromise);await p.locator('#watchShortcut').tap();const box=await p.locator('#wheelCanvas').boundingBox();await p.touchscreen.tap(box.x+box.width*.8,box.y+box.height*.402);await p.evaluate(()=>__demo.tick(1.05));assert.equal(await p.locator('#formName').textContent(),'XLR8');await p.locator('#btnHeavy').tap();assert.equal(await p.evaluate(()=>__demo.speedAction.phase),'rush');await p.evaluate(()=>__demo.tick(.6));assert.equal(await p.evaluate(()=>__demo.player.mode),'idle');await mobile.close();
 });
 await check('the charge timer, route endpoint and one-hit damage agree at 30, 60 and 120 Hz',async()=>{
  for(const fps of [30,60,120]){
   const result=await page.evaluate(fps=>{
    __demo.reset();__demo.stats.transform({id:'xlr8'});const p=__demo.player,start={x:p.x,y:p.y};__demo.dummies.push({x:p.x+120,y:p.y,health:100,alive:true});
    __demo.beginSpeedAbility();__demo.speedAction.plan.add({x:p.x+240,y:p.y},{obstacles:[]});__demo.speedAction.plan.add({x:p.x+240,y:p.y+120},{obstacles:[]});
    for(let left=2.3;left>1e-10;){const dt=Math.min(left,1/fps);__demo.update(dt);left-=dt;}
    return {dx:p.x-start.x,dy:p.y-start.y,hp:__demo.dummies[0].health,phase:__demo.speedAction.phase};
   },fps);close(result.dx,240);close(result.dy,120);assert.equal(result.hp,66);assert.equal(result.phase,'idle');
  }
 });
 await check('retina pointer coordinates select world points correctly and resizing cancels an unfinished plan',async()=>{
  const context=await browser.newContext({viewport:{width:960,height:720},deviceScaleFactor:2}),p=await context.newPage();await p.addInitScript(()=>{requestAnimationFrame=()=>0});await p.goto('http://127.0.0.1:8783');await p.evaluate(()=>__demo.readyPromise);await p.keyboard.press('r');await p.keyboard.press('3');await p.evaluate(()=>{__demo.tick(1.05);for(let i=0;i<90;i++)__demo.render()});
  const start=await p.evaluate(()=>({x:__demo.player.x,y:__demo.player.y})),point=await p.evaluate(()=>({x:(__demo.player.x+200-__demo.cam.x)*__demo.cam.zoom,y:(__demo.player.y+100-__demo.cam.y)*__demo.cam.zoom}));
  await p.mouse.move(point.x,point.y);await p.mouse.down({button:'right'});await p.evaluate(()=>__demo.tick(.22));await p.mouse.up({button:'right'});await p.evaluate(()=>__demo.tick(.7));const end=await p.evaluate(()=>({x:__demo.player.x,y:__demo.player.y}));close(end.x,start.x+200);close(end.y,start.y+100);
  await p.evaluate(()=>__demo.tick(1.1));await p.mouse.down({button:'right'});await p.evaluate(()=>__demo.tick(.22));await p.setViewportSize({width:1000,height:740});await p.waitForFunction(()=>__demo.speedAction.phase==='idle');assert.equal(await p.locator('#speedGuide').isVisible(),false);await p.mouse.up({button:'right'});await context.close();
 });
 await check('holding and dragging the touch RUTA button draws and executes a real finger path',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await context.newPage();await p.addInitScript(()=>{requestAnimationFrame=()=>0});await p.goto('http://127.0.0.1:8783');await p.evaluate(()=>__demo.readyPromise);await p.locator('#watchShortcut').tap();const box=await p.locator('#wheelCanvas').boundingBox();await p.touchscreen.tap(box.x+box.width*.8,box.y+box.height*.402);await p.evaluate(()=>{__demo.tick(1.05);for(let i=0;i<90;i++)__demo.render()});
  const start=await p.evaluate(()=>({x:__demo.player.x,y:__demo.player.y})),button=await p.locator('#btnHeavy').boundingBox(),client=await context.newCDPSession(p);
  await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:button.x+button.width/2,y:button.y+button.height/2,id:77}]});await p.evaluate(()=>__demo.tick(.22));assert.equal(await p.evaluate(()=>__demo.speedAction.phase),'plan');
  for(const [dx,dy] of [[70,-30],[90,30]]){const point=await p.evaluate(v=>({x:(__demo.player.x+v.dx-__demo.cam.x)*__demo.cam.zoom,y:(__demo.player.y+v.dy-__demo.cam.y)*__demo.cam.zoom}),{dx,dy});await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:point.x,y:point.y,id:77}]});}
  assert.ok((await p.evaluate(()=>__demo.speedAction.plan.points.length))>=3);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.evaluate(()=>__demo.tick(.9));const end=await p.evaluate(()=>({x:__demo.player.x,y:__demo.player.y}));close(end.x,start.x+90);close(end.y,start.y+30);assert.equal(await p.evaluate(()=>__demo.speedAction.phase),'idle');await context.close();
 });
 await check('the camera keeps the rushing player visible on a narrow phone viewport',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844}}),p=await context.newPage();await p.addInitScript(()=>{requestAnimationFrame=()=>0});await p.goto('http://127.0.0.1:8783');await p.evaluate(()=>__demo.readyPromise);
  const bad=await p.evaluate(()=>{
   __demo.reset();__demo.stats.transform({id:'xlr8'});for(let i=0;i<120;i++)__demo.render();const start={x:__demo.player.x,y:__demo.player.y};__demo.beginSpeedAbility();
   for(const dx of [140,-140,140,0])__demo.speedAction.plan.add({x:start.x+dx,y:start.y},{obstacles:[]});__demo.startSpeedRush('route');const bad=[];
   for(let i=0;i<90;i++){__demo.update(1/60);__demo.render(1/60);const x=(__demo.player.x-__demo.cam.x)*__demo.cam.zoom;if(x<25||x>365)bad.push(x);}return bad;
  });assert.deepEqual(bad,[]);await context.close();
 });
 await check('two real melee hits and a powered route finish with a visible lightning kick for 28 extra damage and one energy charge',async()=>{
  await reset();await transform();await face('d');await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+80,y:p.y,health:500,alive:true});});
  for(const d of [.18,.2]){await page.mouse.click(1100,300);await tick(d+.03);}const energy=await page.evaluate(()=>__demo.stats.energy),target=await page.evaluate(()=>({x:__demo.dummies[0].x,y:__demo.dummies[0].y}));
  await moveWorld(target.x-20,target.y);await page.mouse.down({button:'right'});await tick(.22);await page.mouse.up({button:'right'});await tick(.04);
  assert.equal(await page.evaluate(()=>__demo.speedAction.phase),'finish');assert.equal(await page.evaluate(()=>__demo.dummies[0].health),420);
  await tick(.12);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),420);await tick(.04);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),392);
  assert.equal(await page.evaluate(()=>__demo.framePlayer().row),22);close(await page.evaluate(()=>__demo.stats.energy),energy-20-.42*1.5);
  await tick(.5);assert.equal(await page.evaluate(()=>__demo.speedAction.phase),'idle');assert.equal(await page.evaluate(()=>__demo.dummies[0].health),392);
 });
 await check('the combo kick faces its target and damages once at 30, 60 and 120 Hz in every direction',async()=>{
  for(const fps of [30,60,120])for(const [dir,dx,dy,index] of [['right',1,0,2],['left',-1,0,3],['up',0,-1,1],['down',0,1,0]]){
   const result=await page.evaluate(v=>{
    __demo.reset();__demo.stats.transform({id:'xlr8'});const p=__demo.player;Object.assign(p,{dir:v.dir,faceX:v.dx,faceY:v.dy});__demo.dummies.push({x:p.x+v.dx*60,y:p.y+v.dy*60,health:500,alive:true});__demo.stats.recordLightHit();__demo.stats.recordLightHit();
    __demo.beginSpeedAbility();__demo.speedAction.plan.add({x:p.x+v.dx*40,y:p.y+v.dy*40},{obstacles:[]});__demo.startSpeedRush('route');let row=null;
    for(let left=1;left>1e-10;){const dt=Math.min(left,1/v.fps);__demo.update(dt);left-=dt;if(p.mode==='speedFinish'&&p.modeTime>=.15&&p.modeTime<.22)row=__demo.framePlayer().row;}
    return {hp:__demo.dummies[0].health,energy:__demo.stats.energy,phase:__demo.speedAction.phase,row};
   },{fps,dir,dx,dy});assert.equal(result.hp,414);close(result.energy,78.5);assert.equal(result.phase,'idle');assert.equal(result.row,20+index);
  }
 });
 await check('the finisher respects solid cover and returning to Ben cancels a kick before contact',async()=>{
  const blocked=await page.evaluate(()=>{
   __demo.reset();__demo.stats.transform({id:'xlr8'});const p=__demo.player;Object.assign(p,{dir:'right',faceX:1,faceY:0});__demo.dummies.push({x:p.x+120,y:p.y,health:500,alive:true});__demo.props.push({x:p.x+70,y:p.y,r:20,block:true});__demo.stats.recordLightHit();__demo.stats.recordLightHit();__demo.beginSpeedAbility();__demo.speedAction.plan.add({x:p.x+180,y:p.y},{obstacles:__demo.props});__demo.startSpeedRush('route');__demo.tick(1);return __demo.dummies[0].health;
  });assert.equal(blocked,500);
  await page.evaluate(()=>{
   __demo.reset();__demo.stats.transform({id:'xlr8'});const p=__demo.player;Object.assign(p,{dir:'right',faceX:1,faceY:0});__demo.dummies.push({x:p.x+60,y:p.y,health:500,alive:true});__demo.stats.recordLightHit();__demo.stats.recordLightHit();__demo.beginSpeedAbility();__demo.speedAction.plan.add({x:p.x+40,y:p.y},{obstacles:[]});__demo.startSpeedRush('route');__demo.tick(.04);
  });assert.equal(await page.evaluate(()=>__demo.speedAction.phase),'finish');await page.keyboard.press('t');await tick(.7);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),442);assert.equal(await page.evaluate(()=>__demo.stats.form),null);
 });
 await check('the embedded XLR8 controller matches its maintained source',async()=>{const root=path.resolve(__dirname,'..');assert.ok(fs.readFileSync(path.join(root,'index.html'),'utf8').includes('// XLR8_GAME_START\n'+fs.readFileSync(path.join(root,'systems/xlr8-game.js'),'utf8')+'// XLR8_GAME_END'));});
 assert.deepEqual(errors,[]);console.log(`${count} XLR8 checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.close()});
