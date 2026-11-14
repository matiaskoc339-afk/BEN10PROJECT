/* Runtime rendering of the retained, drawn frames. No procedural body poses. */
'use strict';
window.CircusSprites=(()=>{
 const data=window.BEN10_CIRCUS_ART,images=new Map();
 const files=new Set([data.referencePlayer.file,...data.units.map(u=>u.atlas),...data.routes.flatMap(r=>r.tiles.map(t=>t.file)),data.entrance.file,data.mirrorRealm.file,...[data.props,data.fx].flatMap(g=>g.clips.map(c=>c.atlas))]);
 const ready=Promise.all([...files].map(file=>new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>{images.set(file,im);resolve()};im.onerror=()=>reject(new Error('No se puede cargar '+file));im.src=file;})));
 const duration=c=>c.durations.reduce((a,b)=>a+b,0);
 function frameAt(clip,time,repeat=false){let t=Math.max(0,time);const total=duration(clip);if(clip.loop||repeat)t%=total;else t=Math.min(t,total-1);for(let i=0;i<clip.frames.length;i++){if(t<clip.durations[i])return i;t-=clip.durations[i]}return clip.frames.length-1}
 function drawFrame(ctx,file,f,x,y,scale=1,left=false){const im=images.get(file);if(!im)return;ctx.save();ctx.translate(x,y);ctx.scale(left?-scale:scale,scale);ctx.imageSmoothingEnabled=false;ctx.drawImage(im,f.x,f.y,f.width,f.height,-f.anchorX,-f.anchorY,f.width,f.height);ctx.restore()}
 function shadow(ctx,x,y,w=24){ctx.save();ctx.fillStyle='#07081166';ctx.beginPath();ctx.ellipse(x,y,w,w*.23,0,0,Math.PI*2);ctx.fill();ctx.restore()}
 function unit(ctx,u,key,x,y,time=0,left=false,frame,repeat=false,height){const c=u.animations[key],i=frame===undefined?frameAt(c,time,repeat):frame;shadow(ctx,x,y,u.bodyHeight*.23);drawFrame(ctx,u.atlas,c.frames[i],x,y,(height||u.bodyHeight)/u.nativeBodyHeight,left);return i}
 function ben(ctx,x,y){const r=data.referencePlayer;shadow(ctx,x,y,16);drawFrame(ctx,r.file,{x:0,y:0,width:r.cellWidth,height:r.cellHeight,anchorX:r.anchorX,anchorY:r.anchorY},x,y,r.bodyHeight/r.sourceBodyHeight)}
 const clips=new Map([...data.props.clips,...data.fx.clips].map(c=>[c.id,c]));
 function prop(ctx,id,x,y,time=0,height,frame,repeat=false){const c=clips.get(id);if(!c)return;const i=frame===undefined?frameAt(c.animation,time,repeat):frame;drawFrame(ctx,c.atlas,c.animation.frames[i],x,y,(height||c.bodyHeight)/c.nativeBodyHeight);return i}
 function panorama(ctx,route,time=0,animated=true){
  ctx.imageSmoothingEnabled=true;
  for(let i=0;i<route.tiles.length;i++){
   const t=route.tiles[i],im=images.get(t.file);if(!im)continue;
   if(i===0){ctx.drawImage(im,t.x,0,t.width,360);continue}
   const seam=route.seams[i-1];
   // Architecture has a precise cut at its painted support. Only the floor needs a wider feather.
   for(const [y,h,blend]of[[0,route.floorTop,2],[route.floorTop,360-route.floorTop,14]]){
    ctx.save();ctx.beginPath();ctx.rect(seam+blend,y,t.x+t.width-seam,h);ctx.clip();ctx.drawImage(im,t.x,0,t.width,360);ctx.restore();
    for(let x=0;x<blend*2;x++){const wx=seam-blend+x;ctx.save();ctx.globalAlpha=(x+.5)/(blend*2);ctx.beginPath();ctx.rect(wx,y,1.01,h);ctx.clip();ctx.drawImage(im,t.x,0,t.width,360);ctx.restore()}
   }
  }
  // The cut follows an existing painted support; no duplicate prop is pasted over it.
 }
 function portal(ctx,p,time){if(!p)return;if(p.mode==='painted'){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.08+.035*Math.sin(time/350);ctx.fillStyle='#90dbd4';ctx.beginPath();ctx.ellipse(p.x,p.y-81,26,65,0,0,Math.PI*2);ctx.fill();ctx.restore();return}prop(ctx,'mirror-idle',p.x,p.y,time,164)}
 function route(ctx,which,camera=0,time=0,options={}){
  ctx.save();ctx.clearRect(0,0,ctx.canvas.width,ctx.canvas.height);ctx.scale(ctx.canvas.width/640,ctx.canvas.height/360);ctx.translate(-camera,0);
  const r=typeof which==='number'?data.routes[which]:null;
  if(r){panorama(ctx,r,time);portal(ctx,r.entryMirror,time);portal(ctx,r.exitMirror,time);if(options.floor){ctx.fillStyle='#8bffbb22';ctx.fillRect(camera,r.floorTop,640,r.floorBottom-r.floorTop);ctx.strokeStyle='#b2f8ca';ctx.setLineDash([4,4]);ctx.strokeRect(camera,r.floorTop,640,r.floorBottom-r.floorTop)}}
  else {const bg=which==='entrance'?data.entrance:data.mirrorRealm;ctx.drawImage(images.get(bg.file),0,0,bg.nativeWidth/bg.nativeHeight*360,360);if(which==='mirror'){prop(ctx,'mirror-idle',62,327,time,126);prop(ctx,'mirror-open',1013,327,time,126,undefined,true);for(const [x,y]of[[280,302],[470,253],[670,282],[845,229]])prop(ctx,'platform',x,y,time,16)}}
  if(options.ben)ben(ctx,camera+320,which==='mirror'?342:302);
  ctx.restore();
 }
 return{data,images,ready,clips,duration,frameAt,drawFrame,unit,ben,shadow,prop,route,panorama};
})();
