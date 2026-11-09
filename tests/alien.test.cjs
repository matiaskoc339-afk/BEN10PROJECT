const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const { instrument } = require('./demo-fixture.cjs');
const html = instrument(fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8'));
const server = http.createServer((req,res)=>res.end(html));
let browser,checks=0;
async function check(name,fn){await fn();checks++;console.log('PASS',name);}
(async()=>{
  await new Promise(r=>server.listen(8778,'127.0.0.1',r));
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;});
  await page.goto('http://127.0.0.1:8778');await page.evaluate(()=>__demo.readyPromise);
  const tick=seconds=>page.evaluate(seconds=>__demo.tick(seconds),seconds);
  const reset=()=>page.evaluate(()=>__demo.reset());
  const transform=async()=>{await page.keyboard.press('r');await page.keyboard.press('1');await tick(1.05);};
  await check('176 Four Arms poses have transparent margins and share a stable foot registration',async()=>{
    const result=await page.evaluate(()=>{
      const frames=__demo.fourArmsAtlas.rows.flat(),bad=[];
      for(const f of frames){
        const p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data;let opaque=0,bottom=0,edge=0;
        for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++)if(p[(y*f.w+x)*4+3]>100){opaque++;bottom=Math.max(bottom,y);if(x<2||y<2||x>=f.w-2||y>=f.h-2)edge++;}
        if(opaque<500||edge||Math.abs(bottom+1-f.anchorY)>2)bad.push([f.row,f.col,opaque,edge,bottom,f.anchorY]);
      }
      return {count:frames.length,bad};
    });assert.equal(result.count,176);assert.deepEqual(result.bad,[]);
  });
  await check('real keyboard selection finishes the Ben activation before changing form and HUD',async()=>{
    await reset();await page.keyboard.press('r');await page.keyboard.press('1');await tick(.45);
    assert.equal(await page.evaluate(()=>__demo.stats.form),null);
    assert.equal(await page.evaluate(()=>__demo.player.mode),'omnitrix');
    await tick(.61);
    assert.equal(await page.evaluate(()=>__demo.stats.form.id),'four-arms');
    assert.equal(await page.locator('#formName').textContent(),'CUATRO BRAZOS');
    assert.equal(await page.evaluate(()=>__demo.framePlayer().alien),true);
  });
  await check('Ben is child sized and Four Arms is over twice his height, with slower movement',async()=>{
    await reset();const human=await page.evaluate(()=>({...__demo.actorMetrics(),sourceHeight:__demo.mainAtlas.rows[0][0].bodyHeight}));
    assert.equal(human.scale,1.25);
    await transform();const alien=await page.evaluate(()=>__demo.actorMetrics());
    assert.ok(alien.height>human.sourceHeight*human.scale*2);
    assert.ok(alien.speed<human.speed);
    const x=await page.evaluate(()=>__demo.player.x);await page.keyboard.down('d');await tick(1);await page.keyboard.up('d');
    assert.ok(Math.abs((await page.evaluate(()=>__demo.player.x))-x-190)<.01);
  });
  for(const [key,dir,guard,walk] of [['s','down',0,4],['w','up',1,5],['d','right',2,6],['a','left',3,7]]){
    await check('Four Arms walks, guards and hits only toward '+dir,async()=>{
      await reset();await transform();await page.keyboard.down(key);await tick(.12);
      assert.equal(await page.evaluate(()=>__demo.framePlayer().row),walk);
      await page.keyboard.up(key);
      assert.equal(await page.evaluate(()=>__demo.framePlayer().row),guard);
      await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push(
        {x:p.x+p.faceX*100,y:p.y+p.faceY*100,health:100,alive:true},
        {x:p.x-p.faceX*100,y:p.y-p.faceY*100,health:100,alive:true});});
      await page.mouse.click(1000,300);await tick(.14);
      assert.deepEqual(await page.evaluate(()=>__demo.dummies.map(d=>d.health)),[100,100]);
      await tick(.08);
      assert.deepEqual(await page.evaluate(()=>__demo.dummies.map(d=>d.health)),[74,100]);
      assert.equal(await page.evaluate(()=>__demo.framePlayer().direction),dir);
      await tick(.3);assert.equal(await page.evaluate(()=>__demo.framePlayer().idle),true);
    });
  }
  await check('idle animates, alternating punches use different drawings and attacks end in guard',async()=>{
    await reset();await transform();
    const first=await page.evaluate(()=>__demo.framePlayer().frame);await tick(.3);
    assert.notEqual(await page.evaluate(()=>__demo.framePlayer().frame),first);
    await page.keyboard.down('d');await tick(.01);await page.keyboard.up('d');
    const poses=[];
    for(let i=0;i<3;i++){await page.mouse.click(900,300);await tick(.2);poses.push(await page.evaluate(()=>{const p=__demo.framePlayer();return [p.row,p.frame];}));await tick(.22);}
    assert.notDeepEqual(poses[0],poses[1]);assert.notDeepEqual(poses[1],poses[2]);
    assert.equal(await page.evaluate(()=>__demo.framePlayer().idle),true);
  });
  await check('two connected punches unlock one radial seismic special, spending exactly 20 energy',async()=>{
    await reset();await transform();await page.evaluate(()=>{const p=__demo.player;p.dir='right';p.faceX=1;p.faceY=0;__demo.dummies.push({x:p.x+105,y:p.y,health:500,alive:true},{x:p.x-150,y:p.y,health:100,alive:true});});
    for(let i=0;i<2;i++){await page.mouse.click(900,300);await tick(.43);}
    assert.equal(await page.evaluate(()=>__demo.stats.specialReady),true);
    const before=await page.evaluate(()=>__demo.stats.energy);
    await page.mouse.click(900,300,{button:'right'});await tick(.5);
    assert.equal(await page.evaluate(()=>__demo.framePlayer().row),20);
    await tick(.22);assert.equal(await page.evaluate(()=>__demo.framePlayer().row),20);
    await tick(.28);
    const result=await page.evaluate(()=>({energy:__demo.stats.energy,hp:__demo.dummies.map(d=>d.health),ready:__demo.stats.specialReady}));
    assert.ok(Math.abs(result.energy-(before-20-1.5))<.001);
    assert.deepEqual(result.hp,[354,10]);assert.equal(result.ready,false);
  });
  await check('Four Arms dash moves forward and can cancel a special before spending its charge',async()=>{
    await reset();await transform();await page.evaluate(()=>{__demo.stats.recordLightHit();__demo.stats.recordLightHit();__demo.player.dir='right';__demo.player.faceX=1;__demo.player.faceY=0;});
    const before=await page.evaluate(()=>({x:__demo.player.x,energy:__demo.stats.energy}));
    await page.mouse.click(900,300,{button:'right'});await page.keyboard.press('Space');await tick(.46);
    const after=await page.evaluate(()=>({x:__demo.player.x,energy:__demo.stats.energy}));
    assert.ok(Math.abs(after.x-before.x-170.2)<.1);
    assert.ok(Math.abs(after.energy-(before.energy-.46*1.5))<.001);
  });
  await check('manual reversion keeps life and XP, releases combat, and cannot refill the watch by switching',async()=>{
    await reset();await transform();await page.evaluate(()=>{__demo.stats.damage(23);__demo.stats.awardXP(130);});await tick(2);
    const energy=await page.evaluate(()=>__demo.stats.energy);await page.keyboard.press('t');
    assert.equal(await page.evaluate(()=>__demo.stats.form),null);
    assert.equal(await page.locator('#formName').textContent(),'BEN');
    assert.deepEqual(await page.evaluate(()=>[__demo.stats.health,__demo.stats.level,__demo.stats.xp,__demo.player.mode]),[77,2,30,'idle']);
    await transform();assert.ok((await page.evaluate(()=>__demo.stats.energy))<=energy);
  });
  await check('energy exhaustion during combat restores the human sprite and cancels a pending attack',async()=>{
    await reset();await transform();await page.evaluate(()=>{__demo.stats.energy=.1;__demo.heavyAttack();});await tick(.15);
    assert.equal(await page.evaluate(()=>__demo.stats.form),null);
    assert.equal(await page.evaluate(()=>__demo.player.mode),'idle');
    assert.equal(await page.evaluate(()=>!!__demo.framePlayer().alien),false);
    assert.equal(await page.evaluate(()=>__demo.stats.energy),0);
  });
  await check('transformation finds free space for its larger footprint and cannot pass through props',async()=>{
    await reset();await page.evaluate(()=>{const p=__demo.player;__demo.props.push({x:p.x+40,y:p.y,r:20,block:true});});
    await transform();assert.equal(await page.evaluate(()=>__demo.collide(__demo.player.x,__demo.player.y)),false);
    await page.keyboard.down('d');await tick(1);await page.keyboard.up('d');
    assert.equal(await page.evaluate(()=>__demo.collide(__demo.player.x,__demo.player.y)),false);
  });
  await check('camera centres each full body and widens smoothly for the larger alien',async()=>{
    await reset();await transform();const result=await page.evaluate(()=>{for(let i=0;i<180;i++)__demo.render(1/60);const a=__demo.actorMetrics();return {zoom:__demo.cam.zoom,centre:(__demo.player.y-a.height*.5-__demo.cam.y)*__demo.cam.zoom};});
    assert.ok(Math.abs(result.zoom-.9)<.001);assert.ok(Math.abs(result.centre-400)<30);
  });
  await check('centre of the Omnitrix returns to Ben using touch without a keyboard',async()=>{
    const touch=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
    const mobile=await touch.newPage();await mobile.addInitScript(()=>{requestAnimationFrame=()=>0;});await mobile.goto('http://127.0.0.1:8778');await mobile.evaluate(()=>__demo.readyPromise);
    await mobile.locator('#watchShortcut').tap();
    const box=await mobile.locator('#wheelCanvas').boundingBox();
    await mobile.touchscreen.tap(box.x+box.width/2,box.y+box.height*.185);await mobile.evaluate(()=>__demo.tick(1.05));
    assert.equal(await mobile.evaluate(()=>__demo.stats.form.id),'four-arms');
    await mobile.locator('#watchShortcut').tap();await mobile.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
    assert.equal(await mobile.evaluate(()=>__demo.stats.form),null);assert.equal(await mobile.evaluate(()=>__demo.state.wheel),false);await touch.close();
  });
  assert.deepEqual(errors,[]);console.log(`${checks} alien checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
