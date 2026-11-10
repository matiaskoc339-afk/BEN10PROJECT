const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright');
const {compressPng}=require('./compress-png.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/aliens');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const start=html.indexOf('function prepareAtlas('),end=html.indexOf('\nfunction normalizeAtlas(',start);
  await page.setContent('<html></html>');await page.addScriptTag({content:html.slice(start,end)+';window.__compile={prepareAtlas};'});
  const sources=['guard','float','phase','left','right','both','reveal'].map(name=>'data:image/png;base64,'+fs.readFileSync(path.join(dir,'ghostfreak-'+name+'-source.png')).toString('base64'));
  const result=await page.evaluate(async sources=>{
   const frames=[];
   for(const [action,src] of sources.entries()){
    const image=new Image();image.src=src;await image.decode();
    const clean=document.createElement('canvas');clean.width=image.naturalWidth;clean.height=image.naturalHeight;
    const cc=clean.getContext('2d',{willReadFrequently:true});cc.drawImage(image,0,0);
    const pixels=cc.getImageData(0,0,clean.width,clean.height);
    for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=128?255:0;
    cc.putImageData(pixels,0,0);const decoded=new Image();decoded.src=clean.toDataURL();await decoded.decode();
    const raw=__compile.prepareAtlas(decoded,4,8,Array(8).fill(4));
    for(let d=0;d<4;d++){
     const clip=[...raw.rows[d*2],...raw.rows[d*2+1]],scale=160/clip[0].bodyHeight;
     for(const [col,f] of clip.entries()){
      const p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data,top=f.anchorY-f.bodyHeight;
      let sum=0,mass=0;
      // Register on the pointed hood, not the moving tail or striking hands.
      for(let y=Math.max(0,Math.floor(top));y<Math.min(f.h,top+f.bodyHeight*.2);y++)for(let x=0;x<f.w;x++)if(p[(y*f.w+x)*4+3]>160){sum+=x;mass++;}
      f.anchorX=mass?sum/mass:f.w/2;f.sourceTop=top;f.scale=scale;f.row=action*4+d;f.col=col;frames.push(f);
     }
    }
   }
   let extentX=0,down=0;
   for(const f of frames){extentX=Math.max(extentX,f.anchorX*f.scale,(f.w-f.anchorX)*f.scale);down=Math.max(down,(f.h-f.sourceTop)*f.scale-160);}
   const cellWidth=Math.ceil((extentX+10)/4)*8,anchorX=cellWidth/2,anchorY=176,cellHeight=Math.ceil((anchorY+down+10)/4)*4;
   const canvas=document.createElement('canvas');canvas.width=cellWidth*8;canvas.height=cellHeight*28;const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
   for(const f of frames)c.drawImage(f.canvas,f.col*cellWidth+anchorX-Math.round(f.anchorX*f.scale),f.row*cellHeight+anchorY-160-Math.round(f.sourceTop*f.scale),Math.round(f.w*f.scale),Math.round(f.h*f.scale));
   return {png:canvas.toDataURL().split(',')[1],spec:{cols:8,rows:28,cellWidth,cellHeight,anchorX,anchorY,bodyHeight:160,resolutionScale:2,quality:'HD',registration:'hood-and-floating-tail'}};
  },sources);
  result.png=compressPng(Buffer.from(result.png,'base64')).toString('base64');
  fs.writeFileSync(path.join(dir,'ghostfreak-atlas.png'),Buffer.from(result.png,'base64'));fs.writeFileSync(path.join(dir,'ghostfreak-atlas.json'),JSON.stringify(result.spec,null,2)+'\n');
  const block='// GHOSTFREAK_ASSET_START\nconst GHOSTFREAK_ATLAS='+JSON.stringify(result.spec)+';\nconst ghostfreakSheet=new Image();ghostfreakSheet.src=\'data:image/png;base64,'+result.png+'\';\n// GHOSTFREAK_ASSET_END';
  html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  if(html.includes('// GHOSTFREAK_ASSET_START'))html=html.replace(/\/\/ GHOSTFREAK_ASSET_START[\s\S]*?\/\/ GHOSTFREAK_ASSET_END/,()=>block);
  else html=html.replace('let watchIcon=null;',()=>block+'\nlet watchIcon=null;');
  fs.writeFileSync(path.join(root,'index.html'),html);console.log('Ghostfreak: 224 registered HD poses',result.spec);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
