const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {instrument}=require('./demo-fixture.cjs'),root=path.resolve(__dirname,'..');
const server=http.createServer((q,r)=>{r.setHeader('Content-Type','text/html');r.end(instrument(fs.readFileSync(path.join(root,'index.html'),'utf8')))});
let browser,count=0;async function check(name,fn){await fn();count++;console.log('PASS',name)}
const close=(a,b)=>assert.ok(Math.abs(a-b)<.04,`${a} != ${b}`);
(async()=>{
 await new Promise(r=>server.listen(8786,'127.0.0.1',r));browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{requestAnimationFrame=()=>0});await page.goto('http://127.0.0.1:8786');await page.evaluate(()=>__demo.readyPromise);
 const tick=s=>page.evaluate(s=>__demo.tick(s),s),energy=()=>page.evaluate(()=>__demo.stats.energy),target=()=>page.evaluate(()=>({...__demo.dummies[0]}));
 async function prepare(key='d',health=1000){
  await page.evaluate(()=>__demo.reset());await page.keyboard.press('r');await page.keyboard.press('6');await tick(1.05);await page.keyboard.down(key);await tick(.01);await page.keyboard.up(key);await tick(.1);
  await page.evaluate(health=>{const p=__demo.player;__demo.dummies.push({x:p.x+p.faceX*85,y:p.y+p.faceY*85,health,alive:true});},health);
 }
 async function prime(){for(const dt of [.43,.47]){await page.mouse.click(1100,300);await tick(dt);}assert.equal(await page.evaluate(()=>__demo.stats.specialReady),true);}
 for(const [key,dir,index] of [['d','right',2],['a','left',3],['w','up',1],['s','down',0]])await check('two real claws then strong pull one enemy into the abdomen and expel it facing '+dir,async()=>{
  await prepare(key);await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+p.faceX*145,y:p.y+p.faceY*145,health:1000,alive:true},{x:p.x-p.faceX*85,y:p.y-p.faceY*85,health:1000,alive:true});});await prime();const origin=await target(),before=await energy();
  await page.mouse.click(1100,300,{button:'right'});assert.equal(await page.evaluate(()=>__demo.player.mode),'ghostCombo');await tick(.3);assert.equal(await page.evaluate(()=>!!__demo.ghostAction.grab),false);close(await energy(),before-.45);
  await tick(.5);const g=await page.evaluate(()=>({target:__demo.ghostAction.grab?.target===__demo.dummies[0],pull:__demo.ghostAction.grab?.pull,scale:__demo.ghostAction.grab?.scale,pose:{row:__demo.framePlayer().row,frame:__demo.framePlayer().frame},distance:Math.hypot(__demo.dummies[0].x-__demo.player.x,__demo.dummies[0].y-__demo.player.y),immune:__demo.stats.invulnerable}));
  assert.equal(g.target,true);assert.equal(g.pull,1);close(g.scale,.78);assert.equal(g.pose.row,28+index);assert.equal(g.pose.frame,5);assert.ok(g.distance<25);assert.equal(g.immune,false);assert.equal((await target()).health,968);close(await energy(),before-20-1.2);
  await tick(.25);assert.equal((await target()).health,896);assert.equal(await page.evaluate(()=>__demo.framePlayer().frame),6);await tick(.4);close((await target()).x,origin.x);close((await target()).y,origin.y);assert.equal(await page.evaluate(()=>__demo.ghostAction.grab),null);assert.equal(await page.evaluate(()=>__demo.player.mode),'idle');assert.deepEqual(await page.evaluate(()=>__demo.dummies.slice(1).map(d=>d.health)),[1000,1000]);close(await energy(),before-20-1.45*1.5);
 });
 await check('a single claw or a missed second claw still uses the normal tentacle animation',async()=>{
  await prepare();await page.mouse.click(1100,300);await tick(.43);await page.mouse.click(1100,300,{button:'right'});assert.equal(await page.evaluate(()=>__demo.player.mode),'ghostReveal');await tick(.9);assert.equal((await target()).health,942);assert.equal(await page.evaluate(()=>__demo.ghostAction.grab),null);
  await prepare();await page.mouse.click(1100,300);await tick(.43);await page.evaluate(()=>{__demo.dummies[0].x+=250});await page.mouse.click(1100,300);await tick(.47);await page.mouse.click(1100,300,{button:'right'});assert.equal(await page.evaluate(()=>__demo.player.mode),'ghostReveal');await tick(.9);assert.equal(await page.evaluate(()=>__demo.ghostAction.grab),null);
 });
 await check('a quick strong input during the second claw recovery queues the distinct combo',async()=>{
  await prepare();await page.mouse.click(1100,300);await tick(.43);await page.mouse.click(1100,300);await tick(.24);await page.mouse.click(1100,300,{button:'right'});assert.equal(await page.evaluate(()=>__demo.player.bufferedAttack?.type),'heavy');assert.equal(await page.evaluate(()=>__demo.ghostAction.pendingPress?.released),true);await tick(.25);assert.equal(await page.evaluate(()=>__demo.player.mode),'ghostCombo');await tick(1.4);assert.equal((await target()).health,896);
 });
 await check('a held strong input queued during a claw can phase before performing the same grab',async()=>{
  await prepare();await page.mouse.click(1100,300);await tick(.43);await page.mouse.click(1100,300);await tick(.24);await page.mouse.down({button:'right'});await tick(.45);assert.equal(await page.evaluate(()=>__demo.ghostAction.phase),'hold');assert.equal(await page.evaluate(()=>__demo.stats.invulnerable),true);await page.mouse.up({button:'right'});assert.equal(await page.evaluate(()=>__demo.ghostAction.phase),'combo');await tick(1.45);assert.equal((await target()).health,896);assert.equal(await page.evaluate(()=>__demo.stats.invulnerable),false);
 });
 await check('T, watch, Space, blur and resize release a captured target without late damage or a lingering collider',async()=>{
  for(const action of ['t','r','Space','blur','resize']){
   await prepare();await prime();const origin=await target(),before=await energy();await page.mouse.click(1100,300,{button:'right'});await tick(.8);assert.equal(await page.evaluate(()=>__demo.ghostAction.grab?.pull),1);
   if(['blur','resize'].includes(action))await page.evaluate(type=>window.dispatchEvent(new Event(type)),action);else await page.keyboard.press(action);
   assert.equal(await page.evaluate(()=>__demo.ghostAction.grab),null);close((await target()).x,origin.x);close((await target()).y,origin.y);if(action==='r')await page.keyboard.press('Escape');await tick(1);assert.equal((await target()).health,968);assert.equal(await page.evaluate(()=>__demo.ghostAction.phase),'idle');assert.equal(await page.evaluate(()=>__demo.stats.invulnerable),false);assert.ok((await energy())<before-20);
  }
 });
 await check('a knockout is awarded once on expulsion, then the defeated target returns to its own ground position',async()=>{
  await prepare('s',100);await prime();const origin=await target();await page.mouse.click(1100,300,{button:'right'});await tick(.85);assert.equal((await target()).alive,true);assert.equal((await target()).health,68);await tick(.2);assert.equal((await target()).alive,false);assert.equal(await page.evaluate(()=>__demo.stats.totalXP),40);assert.equal(await page.evaluate(()=>__demo.state.kills),1);await tick(.5);close((await target()).x,origin.x);close((await target()).y,origin.y);assert.equal(await page.evaluate(()=>__demo.ghostAction.grab),null);await tick(.8);assert.equal(await page.evaluate(()=>__demo.stats.totalXP),40);
 });
 await check('a missed combo plays its full animation and spends only one special charge',async()=>{
  await prepare();await prime();await page.evaluate(()=>{__demo.dummies[0].x+=350});const before=await energy();await page.mouse.click(1100,300,{button:'right'});await tick(.8);assert.equal(await page.evaluate(()=>__demo.player.mode),'ghostCombo');assert.equal(await page.evaluate(()=>__demo.ghostAction.grab),null);await tick(.65);assert.equal((await target()).health,968);assert.equal(await page.evaluate(()=>__demo.player.mode),'idle');close(await energy(),before-20-1.45*1.5);
 });
 await check('solid cover prevents a tentacle capture from pulling or damaging a target through a wall',async()=>{
  await prepare();await prime();const origin=await target();await page.evaluate(()=>{const p=__demo.player;__demo.props.push({x:p.x+40,y:p.y,r:16,block:true});});await page.mouse.click(1100,300,{button:'right'});await tick(.8);assert.equal(await page.evaluate(()=>__demo.ghostAction.grab),null);await tick(.65);assert.equal((await target()).health,968);close((await target()).x,origin.x);close((await target()).y,origin.y);
 });
 await check('a watch that drains below the special cost falls back to the normal attack without a free grab',async()=>{
  await prepare();await prime();await page.evaluate(()=>{__demo.stats.energy=20.2});await page.mouse.click(1100,300,{button:'right'});await tick(1);assert.equal(await page.evaluate(()=>__demo.ghostAction.grab),null);assert.equal((await target()).health,924);close(await energy(),18.7);assert.equal(await page.evaluate(()=>__demo.player.mode),'idle');
 });
 await check('exhaustion and an external target defeat during capture cannot leave an invisible or trapped enemy',async()=>{
  await prepare();await prime();const origin=await target();await page.mouse.click(1100,300,{button:'right'});await tick(.8);await page.evaluate(()=>{__demo.stats.energy=.1});await tick(.1);assert.equal(await page.evaluate(()=>__demo.stats.form),null);assert.equal(await page.evaluate(()=>__demo.ghostAction.grab),null);close((await target()).x,origin.x);close((await target()).y,origin.y);assert.equal((await target()).health,968);
  await prepare();await prime();const other=await target();await page.mouse.click(1100,300,{button:'right'});await tick(.8);await page.evaluate(()=>{__demo.dummies[0].alive=false;__demo.dummies[0].health=0;__demo.dummies[0].respawn=4.2});await tick(.1);assert.equal(await page.evaluate(()=>__demo.ghostAction.grab),null);close((await target()).x,other.x);close((await target()).y,other.y);await tick(.6);assert.equal(await page.evaluate(()=>__demo.stats.totalXP),0);
 });
 await check('grab position, expulsion damage and restoration agree at 30, 60 and 120 updates per second',async()=>{
  for(const fps of [30,60,120]){
   await prepare();await prime();const origin=await target(),before=await energy();await page.mouse.click(1100,300,{button:'right'});await page.evaluate(fps=>{for(let i=0;i<fps*.8;i++)__demo.update(1/fps)},fps);assert.equal(await page.evaluate(()=>__demo.ghostAction.grab?.pull),1);assert.equal((await target()).health,968);await page.evaluate(fps=>{for(let i=0;i<fps;i++)__demo.update(1/fps)},fps);assert.equal((await target()).health,896);close((await target()).x,origin.x);close((await target()).y,origin.y);assert.equal(await page.evaluate(()=>__demo.ghostAction.grab),null);close(await energy(),before-20-1.8*1.5);
  }
 });
 await check('touch controls perform two real claws and a quick FASE tap to capture and release',async()=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await context.newPage();await p.addInitScript(()=>{requestAnimationFrame=()=>0});await p.goto('http://127.0.0.1:8786');await p.evaluate(()=>__demo.readyPromise);await p.locator('#watchShortcut').tap();const box=await p.locator('#wheelCanvas').boundingBox();await p.touchscreen.tap(box.x+box.width*.589,box.y+box.height*.802);await p.evaluate(()=>{__demo.tick(1.05);const p=__demo.player;__demo.dummies.splice(0,__demo.dummies.length,{x:p.x,y:p.y+85,health:1000,alive:true});});
  for(const dt of [.43,.47]){await p.locator('#btnLight').tap();await p.evaluate(dt=>__demo.tick(dt),dt);}assert.equal(await p.evaluate(()=>__demo.stats.specialReady),true);await p.locator('#btnHeavy').tap();assert.equal(await p.evaluate(()=>__demo.player.mode),'ghostCombo');await p.evaluate(()=>__demo.tick(.8));assert.equal(await p.evaluate(()=>__demo.ghostAction.grab?.pull),1);await p.evaluate(()=>__demo.tick(.65));assert.equal(await p.evaluate(()=>__demo.dummies[0].health),896);assert.equal(await p.evaluate(()=>__demo.ghostAction.grab),null);await context.close();
 });
 assert.deepEqual(errors,[]);console.log(`${count} Ghostfreak combo checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1}).finally(async()=>{if(browser)await browser.close();server.close()});
