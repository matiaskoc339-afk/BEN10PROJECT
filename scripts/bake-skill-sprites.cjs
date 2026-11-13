const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
let chromium;try{({chromium}=require('playwright'))}catch{({chromium}=require('/workspace/BEN10PROJECT/node_modules/playwright'))}
const root=path.resolve(__dirname,'..'),folder=path.join(root,'assets/skills'),book=JSON.parse(fs.readFileSync(path.join(folder,'catalog.json'),'utf8'));
(async()=>{const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),at=html.lastIndexOf('\n})();'),instrumented=html.slice(0,at)+'\nwindow.__skillBake={ready:()=>assetsReady};\n'+html.slice(at);
 const server=http.createServer((req,res)=>{const name=new URL(req.url,'http://localhost').pathname;if(name==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');return res.end(instrumented)}const file=path.resolve(root,'.'+name);if(!file.startsWith(root+'/')||!fs.existsSync(file)){res.writeHead(404);return res.end()}res.setHeader('Content-Type','image/png');fs.createReadStream(file).pipe(res)});await new Promise(r=>server.listen(8812,'127.0.0.1',r));
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
 try{const page=await browser.newPage();page.on('pageerror',e=>console.error(e.message));await page.goto('http://127.0.0.1:8812/',{waitUntil:'load',timeout:90000});await page.waitForFunction(()=>window.__skillBake?.ready(),{},{timeout:60000});if(!await page.evaluate(()=>Ben10SkillArt.modelsReady))throw Error('The ten original native atlases must be registered');const manifest=[];
  for(const spec of book.filter(s=>!process.env.SKILL_FORM||s.id===process.env.SKILL_FORM)){
   for(const skill of spec.skills){
    const result=await page.evaluate(({spec,skill})=>{const a=Ben10SkillArt,box=a.layout(spec.id),c=document.createElement('canvas');c.width=a.columns*box.cellWidth;c.height=Math.ceil(a.frames*4/a.columns)*box.cellHeight;const ctx=c.getContext('2d');ctx.imageSmoothingEnabled=false;
     for(let d=0;d<4;d++)for(let f=0;f<a.frames;f++){const n=d*a.frames+f,x=n%a.columns*box.cellWidth,y=Math.floor(n/a.columns)*box.cellHeight;ctx.save();ctx.beginPath();ctx.rect(x,y,box.cellWidth,box.cellHeight);ctx.clip();a.draw(ctx,spec.id,skill.motion,f/(a.frames-1),['down','up','right','left'][d],x+box.anchorX,y+box.anchorY,box.bodyHeight);ctx.restore()}
     return {png:c.toDataURL('image/png').split(',')[1],width:c.width,height:c.height,frames:a.frames*4};
    },{spec,skill});
    const file=spec.id+'-'+skill.id+'.png';fs.writeFileSync(path.join(folder,file),Buffer.from(result.png,'base64'));manifest.push({form:spec.id,skill:skill.id,motion:skill.motion,file,frames:result.frames,width:result.width,height:result.height});
   }console.log(spec.name+': '+spec.skills.length+' clips × 4 direcciones × 18 fotogramas');
  }if(!process.env.SKILL_FORM)fs.writeFileSync(path.join(folder,'atlas-manifest.json'),JSON.stringify(manifest,null,2)+'\n');console.log('Baked '+manifest.length+' sprite sheets / '+manifest.reduce((n,x)=>n+x.frames,0)+' poses.');
  require('node:child_process').execFileSync('python3',[path.join(root,'scripts/pack-skill-sprites.py')],{stdio:'inherit'});require('./embed-evolution.cjs');
 }finally{await browser.close();server.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
