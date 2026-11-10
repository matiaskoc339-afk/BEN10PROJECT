const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {instrument}=require('./demo-fixture.cjs');
const root=path.resolve(__dirname,'..'),server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(instrument(fs.readFileSync(path.join(root,'index.html'),'utf8')))});
let browser,count=0;async function check(name,fn){await fn();count++;console.log('PASS',name)}
const close=(a,b)=>assert.ok(Math.abs(a-b)<.04,`${a} != ${b}`);
(async()=>{
 await new Promise(r=>server.listen(8785,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0});await page.goto('http://127.0.0.1:8785');await page.evaluate(()=>__demo.readyPromise);
 const tick=s=>page.evaluate(s=>__demo.tick(s),s),reset=()=>page.evaluate(()=>__demo.reset()),position=()=>page.evaluate(()=>({x:__demo.player.x,y:__demo.player.y}));
 async function transform(){await page.keyboard.press('r');await page.keyboard.press('6');await tick(1.05)}
 async function face(key){await page.keyboard.down(key);await tick(.01);await page.keyboard.up(key);await tick(.1)}
 async function target(distance=85){await page.evaluate(distance=>{const p=__demo.player;__demo.dummies.push({x:p.x+p.faceX*distance,y:p.y+p.faceY*distance,health:1000,alive:true});},distance)}
 await check('R then 6 activates Fantasmático, updates the HUD and gives a held FASE touch control',async()=>{
  await reset();await page.keyboard.press('r');await page.keyboard.press('6');await tick(.5);assert.equal(await page.evaluate(()=>__demo.stats.form),null);await tick(.55);
  assert.equal(await page.evaluate(()=>__demo.stats.form.id),'ghostfreak');assert.equal(await page.locator('#formName').textContent(),'FANTASMÁTICO');assert.equal(await page.locator('#btnHeavy').textContent(),'FASE');assert.equal(await page.evaluate(()=>__demo.player.selectedAlien),5);
 });
 await check('all 256 HD poses preserve full shroud, claws and tentacles with transparent margins',async()=>{
  const r=await page.evaluate(()=>{const frames=__demo.ghostfreakAtlas.rows.flat(),bad=[];for(const f of frames){const p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data;let mass=0,edge=0,top=f.h;for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++)if(p[(y*f.w+x)*4+3]>100){mass++;top=Math.min(top,y);if(x<2||y<2||x>=f.w-2||y>=f.h-2)edge++;}if(mass<800||edge||Math.abs(top-(f.anchorY-160))>2)bad.push({row:f.row,col:f.col,mass,edge,top});}return {count:frames.length,bad,native:frames[0].bodyHeight};});
  assert.equal(r.count,256);assert.equal(r.native,160);assert.deepEqual(r.bad,[]);
 });
 await check('idle has changing floating poses and a gently rising body at a moderate scale',async()=>{
  await reset();await transform();const a=await page.evaluate(()=>({frame:__demo.framePlayer().frame,lift:__demo.framePlayer().lift,metrics:__demo.actorMetrics()}));await tick(.3);const b=await page.evaluate(()=>__demo.framePlayer());
  assert.notEqual(a.frame,b.frame);assert.notEqual(a.lift,b.lift);assert.ok(b.lift>6);assert.equal(b.row,0);assert.equal(a.metrics.height,100);assert.equal(a.metrics.zoom,1.125);assert.equal(a.metrics.speed,260);
 });
 for(const [key,dir,index] of [['d','right',2],['a','left',3],['w','up',1],['s','down',0]]){
  await check('floating movement and a return to animated idle face '+dir,async()=>{
   await reset();await transform();const p=await position();await page.keyboard.down(key);await tick(.3);const pose=await page.evaluate(()=>__demo.framePlayer());assert.equal(pose.row,4+index);assert.equal(pose.direction,dir);assert.ok(pose.lift>6);assert.ok(Math.hypot((await position()).x-p.x,(await position()).y-p.y)>70);const f=pose.frame;await tick(.08);assert.notEqual(await page.evaluate(()=>__demo.framePlayer().frame),f);await page.keyboard.up(key);await tick(.03);assert.equal(await page.evaluate(()=>__demo.framePlayer().row),index);
  });
  await check('left claw, right claw and both claws have separate poses and damage facing '+dir,async()=>{
   await reset();await transform();await face(key);await target();await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x-p.faceX*85,y:p.y-p.faceY*85,health:1000,alive:true});});
   for(const [n,duration,row,health] of [[1,.34,12,986],[2,.38,16,968],[3,.48,20,942]]){
    await page.mouse.click(1100,300);await tick(duration*.55);assert.equal(await page.evaluate(()=>__demo.framePlayer().row),row+index);await tick(duration*.45+.09);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),health);assert.equal(await page.evaluate(()=>__demo.dummies[1].health),1000);assert.equal(await page.evaluate(()=>__demo.player.mode),'idle');
   }
  });
 }
 await check('a quick right click skips intangibility and opens the shroud before one tentacle impact',async()=>{
  await reset();await transform();await face('d');await target(100);await page.mouse.click(1100,300,{button:'right'});
  assert.equal(await page.evaluate(()=>__demo.ghostAction.phase),'reveal');assert.equal(await page.evaluate(()=>__demo.stats.invulnerable),false);assert.equal(await page.locator('#ghostGuide').isVisible(),false);await tick(.2);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),1000);assert.equal(await page.evaluate(()=>__demo.framePlayer().row),26);await tick(.22);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),956);assert.equal(await page.evaluate(()=>__demo.framePlayer().frame),4);await tick(.7);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),956);assert.equal(await page.evaluate(()=>__demo.player.mode),'idle');
 });
 await check('holding right click fades to a moving intangible form and release restores vulnerability',async()=>{
  await reset();await transform();await page.mouse.down({button:'right'});await tick(.1);assert.equal(await page.evaluate(()=>__demo.stats.invulnerable),false);await tick(.12);assert.equal(await page.evaluate(()=>__demo.stats.invulnerable),true);assert.ok((await page.evaluate(()=>__demo.framePlayer().alpha))<.5);assert.equal(await page.evaluate(()=>__demo.stats.damage(50)),0);assert.equal(await page.evaluate(()=>__demo.stats.health),100);assert.equal(await page.locator('#ghostGuide').isVisible(),true);
  const p=await position();await page.keyboard.down('d');await tick(.4);await page.keyboard.up('d');close((await position()).x-p.x,260*1.15*.4);assert.equal(await page.evaluate(()=>__demo.dummies.length),0);await page.mouse.up({button:'right'});assert.equal(await page.evaluate(()=>__demo.stats.invulnerable),false);assert.equal(await page.evaluate(()=>__demo.stats.damage(7)),7);assert.equal(await page.evaluate(()=>__demo.framePlayer().alpha),1);assert.equal(await page.locator('#ghostGuide').isVisible(),false);
 });
 await check('tap and short, medium and maximum holds cause identical tentacle damage',async()=>{
  for(const hold of [0,.3,.9,1.8]){
   await reset();await transform();await face('d');await target(100);await page.mouse.down({button:'right'});if(hold)await tick(hold);await page.mouse.up({button:'right'});await tick(.9);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),956,`hold=${hold}`);
  }
 });
 await check('maximum hold automatically materialises, attacks once and cannot stay invulnerable',async()=>{
  await reset();await transform();await face('d');await target(100);await page.mouse.down({button:'right'});await tick(1.7);assert.equal(await page.evaluate(()=>__demo.ghostIntangible()),true);await tick(.12);assert.equal(await page.evaluate(()=>__demo.ghostAction.phase),'reveal');assert.equal(await page.evaluate(()=>__demo.stats.invulnerable),false);await tick(1);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),956);assert.equal(await page.evaluate(()=>__demo.ghostAction.phase),'idle');await tick(2);await page.mouse.up({button:'right'});assert.equal(await page.evaluate(()=>__demo.dummies[0].health),956);
 });
 await check('phasing crosses solid props and targets without damaging them, then materialises on nearby free ground',async()=>{
  await reset();await transform();await face('d');const start=await position();await page.evaluate(()=>{const p=__demo.player;__demo.props.push({x:p.x+110,y:p.y,r:38,block:true});__demo.dummies.push({x:p.x+110,y:p.y+100,health:1000,alive:true});});await page.mouse.down({button:'right'});await tick(.2);await page.keyboard.down('d');await tick(.36);await page.keyboard.up('d');assert.ok((await position()).x>start.x+100);assert.equal(await page.evaluate(()=>__demo.collide(__demo.player.x,__demo.player.y)),true);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),1000);const inside=await position();await page.mouse.up({button:'right'});assert.equal(await page.evaluate(()=>__demo.collide(__demo.player.x,__demo.player.y)),false);assert.ok(Math.hypot((await position()).x-inside.x,(await position()).y-inside.y)<80);
 });
 await check('the ordinary floating form respects obstacles and tentacles do not hit through walls',async()=>{
  await reset();await transform();await face('d');const start=await position();await page.evaluate(()=>{const p=__demo.player;__demo.props.push({x:p.x+65,y:p.y,r:24,block:true});__demo.dummies.push({x:p.x+120,y:p.y,health:1000,alive:true});});await page.keyboard.down('d');await tick(.4);await page.keyboard.up('d');assert.ok((await position()).x<start.x+27);await page.mouse.click(1100,300,{button:'right'});await tick(1);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),1000);
 });
 await check('two connected claws reserve the combo through a long phase and spend energy once at the tentacle contact',async()=>{
  await reset();await transform();await face('d');await target();for(const d of [.34,.38]){await page.mouse.click(1100,300);await tick(d+.09);}assert.equal(await page.evaluate(()=>__demo.stats.specialReady),true);const energy=await page.evaluate(()=>__demo.stats.energy);await page.mouse.down({button:'right'});await tick(1.5);close(await page.evaluate(()=>__demo.stats.energy),energy-2.25);await page.mouse.up({button:'right'});await tick(.3);close(await page.evaluate(()=>__demo.stats.energy),energy-2.7);await tick(.13);close(await page.evaluate(()=>__demo.stats.energy),energy-20-3*.965);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),968);assert.equal(await page.evaluate(()=>__demo.player.mode),'ghostCombo');await tick(.62);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),896);await tick(.45);assert.equal(await page.evaluate(()=>__demo.ghostAction.phase),'idle');
 });
 await check('T, the watch, Space, blur and resize end intangibility without a delayed attack or special charge',async()=>{
  for(const action of ['t','r','Space','blur','resize']){
   await reset();await transform();await face('d');await target();await page.evaluate(()=>{__demo.stats.recordLightHit();__demo.stats.recordLightHit();});const energy=await page.evaluate(()=>__demo.stats.energy);await page.mouse.down({button:'right'});await tick(.4);
   if(['blur','resize'].includes(action))await page.evaluate(type=>window.dispatchEvent(new Event(type)),action);else await page.keyboard.press(action);await page.mouse.up({button:'right'});assert.equal(await page.evaluate(()=>__demo.stats.invulnerable),false);assert.equal(await page.locator('#ghostGuide').isVisible(),false);if(action==='r')await page.keyboard.press('Escape');await tick(1);assert.equal(await page.evaluate(()=>__demo.ghostAction.phase),'idle');assert.equal(await page.evaluate(()=>__demo.dummies[0].health),1000);assert.ok((await page.evaluate(()=>__demo.stats.energy))>energy-3);
  }
 });
 await check('cancelling a tentacle reveal before contact spends no reserved energy',async()=>{
  await reset();await transform();await face('d');await target();await page.evaluate(()=>{__demo.stats.recordLightHit();__demo.stats.recordLightHit();});const energy=await page.evaluate(()=>__demo.stats.energy);await page.mouse.click(1100,300,{button:'right'});await tick(.2);await page.keyboard.press('Space');await tick(.8);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),1000);close(await page.evaluate(()=>__demo.stats.energy),energy-1.5);
 });
 await check('exhaustion or reverting inside a prop safely returns Ben and restores damage',async()=>{
  for(const exhaust of [false,true]){
   await reset();await transform();await face('d');await page.evaluate(()=>{const p=__demo.player;__demo.props.push({x:p.x+110,y:p.y,r:38,block:true});});await page.mouse.down({button:'right'});await tick(.2);await page.keyboard.down('d');await tick(.36);await page.keyboard.up('d');if(exhaust){await page.evaluate(()=>{__demo.stats.energy=.1});await tick(.1);}else await page.keyboard.press('t');await page.mouse.up({button:'right'});assert.equal(await page.evaluate(()=>__demo.stats.form),null);assert.equal(await page.evaluate(()=>__demo.collide(__demo.player.x,__demo.player.y)),false);assert.equal(await page.evaluate(()=>__demo.stats.invulnerable),false);assert.equal(await page.evaluate(()=>__demo.stats.damage(5)),5);await tick(.8);assert.equal(await page.evaluate(()=>__demo.ghostAction.phase),'idle');
  }
 });
 await check('tentacle opening has a dark hollow and visibly spreading striped appendages in every view',async()=>{
  const values=await page.evaluate(()=>Array.from({length:4},(_,d)=>[0,4].map(col=>{const f=__demo.ghostfreakAtlas.rows[24+d][col],p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data;let darkBlue=0,opaque=0;for(let i=0;i<p.length;i+=4)if(p[i+3]>120){opaque++;if(p[i]<55&&p[i+1]<75&&p[i+2]>p[i+1]*1.1&&p[i+2]>p[i]*1.3)darkBlue++;}return {darkBlue,opaque};})));
  for(const [closed,opened] of values){assert.ok(opened.darkBlue>closed.darkBlue+150);assert.ok(opened.opaque>closed.opaque*1.15);}
 });
 await check('rapidly buffered light inputs still play all three complete claw attacks',async()=>{
  await reset();await transform();await face('d');await target();await page.mouse.click(1100,300);
  for(const n of [1,2]){await tick(n===1?.23:.26);await page.mouse.click(1100,300);await tick(.17);}await tick(.6);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),942);assert.equal(await page.evaluate(()=>__demo.player.mode),'idle');
 });
 await check('the existing five forms remain available, three classic slots stay locked, and changing form clears intangibility',async()=>{
  await reset();for(const [key,id] of [['1','four-arms'],['2','heatblast'],['3','xlr8'],['4','diamondhead'],['5','cannonbolt'],['6','ghostfreak']]){await page.keyboard.press('r');await page.keyboard.press(key);await tick(1.05);assert.equal(await page.evaluate(()=>__demo.stats.form.id),id);}for(const key of ['u','i','o']){await page.keyboard.press('r');await page.keyboard.press(key);assert.equal(await page.evaluate(()=>__demo.state.wheel),true);await page.keyboard.press('Escape');}await page.mouse.down({button:'right'});await tick(.4);await page.keyboard.press('r');await page.keyboard.press('5');await tick(1.05);await page.mouse.up({button:'right'});assert.equal(await page.evaluate(()=>__demo.stats.form.id),'cannonbolt');assert.equal(await page.evaluate(()=>__demo.stats.invulnerable),false);assert.equal(await page.evaluate(()=>__demo.ghostAction.phase),'idle');
 });
 await check('touch users select Ghostfreak, hold and release FASE, then return through the watch centre',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await context.newPage();await p.addInitScript(()=>{requestAnimationFrame=()=>0});await p.goto('http://127.0.0.1:8785');await p.evaluate(()=>__demo.readyPromise);await p.locator('#watchShortcut').tap();const box=await p.locator('#wheelCanvas').boundingBox();await p.touchscreen.tap(box.x+box.width*0.708884,box.y+box.height*0.735781);await p.evaluate(()=>__demo.tick(1.05));assert.equal(await p.locator('#formName').textContent(),'FANTASMÁTICO');const b=await p.locator('#btnHeavy').boundingBox(),client=await context.newCDPSession(p);await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:b.x+b.width/2,y:b.y+b.height/2,id:61}]});await p.evaluate(()=>__demo.tick(.6));assert.equal(await p.evaluate(()=>__demo.stats.invulnerable),true);await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});assert.equal(await p.evaluate(()=>__demo.ghostAction.phase),'reveal');await p.evaluate(()=>__demo.tick(1));assert.equal(await p.evaluate(()=>__demo.stats.invulnerable),false);await p.locator('#watchShortcut').tap();await p.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);assert.equal(await p.locator('#formName').textContent(),'BEN');await context.close();
 });
 await check('phase speed, fixed tentacle damage and recovery agree at 30, 60 and 120 updates per second',async()=>{
  for(const fps of [30,60,120]){
   await reset();await transform();await face('d');await page.mouse.down({button:'right'});await tick(.2);const p=await position();await page.keyboard.down('d');await page.evaluate(fps=>{for(let i=0;i<fps*.4;i++)__demo.update(1/fps)},fps);await page.keyboard.up('d');close((await position()).x-p.x,260*1.15*.4);await target(100);await page.mouse.up({button:'right'});await page.evaluate(fps=>{for(let i=0;i<fps;i++)__demo.update(1/fps)},fps);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),956);assert.equal(await page.evaluate(()=>__demo.stats.invulnerable),false);assert.equal(await page.evaluate(()=>__demo.player.mode),'idle');
  }
 });
 await check('an intangible ghost still respects all four level edges',async()=>{
  for(const [key,x,y] of [['a',126,900],['d',2289,900],['w',1200,101],['s',1200,1689]]){
   await reset();await transform();await page.evaluate(p=>Object.assign(__demo.player,p),{x,y});await page.mouse.down({button:'right'});await tick(.2);await page.keyboard.down(key);await tick(.4);await page.keyboard.up(key);close((await position()).x,x);close((await position()).y,y);await page.mouse.up({button:'right'});await tick(.9);
  }
 });
 await check('the standalone embeds exactly the maintained ghost ability and controller',async()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert.ok(html.includes('// GHOSTFREAK_GAME_START\n'+fs.readFileSync(path.join(root,'systems/ghostfreak-game.js'),'utf8')+'// GHOSTFREAK_GAME_END'));assert.ok(html.includes(fs.readFileSync(path.join(root,'systems/ghostfreak-ability.js'),'utf8')));
 });
 assert.deepEqual(errors,[]);console.log(`${count} Ghostfreak checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.close()});
