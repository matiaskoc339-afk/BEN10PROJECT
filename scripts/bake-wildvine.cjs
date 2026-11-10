const fs=require('node:fs'),path=require('node:path'),{chromium}=require('playwright'),{compressPng}=require('./compress-png.cjs');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/aliens');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});try{
 const page=await browser.newPage();let html=fs.readFileSync(path.join(root,'index.html'),'utf8');const start=html.indexOf('function prepareAtlas('),end=html.indexOf('\nfunction normalizeAtlas(',start);
 await page.setContent('<html></html>');await page.addScriptTag({content:html.slice(start,end)+';window.__compile={prepareAtlas};'});
 const names=['guard','walk','dash','right-whip','left-whip','double','spin','plant','thorns'],sources=names.map(n=>'data:image/png;base64,'+fs.readFileSync(path.join(dir,'wildvine-'+n+'-source.png')).toString('base64'));
 const result=await page.evaluate(async sources=>{
  const frames=[],replaced=[];
  async function decode(src,rows){const original=new Image();original.src=src;await original.decode();const clean=document.createElement('canvas');clean.width=original.naturalWidth;clean.height=original.naturalHeight;const c=clean.getContext('2d',{willReadFrequently:true});c.drawImage(original,0,0);const pixels=c.getImageData(0,0,clean.width,clean.height);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=128?255:0;c.putImageData(pixels,0,0);const image=new Image();image.src=clean.toDataURL();await image.decode();return {raw:__compile.prepareAtlas(image,4,rows,Array(rows).fill(4)),width:clean.width,height:clean.height};}
  for(let action=0;action<8;action++){
   const {raw,width,height}=await decode(sources[action],8);
   for(let direction=0;direction<4;direction++){
    const clip=[...raw.rows[direction*2],...raw.rows[direction*2+1]];
    const cut=f=>{const p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data;for(let y=0;y<f.h;y++)for(let x=0;x<f.w;x++)if(p[(y*f.w+x)*4+3]>160&&(f.x+x===0||f.y+y===0||f.x+x===width-1||f.y+y===height-1))return true;return false;};
    const safe=clip.map(f=>!cut(f)),reference=safe[0]?0:safe.findIndex(Boolean);if(reference<0)throw new Error('No complete Wildvine pose '+action+':'+direction);const scale=160/clip[reference].bodyHeight;
    for(let col=0;col<8;col++){
     let source=col;if(!safe[col]){const preferred=col===0?[7,1,6,2,5,3,4]:[col-1,col+1,6,5,4,3,2,1,7,0];source=preferred.find(i=>i>=0&&i<8&&safe[i]);replaced.push({action,direction,col,source});}
     const f={...clip[source],scale,row:action*4+direction,col},p=f.canvas.getContext('2d').getImageData(0,0,f.w,f.h).data,top=f.anchorY-f.bodyHeight;let sum=0,mass=0;
     // Register to the chest watch; back views use the turquoise shoulder pods.
     for(let y=Math.max(0,Math.floor(top+f.bodyHeight*.24));y<Math.min(f.h,top+f.bodyHeight*.59);y++)for(let x=0;x<f.w;x++){const i=(y*f.w+x)*4;if(p[i+3]>160&&p[i]>175&&p[i+1]>175&&p[i+2]>175){sum+=x;mass++;}}
     if(!mass)for(let y=Math.max(0,Math.floor(top+f.bodyHeight*.1));y<Math.min(f.h,top+f.bodyHeight*.48);y++)for(let x=0;x<f.w;x++){const i=(y*f.w+x)*4;if(p[i+3]>160&&p[i+1]>90&&p[i+2]>p[i]*1.5&&p[i+1]>p[i]*1.5&&p[i+2]>p[i+1]*.8){sum+=x;mass++;}}
     f.anchorX=mass?sum/mass:f.anchorX;frames.push(f);
    }
   }
  }
  function pack(frames,cols,rows,bodyHeight){let extentX=0,extentUp=0,extentDown=0;for(const f of frames){extentX=Math.max(extentX,f.anchorX*f.scale,(f.w-f.anchorX)*f.scale);extentUp=Math.max(extentUp,f.anchorY*f.scale);extentDown=Math.max(extentDown,(f.h-f.anchorY)*f.scale);}const cellWidth=Math.ceil((extentX+10)/4)*8,anchorX=cellWidth/2,anchorY=Math.ceil((extentUp+10)/4)*4,cellHeight=Math.ceil((anchorY+extentDown+10)/4)*4,canvas=document.createElement('canvas');canvas.width=cellWidth*cols;canvas.height=cellHeight*rows;const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';for(const f of frames)c.drawImage(f.canvas,f.col*cellWidth+anchorX-Math.round(f.anchorX*f.scale),f.row*cellHeight+anchorY-Math.round(f.anchorY*f.scale),Math.round(f.w*f.scale),Math.round(f.h*f.scale));return {png:canvas.toDataURL().split(',')[1],spec:{cols,rows,cellWidth,cellHeight,anchorX,anchorY,bodyHeight,resolutionScale:bodyHeight/80,quality:'HD',registration:'chest-and-ground'}};}
  const fx=await decode(sources[8],4),effectFrames=fx.raw.rows.flat(),scale=128/Math.max(...effectFrames.map(f=>f.bodyHeight));for(const f of effectFrames){f.scale=scale;f.anchorX=(f.col+.5)*fx.width/4-f.x;}
  return {character:pack(frames,8,32,160),thorns:pack(effectFrames,4,4,128),replaced};
 },sources);
 let block='// WILDVINE_ASSET_START\n';
 for(const [kind,name,constant,variable] of [['character','wildvine','WILDVINE_ATLAS','wildvineSheet'],['thorns','wildvine-thorns','WILD_THORN_ATLAS','wildThornSheet']]){const r=result[kind],png=compressPng(Buffer.from(r.png,'base64'));fs.writeFileSync(path.join(dir,name+'-atlas.png'),png);fs.writeFileSync(path.join(dir,name+'-atlas.json'),JSON.stringify(r.spec,null,2)+'\n');block+='const '+constant+'='+JSON.stringify(r.spec)+';\nconst '+variable+'=new Image();'+variable+'.src=\'data:image/png;base64,'+png.toString('base64')+'\';\n';console.log(name,r.spec,'bytes',png.length);}
 block+='// WILDVINE_ASSET_END';html=fs.readFileSync(path.join(root,'index.html'),'utf8');if(html.includes('// WILDVINE_ASSET_START'))html=html.replace(/\/\/ WILDVINE_ASSET_START[\s\S]*?\/\/ WILDVINE_ASSET_END/,()=>block);else html=html.replace('let watchIcon=null;',()=>block+'\nlet watchIcon=null;');fs.writeFileSync(path.join(root,'index.html'),html);console.log('Complete-pose substitutions:',result.replaced);
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
