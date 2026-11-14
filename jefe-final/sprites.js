(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.KingSprites=factory(root.BEN10_KING_ART)})(typeof globalThis==='undefined'?this:globalThis,function(data){
 'use strict';
 const duration=clip=>clip.durations.reduce((a,b)=>a+b,0)/1000;
 function frameAt(clip,time,repeat=false){let ms=Math.max(0,time)*1000,total=duration(clip)*1000;if(clip.loop||repeat)ms%=total;else if(ms>=total)return clip.frames.length-1;for(let i=0;i<clip.durations.length;i++){if(ms<clip.durations[i])return i;ms-=clip.durations[i]}return clip.frames.length-1}
 function eventsBetween(clip,from,to){return Object.entries(clip.eventFrames||{}).filter(([,frame])=>{const at=clip.durations.slice(0,frame).reduce((a,b)=>a+b,0)/1000;return at>from&&at<=to}).map(([name])=>name)}
 const images=new Map();
 const ready=data?Promise.all([...new Set([data.referencePlayer.file,data.background,...data.phases.map(p=>p.atlas)])].map(file=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images.set(file,im);resolve()};im.onerror=()=>reject(Error('No se pudo cargar '+file));im.src=file}))):Promise.resolve();
 function draw(ctx,phase,key,index,x,y,scale=1,facing='right',pivot=false){const clip=phase.animations[key],f=clip.frames[index],im=images.get(phase.atlas);if(!im)return;const z=phase.bodyHeight/phase.nativeBodyHeight*scale;ctx.save();ctx.translate(x,y);if(facing!==(clip.nativeFacing||'right'))ctx.scale(-1,1);ctx.imageSmoothingEnabled=false;ctx.drawImage(im,f.x,f.y,f.width,f.height,-f.anchorX*z,-f.anchorY*z,f.width*z,f.height*z);if(pivot){ctx.strokeStyle='#b6ebd477';ctx.strokeRect(-f.anchorX*z,-f.anchorY*z,f.width*z,f.height*z)}ctx.restore()}
 function ben(ctx,x,y,scale,time){const p=data.referencePlayer,im=images.get(p.file),z=p.bodyHeight/p.sourceBodyHeight*scale;if(!im)return;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(im,(4+Math.floor(time*1.3)%2)*96,384,96,96,x-p.anchorX*z,y-p.anchorY*z,96*z,96*z);ctx.restore()}
 function shadow(ctx,x,y,width){ctx.save();ctx.fillStyle='#03080b66';ctx.beginPath();ctx.ellipse(x,y+2,width,4,0,0,Math.PI*2);ctx.fill();ctx.restore()}
 return {data,images,ready,duration,frameAt,eventsBetween,draw,ben,shadow};
});
