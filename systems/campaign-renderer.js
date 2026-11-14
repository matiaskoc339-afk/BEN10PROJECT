(function(root){
 'use strict';
 class Renderer{
  constructor(data,{base='mapas/'}={}){
   this.data=data;this.base=base;this.images=new Map();this.masks=new Map();
   const paths=new Set();for(const chapter of data.chapters)for(const s of chapter.segments)if(s.tiles?.length)for(const tile of s.tiles)paths.add(tile.file);else paths.add(s.native?.file||s.image);
   for(const effect of data.sceneEffects||[])paths.add(effect.file);
   for(const family of Object.values(data.props)){for(const p of family.static)paths.add(p.file);for(const clip of family.animations)for(const f of clip.frames)paths.add(f.file);}
   this.ready=Promise.all([...paths].map(file=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{this.images.set(file,image);resolve()};image.onerror=()=>reject(Error('No se pudo cargar el mapa: '+file));image.src=base+file;}))).then(()=>{
    for(const chapter of data.chapters)for(const s of chapter.segments){
     if(s.tiles?.length)continue;
     const n=s.native,image=this.images.get(n?.file||s.image),surface=document.createElement('canvas');surface.width=n?.width||image.width;surface.height=n?.height||image.height;const c=surface.getContext('2d');if(n)c.drawImage(image,n.x,n.y,n.width,n.height,0,0,n.width,n.height);else c.drawImage(image,0,0);
     if(s.overlap){c.globalCompositeOperation='destination-in';const gradient=c.createLinearGradient(0,0,s.overlap*surface.width/s.width,0);gradient.addColorStop(0,'transparent');gradient.addColorStop(1,'black');c.fillStyle=gradient;c.fillRect(0,0,surface.width,surface.height);}this.masks.set(s.image,surface);
    }
   });
  }
  tileImage(tile,displayScale=1){
   const image=this.images.get(tile.file),scale=Math.min(3,Math.max(1,Math.round(displayScale*1000)/1000)),key=tile.file+'@'+scale;if(this.masks.has(key))return this.masks.get(key);
   // Resample once at the current display scale. Ordinary scrolling then copies
   // prepared pixels instead of doing a high-quality resize every frame.
   const surface=document.createElement('canvas');surface.width=Math.ceil(tile.width*scale);surface.height=Math.ceil(tile.height*scale);const c=surface.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.drawImage(image,0,0,surface.width,surface.height);
   if(tile.overlap){c.globalCompositeOperation='destination-in';const gradient=c.createLinearGradient(0,0,tile.overlap*surface.width/tile.width,0);gradient.addColorStop(0,'transparent');gradient.addColorStop(1,'black');c.fillStyle=gradient;c.fillRect(0,0,surface.width,surface.height);}this.masks.set(key,surface);if(this.masks.size>8)this.masks.delete(this.masks.keys().next().value);return surface;
  }
  background(ctx,level,view){
   ctx.save();ctx.translate(0,level.offsetY);ctx.scale(level.scale,level.scale);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
   for(const s of level.phase.segments){const x=(s.x-level.phase.x)*level.scale;if(x+s.width*level.scale<view.left||x>view.right)continue;
    if(s.tiles?.length){ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='low';const displayScale=Math.abs(ctx.getTransform().a);for(const tile of s.tiles){const tx=(tile.x-level.phase.x)*level.scale;if(tx+tile.width*level.scale<view.left||tx>view.right)continue;ctx.drawImage(this.tileImage(tile,displayScale),tile.x-level.phase.x,0,tile.width,tile.height);}continue;}
    const image=this.masks.get(s.image)||this.images.get(s.image),n=s.native;
    if(n){ctx.drawImage(image,0,n.wallTop,n.width,n.wallHeight,s.x-level.phase.x,0,s.width,208);ctx.drawImage(image,0,n.floorTop,n.width,n.floorHeight,s.x-level.phase.x,208,s.width,152);}else ctx.drawImage(image,s.x-level.phase.x,0);
   }
   ctx.restore();
  }
  sprite(ctx,prop,time){
   const p=prop.art,family=this.data.props[prop.room.chapter],clip=p.animated===undefined?null:family.animations[p.animated];
   const meta=clip?clip.frames[Math.floor(time*clip.fps+prop.room.index*1.3)%clip.frames.length]:family.static.find(f=>f.name===p.name);
   if(!meta)return;const image=this.images.get(meta.file);if(!image)return;
   const scale=prop.height/(clip?.referenceHeight||meta.height),anchorY=clip?.anchor==='top'?0:meta.anchorY;
   const y=prop.y-(clip?.anchor==='top'?prop.height:0);
   ctx.save();if(!p.mounted&&!clip){ctx.fillStyle='#10192538';ctx.beginPath();ctx.ellipse(prop.x,prop.y,Math.max(8,prop.height*.16),3.5,0,0,7);ctx.fill();}
   ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,prop.x-meta.anchorX*scale,y-anchorY*scale,meta.width*scale,meta.height*scale);ctx.restore();
  }
  visibleProps(level,view){return level.props.filter(p=>p.x+p.width/2>=view.left-40&&p.x-p.width/2<=view.right+40);}
  ambient(ctx,level,time,view){
   ctx.save();ctx.translate(0,level.offsetY);ctx.scale(level.scale,level.scale);
   for(const effect of this.data.sceneEffects||[]){if(effect.chapter!==level.phase.id)continue;const image=this.images.get(effect.file);if(!image)continue;const cw=image.width/effect.columns,ch=image.height/effect.rows,frame=Math.floor(time*effect.fps)%effect.frames;ctx.save();ctx.globalCompositeOperation=effect.blend||'source-over';ctx.globalAlpha=effect.opacity??1;ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(image,frame%effect.columns*cw+effect.insetX,Math.floor(frame/effect.columns)*ch+effect.insetY,cw-effect.insetX*2,ch-effect.insetY*2,effect.x-level.phase.x,effect.y,effect.width,effect.height);ctx.restore();}
   for(const room of level.rooms){const base=room.x-level.phase.x;if((base+room.width)*level.scale<view.left||base*level.scale>view.right)continue;
    for(const a of room.ambient){
     if(a.kind==='leaves'){for(let i=0;i<6;i++){const x=base+(time*(9+i%3)+i*89+a.seed)%(room.width+30),y=80+((i*47+time*(5+i%2))%230);ctx.fillStyle=['#b7ae60aa','#c8bd6c99','#90ad6299'][i%3];ctx.fillRect(Math.round(x),Math.round(y),3,1);}}
     else if(a.kind==='water'){ctx.strokeStyle='#d4efff88';ctx.lineWidth=1;for(let i=0;i<5;i++){const x=base+a.x+Math.sin(time*.5+i*2)*a.width*.45;ctx.beginPath();ctx.moveTo(x,a.y+i%3*5);ctx.lineTo(x+8+Math.sin(time*2+i)*4,a.y+i%3*5);ctx.stroke();}}
     else if(a.kind==='embers'){for(let i=0;i<5;i++){const age=(time*.4+i*.23)%1;ctx.globalAlpha=(1-age)*.5;ctx.fillStyle='#f6c47c';ctx.fillRect(Math.round(base+a.x+Math.sin(age*7+i)*8),Math.round(a.y-age*32),1,2);}ctx.globalAlpha=1;}
     else if(a.kind==='circuit'){ctx.globalAlpha=.2+.13*Math.sin(time*1.6+room.index);ctx.fillStyle='#96f6cf';for(let i=0;i<4;i++)ctx.fillRect(base+80+i*130,209,35,1);ctx.globalAlpha=1;}
     else if(a.kind==='reactor'){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.04+.035*Math.sin(time*1.8);ctx.fillStyle='#8cebc6';ctx.beginPath();ctx.ellipse(base+a.x,a.y,a.width*.6,a.height*.55,0,0,7);ctx.fill();ctx.restore();}
    }
   }ctx.restore();
  }
 }
 root.Ben10CampaignRenderer=Renderer;
})(typeof globalThis==='undefined'?this:globalThis);
