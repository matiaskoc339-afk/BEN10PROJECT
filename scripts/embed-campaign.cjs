const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=file=>fs.readFileSync(path.join(root,file),'utf8'),target=path.join(root,'index.html');
let html=read('index.html');
function block(begin,end,value,before){
 const a=html.indexOf(begin),b=html.indexOf(end,a);
 if(a>=0&&b>=a)html=html.slice(0,a)+value+html.slice(b+end.length);
 else{if(!html.includes(before))throw Error('Missing integration anchor '+before);html=html.replace(before,()=>value+'\n'+before);}
}
function between(begin,end,value){const a=html.indexOf(begin),b=html.indexOf(end,a);if(a<0||b<a)throw Error('Missing game anchor '+begin);html=html.slice(0,a)+value+'\n'+html.slice(b);}
const css='/* CAMPAIGN_STYLE_START */\n'+read('systems/campaign.css')+'\n'+read('systems/enemy-ui.css')+'\n/* CAMPAIGN_STYLE_END */';
block('/* CAMPAIGN_STYLE_START */','/* CAMPAIGN_STYLE_END */',css,'</style>');
const modules='<!-- CAMPAIGN_MODULES_START -->\n<script>window.BEN10_CAMPAIGN_DATA='+JSON.stringify(JSON.parse(read('mapas/data/recorrido.json')))+';window.BEN10_ENEMY_DATA='+JSON.stringify(JSON.parse(read('enemigos/data/manifest.json')))+';</script>\n'+['mapas/world.js','systems/campaign-world.js','systems/campaign-renderer.js','systems/eternal-enemies.js','systems/enemy-renderer.js'].map(file=>'<script>\n'+read(file)+'\n</script>').join('\n')+'\n<!-- CAMPAIGN_MODULES_END -->';
block('<!-- CAMPAIGN_MODULES_START -->','<!-- CAMPAIGN_MODULES_END -->',modules,"<script>\n\n(()=>{'use strict';");
const ui='<!-- CAMPAIGN_UI_START -->\n'+read('systems/campaign-ui.html')+read('systems/enemy-ui.html')+'<!-- CAMPAIGN_UI_END -->';
block('<!-- CAMPAIGN_UI_START -->','<!-- CAMPAIGN_UI_END -->',ui,'<div id="combo">');
html=html.replace(/<div id="enemyCount">[^\n]+\n/,'').replace(/^#enemyCount \{[^\n]+\n/m,'');
html=html.replace(/#enemyCount\{[^}]+\}/g,'').replace('body.comic-active #enemyCount,','');
html=html.replace('aria-label="Campo de pruebas jugable"','aria-label="Recorrido jugable: calles, castillo y laboratorio"');
html=html.replace(/<title>[^<]+<\/title>/,'<title>Ben 10 — V35 · El asedio de los Eternos</title>');
html=html.replace('const WORLD={w:2400,h:1800}, TILE=48;', 'const campaign=new Ben10Campaign.Level(window.BEN10_CAMPAIGN_DATA);\nconst WORLD={w:campaign.width,h:campaign.height};');
if(html.includes('// Pixel-art city plaza:'))between('// Pixel-art city plaza:','function drawDummy(',read('systems/campaign-game.js'));
else block('// CAMPAIGN_GAME_START','// CAMPAIGN_GAME_END',read('systems/campaign-game.js').trim(),'function drawDummy(');
block('// ENEMY_GAME_START','// ENEMY_GAME_END',read('systems/enemy-game.js').trim(),'// CAMPAIGN_GAME_START');
between('function collide(','function startMode(', 'function collide(x,y,radius=actorMetrics().radius){return campaignCollide(x,y,radius);}');
between('function drawWorld(){','function render(', 'function drawWorld(){campaignDrawWorld();}');
between('function render(','function loop(', `function render(dt=1/60){
 ctx.setTransform(dpr,0,0,dpr,0,0);ctx.imageSmoothingEnabled=false;
 if(!assetsReady){ctx.fillStyle='#101c17';ctx.fillRect(0,0,screenW,screenH);ctx.fillStyle='#b7f17b';ctx.textAlign='center';ctx.font='bold 16px Consolas,monospace';ctx.fillText('PREPARANDO EL OMNITRIX Y EL RECORRIDO…',screenW/2,screenH/2);return;}
 campaignCamera(dt);ctx.save();if(shake)ctx.translate((rng()-.5)*shake,(rng()-.5)*shake);drawWorld();ctx.restore();
}`);
if(!html.includes('const campaignBefore={x:player.x,y:player.y};updateStats(dt);'))html=html.replace('updateStats(dt);t+=dt;evolutionTick(dt);','const campaignBefore={x:player.x,y:player.y};updateStats(dt);t+=dt;evolutionTick(dt);');
html=html.replace('if(!collide(newX,player.y))player.x=newX;\n if(!collide(player.x,newY))player.y=newY;','campaignMovePlayer(newX,newY);');
if(!html.includes('updateStats(0);campaignAfterUpdate(campaignBefore);'))html=html.replace('shake=Math.max(0,shake-dt*23);updateStats(0);','shake=Math.max(0,shake-dt*23);updateStats(0);campaignAfterUpdate(campaignBefore);');
if(!html.includes('campaignArt.ready,loadImage(sheet)'))html=html.replace('const readyPromise=Promise.all([loadImage(sheet)','const readyPromise=Promise.all([campaignArt.ready,loadImage(sheet)');
if(!html.includes('enemyArt.ready,campaignArt.ready'))html=html.replace('campaignArt.ready,loadImage(sheet)','enemyArt.ready,campaignArt.ready,loadImage(sheet)');
if(!html.includes('if(d.enemy)return enemyDamage('))html=html.replace('function damageDummy(d,damage,heavy,feedback={}){','function damageDummy(d,damage,heavy,feedback={}){\n if(d.enemy)return enemyDamage(d,damage,heavy,feedback);');
if(!html.includes('if(d.enemy)return enemyDraw('))html=html.replace('function drawDummy(d,options={}){','function drawDummy(d,options={}){if(d.enemy)return enemyDraw(d,options);');
html=html.replace('for(const d of dummyList){if(d.shake>0)','for(const d of dummyList){if(d.enemy)continue;if(d.shake>0)');
html=html.replace('if(isGhostfreak()&&Ben10Speed.clipSegment({x:player.x,y:player.y},d,speedWorld(),0).blocked)continue;','if(Ben10Speed.clipSegment({x:player.x,y:player.y},d,speedWorld(),0).blocked)continue;');
if(!html.includes('enemyGameTick(dt,campaignBefore);'))html=html.replace('updateStats(0);campaignAfterUpdate(campaignBefore);','enemyGameTick(dt,campaignBefore);updateStats(0);campaignAfterUpdate(campaignBefore);');
if(!html.includes("if(stats.health<=0&&assetsReady&&!comicOpen){"))html=html.replace('function update(dt){',"function update(dt){if(stats.health<=0&&assetsReady&&!comicOpen){t+=dt;player.mode='defeat';player.modeDur=1.2;player.modeTime=Math.min(1.2,player.modeTime+dt);enemySyncUI();return;}");
for(const name of ['lightAttack','heavyAttack','dodge'])if(!html.includes('function '+name+'(){if(stats.health<=0'))html=html.replace('function '+name+'(){','function '+name+'(){if(stats.health<=0||t<enemyStaggerUntil)return;');
html=html.replace("locked=player.mode==='omnitrix'||abilityLocked;","locked=player.mode==='omnitrix'||abilityLocked||t<enemyStaggerUntil;");
// Keep the native display scale, including fractional Windows/retina scaling.
html=html.replace('dpr=Math.min(Math.max(1,Math.round(devicePixelRatio||1)),2)','dpr=Math.min(Math.max(1,devicePixelRatio||1),2)');
html=html.replace('dpr=Math.min(Math.max(1.5,devicePixelRatio||1),2)','dpr=Math.min(Math.max(1,devicePixelRatio||1),2)');
html=html.replace('height:100vh; image-rendering:pixelated; cursor:crosshair;','height:100vh; image-rendering:auto; cursor:crosshair;');
html=html.replace('document.getElementById(\'count\').textContent=String(state.kills);','');
if(!html.includes("if(k==='e'&&!e.repeat){"))html=html.replace("keys.add(k);if(k===' '&&!e.repeat)dodge();", "if(k==='e'&&!e.repeat){if(campaignEnter())e.preventDefault();return;}keys.add(k);if(k===' '&&!e.repeat)dodge();");
html=html.replace("const a=actorMetrics();cam.zoom=a.zoom;\n cam.x=clamp(player.x-screenW/(2*cam.zoom),0,Math.max(0,WORLD.w-screenW/cam.zoom));\n cam.y=clamp(player.y-screenH*.52/cam.zoom-a.height*.45,0,Math.max(0,WORLD.h-screenH/cam.zoom));",'campaignCamera(0,true);');
html=html.replaceAll('fire.tick(dt,{targets:dummyList,obstacles:props,width:WORLD.w,height:WORLD.h}', 'fire.tick(dt,{...speedWorld(),targets:dummyList}');
for(const [name,file] of [['SPEED_ROUTE','systems/speed-route.js'],['FIRE_PROJECTILES','systems/fire-projectiles.js'],['GHOSTFREAK_ABILITY','systems/ghostfreak-ability.js'],['STINKFLY_FIELD','systems/stinkfly-field.js']]){
 block('<!-- '+name+'_START -->','<!-- '+name+'_END -->','<!-- '+name+'_START -->\n<script>\n'+read(file)+'\n</script>\n<!-- '+name+'_END -->','<!-- CAMPAIGN_MODULES_START -->');
}
for(const [name,file] of [['XLR8_GAME','systems/xlr8-game.js'],['STINKFLY_GAME','systems/stinkfly-game.js']])block('// '+name+'_START','// '+name+'_END','// '+name+'_START\n'+read(file)+'// '+name+'_END','function update(dt){');
fs.writeFileSync(target,html);
console.log('Embedded V35: role-based knights, progressive locked encounters, three champions and refined map rendering.');
