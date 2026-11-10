const {compressPng}=require('./compress-png.cjs');
// Compile original eight-frame clips into one registered HD texture.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/aliens');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage();let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const start=html.indexOf('function prepareAtlas('),end=html.indexOf('\nfunction normalizeAtlas(',start);
  await page.setContent('<html></html>');await page.addScriptTag({content:html.slice(start,end)+';window.__compile={prepareAtlas};'});
  const names=['guard','unfold','roll','left','right',null,'slam','unfold'];
  const sources=names.map(name=>name?'data:image/png;base64,'+fs.readFileSync(path.join(dir,'cannonbolt-'+name+'-source.png')).toString('base64'):null);
  const result=await page.evaluate(async sources=>{
   const frames=[];
   for(const [action,src] of sources.entries()){
    if(!src)continue;
    const decoded=new Image();decoded.src=src;await decoded.decode();
    const clean=document.createElement('canvas');clean.width=decoded.naturalWidth;clean.height=decoded.naturalHeight;
    const cc=clean.getContext('2d',{willReadFrequently:true});cc.drawImage(decoded,0,0);
    const pixels=cc.getImageData(0,0,clean.width,clean.height);
    for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=128?255:0;
    cc.putImageData(pixels,0,0);
    const image=new Image();image.src=clean.toDataURL('image/png');await image.decode();
    const raw=__compile.prepareAtlas(image,4,8,Array(8).fill(4));
    const clips=Array.from({length:4},(_,r)=>[...raw.rows[r*2],...raw.rows[r*2+1]]);
    if(action===1)for(const clip of clips)clip.reverse();
    clips.forEach((clip,direction)=>clip.forEach((frame,col)=>{
     const morph=[118,118,124,132,140,149,156,160];
     frame.scale=action===1?morph[7-col]/frame.bodyHeight:action===7?morph[col]/frame.bodyHeight:action===2?118/frame.bodyHeight:([6].includes(action)?118:160)/clip[0].bodyHeight;frame.row=action*4+direction;frame.col=col;
     const p=frame.canvas.getContext('2d').getImageData(0,0,frame.w,frame.h).data;
     const sphere=[2,6].includes(action)||(action===1&&col>=6)||(action===5&&col>=4)||(action===7&&col<=1);
     const top=frame.anchorY-frame.bodyHeight;let centre=0,mass=0;
     if(!sphere)for(let y=Math.max(0,Math.floor(top+frame.bodyHeight*.3));y<Math.min(frame.h,top+frame.bodyHeight*.8);y++)for(let x=0;x<frame.w;x++){
      const i=(y*frame.w+x)*4;
      if(p[i+3]>160&&p[i]>150&&p[i+1]>150&&p[i+2]>150&&Math.max(p[i],p[i+1],p[i+2])-Math.min(p[i],p[i+1],p[i+2])<35){centre+=x;mass++;}
     }
     // White belly anchors the standing body; a sphere uses its geometric centre.
     frame.anchorX=mass?centre/mass:frame.w/2;frames.push(frame);
    }));
   }
   // Curling is the physical reverse of opening. Closed endpoints share the
   // rolling shell, so its diameter and panel model never pop on a state change.
   const replace=(row,col,source)=>{const at=frames.findIndex(f=>f.row===row&&f.col===col);if(at<0)frames.push({...source,row,col});else frames[at]={...source,row,col};};
   for(let d=0;d<4;d++){
    const roll=frames.filter(f=>f.row===8+d).sort((a,b)=>a.col-b.col),slam=frames.filter(f=>f.row===24+d).sort((a,b)=>a.col-b.col);
    replace(4+d,6,roll[1]);replace(4+d,7,roll[0]);replace(28+d,0,roll[0]);replace(28+d,1,roll[1]);
    const fold=frames.filter(f=>f.row===4+d).sort((a,b)=>a.col-b.col);
    for(const [col,src] of [[0,fold[0]],[1,fold[2]],[2,fold[4]],[3,fold[5]],[4,roll[0]],[5,slam[1]],[6,roll[1]],[7,slam[1]]])replace(20+d,col,src);
   }
   let extentX=0,extentUp=0,extentDown=0;
   for(const f of frames){extentX=Math.max(extentX,f.anchorX*f.scale,(f.w-f.anchorX)*f.scale);extentUp=Math.max(extentUp,f.anchorY*f.scale);extentDown=Math.max(extentDown,(f.h-f.anchorY)*f.scale);}
   const cellWidth=Math.ceil((extentX+8)/4)*8,anchorX=cellWidth/2,anchorY=Math.ceil((extentUp+8)/4)*4,cellHeight=Math.ceil((anchorY+extentDown+8)/4)*4;
   const canvas=document.createElement('canvas');canvas.width=cellWidth*8;canvas.height=cellHeight*32;const c=canvas.getContext('2d');
   for(const f of frames){
    const cell=document.createElement('canvas');cell.width=cellWidth;cell.height=cellHeight;const cc=cell.getContext('2d',{willReadFrequently:true});cc.imageSmoothingEnabled=true;cc.imageSmoothingQuality='high';
    cc.drawImage(f.canvas,anchorX-Math.round(f.anchorX*f.scale),anchorY-Math.round(f.anchorY*f.scale),Math.round(f.w*f.scale),Math.round(f.h*f.scale));
    const p=cc.getImageData(0,0,cellWidth,cellHeight).data;let bottom=0;
    for(let y=0;y<cellHeight;y++)for(let x=0;x<cellWidth;x++)if(p[(y*cellWidth+x)*4+3]>100)bottom=Math.max(bottom,y);
    c.drawImage(cell,f.col*cellWidth,f.row*cellHeight+anchorY-bottom-1);
   }
   return {png:canvas.toDataURL().split(',')[1],spec:{cols:8,rows:32,cellWidth,cellHeight,anchorX,anchorY,bodyHeight:160,resolutionScale:2,quality:'HD',registration:'pelvis-and-ground'}};
  },sources);
  result.png=compressPng(Buffer.from(result.png,'base64')).toString('base64');
  fs.writeFileSync(path.join(dir,'cannonbolt-atlas.png'),Buffer.from(result.png,'base64'));
  fs.writeFileSync(path.join(dir,'cannonbolt-atlas.json'),JSON.stringify(result.spec,null,2)+'\n');
  const block='// CANNONBOLT_ASSET_START\nconst CANNONBOLT_ATLAS='+JSON.stringify(result.spec)+';\nconst cannonboltSheet=new Image();cannonboltSheet.src=\'data:image/png;base64,'+result.png+'\';\n// CANNONBOLT_ASSET_END';
  html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  if(html.includes('// CANNONBOLT_ASSET_START'))html=html.replace(/\/\/ CANNONBOLT_ASSET_START[\s\S]*?\/\/ CANNONBOLT_ASSET_END/,()=>block);
  else html=html.replace('let watchIcon=null;',()=>block+'\nlet watchIcon=null;');
  fs.writeFileSync(path.join(root,'index.html'),html);console.log('Cannonbolt: 256 registered HD poses',result.spec);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
