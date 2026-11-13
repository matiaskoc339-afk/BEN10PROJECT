/* V33. Playback uses new drawn key poses. Native idle cells are a loading fallback only. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Ben10SkillArt=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
 const models=new Map(),cells=new Map();
 const layout=id=>id==='wildvine'?{cellWidth:704,cellHeight:320,anchorX:352,anchorY:280,bodyHeight:160}:{cellWidth:384,cellHeight:288,anchorX:192,anchorY:248,bodyHeight:160};
 function registerModels(entries){for(const entry of entries)models.set(entry.id,entry)}
 function nativeCell(id,m,p,dir){
  const model=models.get(id);if(!model)return null;
  const sourceDir=dir==='left'?'right':dir,d={down:0,up:1,right:2}[sourceDir]??2,row=d,col=Math.floor(p*7)%8,flip=false;
  const frame=model.atlas.rows[row]?.[col]||model.atlas.rows[d][0],key=id+':'+row+':'+col+':'+!!flip;
  if(cells.has(key))return cells.get(key);
  const box=layout(id),canvas=document.createElement('canvas');canvas.width=box.cellWidth;canvas.height=box.cellHeight;const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.translate(box.anchorX,box.anchorY);if(flip)c.scale(-1,1);
  const scale=160/frame.bodyHeight;
  if(frame.image)c.drawImage(frame.image,frame.sourceX,frame.sourceY,frame.w,frame.h,-frame.anchorX*scale,-frame.anchorY*scale,frame.w*scale,frame.h*scale);
  else c.drawImage(frame.canvas,-frame.anchorX*scale,-frame.anchorY*scale,frame.w*scale,frame.h*scale);
  cells.set(key,canvas);if(cells.size>48)cells.delete(cells.keys().next().value);return canvas;
 }
 function draw(c,id,m,p,dir='right',x=0,y=0,height=160){
  // Fallback and passive previews use the original idle animation without deformation.
  const image=nativeCell(id,'idle',p,dir);if(!image)return;
  const box=layout(id),scale=height/160;
  c.save();c.translate(x,y);c.scale(scale*(dir==='left'?-1:1),scale);c.imageSmoothingEnabled=false;c.drawImage(image,-box.anchorX,-box.anchorY);c.restore();
 }
 return {draw,registerModels,layout,get modelsReady(){return models.size===10},frames:6,columns:6,bodyHeight:160};
});
