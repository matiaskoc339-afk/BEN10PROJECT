const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),http=require('node:http');
let chromium;try{({chromium}=require('playwright'))}catch{({chromium}=require('/workspace/BEN10PROJECT/node_modules/playwright'))}
const root=path.resolve(__dirname,'..'),out=root+'/artifacts/rey-eterno',data=require('../jefe-final/data/manifest.json'),api=require('../jefe-final/sprites.js');
fs.mkdirSync(out,{recursive:true});
// Contacts and transitions use elapsed clip time, without repeating death events.
const fall=data.phases[2].animations.defeat,total=api.duration(fall);
assert.equal(api.frameAt(fall,total+5),5);assert.equal(api.frameAt(fall,-1),0);
assert.deepEqual(api.eventsBetween(fall,0,total),['helpersDie','diamondheadDNA']);
assert.deepEqual(api.eventsBetween(fall,total,total+5),[]);
assert.equal(api.frameAt(data.phases[0].animations.idle,1.081),0);
let browser;const report={errors:[],missing:[],clips:[],offlineAssetsOnly:true,launchMode:'local-http'};
// Managed Chromium blocks file:// navigation. Serve the same unmodified files
// on loopback; block every external request and keep catalog data inline.
const server=http.createServer((req,res)=>{let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name==='/favicon.ico'){res.writeHead(204);return res.end()}if(name==='/')name='/index.html';const file=path.resolve(root+'/jefe-final','.'+name);if(!file.startsWith(root+'/jefe-final/')||!fs.existsSync(file)){res.writeHead(404);return res.end()}const ext=path.extname(file);res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.png':'image/png','.js':'text/javascript','.css':'text/css','.json':'application/json'})[ext]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});const page=await browser.newPage({viewport:{width:1440,height:1050}});page.on('pageerror',e=>report.errors.push(e.stack));page.on('requestfailed',r=>report.missing.push(r.url()));
 await page.route(/^https?:/,route=>route.request().url().startsWith(origin+'/')?route.continue():route.abort());
 await page.goto(origin);await page.evaluate(()=>kingArtReady);assert.equal(await page.locator('[data-phase]').count(),3);
 for(let p=0;p<3;p++){
  await page.locator('[data-phase="'+p+'"]').click();assert.equal(await page.locator('[data-action]').count(),Object.keys(data.phases[p].animations).length);await page.evaluate(()=>KingArtViewer.setFrame(0));await page.screenshot({path:out+'/fase-'+(p+1)+'-reposo.png'});
  for(const [key,clip] of Object.entries(data.phases[p].animations)){
   await page.locator('[data-action="'+key+'"]').click();await page.locator('[data-frame="5"]').click();let s=await page.evaluate(()=>KingArtViewer.snapshot());assert.equal(s.phase,p);assert.equal(s.action,key);assert.equal(s.frame,5);assert.equal(s.playing,false);
   assert.equal(s.facing,clip.nativeFacing||'right');await page.locator('[data-facing="left"]').click();assert.equal((await page.evaluate(()=>KingArtViewer.snapshot())).facing,'left');await page.locator('[data-facing="right"]').click();
   report.clips.push({phase:p+1,key,frames:6});
  }
 }
 await page.evaluate(()=>{KingArtViewer.selectPhase(1,'shatter');KingArtViewer.setFrame(5)});await page.screenshot({path:out+'/rotura-armadura.png'});
 const sequence=await page.evaluate(()=>{KingArtViewer.startSequence();const steps=[];let prior='';for(let n=0;n<4000;n++){const s=KingArtViewer.snapshot(),id=s.phase+':'+s.action;if(id!==prior){steps.push(id);prior=id}if(!s.sequence)return {steps,final:s};KingArtViewer.advance(.02)}throw Error('Sequence never ended')});
 assert.equal(sequence.final.phase,2);assert.equal(sequence.final.action,'defeat');assert.equal(sequence.final.frame,5);assert.ok(sequence.final.rewardVisible);assert.equal(sequence.final.playing,false);assert.equal(sequence.steps.length,19);assert.ok(sequence.steps.indexOf('0:guard-break')<sequence.steps.indexOf('1:shatter'));assert.ok(sequence.steps.indexOf('2:summon')<sequence.steps.indexOf('2:defeat'));report.sequence=sequence.steps;
 await page.screenshot({path:out+'/caida-y-adn.png'});await page.locator('#background').selectOption('alpha');await page.screenshot({path:out+'/transparencia.png'});
 const pending=page.waitForEvent('download');await page.locator('#downloadAtlas').click();const download=await pending,target=out+'/download-atlas.png';await download.saveAs(target);assert.ok(fs.readFileSync(target).equals(fs.readFileSync(root+'/jefe-final/assets/atlases/fase-3.png')));report.downloadPassed=true;
 await page.locator('[data-action="idle"]').click();await page.locator('#play').click();let paused=await page.evaluate(()=>KingArtViewer.snapshot());await page.keyboard.press('ArrowRight');const next=await page.evaluate(()=>KingArtViewer.snapshot());assert.equal(next.frame,Math.min(5,paused.frame+1));assert.equal(next.playing,false);
 assert.equal(report.clips.length,19);assert.deepEqual(report.errors,[]);assert.deepEqual(report.missing,[]);report.passed=true;console.log('Offline boss viewer: 19 clips, mirroring, fixed final fall, full phase sequence, controls and original PNG download passed.');
})().catch(e=>{report.failure=e.stack;console.error(e);process.exitCode=1}).finally(async()=>{fs.writeFileSync(out+'/browser-review.json',JSON.stringify(report,null,2)+'\n');if(browser)await browser.close();server.close()});
