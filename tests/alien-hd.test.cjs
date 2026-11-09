const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {instrument}=require('./demo-fixture.cjs');
const root=path.resolve(__dirname,'..'),server=http.createServer((req,res)=>res.end(instrument(fs.readFileSync(path.join(root,'index.html'),'utf8'))));
let browser,count=0;
async function check(name,test){await test();count++;console.log('PASS',name);}
(async()=>{
 await new Promise(r=>server.listen(8781,'127.0.0.1',r));
 browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{requestAnimationFrame=()=>0;});await page.goto('http://127.0.0.1:8781');await page.evaluate(()=>__demo.readyPromise);
 await check('both aliens use 160-pixel HD frames while keeping their established world heights',async()=>{
  const result=await page.evaluate(()=>{
   const result=[];
   for(const [id,name] of [['four-arms','Cuatro Brazos'],['heatblast','Fuego']]){
    __demo.reset();__demo.stats.transform({id,name});const pose=__demo.framePlayer(),frame=pose.atlas.rows[pose.row][pose.frame];
    result.push({id,native:frame.bodyHeight,resolution:pose.atlas.resolutionScale,worldHeight:frame.bodyHeight*pose.scale,expected:__demo.actorMetrics().height});
   }return result;
  });
  for(const item of result){assert.equal(item.native,160);assert.equal(item.resolution,2);assert.ok(Math.abs(item.worldHeight-item.expected)<.001);}
 });
 await check('HD master sheets contain larger original drawings and preserve readable body silhouettes',async()=>{
  for(const file of ['four-arms-hd-guard.png','heatblast-hd-guard.png']){
   const png=fs.readFileSync(path.join(root,'assets/aliens',file));assert.ok(png.readUInt32BE(16)>=700);assert.ok(png.readUInt32BE(20)>=1400);
  }
  const bad=await page.evaluate(()=>{
   const bad=[];
   for(const atlas of [__demo.fourArmsAtlas,__demo.heatblastAtlas])for(let row=0;row<4;row++){
    const f=atlas.rows[row][0],p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data;let top=f.h,bottom=0,mass=0;
    for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++)if(p[(y*f.w+x)*4+3]>100){mass++;top=Math.min(top,y);bottom=Math.max(bottom,y);}
    if(bottom-top<140||mass<4000)bad.push({row,height:bottom-top,mass});
   }return bad;
  });assert.deepEqual(bad,[]);
 });
 await check('Heatblast animation is about 21 percent slower while he still moves at 285 units per second',async()=>{
  for(const fps of [30,60,120]){
   const result=await page.evaluate(fps=>{
    __demo.reset();__demo.stats.transform({id:'heatblast',name:'Fuego'});const start=__demo.player.x;__demo.keys.add('d');
    for(let left=152/285;left>1e-10;){const dt=Math.min(left,1/fps);__demo.update(dt);left-=dt;}
    return {distance:__demo.player.x-start,frame:__demo.framePlayer().frame,speed:__demo.actorMetrics().speed,ratio:152/__demo.actorMetrics().stride};
   },fps);
   assert.ok(Math.abs(result.distance-152)<.01);assert.equal(result.speed,285);assert.equal(result.frame,6);assert.ok(result.ratio>.78&&result.ratio<.81);
  }
 });
 await check('HD characters keep the same visible size on normal and retina canvases',async()=>{
  const bad=await page.evaluate(()=>{
   const bad=[];
   for(const id of ['four-arms','heatblast'])for(const dir of ['down','up','right','left']){
    __demo.reset();__demo.stats.transform({id});__demo.player.dir=dir;const pose=__demo.framePlayer(),sizes=[];
    for(const scale of [1,2]){
     const cv=document.createElement('canvas');cv.width=400*scale;cv.height=300*scale;const c=cv.getContext('2d');c.scale(scale,scale);__demo.paintPlayerSprite(c,pose,200,250);
     const p=c.getImageData(0,0,cv.width,cv.height).data;let top=cv.height,bottom=0;
     for(let y=0;y<cv.height;y++)for(let x=0;x<cv.width;x++)if(p[(y*cv.width+x)*4+3]>100){top=Math.min(top,y);bottom=Math.max(bottom,y);}
     sizes.push((bottom-top+1)/scale);
    }
    if(Math.abs(sizes[0]-sizes[1])>1.5)bad.push({id,dir,sizes});
   }return bad;
  });assert.deepEqual(bad,[]);
 });
 assert.deepEqual(errors,[]);console.log(`${count} HD checks passed`);
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{if(browser)await browser.close();server.close();});
