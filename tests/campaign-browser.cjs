const fs=require('node:fs'),path=require('node:path'),http=require('node:http'),assert=require('node:assert/strict');
let chromium;try{({chromium}=require('playwright'))}catch{({chromium}=require('/workspace/BEN10PROJECT/node_modules/playwright'))}
const root=path.resolve(__dirname,'..'),out=root+'/artifacts/campaign';fs.mkdirSync(out,{recursive:true});
let html=fs.readFileSync(root+'/index.html','utf8').replace('function update(dt){','function update(dt){if(window.__campaignHold)return;');
const hook=`
 function campaignTestStep(seconds){window.__campaignHold=false;for(let i=0;i<Math.ceil(seconds*60);i++)update(1/60);window.__campaignHold=true;campaignCamera(0,true);render(0);}
 window.__campaign={ready:()=>assetsReady,hold:value=>window.__campaignHold=value,
 snapshot(){return {phase:campaign.phaseIndex,exitReady:campaignExitReady,player:{x:player.x,y:player.y,mode:player.mode},stats:stats.snapshot(),radius:actorMetrics().radius,onFloor:campaign.onFloor(player,actorMetrics().radius),dummies:dummyList.length,props:props.length,legacyProps:props.filter(p=>p.type!=='campaign').length,fire:fire.shots.length,pools:slime.pools.length,fields:progression.fields.length,view:campaignView,camera:{...cam},speed:speedAction.phase,cannon:cannonAction.phase,ghost:ghostAction.phase}},
 step:campaignTestStep,walk(seconds){keys.add('d');campaignTestStep(seconds);keys.clear()},
 place(x,y=285){const at=campaign.clampPoint({x:x*campaign.scale,y:campaign.offsetY+y*campaign.scale},actorMetrics().radius,props,{ignoreProps:true});player.x=at.x;player.y=at.y;keys.clear();player.mode='idle';player.dir='right';player.faceX=1;player.faceY=0;campaignAfterUpdate(at);campaignCamera(0,true);render(0)},
 nearExit(){this.place(campaign.exit.x/campaign.scale,285)},phase(index){campaignSetPhase(index);campaignCamera(0,true);render(0)},
 alien(index){returnToBen();stats.drainEvents();stats.energy=100;stats.rechargeLocked=false;stats.rechargeLeft=0;player.mode='idle';keys.clear();selectSlot(index);campaignTestStep(1.1);return stats.form?.id},
 ben(){returnToBen();stats.energy=100;stats.rechargeLocked=false;keys.clear()},
 screen(x,y){return {x:campaignView.x+(x-cam.x)*cam.zoom,y:campaignView.y+(y-cam.y)*cam.zoom}},
 route(){return speedAction.plan?.points.map(p=>({...p,onFloor:campaign.onFloor(p,14)}))||[]},
 carry(){stats.health=73;stats.energy=61;stats.xp=42;slime.addPool(player.x,player.y);fire.launch({x:player.x,y:player.y,dx:1,dy:0});progression.fields.push({kind:'pool',x:player.x,y:player.y,life:3,age:0,source:{color:'#fff',form:'heatblast'},radius:30})}
 };`;
