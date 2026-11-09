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
    let html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
    const at = html.lastIndexOf('\n})();');
    html = html.slice(0, at) + '\nwindow.__compile={prepareAtlas};' + html.slice(at);
    await page.setContent('<script>requestAnimationFrame=()=>0</script>' + html);
    const sources = ['four-arms-source.png','four-arms-combat-source.png'].map((name,index)=>({
      src:'data:image/png;base64,'+fs.readFileSync(path.join(dir,name)).toString('base64'),rows:index?8:14
    }));
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
        const guards=(index?atlas.rows.slice(0,4).map(row=>row[0]):atlas.rows.slice(0,4).flat()).map(f=>f.bodyHeight).sort((a,b)=>a-b);
        const scale=80/guards[Math.floor(guards.length/2)];
        for(const frame of atlas.rows.flat()){frame.scale=scale;frame.row+=rows;frames.push(frame);}
        rows+=source.rows;
      }
      let extentX=0, extentUp=0, extentDown=0;
      for (const frame of frames) {
        const scale=frame.scale;
        const c = frame.canvas.getContext('2d'), p = c.getImageData(0,0,frame.w,frame.h).data;
        let shirtX=0,shirtPixels=0;
        for(let y=0;y<frame.h;y++)for(let x=0;x<frame.w;x++){
          const i=(y*frame.w+x)*4;
          if(p[i+3]>160&&p[i]>175&&p[i+1]>175&&p[i+2]>175){shirtX+=x;shirtPixels++;}
        }
        if(shirtPixels<20)throw new Error('Cannot register torso '+frame.row+':'+frame.col);
        const right=[2,6,8,12,13].includes(frame.row),left=[3,7,9].includes(frame.row);
        const lean=frame.row===13?8:right?3:left?-3:0;
        frame.anchorX=shirtX/shirtPixels-lean/scale;
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
      return {png:canvas.toDataURL('image/png').split(',')[1],spec:{cols:8,rows,cellWidth,cellHeight,anchorX,anchorY,bodyHeight:80,registration:'torso-centre-and-ground'}};
    }, sources);
    fs.writeFileSync(path.join(dir,'four-arms-atlas.png'), Buffer.from(result.png,'base64'));
    fs.writeFileSync(path.join(dir,'four-arms-atlas.json'), JSON.stringify(result.spec,null,2)+'\n');
    const block='// FOUR_ARMS_ASSET_START\nconst FOUR_ARMS_ATLAS='+JSON.stringify(result.spec)+';\nconst fourArmsSheet=new Image();fourArmsSheet.src=\'data:image/png;base64,'+result.png+'\';\n// FOUR_ARMS_ASSET_END';
    html=fs.readFileSync(path.join(root,'index.html'),'utf8');
    if(html.includes('// FOUR_ARMS_ASSET_START'))html=html.replace(/\/\/ FOUR_ARMS_ASSET_START[\s\S]*?\/\/ FOUR_ARMS_ASSET_END/,block);
    else html=html.replace('let watchIcon=null;',block+'\nlet watchIcon=null;');
    fs.writeFileSync(path.join(root,'index.html'),html);
    console.log('Four Arms: '+(result.spec.rows*8)+' registered poses',result.spec);
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
