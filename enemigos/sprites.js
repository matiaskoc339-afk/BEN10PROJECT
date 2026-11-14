(function(){
 'use strict';
 const data=window.BEN10_ENEMY_ART,images=new Map();
 const paths=new Set([data.referencePlayer.file,'assets/context/castillo.png','assets/context/laboratorio.png','assets/context/ciudad.png']);
 for(const unit of data.units){paths.add(unit.atlas);if(unit.projectile)paths.add(unit.projectile.file);}
 const ready=Promise.all([...paths].map(file=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{images.set(file,image);resolve()};image.onerror=()=>reject(Error('No se pudo cargar '+file));image.src=file;})));
 const duration=clip=>clip.durations.reduce((a,b)=>a+b,0)/1000;
 function frameAt(clip,time,repeat=false){let ms=Math.max(0,time)*1000,total=duration(clip)*1000;if(clip.loop||repeat)ms%=total;else if(ms>=total)return clip.frames.length-1;for(let i=0;i<clip.durations.length;i++){if(ms<clip.durations[i])return i;ms-=clip.durations[i];}return clip.frames.length-1;}
 function draw(ctx,unit,key,index,x,y,scale=1,facing='right',pivot=false){
  const f=unit.animations[key].frames[index],texture=images.get(unit.atlas);if(!texture)return;
  const z=unit.bodyHeight/unit.nativeBodyHeight*scale;
  ctx.save();ctx.translate(x,y);if(facing==='left')ctx.scale(-1,1);ctx.imageSmoothingEnabled=false;
  ctx.drawImage(texture,f.x,f.y,f.width,f.height,-f.anchorX*z,-f.anchorY*z,f.width*z,f.height*z);
  if(pivot){ctx.strokeStyle='#b5e9dd77';ctx.lineWidth=1;ctx.strokeRect(-f.anchorX*z,-f.anchorY*z,f.width*z,f.height*z);ctx.strokeStyle='#f3d797';ctx.beginPath();ctx.moveTo(-5,0);ctx.lineTo(5,0);ctx.moveTo(0,-5);ctx.lineTo(0,5);ctx.stroke();}ctx.restore();
 }
 function shadow(ctx,x,y,width){ctx.save();ctx.fillStyle='#03070b55';ctx.beginPath();ctx.ellipse(x,y+2,width,4,0,0,7);ctx.fill();ctx.restore();}
 function ben(ctx,x,y,scale,time=0){const p=data.referencePlayer,image=images.get(p.file);if(!image)return;const z=p.bodyHeight/p.sourceBodyHeight*scale,col=4+Math.floor(time*1.3)%2;ctx.save();ctx.imageSmoothingEnabled=false;shadow(ctx,x,y,11*scale);ctx.drawImage(image,col*96,4*96,96,96,x-p.anchorX*z,y-p.anchorY*z,96*z,96*z);ctx.restore();}
 window.EnemySprites={data,images,ready,duration,frameAt,draw,ben,shadow};
})();
