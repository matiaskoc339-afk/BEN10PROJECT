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
  await check('the torso stays registered while feet and fists move, without sideways frame jumps',async()=>{
    const bad=await page.evaluate(()=>{
      const bad=[];
      for(const row of [0,1,2,3,4,5,6,7,8,9,13]){
        const centres=__demo.fourArmsAtlas.rows[row].map(f=>{
          const p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data;let xSum=0,n=0;
          for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++){
            const i=(y*f.w+x)*4;
            if(p[i+3]>160&&p[i]>175&&p[i+1]>175&&p[i+2]>175){xSum+=x;n++;}
          }
          return xSum/n-f.anchorX;
        });
        if(Math.max(...centres)-Math.min(...centres)>2)bad.push({row,centres});
      }
      return bad;
    });assert.deepEqual(bad,[]);
  });
  await check('every attack and dash starts and ends on the same guard, with no cut to another body',async()=>{
    await reset();await transform();
    const bad=await page.evaluate(()=>{
      const bad=[],p=__demo.player;
      const pixels=()=>{
        const cv=document.createElement('canvas');cv.width=300;cv.height=240;
        __demo.paintPlayerSprite(cv.getContext('2d'),__demo.framePlayer(),150,210);
        return cv.getContext('2d').getImageData(0,0,300,240).data;
      };
      for(const dir of ['down','up','right','left']){
        Object.assign(p,{dir,actionDir:dir,mode:'idle',moving:false,idleClock:0});const guard=pixels();
        for(const mode of ['light1','light2','light3','heavy1','heavy2','dash'])for(const progress of [0,.999]){
          Object.assign(p,{mode,modeDur:1,modeTime:progress});const pose=pixels();
          if(pose.some((v,i)=>v!==guard[i]))bad.push({dir,mode,progress});
        }
      }
      return bad;
    });assert.deepEqual(bad,[]);
  });
  await check('rapid follow-up input waits for recovery instead of restarting or stacking an attack',async()=>{
    await reset();await transform();
    await page.evaluate(()=>{const p=__demo.player;p.dir='right';p.faceX=1;p.faceY=0;__demo.dummies.push({x:p.x+90,y:p.y,health:1000,alive:true});});
    await page.mouse.click(900,300);await tick(.26);
    const before=await page.evaluate(()=>__demo.player.modeTime);
    await page.mouse.click(900,300);
    assert.equal(await page.evaluate(()=>__demo.player.modeTime),before);
    assert.equal(await page.evaluate(()=>__demo.player.lightN),1);
    await tick(.22);
    assert.equal(await page.evaluate(()=>__demo.player.mode),'light2');
    await tick(.4);
    assert.equal(await page.evaluate(()=>__demo.dummies[0].health),944);
    assert.equal(await page.evaluate(()=>__demo.player.mode),'idle');
    await reset();await transform();await page.mouse.click(900,300,{button:'right'});await tick(.7);
    await page.mouse.click(900,300,{button:'right'});await tick(.3);
    assert.equal(await page.evaluate(()=>__demo.player.mode),'heavy2');
  });
  await check('seismic attack keeps its side or back view through windup, impact and recovery',async()=>{
    await reset();await transform();
    const bad=await page.evaluate(()=>{
      const p=__demo.player,bad=[];
      for(const [dir,guard,combat] of [['down',0,20],['up',1,21],['right',2,12],['left',3,12]]){
        Object.assign(p,{mode:'idle',dir,actionDir:dir});__demo.stats.recordLightHit();__demo.stats.recordLightHit();__demo.heavyAttack();
        p.mode='heavy1';p.specialAnimation=true;p.actionDir=dir;p.modeDur=.92;
        for(const progress of [0,.15,.35,.52,.75,.999]){
          p.modeTime=p.modeDur*progress;const pose=__demo.framePlayer();
          if(pose.direction!==dir||![guard,combat].includes(pose.row)||pose.flip!==(dir==='left'&&pose.row===combat))bad.push({dir,progress,row:pose.row,flip:pose.flip});
        }
      }
      return bad;
    });assert.deepEqual(bad,[]);
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
  await check('Four Arms has a measured moderate height relative to Ben and moves more slowly',async()=>{
    await reset();const human=await page.evaluate(()=>({...__demo.actorMetrics(),sourceHeight:__demo.mainAtlas.rows[0][0].bodyHeight}));
    assert.equal(human.scale,1.25);
    await transform();const alien=await page.evaluate(()=>__demo.actorMetrics());
    const ratio=alien.height/(human.sourceHeight*human.scale);
    assert.ok(ratio>=1.5&&ratio<=1.7,JSON.stringify({ratio,alien,human}));
    assert.equal(alien.zoom,human.zoom);
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
    for(let i=0;i<3;i++){await page.mouse.click(900,300);await tick(.2);poses.push(await page.evaluate(()=>{const p=__demo.framePlayer();return [p.row,p.frame];}));await tick(await page.evaluate(()=>Math.max(0,__demo.player.modeDur-__demo.player.modeTime)+.05));}
    assert.notDeepEqual(poses[0],poses[1]);assert.notDeepEqual(poses[1],poses[2]);
    assert.equal(await page.evaluate(()=>__demo.framePlayer().idle),true);
  });
  await check('only the third light attack is slower, with the raised fists and held smash visible on both sides',async()=>{
    for(const [key,dir] of [['d','right'],['a','left'],['s','down'],['w','up']]){
      await reset();await transform();await page.keyboard.down(key);await tick(.01);await page.keyboard.up(key);
      const durations=[];
      for(let i=0;i<3;i++){
        await page.mouse.click(900,300);durations.push(await page.evaluate(()=>__demo.player.modeDur));
        if(i<2)await tick(.43);
      }
      assert.deepEqual(durations,[.38,.38,.5]);
      if(dir==='right'||dir==='left'){
        const clip=await page.evaluate(()=>__demo.fourArmsActionClip());
        assert.deepEqual(clip.poses.slice(1,-1).map(p=>p[1]),[0,1,2,3,4,4,5,6,7]);
        assert.ok(clip.poses.slice(1,-1).every(p=>p[0]===12&&p[2]===(dir==='left')));
        assert.ok(Math.abs((await page.evaluate(()=>__demo.attackContactTime()))-5/11*.5)<.00001);
      }
      await tick(.56);assert.equal(await page.evaluate(()=>__demo.player.mode),'idle');
      await page.mouse.click(900,300,{button:'right'});
      assert.equal(await page.evaluate(()=>__demo.player.modeDur),.92);
    }
  });
  await check('the held smash damages once at contact and finishes before the buffered next punch at 30, 60 and 120 Hz',async()=>{
    for(const fps of [30,60,120]){
      const result=await page.evaluate(fps=>{
        __demo.reset();__demo.stats.transform({id:'four-arms'});
        const p=__demo.player;p.dir='right';p.faceX=1;p.faceY=0;
        __demo.dummies.push({x:p.x+90,y:p.y,health:1000,alive:true});
        function step(seconds){for(let left=seconds;left>1e-10;){const dt=Math.min(left,1/fps);__demo.update(dt);left-=dt;}}
        for(let i=0;i<2;i++){__demo.lightAttack();step(.45);}
        __demo.lightAttack();step(.21);const before=__demo.dummies[0].health;
        step(.12);const contact=__demo.dummies[0].health;
        __demo.lightAttack();const buffered=p.mode;
        step(.25);const next=p.mode,after=__demo.dummies[0].health;
        step(.5);return {before,contact,after,buffered,next,end:p.mode,hp:__demo.dummies[0].health};
      },fps);
      assert.deepEqual(result,{before:944,contact:906,after:906,buffered:'light3',next:'light1',end:'idle',hp:880});
    }
  });
  await check('two connected punches unlock one radial seismic special, spending exactly 20 energy',async()=>{
    await reset();await transform();await page.evaluate(()=>{const p=__demo.player;p.dir='right';p.faceX=1;p.faceY=0;__demo.dummies.push({x:p.x+105,y:p.y,health:500,alive:true},{x:p.x-150,y:p.y,health:100,alive:true});});
    for(let i=0;i<2;i++){await page.mouse.click(900,300);await tick(.43);}
    assert.equal(await page.evaluate(()=>__demo.stats.specialReady),true);
    const before=await page.evaluate(()=>__demo.stats.energy);
    await page.mouse.click(900,300,{button:'right'});await tick(.5);
    assert.equal(await page.evaluate(()=>__demo.framePlayer().row),12);
    await tick(.22);assert.equal(await page.evaluate(()=>__demo.framePlayer().row),12);
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
  await check('camera stays close and keeps the same perspective for both forms',async()=>{
    await reset();await transform();const result=await page.evaluate(()=>{for(let i=0;i<180;i++)__demo.render(1/60);const a=__demo.actorMetrics();return {zoom:__demo.cam.zoom,centre:(__demo.player.y-a.height*.5-__demo.cam.y)*__demo.cam.zoom};});
    assert.ok(Math.abs(result.zoom-1.125)<.001);assert.ok(Math.abs(result.centre-400)<30);
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
