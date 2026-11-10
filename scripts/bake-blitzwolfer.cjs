const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright'),{compressPng}=require('./compress-png.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/aliens');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage();let html=fs.readFileSync(path.join(root,'index.html'),'utf8');const start=html.indexOf('function prepareAtlas('),end=html.indexOf('\nfunction normalizeAtlas(',start);
 await page.setContent('<html></html>');await page.addScriptTag({content:html.slice(start,end)+';window.__compile={prepareAtlas};'});
 const names=['guard','walk','dash','claw-right','claw-left','bite','rush','howl'],sources=names.map(n=>'data:image/png;base64,'+fs.readFileSync(path.join(dir,'blitzwolfer-'+n+'-source.png')).toString('base64'));
 const result=await page.evaluate(async sources=>{
  const frames=[],replaced=[],scales=[],mouths=Array.from({length:4},()=>Array(8));
  async function decode(src,rows){const original=new Image();original.src=src;await original.decode();const clean=document.createElement('canvas');clean.width=original.naturalWidth;clean.height=original.naturalHeight;const c=clean.getContext('2d',{willReadFrequently:true});c.drawImage(original,0,0);const pixels=c.getImageData(0,0,clean.width,clean.height);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=128?255:0;c.putImageData(pixels,0,0);const image=new Image();image.src=clean.toDataURL();await image.decode();return {raw:__compile.prepareAtlas(image,4,rows,Array(rows).fill(4)),width:clean.width,height:clean.height};}
  for(let action=0;action<8;action++){
   const {raw,width,height}=await decode(sources[action],8);
   for(let direction=0;direction<4;direction++){
    const clip=[...raw.rows[direction*2],...raw.rows[direction*2+1]];
    const cut=f=>{const p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data;for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++)if(p[(y*f.w+x)*4+3]>160&&(f.x+x===0||f.y+y===0||f.x+x===width-1||f.y+y===height-1))return true;return false;};
    const safe=clip.map(f=>!cut(f)),reference=safe[0]?0:safe.findIndex(Boolean);if(reference<0)throw new Error('No complete Blitzwolfer pose '+action+':'+direction);const scale=(action===1||action===2)?scales[direction]:160/clip[reference].bodyHeight;if(action===0)scales[direction]=scale;
    for(let col=0;col<8;col++){
     let source=col;if(!safe[col]){const preferred=col===0?[7,1,6,2,5,3,4]:[col-1,col+1,6,5,4,3,2,1,7,0];source=preferred.find(i=>i>=0&&i<8&&safe[i]);replaced.push({action,direction,col,source});}
     const f={...clip[source],scale,row:action*4+direction,col},p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data,top=f.anchorY-f.bodyHeight;let sum=0,mass=0;
     // White torso and waist anchor the body independently of swinging paws/tail.
     for(let y=Math.max(0,Math.floor(top+f.bodyHeight*.3));y<Math.min(f.h,top+f.bodyHeight*.7);y++)for(let x=0;x<f.w;x++){const i=(y*f.w+x)*4;if(p[i+3]>160&&p[i]>170&&p[i+1]>170&&p[i+2]>170){sum+=x;mass++;}}
     f.anchorX=mass?sum/mass:f.anchorX;
     if(action===7){
      const seen=new Uint8Array(f.w*f.h),components=[];const green=q=>p[q*4+3]>160&&p[q*4+1]>130&&p[q*4]<p[q*4+1]*.85&&p[q*4+2]<p[q*4+1]*.65;
      for(let q=0;q<seen.length;q++)if(!seen[q]&&green(q)){const queue=[q];seen[q]=1;let sx=0,sy=0;for(let h=0;h<queue.length;h++){const at=queue[h],x=at%f.w,y=Math.floor(at/f.w);sx+=x;sy+=y;for(const n of [at-f.w,at+f.w,x?at-1:-1,x+1<f.w?at+1:-1])if(n>=0&&n<seen.length&&!seen[n]&&green(n)){seen[n]=1;queue.push(n)}}components.push({x:sx/queue.length,y:sy/queue.length,mass:queue.length});}
      components.sort((a,b)=>b.mass-a.mass);const point=components[0]||{x:f.anchorX,y:top+f.bodyHeight*.15};mouths[direction][col]={x:Math.round((point.x-f.anchorX)*scale),y:Math.round((point.y-f.anchorY)*scale)};
     }
     frames.push(f);
    }
   }
  }
  function pack(frames,cols,rows,bodyHeight){let extentX=0,extentUp=0,extentDown=0;for(const f of frames){extentX=Math.max(extentX,f.anchorX*f.scale,(f.w-f.anchorX)*f.scale);extentUp=Math.max(extentUp,f.anchorY*f.scale);extentDown=Math.max(extentDown,(f.h-f.anchorY)*f.scale);}const cellWidth=Math.ceil((extentX+10)/4)*8,anchorX=cellWidth/2,anchorY=Math.ceil((extentUp+10)/4)*4,cellHeight=Math.ceil((anchorY+extentDown+10)/4)*4,canvas=document.createElement('canvas');canvas.width=cellWidth*cols;canvas.height=cellHeight*rows;const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';for(const f of frames)c.drawImage(f.canvas,f.col*cellWidth+anchorX-Math.round(f.anchorX*f.scale),f.row*cellHeight+anchorY-Math.round(f.anchorY*f.scale),Math.round(f.w*f.scale),Math.round(f.h*f.scale));return {png:canvas.toDataURL().split(',')[1],spec:{cols,rows,cellWidth,cellHeight,anchorX,anchorY,bodyHeight,resolutionScale:bodyHeight/80,quality:'HD',registration:'chest-and-ground'}};}
  return {...pack(frames,8,32,160),mouths,replaced};
 },sources);
 const png=compressPng(Buffer.from(result.png,'base64'));fs.writeFileSync(path.join(dir,'blitzwolfer-atlas.png'),png);fs.writeFileSync(path.join(dir,'blitzwolfer-atlas.json'),JSON.stringify(result.spec,null,2)+'\n');fs.writeFileSync(path.join(dir,'blitzwolfer-mouths.json'),JSON.stringify(result.mouths)+'\n');
 let block='// BLITZWOLFER_ASSET_START\nconst BLITZWOLFER_ATLAS='+JSON.stringify(result.spec)+';\nconst BLITZ_MOUTHS='+JSON.stringify(result.mouths)+';\nconst blitzwolferSheet=new Image();blitzwolferSheet.src=\'data:image/png;base64,'+png.toString('base64')+'\';\n';console.log('Blitzwolfer256poses',result.spec,'bytes',png.length);
 block+='// BLITZWOLFER_ASSET_END';html=fs.readFileSync(path.join(root,'index.html'),'utf8');if(html.includes('// BLITZWOLFER_ASSET_START'))html=html.replace(/\/\/ BLITZWOLFER_ASSET_START[\s\S]*?\/\/ BLITZWOLFER_ASSET_END/,()=>block);else html=html.replace('let watchIcon=null;',()=>block+'\nlet watchIcon=null;');fs.writeFileSync(path.join(root,'index.html'),html);console.log('Complete-pose substitutions:',result.replaced);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
