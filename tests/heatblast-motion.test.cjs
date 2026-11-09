const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {instrument}=require('./demo-fixture.cjs');
const server=http.createServer((req,res)=>res.end(instrument(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'))));
let browser,count=0;
async function check(name,test){await test();count++;console.log('PASS',name);}
const close=(a,b)=>assert.ok(Math.abs(a-b)<.01,`${a} != ${b}`);
(async()=>{
  await new Promise(r=>server.listen(8780,'127.0.0.1',r));
  browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{requestAnimationFrame=()=>0;});await page.goto('http://127.0.0.1:8780');await page.evaluate(()=>__demo.readyPromise);
  const reset=()=>page.evaluate(()=>__demo.reset()),tick=seconds=>page.evaluate(seconds=>__demo.tick(seconds),seconds);
  async function transform(){await page.keyboard.press('r');await page.keyboard.press('2');await tick(1.05);}
  async function face(key){await page.keyboard.down(key);await tick(.02);await page.keyboard.up(key);}
  await check('running has eight different poses and clear contact-to-passing changes in leg span',async()=>{
    const bad=await page.evaluate(()=>{
      const bad=[];
      for(let row=4;row<8;row++){
        const frames=__demo.heatblastAtlas.rows[row],hashes=[],spans=[];
        for(const f of frames){
          const p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data;let hash=2166136261,left=f.w,right=0;
          for(let i=0;i<p.length;i++)hash=Math.imul(hash^p[i],16777619);hashes.push(hash);
          for(let y=f.anchorY-28;y<f.anchorY;y++)for(let x=0;x<f.w;x++)if(p[(y*f.w+x)*4+3]>100){left=Math.min(left,x);right=Math.max(right,x);}
          spans.push(right-left);
        }
        if(new Set(hashes).size!==8)bad.push({row,duplicateRunPose:true});
        if(row>=6&&(spans[0]+spans[4])/2-(spans[2]+spans[6])/2<8)bad.push({row,spans});
      }return bad;
    });assert.deepEqual(bad,[]);
  });
  await check('gait follows distance at 30, 60 and 120 fps and stops when scenery blocks movement',async()=>{
    for(const fps of [30,60,120]){
      await reset();await transform();const phases=await page.evaluate(fps=>{
        const p=__demo.player;__demo.keys.add('d');const stride=__demo.actorMetrics().stride;
        const advance=distance=>{for(let time=distance/285;time>1e-10;){const dt=Math.min(time,1/fps);__demo.update(dt);time-=dt;}};
        advance(stride/2+.02);const half=__demo.framePlayer().frame;advance(stride/2);const whole=__demo.framePlayer().frame;
        __demo.props.push({x:p.x+37,y:p.y,r:24,block:true});__demo.update(1/fps);return {half,whole,idle:__demo.framePlayer().idle};
      },fps);assert.deepEqual(phases,{half:4,whole:0,idle:true});
    }
  });
  await check('jab, hook, kick and both fire casts have visibly different contact drawings in every view',async()=>{
    await reset();await transform();const bad=await page.evaluate(()=>{
      const p=__demo.player,bad=[];
      for(const dir of ['down','up','right','left']){
        const hashes=[];
        for(const mode of ['light1','light2','light3','heavy1','heavy2']){
          Object.assign(p,{mode,dir,actionDir:dir,modeDur:1,modeTime:.501,specialAnimation:false});
          const cv=document.createElement('canvas');cv.width=320;cv.height=240;__demo.paintPlayerSprite(cv.getContext('2d'),__demo.framePlayer(),160,210);
          const data=cv.getContext('2d').getImageData(0,0,320,240).data;let hash=2166136261;for(const value of data)hash=Math.imul(hash^value,16777619);hashes.push(hash);
        }
        if(new Set(hashes).size!==5)bad.push({dir,hashes});
      }return bad;
    });assert.deepEqual(bad,[]);
  });
  await check('all three melee strikes deal damage exactly once on the contact frame',async()=>{
    for(const [key,dir] of [['d','right'],['a','left'],['w','up'],['s','down']])for(let combo=1;combo<=3;combo++){
      await reset();await transform();await face(key);
      const timing=await page.evaluate(combo=>{const p=__demo.player;__demo.dummies.push({x:p.x+p.faceX*85,y:p.y+p.faceY*85,health:500,alive:true});p.lightN=combo-1;p.lastLight=__demo.time-.4;__demo.lightAttack();return __demo.attackContactTime();},combo);
      await tick(timing-.01);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),500,dir);
      await tick(.02);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),500-[14,16,20][combo-1],dir);
      await tick(.6);assert.equal(await page.evaluate(()=>__demo.dummies[0].health),500-[14,16,20][combo-1]);
    }
  });
  await check('weight shifts advance 6, 8 and 12 units without tunnelling through scenery',async()=>{
    for(const fps of [30,60,120])for(let combo=1;combo<=3;combo++){
      await reset();await transform();const distance=await page.evaluate(({fps,combo})=>{
        const p=__demo.player;p.dir='right';p.faceX=1;p.faceY=0;p.lightN=combo-1;p.lastLight=__demo.time-.4;
        const x=p.x;__demo.lightAttack();for(let i=0;i<fps;i++)__demo.update(1/fps);return p.x-x;
      },{fps,combo});close(distance,[6,8,12][combo-1]);
    }
    await reset();await transform();const blocked=await page.evaluate(()=>{
      const p=__demo.player;p.dir='right';p.faceX=1;p.faceY=0;p.lightN=2;p.lastLight=__demo.time-.4;
      const x=p.x;__demo.props.push({x:x+37,y:p.y,r:19,block:true});__demo.lightAttack();__demo.tick(.6);return p.x-x;
    });assert.ok(blocked>=0&&blocked<=2);
  });
  await check('flight frames lift the feet and releasing movement immediately returns to guard',async()=>{
    await reset();await transform();const lift=await page.evaluate(()=>{
      const p=__demo.player;p.dir='right';p.mode='idle';p.moving=true;
      const measure=phase=>{p.runClock=(phase+.01)/8*__demo.actorMetrics().stride/285*1.1;const pose=__demo.framePlayer(),cv=document.createElement('canvas');cv.width=300;cv.height=230;__demo.paintPlayerSprite(cv.getContext('2d'),pose,150,210);const rgba=cv.getContext('2d').getImageData(0,0,300,230).data;let bottom=0;for(let y=0;y<230;y++)for(let x=0;x<300;x++)if(rgba[(y*300+x)*4+3]>100)bottom=Math.max(bottom,y);return {lift:pose.lift,bottom};};
      return {plant:measure(0),flight:measure(3)};
    });assert.ok(lift.flight.lift>3&&lift.plant.bottom-lift.flight.bottom>=3);
    await page.keyboard.down('d');await tick(.1);await page.keyboard.up('d');assert.equal(await page.evaluate(()=>__demo.framePlayer().idle),true);
  });
  await check('buffered input completes jab, hook and kick without restarting drawings',async()=>{
    await reset();await transform();await face('d');await page.evaluate(()=>{const p=__demo.player;__demo.dummies.push({x:p.x+92,y:p.y,health:500,alive:true});});
    await page.mouse.click(900,300);await tick(.2);const time=await page.evaluate(()=>__demo.player.modeTime);await page.mouse.click(900,300);close(await page.evaluate(()=>__demo.player.modeTime),time);
    await tick(.3);assert.equal(await page.evaluate(()=>__demo.player.mode),'light2');await page.mouse.click(900,300);await tick(.54);
    assert.deepEqual(await page.evaluate(()=>[__demo.player.mode,__demo.player.lightN,__demo.dummies[0].health]),['idle',3,450]);
  });
  assert.deepEqual(errors,[]);console.log(`${count} Heatblast motion checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
