const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright'),{compressPng}=require('./compress-png.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/aliens');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage();let html=fs.readFileSync(path.join(root,'index.html'),'utf8');const start=html.indexOf('function prepareAtlas('),end=html.indexOf('\nfunction normalizeAtlas(',start);
 await page.setContent('<html></html>');await page.addScriptTag({content:html.slice(start,end)+';window.__compile={prepareAtlas};'});
 const sources=['guard','walk','dash','spit-a','spit-b','spit-c','tail','pool'].map(n=>'data:image/png;base64,'+fs.readFileSync(path.join(dir,'stinkfly-'+n+'-source.png')).toString('base64'));
 const result=await page.evaluate(async sources=>{
  const frames=[],replaced=[];
  function orange(p,i){return p[i+3]>160&&p[i]>135&&p[i+1]>40&&p[i+1]<170&&p[i+2]<95&&p[i]>p[i+1]*1.15;}
  for(const [action,src] of sources.entries()){
   const original=new Image();original.src=src;await original.decode();const clean=document.createElement('canvas');clean.width=original.naturalWidth;clean.height=original.naturalHeight;const cc=clean.getContext('2d',{willReadFrequently:true});cc.drawImage(original,0,0);const rawPixels=cc.getImageData(0,0,clean.width,clean.height);
   for(let i=3;i<rawPixels.data.length;i+=4)rawPixels.data[i]=rawPixels.data[i]>=128?255:0;cc.putImageData(rawPixels,0,0);
   const decoded=new Image();decoded.src=clean.toDataURL();await decoded.decode();const raw=__compile.prepareAtlas(decoded,4,8,Array(8).fill(4));
   for(let direction=0;direction<4;direction++){
    const clip=action===7?raw.rows.map(row=>row[direction]):[...raw.rows[direction*2],...raw.rows[direction*2+1]],scale=160/clip[0].bodyHeight;
    const clipped=f=>{const p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data;for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++)if(p[(y*f.w+x)*4+3]>160&&(f.x+x===0||f.y+y===0||f.x+x===clean.width-1||f.y+y===clean.height-1))return true;return false;};
    const safe=clip.map(f=>!clipped(f));
    for(let col=0;col<8;col++){
     let source=col;if(!safe[col]){const preferred=action===2?[5,6,4,1,7,0]:action===6?[6,4,5,2,1,7,0]:[4,3,5,6,1,7,0];source=preferred.find(i=>safe[i]);if(source===undefined)throw new Error('No complete Stinkfly pose');replaced.push({action,direction,col,source});}
     const f={...clip[source],scale,row:action*4+direction,col};const p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data,top=f.anchorY-f.bodyHeight;
     let sum=0,mass=0;
     for(let y=Math.max(0,Math.floor(top+f.bodyHeight*.36));y<Math.min(f.h,top+f.bodyHeight*.7);y++)for(let x=0;x<f.w;x++){const i=(y*f.w+x)*4;if(p[i+3]>160&&p[i]>185&&p[i+1]>185&&p[i+2]>185){sum+=x;mass++;}}
     if(!mass)for(let y=Math.max(0,Math.floor(top+f.bodyHeight*.12));y<Math.min(f.h,top+f.bodyHeight*.46);y++)for(let x=Math.floor(f.w*.18);x<f.w*.82;x++){const i=(y*f.w+x)*4;if(p[i+3]>160&&p[i]<45&&p[i+1]<45&&p[i+2]<45){sum+=x;mass++;}}
     f.anchorX=mass?sum/mass:f.w/2;
     const seen=new Uint8Array(f.w*f.h),eyes=[];
     for(let q=0;q<seen.length;q++)if(!seen[q]&&orange(p,q*4)){
      const queue=[q];seen[q]=1;let sx=0,sy=0;
      for(let h=0;h<queue.length;h++){const at=queue[h],x=at%f.w,y=Math.floor(at/f.w);sx+=x;sy+=y;for(const n of [at-f.w,at+f.w,x?at-1:-1,x+1<f.w?at+1:-1])if(n>=0&&n<seen.length&&!seen[n]&&orange(p,n*4)){seen[n]=1;queue.push(n)}}
      if(queue.length>=2)eyes.push({x:sx/queue.length,y:sy/queue.length,mass:queue.length});
     }
     eyes.sort((a,b)=>b.mass-a.mass);const ports=eyes.slice(0,4).sort((a,b)=>a.y-b.y||a.x-b.x);
     if(!ports.length)throw new Error('No orange stalk nozzles in '+f.row+':'+col);
     while(ports.length<4)ports.push({...ports[ports.length-1]});
     f.ports=ports.map(pt=>({x:Math.round((pt.x-f.anchorX)*scale),y:Math.round((pt.y-f.anchorY)*scale)}));frames.push(f);
    }
   }
  }
  let extentX=0,extentUp=0,extentDown=0;for(const f of frames){extentX=Math.max(extentX,f.anchorX*f.scale,(f.w-f.anchorX)*f.scale);extentUp=Math.max(extentUp,f.anchorY*f.scale);extentDown=Math.max(extentDown,(f.h-f.anchorY)*f.scale);}
  const cellWidth=Math.ceil((extentX+10)/4)*8,anchorX=cellWidth/2,anchorY=Math.ceil((extentUp+10)/4)*4,cellHeight=Math.ceil((anchorY+extentDown+10)/4)*4;
  const canvas=document.createElement('canvas');canvas.width=cellWidth*8;canvas.height=cellHeight*32;const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  const ports=Array.from({length:32},()=>Array(8));
  for(const f of frames){c.drawImage(f.canvas,f.col*cellWidth+anchorX-Math.round(f.anchorX*f.scale),f.row*cellHeight+anchorY-Math.round(f.anchorY*f.scale),Math.round(f.w*f.scale),Math.round(f.h*f.scale));ports[f.row][f.col]=f.ports;}
  return {png:canvas.toDataURL().split(',')[1],spec:{cols:8,rows:32,cellWidth,cellHeight,anchorX,anchorY,bodyHeight:160,resolutionScale:2,quality:'HD',registration:'thorax-and-ground'},ports,replaced};
 },sources);
 const png=compressPng(Buffer.from(result.png,'base64'));fs.writeFileSync(path.join(dir,'stinkfly-atlas.png'),png);fs.writeFileSync(path.join(dir,'stinkfly-atlas.json'),JSON.stringify(result.spec,null,2)+'\n');fs.writeFileSync(path.join(dir,'stinkfly-ports.json'),JSON.stringify(result.ports)+'\n');
 const block='// STINKFLY_ASSET_START\nconst STINKFLY_ATLAS='+JSON.stringify(result.spec)+';\nconst STINKFLY_PORTS='+JSON.stringify(result.ports)+';\nconst stinkflySheet=new Image();stinkflySheet.src=\'data:image/png;base64,'+png.toString('base64')+'\';\n// STINKFLY_ASSET_END';
 html=fs.readFileSync(path.join(root,'index.html'),'utf8');if(html.includes('// STINKFLY_ASSET_START'))html=html.replace(/\/\/ STINKFLY_ASSET_START[\s\S]*?\/\/ STINKFLY_ASSET_END/,()=>block);else html=html.replace('let watchIcon=null;',()=>block+'\nlet watchIcon=null;');fs.writeFileSync(path.join(root,'index.html'),html);console.log('Stinkfly:256 registered poses',result.spec,'Complete-pose substitutions:',result.replaced);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
