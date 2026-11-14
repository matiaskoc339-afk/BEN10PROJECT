(function(root){
 'use strict';
 class Renderer{
  constructor(data){this.data=data;this.images=new Map();this.ready=Promise.all(data.phases.map(p=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{this.images.set(p.id,im);resolve()};im.onerror=()=>reject(Error('No se pudo cargar al Rey Eterno: '+p.id));im.src='jefe-final/'+p.atlas})));}
  frame(e){const phase=this.data.phases[e.renderPhase-1],key=phase.animations[e.mode]?e.mode:'idle',clip=phase.animations[key];return {phase,key,clip,index:Ben10FinalKing.frameAt(clip,e.modeTime)}}
  draw(ctx,e,time){const {phase,clip,index}=this.frame(e),im=this.images.get(phase.id);if(!im)return;const f=clip.frames[index],z=e.bodyHeight/phase.nativeBodyHeight;ctx.save();ctx.fillStyle='#050f1966';ctx.beginPath();ctx.ellipse(e.x,e.y+3,e.alive?31:61,e.alive?7:6,0,0,Math.PI*2);ctx.fill();ctx.translate(e.x+(e.shake?Math.sin(time*55)*e.shake:0),e.y);if(e.facing!==(clip.nativeFacing||'right'))ctx.scale(-1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';if(e.hit>0&&Math.floor(time*40)%2)ctx.globalAlpha=.73;ctx.drawImage(im,f.x,f.y,f.width,f.height,-f.anchorX*z,-f.anchorY*z,f.width*z,f.height*z);ctx.restore()}
  ground(ctx,e){if(!e?.alive)return;ctx.save();if(e.attack&&e.modeTime<e.attack.windup){const a=e.attack,reach=e.mode==='lunge'?230:140;ctx.strokeStyle='#ffbc7f';ctx.fillStyle='#f19b6624';ctx.lineWidth=1.5;ctx.setLineDash([6,5]);ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+a.dir.x*reach,e.y+a.dir.y*reach);ctx.stroke();ctx.beginPath();ctx.ellipse(e.x+a.dir.x*reach*.55,e.y+a.dir.y*reach*.55,reach*.55,37,0,0,Math.PI*2);ctx.fill();ctx.stroke()}else if(e.exposedLeft>0){ctx.strokeStyle='#f2cfa1';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(e.x,e.y,34,9,0,0,Math.PI*2);ctx.stroke()}ctx.restore()}
 }
 root.Ben10KingRenderer=Renderer;
})(typeof globalThis==='undefined'?this:globalThis);
