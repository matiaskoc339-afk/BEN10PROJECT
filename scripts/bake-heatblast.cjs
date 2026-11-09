// Register whole silhouettes on the torso centre and ground plane. Swinging
// feet must not pull the whole body sideways between animation frames.
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'assets/aliens');
(async () => {
  const browser = await chromium.launch({executablePath: process.env.CHROMIUM_PATH || (fs.existsSync('/usr/bin/chromium')?'/usr/bin/chromium':undefined), headless: true, args: ['--no-sandbox']});
  try {
    const page = await browser.newPage();
    let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
    const start=html.indexOf('function prepareAtlas('),end=html.indexOf('\nfunction normalizeAtlas(',start);
    await page.setContent('<html><body></body></html>');
    await page.addScriptTag({content:html.slice(start,end)+';window.__compile={prepareAtlas};'});
    const layouts=[
      {name:'heatblast-source.png',rows:12,select:[0,1,2,3],allGuards:true,pivot:'chest'},
      {name:'heatblast-run-source.png',rows:4,select:[0,1,2,3],pivot:'hips'},
      {name:'heatblast-combat-source.png',rows:12,select:[8,9,10,11],pivot:'chest'},
      {name:'heatblast-melee-source.png',rows:12,select:Array.from({length:12},(_,i)=>i),pivot:'hips'},
      {name:'heatblast-front-melee-source.png',rows:4,select:[0,1,2,3],replace:[12,13,16,17],pivot:'hips'},
      {name:'heatblast-cast-source.png',rows:8,select:Array.from({length:8},(_,i)=>i),pivot:'hips'},
      {name:'heatblast-front-cast-source.png',rows:2,select:[0,1],replace:[24,25],pivot:'hips'}
    ];
    const sources=layouts.map(layout=>({...layout,src:'data:image/png;base64,'+fs.readFileSync(path.join(dir,layout.name)).toString('base64')}));
    const result = await page.evaluate(async sources => {
      const frames=[];let rows=0;
      for(const [index,source] of sources.entries()){
        const decoded=new Image();decoded.src=source.src;await decoded.decode();
        // Remove nearly transparent fringes before component registration.
        // These can otherwise connect two neighbouring drawings by one pixel.
        const clean=document.createElement('canvas');clean.width=decoded.naturalWidth;clean.height=decoded.naturalHeight;
        const cleanContext=clean.getContext('2d',{willReadFrequently:true});cleanContext.drawImage(decoded,0,0);
        const pixels=cleanContext.getImageData(0,0,clean.width,clean.height);
        for(let i=3;i<pixels.data.length;i+=4)pixels.data[i]=pixels.data[i]>=128?255:0;
        cleanContext.putImageData(pixels,0,0);
        const image=new Image();image.src=clean.toDataURL('image/png');await image.decode();
        const atlas=__compile.prepareAtlas(image,8,source.rows,Array(source.rows).fill(8));
        const guards=(source.allGuards?atlas.rows.slice(0,4).flat():atlas.rows.slice(0,4).map(row=>row[0])).map(f=>f.bodyHeight).sort((a,b)=>a-b);
        const scale=80/guards[Math.floor(guards.length/2)];
        const selected=source.select.map(row=>atlas.rows[row]);
        if(source.replace)for(let i=frames.length-1;i>=0;i--)if(source.replace.includes(frames[i].row))frames.splice(i,1);
        selected.forEach((row,r)=>row.forEach(frame=>{frame.scale=scale;frame.pivot=source.pivot;frame.row=source.replace?source.replace[r]:rows+r;frames.push(frame);}));
        if(!source.replace)rows+=selected.length;
      }
      let extentX=0, extentUp=0, extentDown=0;
      for (const frame of frames) {
        const scale=frame.scale;
        const c = frame.canvas.getContext('2d'), p = c.getImageData(0,0,frame.w,frame.h).data;
        let badgeX=0,badgePixels=0,rockX=0,rockPixels=0;
        const top=frame.anchorY-frame.bodyHeight;
        for(let y=Math.floor(top+frame.bodyHeight*.28);y<top+frame.bodyHeight*.72;y++)for(let x=0;x<frame.w;x++){
          if(y<0||y>=frame.h)continue;const i=(y*frame.w+x)*4,r=p[i],g=p[i+1],b=p[i+2];
          if(p[i+3]<160)continue;
          if(r>145&&g>145&&b>145&&Math.max(r,g,b)-Math.min(r,g,b)<38){badgeX+=x;badgePixels++;}
          if(r>65&&r>g*1.5&&r>b*1.6){rockX+=x;rockPixels++;}
        }
        if(!badgePixels&&!rockPixels)throw new Error('Cannot register Heatblast '+frame.row+':'+frame.col);
        frame.anchorX=badgePixels?badgeX/badgePixels:rockX/rockPixels;
        if(frame.pivot==='hips'){
          // Keep the pelvis over the collider while letting shoulders, chest and
          // the casting arm rotate and lean through the action.
          const chest=frame.anchorX;let hipsX=0,hipsPixels=0;
          for(let y=Math.floor(top+frame.bodyHeight*.58);y<top+frame.bodyHeight*.78;y++)for(let x=Math.max(0,Math.floor(chest-frame.bodyHeight*.2));x<Math.min(frame.w,chest+frame.bodyHeight*.2);x++){
            if(y<0||y>=frame.h)continue;const i=(y*frame.w+x)*4,r=p[i],g=p[i+1],b=p[i+2];
            if(p[i+3]>160&&r>55&&r>g*1.5&&r>b*1.6){hipsX+=x;hipsPixels++;}
          }
          if(hipsPixels>=8)frame.anchorX=hipsX/hipsPixels;
        }
        extentX=Math.max(extentX,frame.anchorX*scale,(frame.w-frame.anchorX)*scale);
        extentUp=Math.max(extentUp,frame.anchorY*scale);
        extentDown=Math.max(extentDown,(frame.h-frame.anchorY)*scale);
      }
      const cellWidth=Math.ceil((extentX+5)/4)*8, anchorX=cellWidth/2;
      const anchorY=Math.ceil((extentUp+5)/4)*4, cellHeight=Math.ceil((anchorY+extentDown+5)/4)*4;
      const canvas=document.createElement('canvas');canvas.width=cellWidth*8;canvas.height=cellHeight*rows;
      const c=canvas.getContext('2d');c.imageSmoothingEnabled=false;
      for(const frame of frames){
        const scale=frame.scale;
        const cell=document.createElement('canvas');cell.width=cellWidth;cell.height=cellHeight;
        const cc=cell.getContext('2d',{willReadFrequently:true});cc.imageSmoothingEnabled=false;
        cc.drawImage(frame.canvas,anchorX-Math.round(frame.anchorX*scale),anchorY-Math.round(frame.anchorY*scale),Math.round(frame.w*scale),Math.round(frame.h*scale));
        const pixels=cc.getImageData(0,0,cellWidth,cellHeight).data;let bottom=0;
        for(let y=0;y<cellHeight;y++)for(let x=0;x<cellWidth;x++)if(pixels[(y*cellWidth+x)*4+3]>100)bottom=Math.max(bottom,y);
        c.drawImage(cell,frame.col*cellWidth,frame.row*cellHeight+anchorY-bottom-1);
      }
      return {png:canvas.toDataURL('image/png').split(',')[1],spec:{cols:8,rows,cellWidth,cellHeight,anchorX,anchorY,bodyHeight:80,registration:'pelvis-for-motion-chest-for-guard'}};
    }, sources);
    fs.writeFileSync(path.join(dir,'heatblast-atlas.png'), Buffer.from(result.png,'base64'));
    fs.writeFileSync(path.join(dir,'heatblast-atlas.json'), JSON.stringify(result.spec,null,2)+'\n');
    const block='// HEATBLAST_ASSET_START\nconst HEATBLAST_ATLAS='+JSON.stringify(result.spec)+';\nconst heatblastSheet=new Image();heatblastSheet.src=\'data:image/png;base64,'+result.png+'\';\n// HEATBLAST_ASSET_END';
    html=fs.readFileSync(path.join(root,'index.html'),'utf8');
    if(html.includes('// HEATBLAST_ASSET_START'))html=html.replace(/\/\/ HEATBLAST_ASSET_START[\s\S]*?\/\/ HEATBLAST_ASSET_END/,block);
    else html=html.replace('let watchIcon=null;',block+'\nlet watchIcon=null;');
    fs.writeFileSync(path.join(root,'index.html'),html);
    console.log('Heatblast: '+(result.spec.rows*8)+' registered poses',result.spec);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
