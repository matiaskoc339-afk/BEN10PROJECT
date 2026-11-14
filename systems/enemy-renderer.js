(function(root){
 'use strict';
 class Renderer{
  constructor(data,{base='enemigos/'}={}){this.units=new Map(data.units.map(u=>[u.id,u]));this.images=new Map();const paths=new Set(data.units.flatMap(u=>[u.atlas,...u.projectile?[u.projectile.file]:[]]));this.ready=Promise.all([...paths].map(file=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{this.images.set(file,image);resolve()};image.onerror=()=>reject(Error('No se pudo cargar el caballero: '+file));image.src=base+file;})));}
  frame(e,u){
   let key=e.alive?e.mode==='guard'?'secondary':['spawn','idle'].includes(e.mode)?'idle':e.mode:'defeat';if(!u.animations[key])key='idle';const clip=u.animations[key];let frame=0;
   if(e.attack){const a=e.attack;if(a.age<a.windup)frame=Math.min(2,Math.floor(a.age/a.windup*3));else if(a.age<a.windup+a.active)frame=3;else frame=4+Math.min(1,Math.floor((a.age-a.windup-a.active)/a.recovery*2));}
   else if(e.mode==='guard')frame=3;
   else if(e.support)frame=Math.min(5,Math.floor(e.support.age/1.2*6));
   else if(key==='hurt')frame=Math.min(5,Math.floor(e.modeTime/.26*6));
   else{let ms=(key==='walk'?e.animationTime:e.modeTime)*1000,total=clip.durations.reduce((a,b)=>a+b,0);if(clip.loop)ms%=total;frame=clip.frames.length-1;for(let n=0;n<clip.durations.length;n++){if(ms<clip.durations[n]){frame=n;break;}ms-=clip.durations[n];}}
   return {key,frame:clip.frames[frame]};
  }
  draw(ctx,e,time,{hideHealth=false,airborne=false}={}){
   const u=this.units.get(e.spriteId);if(!u)return;const image=this.images.get(u.atlas);if(!image)return;const {frame:f}=this.frame(e,u),z=e.bodyHeight/u.nativeBodyHeight,x=e.x+(e.shake?Math.sin(time*62)*Math.min(3,e.shake):0),y=e.y;
   ctx.save();ctx.globalAlpha=e.alive?(e.spawnLeft>0?Math.max(.2,1-e.spawnLeft/.7):1):Math.min(1,(5-e.deadAge)/1.2);
   if(!airborne){ctx.fillStyle='#08121a55';ctx.beginPath();ctx.ellipse(e.x,y+2,e.kind==='miniboss'?32:20,e.kind==='miniboss'?8:5,0,0,7);ctx.fill();}
   ctx.save();ctx.translate(x,y);if(e.facing==='left')ctx.scale(-1,1);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';if(e.hit>0&&Math.floor(time*35)%2===0)ctx.globalAlpha*=.7;
   ctx.drawImage(image,f.x,f.y,f.width,f.height,-f.anchorX*z,-f.anchorY*z,f.width*z,f.height*z);ctx.restore();
   if(e.alive&&e.buffLeft>0){ctx.strokeStyle='#e8b85f';ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.lineDashOffset=-time*12;ctx.beginPath();ctx.ellipse(x,y,23,7,0,0,7);ctx.stroke();ctx.setLineDash([]);}
   if(e.alive&&!hideHealth&&e.kind!=='miniboss'&&(e.health<e.maxHealth||e.support||e.hit>0)){const w=43,top=y-e.bodyHeight-10;ctx.fillStyle='#111b24dd';ctx.fillRect(x-w/2-1,top-1,w+2,6);ctx.fillStyle=e.tier==='crystal'?'#8edcca':e.tier==='elite'?'#d8b46f':'#ba6961';ctx.fillRect(x-w/2,top,w*e.health/e.maxHealth,4);}
   ctx.restore();
  }
  ground(ctx,battle){
   ctx.save();
   for(const e of battle.enemies){
    if(!e.alive||!e.attack)continue;const a=e.attack;if(a.age>a.windup)continue;const p=a.age/a.windup,color=e.kind==='miniboss'?'#ed825f':'#e6b56c';ctx.strokeStyle=color;ctx.fillStyle=e.kind==='miniboss'?'#ed825f1a':'#e6b56c12';ctx.lineWidth=1.3;ctx.setLineDash([5,4]);
    if(e.role==='ranged'){ctx.beginPath();ctx.moveTo(e.x,e.y);ctx.lineTo(e.x+a.dir.x*e.reach,e.y+a.dir.y*e.reach);ctx.stroke();}
    else{const x=e.x+a.dir.x*e.reach*.55,y=e.y+a.dir.y*e.reach*.55;ctx.beginPath();ctx.ellipse(x,y,e.reach*.55,e.attackWidth,Math.atan2(a.dir.y,a.dir.x)*.3,0,7);ctx.fill();ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.ellipse(x,y,e.reach*.55,e.attackWidth,0,-Math.PI/2,-Math.PI/2+Math.PI*2*p);ctx.stroke();}
   }ctx.restore();
  }
  effects(ctx,battle,time){
   ctx.save();
   for(const e of battle.enemies){if(!e.alive||!e.support)continue;const target=e.support.target,heal=e.support.kind==='heal';ctx.strokeStyle=heal?'#97e9b4':'#f4c777';ctx.lineWidth=1.8;ctx.globalAlpha=.45+.25*Math.sin(time*12);ctx.setLineDash([4,5]);ctx.lineDashOffset=-time*35;ctx.beginPath();ctx.moveTo(e.x,e.y-60);ctx.quadraticCurveTo((e.x+target.x)/2,Math.min(e.y,target.y)-125,target.x,target.y-55);ctx.stroke();ctx.setLineDash([]);ctx.beginPath();ctx.ellipse(target.x,target.y,27,9,0,0,7);ctx.stroke();ctx.globalAlpha=1;}
   for(const p of battle.projectiles){const u=this.units.get(p.owner.spriteId),im=u?.projectile&&this.images.get(u.projectile.file);ctx.save();ctx.translate(p.x,p.y-43);ctx.rotate(Math.atan2(p.dy,p.dx));if(im)ctx.drawImage(im,-im.width/2,-im.height/2,im.width,im.height);else{ctx.strokeStyle=p.kind==='crystal'?'#c6ffe9':'#ffc67a';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(-12,0);ctx.lineTo(7,0);ctx.stroke();ctx.fillStyle='#fff9d4';ctx.fillRect(-4,-1,8,2);}ctx.restore();}
   ctx.restore();
  }
 }
 root.Ben10EnemyRenderer=Renderer;
})(typeof globalThis==='undefined'?this:globalThis);
