/* V47: Desert scenery, nine Vilgax robot atlases and Alpha animations. */
(function(root,factory){
 const Renderer=factory();
 if(typeof module==='object'&&module.exports)module.exports=Renderer;
 else root.Ben10DesertRenderer=Renderer;
})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 class Renderer{
  constructor(manifest){
   this.art=manifest;this.images=new Map();
   const files=[...manifest.backgrounds.flat(),...manifest.robotSheets.flat(),...manifest.bossSheets,manifest.portrait,manifest.worm];
   this.ready=Promise.all(files.map(file=>this.load(file))).then(()=>true);
  }
  load(file){
   if(this.images.has(file))return this.images.get(file).ready;
   const image=new Image(),entry={image,ready:null};
   entry.ready=new Promise(resolve=>{image.onload=()=>resolve(true);image.onerror=()=>resolve(false);});
   image.src=this.art.ASSET+file;this.images.set(file,entry);return entry.ready;
  }
  get(file){const img=this.images.get(file)?.image;return img&&img.complete&&img.naturalWidth?img:null;}
  background(ctx,campaign,view,time=0){
   const phase=Math.max(0,Math.min(2,campaign.phaseIndex));
   const w=campaign.width,h=campaign.data.height*campaign.scale,y=campaign.offsetY;
   const colors=['#c7925c','#dba069','#342d42'];
   ctx.fillStyle=colors[phase];ctx.fillRect(0,y,w,h);
   const parts=9,each=w/parts,first=Math.max(0,Math.floor(view.left/each)-1),last=Math.min(parts,Math.ceil(view.right/each)+1);
   for(let i=first;i<last;i++){
    const path=this.art.backgrounds[phase][Math.min(2,Math.floor(i/3))],img=this.get(path);
    if(!img)continue;
    ctx.save();ctx.imageSmoothingEnabled=true;
    ctx.drawImage(img,i*each,y,each+2,h);ctx.restore();
   }
   const fog=ctx.createLinearGradient(0,y,0,y+h);
   fog.addColorStop(0,'#17152425');fog.addColorStop(.65,'#ffd38b00');fog.addColorStop(1,phase===2?'#110e2240':'#eebb6910');
   ctx.fillStyle=fog;ctx.fillRect(view.left,y,view.right-view.left,h);
  }
  ambience(ctx,campaign,time,view){
   const z=campaign.phaseIndex,s=campaign.scale,y=campaign.offsetY;
   ctx.save();
   for(let i=0;i<24;i++){
    const seed=i*29.31,p=(time*(z===1?42:16)+seed*41)%(campaign.width+700);
    const x=p-350,py=y+s*(239+(seed%91));
    if(x<view.left-20||x>view.right+20)continue;
    ctx.globalAlpha=.12+Math.sin(time*1.8+i)*.07;ctx.fillStyle=z===2?'#dec6e7':'#ffe4aa';ctx.beginPath();ctx.ellipse(x,py,1+(i%3),.4,0,0,Math.PI*2);ctx.fill();
   }
   ctx.restore();
  }
  drawCell(ctx,img,row,col,x,y,w,h){
   if(!img)return;
   const fw=img.naturalWidth/6,fh=img.naturalHeight/6;
   ctx.save();ctx.imageSmoothingEnabled=false;
   ctx.drawImage(img,Math.floor(col%6)*fw,Math.floor(row%6)*fh,fw,fh,x-w/2,y-h,w,h);
   ctx.restore();
  }
  robot(ctx,e,time){
   const type=e.robotType==='physical'?0:e.robotType==='ranged'?1:2,tier=Math.max(0,Math.min(2,e.robotTier||0));
   const img=this.get(this.art.robotSheets[type][tier]);const frame=Math.floor((e.mode==='walk'?e.animationTime:time)*8)%6;
   const row=e.mode==='defeat'?5:e.mode==='hurt'?4:e.mode==='attack'||e.mode==='secondary'?3:e.mode==='walk'?1:0;
   const h=(e.bodyHeight||90)*1.06,w=h*.9;
   ctx.save();ctx.translate(e.x,e.y);if(e.facing==='left')ctx.scale(-1,1);
   if(e.hit>0)ctx.globalAlpha=Math.min(1,.7+Math.sin(time*40)*.25);
   this.drawCell(ctx,img,row,frame,0,0,w,h);ctx.restore();
  }
  alpha(ctx,e,time){
   const map={circle:0,hunt:0,claw:1,charge:2,recover:3,leap:3,howl:4,chain:5,defeat:3,windup:1};
   const sheet=this.art.bossSheets[map[e.alphaMode]??0],img=this.get(sheet),h=e.bodyHeight||167,w=h*1.12;
   const frame=Math.floor((e.alphaClock||0)*10)%6,row=e.alphaMode==='defeat'?5:e.alphaMode==='howl'||e.alphaMode==='chain'?2:1;
   ctx.save();ctx.translate(e.x,e.y);if(e.facing==='left')ctx.scale(-1,1);
   if(e.hit>0)ctx.globalAlpha=.8;
   this.drawCell(ctx,img,row,frame,0,0,w,h);
   ctx.restore();
  }
  worm(ctx,w,time){
   const img=this.get(this.art.worm);
   ctx.save();ctx.translate(w.x,w.y);
   if(w.stage==='warning'){
    ctx.fillStyle='#49342288';ctx.beginPath();ctx.ellipse(0,0,38+w.age*18,13+w.age*3,0,0,Math.PI*2);ctx.fill();
    ctx.strokeStyle='#fbdf8d';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,0,45,18,0,0,Math.PI*2);ctx.stroke();
   }else if(img){
    const rise=Math.min(1,w.age/.25),size=122+rise*42;
    this.drawCell(ctx,img,w.stage==='strike'?2:1,Math.floor(time*9)%6,0,0,size,size);
   }else {
    ctx.fillStyle='#9d6744';ctx.beginPath();ctx.ellipse(0,-24,36,58,0,0,Math.PI*2);ctx.fill();
   }
   ctx.restore();
  }
 }
 return Renderer;
});