const at=html.lastIndexOf('\n})();');html=html.slice(0,at)+hook+html.slice(at);
const report={errors:[],failed:[],httpErrors:[],phases:[],aliens:[]};let browser;
const server=http.createServer((req,res)=>{const name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);if(name==='/favicon.ico'){res.writeHead(204);return res.end()}if(name==='/inspect.html'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(html)}const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));if(!file.startsWith(root+'/')||!fs.existsSync(file)){res.writeHead(404);return res.end()}const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.png':'image/png','.css':'text/css'};res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
(async()=>{
 await new Promise(r=>server.listen(8831,'127.0.0.1',r));browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 const context=await browser.newContext({viewport:{width:1440,height:960}}),page=await context.newPage();page.on('pageerror',e=>report.errors.push(e.stack));page.on('requestfailed',r=>report.failed.push(r.url()));page.on('response',r=>{if(r.status()>=400)report.httpErrors.push({url:r.url(),status:r.status()})});
 await page.goto('http://127.0.0.1:8831/inspect.html',{waitUntil:'load',timeout:90000});await page.waitForFunction(()=>window.__campaign?.ready(),{},{timeout:90000});await page.keyboard.press('Escape');await page.evaluate(()=>__campaign.hold(true));
 assert.equal(await page.locator('#enemyCount').count(),0);let s=await page.evaluate(()=>__campaign.snapshot());assert.equal(s.dummies,0);assert.equal(s.legacyProps,0);assert.ok(s.onFloor);await page.screenshot({path:out+'/01-calles.png'});
 await page.evaluate(()=>__campaign.hold(false));await page.keyboard.down('d');await page.waitForTimeout(400);await page.keyboard.up('d');await page.evaluate(()=>__campaign.hold(true));assert.ok((await page.evaluate(()=>__campaign.snapshot())).player.x>s.player.x+35);
 for(let phase=0;phase<3;phase++){
  await page.evaluate(()=>__campaign.walk(65));s=await page.evaluate(()=>__campaign.snapshot());assert.equal(s.phase,phase);assert.ok(s.onFloor&&s.exitReady);assert.equal(await page.locator('#campaignExit').isVisible(),true);
  const arrived=s.player.x;await page.evaluate(()=>__campaign.walk(3));s=await page.evaluate(()=>__campaign.snapshot());assert.equal(s.phase,phase);assert.ok(s.player.x-arrived<.1);await page.screenshot({path:out+'/fase-'+(phase+1)+'-entrada.png'});report.phases.push({phase,manualGate:true,onFloor:true});
  if(phase===0){await page.evaluate(()=>__campaign.carry());const before=await page.evaluate(()=>__campaign.snapshot());await page.keyboard.press('e');const after=await page.evaluate(()=>__campaign.snapshot());for(const key of ['health','energy','xp','level'])assert.equal(after.stats[key],before.stats[key]);assert.equal(after.phase,1);assert.equal(after.fire+after.pools+after.fields,0);report.preservedState=true;}
  else if(phase===1){await page.locator('#campaignEnter').click();assert.equal((await page.evaluate(()=>__campaign.snapshot())).phase,2);}
 }
 await page.keyboard.press('e');assert.equal((await page.evaluate(()=>__campaign.snapshot())).phase,0);
 for(let i=0;i<10;i++){const form=await page.evaluate(i=>__campaign.alien(i),i);assert.ok(form);s=await page.evaluate(()=>__campaign.snapshot());assert.ok(s.onFloor);await page.mouse.click(800,610);await page.evaluate(()=>__campaign.step(.75));assert.ok((await page.evaluate(()=>__campaign.snapshot())).onFloor);report.aliens.push(form);if([0,1,2,4,9].includes(i))await page.screenshot({path:out+'/alien-'+form+'.png'});}
 // Every wall constrains both normal movement and Space dashes.
 for(let phase=0;phase<3;phase++){
  await page.evaluate(phase=>{__campaign.ben();__campaign.phase(phase);__campaign.place(450);},phase);
  await page.keyboard.down('w');await page.evaluate(()=>__campaign.step(3));await page.keyboard.press('Space');await page.evaluate(()=>__campaign.step(1));await page.keyboard.up('w');s=await page.evaluate(()=>__campaign.snapshot());assert.ok(s.onFloor);
  await page.keyboard.down('s');await page.evaluate(()=>__campaign.step(4));await page.keyboard.press('Space');await page.evaluate(()=>__campaign.step(1));await page.keyboard.up('s');assert.ok((await page.evaluate(()=>__campaign.snapshot())).onFloor);
 }
 await page.evaluate(()=>{__campaign.ben();__campaign.phase(0);__campaign.alien(2);__campaign.place(550);});
 s=await page.evaluate(()=>__campaign.snapshot());let cursor=await page.evaluate(p=>__campaign.screen(p.x+90,p.y),s.player);await page.mouse.move(cursor.x,cursor.y);await page.mouse.down({button:'right'});await page.evaluate(()=>__campaign.step(.35));
 cursor=await page.evaluate(p=>__campaign.screen(p.x+260,p.y-200),s.player);await page.mouse.move(cursor.x,cursor.y);await page.evaluate(()=>__campaign.step(.1));const route=await page.evaluate(()=>__campaign.route());assert.ok(route.length>1&&route.every(p=>p.onFloor));await page.screenshot({path:out+'/xlr8-ruta-con-pared.png'});await page.mouse.up({button:'right'});await page.evaluate(()=>__campaign.step(3));assert.ok((await page.evaluate(()=>__campaign.snapshot())).onFloor);report.xlr8PlanRespectsWalls=true;
 for(const i of [4,5]){await page.evaluate(i=>{__campaign.alien(i);__campaign.place(550);},i);s=await page.evaluate(()=>__campaign.snapshot());cursor=await page.evaluate(p=>__campaign.screen(p.x,p.y),s.player);await page.mouse.move(cursor.x,cursor.y);await page.mouse.down({button:'right'});await page.keyboard.down('w');await page.evaluate(()=>__campaign.step(1.3));await page.mouse.up({button:'right'});await page.evaluate(()=>__campaign.step(3));await page.keyboard.up('w');assert.ok((await page.evaluate(()=>__campaign.snapshot())).onFloor);}
 await page.evaluate(()=>{__campaign.ben();__campaign.phase(1);const r=BEN10_CAMPAIGN_DATA.rooms[18];__campaign.place((r.x-BEN10_CAMPAIGN_DATA.chapters[1].x)+r.width*.65);});await page.screenshot({path:out+'/02-castillo-puzzle.png'});
 await page.evaluate(()=>{__campaign.phase(2);__campaign.nearExit();});await page.screenshot({path:out+'/03-laboratorio.png'});
 assert.deepEqual(report.errors,[]);assert.deepEqual(report.failed,[]);assert.deepEqual(report.httpErrors,[]);report.passed=true;console.log('Three playable phases, manual E/button gates, state carry, 10 aliens and special movement collisions passed.');
})().catch(async error=>{report.failure=error.stack;console.error(error);if(browser){const p=browser.contexts()[0]?.pages()[0];if(p){report.debug=await p.evaluate(()=>window.__campaign?.snapshot()).catch(()=>null);await p.screenshot({path:out+'/failure.png'}).catch(()=>{})}}process.exitCode=1}).finally(async()=>{fs.writeFileSync(out+'/browser-review.json',JSON.stringify(report,null,2));if(browser)await browser.close();server.close()});
