/* An unbounded DNA stream: rows leave outside the viewport, never reset inside it. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Ben10MenuBackground=factory()})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const clamp=v=>Math.max(0,Math.min(1,v)),smooth=v=>{v=clamp(v);return v*v*(3-2*v)};
 function hash(i){let n=Math.imul(i^0x9e3779b9,0x85ebca6b);n=Math.imul(n^(n>>>13),0xc2b2ae35);return ((n^(n>>>16))>>>0)/4294967296}
 function scene(time){
  const t=Math.max(0,Number.isFinite(time)?time:0),blobs=[],bubbles=[],columns=[],rise=t*.035,drift=t*.012;
  for(let row=Math.floor((rise-.36)/.28);row<=Math.ceil((rise+1.36)/.28);row++)for(let col=0;col<4;col++){
   const id=row*43+col*7,y=row*.28-rise+hash(id+77)*.09,fade=smooth((y+.36)/.28)*smooth((1.36-y)/.28);
   if(!fade)continue;blobs.push({id,x:col*.29+.03+hash(id)*.11+.025*Math.sin(t*.31+id),y,r:6+hash(id+4)*5,stretch:1+.16*Math.sin(t*.49+id),fade});
  }
  for(let row=Math.floor((t*.047-.1)/.17);row<=Math.ceil((t*.047+1.1)/.17);row++)for(let col=0;col<4;col++){
   const id=row*59+col*13,y=row*.17-t*.047+hash(id+1)*.08;bubbles.push({id,x:hash(id)*.98+.012*Math.sin(t*.21+id),y,r:4+hash(id+2)*18,fade:smooth((y+.08)/.08)*smooth((1.08-y)/.08)});
  }
  for(let col=Math.floor((drift-.15)/.24);col<=Math.ceil((drift+1.15)/.24);col++)columns.push({id:col,x:col*.24-drift+.02,amplitude:.035+hash(col)*.018,phase:col*1.63+t*.29,travel:t*.022,fade:smooth((col*.24-drift+.15)/.15)*smooth((1.15-col*.24+drift)/.15)});
  return {blobs,bubbles,columns};
 }
 class Renderer{
  constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.lava=document.createElement('canvas');this.lava.width=128;this.lava.height=76;this.lc=this.lava.getContext('2d');this.pixels=this.lc.createImageData(128,76)}
  draw(time){const c=this.ctx,w=this.canvas.width,h=this.canvas.height,s=scene(time),data=this.pixels.data;c.globalAlpha=1;c.fillStyle='#07371c';c.fillRect(0,0,w,h);
   for(let y=0;y<76;y++)for(let x=0;x<128;x++){let f=0;for(const b of s.blobs)f+=b.fade*b.r*b.r/(9+(x-b.x*128)**2+(y-b.y*76)**2/b.stretch);const n=(y*128+x)*4,edge=clamp((f-1.1)*2.7),core=clamp((f-1.8)*.6);data[n]=27+core*42;data[n+1]=125+core*63;data[n+2]=27+core*15;data[n+3]=edge*135;}
   this.lc.putImageData(this.pixels,0,0);c.imageSmoothingEnabled=true;c.drawImage(this.lava,0,0,w,h);const glow=c.createRadialGradient(w*.36,h*.4,0,w*.36,h*.4,w*.8);glow.addColorStop(0,'#80bb2329');glow.addColorStop(1,'#001f1500');c.fillStyle=glow;c.fillRect(0,0,w,h);
   for(const column of s.columns){const step=h/47,travel=column.travel*h,first=Math.floor(travel/step)-5,color=hash(column.id+4)>.5?'#a9e342':'#39b97a';
    for(let i=first;i<first+58;i++){const y=i*step-travel,angle=i*.27+column.phase,cx=column.x*w,amp=column.amplitude*w;c.strokeStyle=color;c.lineWidth=Math.max(1,w/1400);c.globalAlpha=(.10+.1*(Math.cos(angle)*.5+.5))*column.fade;c.beginPath();c.moveTo(cx+Math.sin(angle)*amp,y);c.lineTo(cx-Math.sin(angle)*amp,y+step*.8);c.stroke();
     for(const sign of [-1,1]){const x=cx+sign*Math.sin(angle)*amp,nx=cx+sign*Math.sin(angle+.27)*amp;c.globalAlpha=(.13+.17*(.5+.5*sign*Math.cos(angle)))*column.fade;c.lineWidth=2.1*w/1440;c.beginPath();c.moveTo(x,y);c.lineTo(nx,y+step);c.stroke();c.beginPath();c.arc(x,y,1.5*w/1440,0,Math.PI*2);c.fillStyle=color;c.fill()}
    }
   }
   for(const b of s.bubbles){if(!b.fade)continue;const x=b.x*w,y=b.y*h,r=b.r*w/1440;c.globalAlpha=b.fade;c.strokeStyle='#a0d95735';c.lineWidth=1.2;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.stroke();c.fillStyle='#bef47b33';c.beginPath();c.arc(x-r*.3,y-r*.35,Math.max(1,r*.12),0,Math.PI*2);c.fill()}c.globalAlpha=1;
  }
 }
 return {scene,Renderer};
});
