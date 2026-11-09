const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {instrument}=require('./demo-fixture.cjs');
const server=http.createServer((req,res)=>res.end(instrument(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'))));
let browser,count=0;
async function check(name,test){await test();count++;console.log('PASS',name);}
const close=(a,b)=>assert.ok(Math.abs(a-b)<.01,`${a} != ${b}`);
(async()=>{
  await new Promise(r=>server.listen(8779,'127.0.0.1',r));
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;});await page.goto('http://127.0.0.1:8779');await page.evaluate(()=>__demo.readyPromise);
  const reset=()=>page.evaluate(()=>__demo.reset()),tick=seconds=>page.evaluate(seconds=>__demo.tick(seconds),seconds);
  async function transform(slot='2'){await page.keyboard.press('r');await page.keyboard.press(slot);await tick(1.05);}
  async function face(key){await page.keyboard.down(key);await tick(.02);await page.keyboard.up(key);}
  await check('Ben deals reduced damage: 8, 8, 12 with light punches and 20 with a heavy strike',async()=>{
    await reset();await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x,y:p.y+75,health:500,alive:true});});
    for(let i=0;i<3;i++){await page.mouse.click(900,300);await tick(.31);}
    assert.equal(await page.evaluate(()=>__demo.dummies[0].health),472);
    await page.mouse.click(900,300,{button:'right'});await tick(1);
    assert.equal(await page.evaluate(()=>__demo.dummies[0].health),452);
  });
  await check('256 Heatblast poses retain complete flames, transparent margins and ground registration',async()=>{
    const report=await page.evaluate(()=>{
      const frames=__demo.heatblastAtlas.rows.flat(),bad=[];
      for(const f of frames){const p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data;let mass=0,edge=0,bottom=0;
        for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++)if(p[(y*f.w+x)*4+3]>100){mass++;bottom=Math.max(bottom,y);if(x<2||y<2||x>=f.w-2||y>=f.h-2)edge++;}
        if(mass<400||edge||Math.abs(bottom+1-f.anchorY)>2)bad.push({row:f.row,col:f.col,mass,edge,bottom});
      }return {count:frames.length,bad};
    });assert.equal(report.count,256);assert.deepEqual(report.bad,[]);
  });
  await check('R then 2 selects real Heatblast and updates the HUD and fire button',async()=>{
    await reset();await transform();
    assert.equal(await page.evaluate(()=>__demo.stats.form.id),'heatblast');assert.equal(await page.locator('#formName').textContent(),'FUEGO');
    assert.equal(await page.locator('#btnHeavy').textContent(),'FUEGO');assert.equal(await page.evaluate(()=>__demo.framePlayer().atlas===__demo.heatblastAtlas),true);
  });
  await check('Heatblast is taller than Ben, smaller than Four Arms, faster, and uses the same camera',async()=>{
    await reset();const human=await page.evaluate(()=>__demo.actorMetrics());await transform('1');const four=await page.evaluate(()=>__demo.actorMetrics());await transform();const fire=await page.evaluate(()=>__demo.actorMetrics());
    assert.ok(fire.height>human.height&&fire.height<four.height);assert.ok(fire.speed>human.speed&&fire.speed>four.speed);assert.equal(fire.zoom,four.zoom);
    const x=await page.evaluate(()=>__demo.player.x);await page.keyboard.down('d');await tick(1);await page.keyboard.up('d');close((await page.evaluate(()=>__demo.player.x))-x,285);
  });
  for(const [key,dir] of [['d','right'],['a','left'],['w','up'],['s','down']])await check('Heatblast light attacks are melee only and face '+dir,async()=>{
    await reset();await transform();await face(key);await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push(
      {x:p.x+p.faceX*85,y:p.y+p.faceY*85,health:100,alive:true},
      {x:p.x-p.faceX*85,y:p.y-p.faceY*85,health:100,alive:true},
      {x:p.x+p.faceX*220,y:p.y+p.faceY*220,health:100,alive:true});});
    await page.mouse.click(900,300);await tick(.12);assert.deepEqual(await page.evaluate(()=>__demo.dummies.map(d=>d.health)),[100,100,100]);
    await tick(.04);assert.equal(await page.evaluate(()=>__demo.framePlayer().direction),dir);
    assert.deepEqual(await page.evaluate(()=>__demo.dummies.map(d=>d.health)),[86,100,100]);assert.equal(await page.evaluate(()=>__demo.projectiles.length),0);
  });
  await check('a heavy shot travels toward the locked facing direction and deals 32 damage once on impact',async()=>{
    await reset();await transform();await face('d');await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+260,y:p.y,health:100,alive:true},{x:p.x-200,y:p.y,health:100,alive:true});});
    await page.mouse.click(900,300,{button:'right'});await tick(.2);assert.equal(await page.evaluate(()=>__demo.projectiles.length),0);
    await page.keyboard.down('a');await tick(.14);await page.keyboard.up('a');
    assert.equal(await page.evaluate(()=>__demo.projectiles.length),1);assert.equal(await page.evaluate(()=>__demo.framePlayer().direction),'right');assert.deepEqual(await page.evaluate(()=>__demo.dummies.map(d=>d.health)),[100,100]);
    await tick(.6);assert.deepEqual(await page.evaluate(()=>__demo.dummies.map(d=>d.health)),[68,100]);assert.equal(await page.evaluate(()=>__demo.projectiles.length),0);
  });
  await check('two melee hits unlock one explosive fireball costing 20 energy at emission, with one splash hit',async()=>{
    await reset();await transform();await face('d');await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+85,y:p.y,health:500,alive:true});});
    for(let i=0;i<2;i++){await page.mouse.click(900,300);await tick(.36);}
    assert.equal(await page.evaluate(()=>__demo.stats.specialReady),true);
    await page.evaluate(()=>{const p=__demo.player;__demo.dummies[0].x=p.x+260;__demo.dummies.push({x:p.x+285,y:p.y+20,health:100,alive:true});});
    const energy=await page.evaluate(()=>__demo.stats.energy);await page.mouse.click(900,300,{button:'right'});await tick(.31);close(await page.evaluate(()=>__demo.stats.energy),energy-.465);
    await tick(.03);close(await page.evaluate(()=>__demo.stats.energy),energy-.51-20);assert.equal(await page.evaluate(()=>__demo.projectiles[0].special),true);
    await tick(.7);close(await page.evaluate(()=>__demo.stats.energy),energy-1.56-20);
    assert.deepEqual(await page.evaluate(()=>__demo.dummies.map(d=>d.health)),[400,30]);assert.equal(await page.evaluate(()=>__demo.stats.specialReady),false);
  });
  await check('the faster dash cancels a special before emission without spending its charge',async()=>{
    await reset();await transform();await face('d');await page.evaluate(()=>{__demo.stats.recordLightHit();__demo.stats.recordLightHit();});
    const energy=await page.evaluate(()=>__demo.stats.energy);await page.mouse.click(900,300,{button:'right'});await tick(.16);
    const x=await page.evaluate(()=>__demo.player.x);await page.keyboard.press('Space');await tick(.32);
    close((await page.evaluate(()=>__demo.player.x))-x,185.6);close(await page.evaluate(()=>__demo.stats.energy),energy-.48*1.5);assert.equal(await page.evaluate(()=>__demo.projectiles.length),0);
  });
  await check('switching both classic aliens preserves charge, life, XP and camera, and T returns to Ben',async()=>{
    await reset();await transform('1');await page.evaluate(()=>{__demo.stats.damage(17);__demo.stats.awardXP(130);});const energy=await page.evaluate(()=>__demo.stats.energy);
    await transform();assert.ok((await page.evaluate(()=>__demo.stats.energy))<energy);assert.equal(await page.evaluate(()=>__demo.player.selectedAlien),1);
    await transform('1');assert.equal(await page.evaluate(()=>__demo.stats.form.id),'four-arms');await page.keyboard.press('t');
    assert.deepEqual(await page.evaluate(()=>[__demo.stats.form,__demo.stats.health,__demo.stats.level,__demo.stats.xp,__demo.cam.zoom]),[null,83,2,30,1.125]);
    assert.equal(await page.locator('#btnHeavy').textContent(),'FUERTE');
  });
  await check('the last special charge returns to Ben while its already emitted fireball finishes its flight',async()=>{
    await reset();await transform();await face('d');await page.evaluate(()=>{const p=__demo.player;__demo.stats.energy=20.51;__demo.stats.recordLightHit();__demo.stats.recordLightHit();__demo.dummies.push({x:p.x+260,y:p.y,health:100,alive:true});});
    await page.mouse.click(900,300,{button:'right'});await tick(.38);
    assert.equal(await page.evaluate(()=>__demo.stats.form),null);assert.equal(await page.evaluate(()=>__demo.projectiles.length),1);
    await tick(.6);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),30);assert.equal(await page.evaluate(()=>__demo.projectiles.length),0);
  });
  await check('every Heatblast action starts and recovers in the same correctly oriented guard',async()=>{
    await reset();await transform();const bad=await page.evaluate(()=>{const bad=[],p=__demo.player;
      for(const dir of ['down','up','right','left']){Object.assign(p,{dir,actionDir:dir,mode:'idle',moving:false,idleClock:0});const guard=__demo.framePlayer();
        for(const mode of ['light1','light2','light3','heavy1','heavy2','dash'])for(const phase of [0,.999]){Object.assign(p,{mode,modeDur:1,modeTime:phase});const pose=__demo.framePlayer();if(pose.row!==guard.row||pose.frame!==guard.frame||pose.flip!==guard.flip)bad.push({dir,mode,phase});}
      }return bad;});assert.deepEqual(bad,[]);
  });
  await check('real ranged defeats award 40 XP once without repeated hits from an expired fireball',async()=>{
    await reset();await transform();await face('d');await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+220,y:p.y,health:60,alive:true});});
    for(let i=0;i<2;i++){await page.mouse.click(900,300,{button:'right'});await tick(.75);}
    await tick(2);assert.deepEqual(await page.evaluate(()=>[__demo.dummies[0].alive,__demo.stats.totalXP,__demo.state.kills]),[false,40,1]);
  });
  await check('solid scenery blocks ranged fire before it can damage a target behind it',async()=>{
    await reset();await transform();await face('d');await page.evaluate(()=>{const p=__demo.player;__demo.props.push({x:p.x+100,y:p.y,r:24,block:true});__demo.dummies.push({x:p.x+230,y:p.y,health:100,alive:true});});
    await page.mouse.click(900,300,{button:'right'});await tick(1.2);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),100);assert.equal(await page.evaluate(()=>__demo.projectiles.length),0);
  });
  await check('touch selection, the fire button and returning through the wheel work without a keyboard',async()=>{
    const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true}),p=await mobile.newPage();await p.addInitScript(()=>{requestAnimationFrame=()=>0;});await p.goto('http://127.0.0.1:8779');await p.evaluate(()=>__demo.readyPromise);
    await p.locator('#watchShortcut').tap();const box=await p.locator('#wheelCanvas').boundingBox();await p.touchscreen.tap(box.x+box.width*.685,box.y+box.height*.245);await p.evaluate(()=>__demo.tick(1.05));
    assert.equal(await p.locator('#formName').textContent(),'FUEGO');await p.locator('#btnHeavy').tap();await p.evaluate(()=>__demo.tick(.35));assert.equal(await p.evaluate(()=>__demo.projectiles.length),1);
    await p.locator('#watchShortcut').tap();await p.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);assert.equal(await p.evaluate(()=>__demo.stats.form),null);await mobile.close();
  });
  assert.deepEqual(errors,[]);console.log(`${count} Heatblast checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
