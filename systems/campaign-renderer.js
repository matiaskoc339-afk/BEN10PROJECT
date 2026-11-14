(function(root){
 'use strict';
 class Renderer{
  constructor(data,{base='mapas/'}={}){
   this.data=data;this.base=base;this.images=new Map();this.masks=new Map();
   const paths=new Set();for(const chapter of data.chapters)for(const s of chapter.segments)paths.add(s.image);
   for(const family of Object.values(data.props)){for(const p of family.static)paths.add(p.file);for(const clip of family.animations)for(const f of clip.frames)paths.add(f.file);}
   this.ready=Promise.all([...paths].map(file=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{this.images.set(file,image);resolve()};image.onerror=()=>reject(Error('No se pudo cargar el mapa: '+file));image.src=base+file;}))).then(()=>{
    for(const chapter of data.chapters)for(const s of chapter.segments){if(!s.overlap)continue;const image=this.images.get(s.image),surface=document.createElement('canvas');surface.width=image.width;surface.height=image.height;const c=surface.getContext('2d');c.drawImage(image,0,0);c.globalCompositeOperation='destination-in';const gradient=c.createLinearGradient(0,0,s.overlap,0);gradient.addColorStop(0,'transparent');gradient.addColorStop(1,'black');c.fillStyle=gradient;c.fillRect(0,0,surface.width,surface.height);this.masks.set(s.image,surface);}
   });
  }
  background(ctx,level,view){
   ctx.save();ctx.translate(0,level.offsetY);ctx.scale(level.scale,level.scale);ctx.imageSmoothingEnabled=false;
   for(const s of level.phase.segments){const x=(s.x-level.phase.x)*level.scale;if(x+s.width*level.scale<view.left||x>view.right)continue;ctx.drawImage(this.masks.get(s.image)||this.images.get(s.image),s.x-level.phase.x,0);}
   ctx.restore();
  }
  sprite(ctx,prop,time){
   const p=prop.art,family=this.data.props[prop.room.chapter],clip=p.animated===undefined?null:family.animations[p.animated];
   const meta=clip?clip.frames[Math.floor(time*clip.fps+prop.room.index*1.3)%clip.frames.length]:family.static.find(f=>f.name===p.name);
   if(!meta)return;const image=this.images.get(meta.file);if(!image)return;
   const scale=prop.height/(clip?.referenceHeight||meta.height),anchorY=clip?.anchor==='top'?0:meta.anchorY;
   const y=prop.y-(clip?.anchor==='top'?prop.height:0);
   ctx.save();if(!p.mounted&&!clip){ctx.fillStyle='#10192538';ctx.beginPath();ctx.ellipse(prop.x,prop.y,Math.max(8,prop.height*.16),3.5,0,0,7);ctx.fill();}
   ctx.imageSmoothingEnabled=false;ctx.drawImage(image,Math.round(prop.x-meta.anchorX*scale),Math.round(y-anchorY*scale),Math.round(meta.width*scale),Math.round(meta.height*scale));ctx.restore();
  }
  visibleProps(level,view){return level.props.filter(p=>p.x+p.width/2>=view.left-40&&p.x-p.width/2<=view.right+40);}
  ambient(ctx,level,time,view){
   ctx.save();ctx.translate(0,level.offsetY);ctx.scale(level.scale,level.scale);
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
