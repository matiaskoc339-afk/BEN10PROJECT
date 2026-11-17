/* Browser smoke for the unmodified, fully packaged V47. */
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const record={
 createdAt:Date.now(),updatedAt:Date.now(),playSeconds:500,progression:null,
 unlocks:{version:1,diamondhead:true,ghostfreak:true,blitzwolfer:false},
 adventure:{version:1,story:'hub',mode:'circus',eternalsCleared:true,circusVisited:true,circusRouteCleared:true,zombozoDefeated:true,desertVisited:false,desertDefeated:false,mirrorIndex:0,mirrorCheckpoint:0},
 checkpoint:{phase:2,cleared:4,x:0,y:0,kind:'selection',introSeen:true,kills:80}
};
const key='ben10.omnitrix-fragmentado.saves.v1';
const bad=[],missing=[];
const server=http.createServer((req,res)=>{
 let pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 if(pathname==='/favicon.ico'){res.writeHead(204);return res.end();}
 if(pathname==='/')pathname='/index.html';
 const filename=path.resolve(root,'.'+pathname);
 if(!filename.startsWith(root+'/')||!fs.existsSync(filename)){res.writeHead(404);return res.end('missing');}
 res.setHeader('Content-Type',({'.html':'text/html; charset=utf-8','.js':'text/javascript','.png':'image/png','.webp':'image/webp','.css':'text/css'})[path.extname(filename)]||'application/octet-stream');
 fs.createReadStream(filename).pipe(res);
});
let browser;
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1360,height:810}});
 await context.addInitScript(({key,record})=>{
  if(!localStorage.getItem('v47-smoke-seed')){localStorage.setItem('v47-smoke-seed','1');localStorage.setItem(key,JSON.stringify({version:1,slots:[record,null,null]}));}
 },{key,record});
 const page=await context.newPage();
 page.on('pageerror',e=>bad.push(e.stack||e.message));
 page.on('response',r=>{if(r.status()>=400)missing.push(r.url());});
 page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith('http://127.0.0.1:'))bad.push('Unexpected external request '+r.url());});
 await page.goto('http://127.0.0.1:'+server.address().port,{waitUntil:'load',timeout:120000});
 await page.waitForFunction(()=>window.Ben10MainMenu?.state.ready,{},{timeout:100000});
 await page.locator('[data-save-slot="0"]').click();
 await page.locator('#villainHub').waitFor({state:'visible',timeout:25000});
 assert.equal(await page.locator('#chooseBlitzwolfer').count(),1);
 assert.equal(await page.locator('#chooseBlitzwolfer img').evaluate(i=>i.complete&&i.naturalWidth>0),true);
 await page.locator('#chooseBlitzwolfer').click();
 await page.waitForFunction(()=>document.querySelector('#campaignPhase')?.textContent.includes('ALFA'),{},{timeout:10000});
 await page.keyboard.press('u');
 await page.locator('#v47Developer').waitFor({state:'visible'});
 await page.locator('[data-v47-points="5"]').click();
 await page.locator('#v47DevZone').selectOption('2');
 await page.locator('#v47DevStage').selectOption('boss');
 await page.locator('#v47DevJump').click();
 await page.locator('#alphaHUD').waitFor({state:'visible',timeout:12000});
 assert.match(await page.locator('#alphaPhase').textContent(),/FASE 1/);
 await page.keyboard.press('u');
 await page.locator('#v47Developer').waitFor({state:'visible'});
 await page.locator('#v47DevRestore').click();
 await page.locator('#villainHub').waitFor({state:'visible',timeout:12000});
 assert.equal(await page.locator('#chooseBlitzwolfer').count(),1);
 const saved=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).slots[0],key);
 assert.equal(saved.adventure.story,'hub','Developer teleport must not overwrite save');
 assert.equal(saved.unlocks.blitzwolfer,false,'Developer teleport must never give away DNA');
 assert.deepEqual(bad,[],'Unexpected browser runtime errors');
 assert.deepEqual(missing,[],'Missing offline art files');
 console.log('V47 smoke OK: chooser -> desert -> U panel -> skill points -> Alpha -> restore original save; local assets only.');
})().catch(e=>{console.error(e);console.error({bad,missing});process.exitCode=1}).finally(async()=>{await browser?.close();server.close();});
