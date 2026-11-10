const {compressPng}=require('./compress-png.cjs');
// Keep a single HD character model across directions and animation sheets.
// Each four-column master holds four eight-frame clips on pairs of rows.
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),dir=path.join(root,'assets/aliens');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||(fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined),args:['--no-sandbox']});
 try{
  const page=await browser.newPage();let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const start=html.indexOf('function prepareAtlas('),end=html.indexOf('\nfunction normalizeAtlas(',start);
  await page.setContent('<html><body></body></html>');await page.addScriptTag({content:html.slice(start,end)+';window.__compile={prepareAtlas};'});
  const layouts=[
   {name:'four-arms-hd-guard.png',targets:[0,1,2,3]},
   {name:'four-arms-hd-walk.png',targets:[4,5,6,7]},
   {name:'four-arms-hd-side.png',targets:[8,9,12,13]},
   {name:'four-arms-hd-melee.png',targets:[14,15,16,17]},
   {name:'four-arms-hd-vertical.png',targets:[18,19,20,21]}
  ];
  const sources=layouts.map(layout=>({...layout,src:'data:image/png;base64,'+fs.readFileSync(path.join(dir,layout.name)).toString('base64')}));
  const result=await page.evaluate(async sources=>{
   const frames=[];
   for(const source of sources){
    const decoded=new Image();decoded.src=source.src;await decoded.decode();
    const clean=document.createElement('canvas');clean.width=decoded.naturalWidth;clean.height=decoded.naturalHeight;
    const cc=clean.getContext('2d',{willReadFrequently:true});cc.drawImage(decoded,0,0);
    const pixels=cc.getImageData(0,0,clean.width,clean.height);for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=128?255:0;cc.putImageData(pixels,0,0);
    const image=new Image();image.src=clean.toDataURL('image/png');await image.decode();
    const raw=__compile.prepareAtlas(image,4,8,Array(8).fill(4));
    const clips=Array.from({length:4},(_,r)=>[...raw.rows[r*2],...raw.rows[r*2+1]]);
    clips.forEach((clip,r)=>clip.forEach((frame,col)=>{frame.scale=160/clip[0].bodyHeight;frame.row=source.targets[r];frame.col=col;frames.push(frame);}));
   }
   // The old unused front/back rows keep their indices as aliases, so all
   // existing clips and saved documentation references stay compatible.
   for(const [from,to] of [[20,10],[21,11]])for(const frame of frames.filter(f=>f.row===from))frames.push({...frame,row:to});
   let extentX=0,extentUp=0,extentDown=0;
   for(const frame of frames){
    const p=frame.canvas.getContext('2d').getImageData(0,0,frame.w,frame.h).data;let xSum=0,n=0;
    for(let y=0;y<frame.h;y++)for(let x=0;x<frame.w;x++){const i=(y*frame.w+x)*4;if(p[i+3]>160&&p[i]>175&&p[i+1]>175&&p[i+2]>175){xSum+=x;n++;}}
    if(n<20)throw new Error('Cannot register Four Arms shirt '+frame.row+':'+frame.col);
    const lean=frame.row===13?16:[2,6,8,12].includes(frame.row)?6:[3,7,9].includes(frame.row)?-6:0;
    frame.anchorX=xSum/n-lean/frame.scale;
    extentX=Math.max(extentX,frame.anchorX*frame.scale,(frame.w-frame.anchorX)*frame.scale);
    extentUp=Math.max(extentUp,frame.anchorY*frame.scale);extentDown=Math.max(extentDown,(frame.h-frame.anchorY)*frame.scale);
   }
   const cellWidth=Math.ceil((extentX+8)/4)*8,anchorX=cellWidth/2,anchorY=Math.ceil((extentUp+8)/4)*4,cellHeight=Math.ceil((anchorY+extentDown+8)/4)*4;
   const canvas=document.createElement('canvas');canvas.width=cellWidth*8;canvas.height=cellHeight*22;const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
   for(const frame of frames){
    const cell=document.createElement('canvas');cell.width=cellWidth;cell.height=cellHeight;const cc=cell.getContext('2d',{willReadFrequently:true});cc.imageSmoothingEnabled=true;cc.imageSmoothingQuality='high';
    cc.drawImage(frame.canvas,anchorX-Math.round(frame.anchorX*frame.scale),anchorY-Math.round(frame.anchorY*frame.scale),Math.round(frame.w*frame.scale),Math.round(frame.h*frame.scale));
    const p=cc.getImageData(0,0,cellWidth,cellHeight).data;let bottom=0;for(let y=0;y<cellHeight;y++)for(let x=0;x<cellWidth;x++)if(p[(y*cellWidth+x)*4+3]>100)bottom=Math.max(bottom,y);
    c.drawImage(cell,frame.col*cellWidth,frame.row*cellHeight+anchorY-bottom-1);
   }
   return {png:canvas.toDataURL('image/png').split(',')[1],spec:{cols:8,rows:22,cellWidth,cellHeight,anchorX,anchorY,bodyHeight:160,resolutionScale:2,quality:'HD',registration:'torso-centre-and-ground'}};
  },sources);
  result.png=compressPng(Buffer.from(result.png,'base64')).toString('base64');
  fs.writeFileSync(path.join(dir,'four-arms-atlas.png'),Buffer.from(result.png,'base64'));fs.writeFileSync(path.join(dir,'four-arms-atlas.json'),JSON.stringify(result.spec,null,2)+'\n');
  const block='// FOUR_ARMS_ASSET_START\nconst FOUR_ARMS_ATLAS='+JSON.stringify(result.spec)+';\nconst fourArmsSheet=new Image();fourArmsSheet.src=\'data:image/png;base64,'+result.png+'\';\n// FOUR_ARMS_ASSET_END';
  html=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/\/\/ FOUR_ARMS_ASSET_START[\s\S]*?\/\/ FOUR_ARMS_ASSET_END/,()=>block);fs.writeFileSync(path.join(root,'index.html'),html);
  console.log('Four Arms HD: 176 registered poses',result.spec);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
