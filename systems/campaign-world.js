/* One ground-plane geometry for walking, dashes, skills and projectiles. */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('../mapas/world.js'):root.Ben10MapWorld);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.Ben10Campaign=api;
})(typeof globalThis==='undefined'?this:globalThis,function(MapWorld){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 function ellipseEntry(a,b,p,rx,ry){
  const x=(a.x-p.x)/rx,y=(a.y-p.y)/ry,dx=(b.x-a.x)/rx,dy=(b.y-a.y)/ry;
  const c=x*x+y*y-1,n=dx*dx+dy*dy,dot=x*dx+y*dy;
  if(!n)return null;
  // An actor already touching an object can retreat from it.
  if(c<=1e-8)return dot>=0?null:0;
  const disc=dot*dot-n*c;if(disc<0)return null;
  const at=(-dot-Math.sqrt(disc))/n;return at>=0&&at<=1?at:null;
 }
 class Level{
  constructor(data,{scale=1.25,offsetY=620}={}){
   this.data=data;this.scale=scale;this.offsetY=offsetY;this.phaseIndex=0;this.setPhase(0);
  }
  get phase(){return this.data.chapters[this.phaseIndex];}
  get width(){return (this.phase.end-this.phase.x)*this.scale;}
  get height(){return this.offsetY+this.data.height*this.scale;}
  get mapRect(){return {x:0,y:this.offsetY,width:this.width,height:this.data.height*this.scale};}
  world(x,y){return {x:(x-this.phase.x)*this.scale,y:this.offsetY+y*this.scale};}
  logical(point){return {x:point.x/this.scale+this.phase.x,y:(point.y-this.offsetY)/this.scale};}
  setPhase(index){
   if(!Number.isInteger(index)||!this.data.chapters[index])throw Error('Invalid campaign phase');
   this.phaseIndex=index;this.arena=null;this.rooms=this.data.rooms.filter(r=>r.chapter===this.phase.id);
   // Frame the actual door, keeping a little scenery beyond the end of the lane.
   const inset=[240,275,140][index];
   this.exit={x:this.width-inset*this.scale,y:this.offsetY+270*this.scale,range:115*this.scale};
   this.walkEnd=Math.min(this.width-18*this.scale,this.exit.x+72*this.scale);
   this.props=this.rooms.flatMap(room=>room.props.map(prop=>this.makeProp(room,prop)));
   return this.spawn();
  }
  makeProp(room,prop){
   const family=this.data.props[room.chapter],meta=prop.animated===undefined?family.static.find(p=>p.name===prop.name):family.animations[prop.animated].frames[0];
   const height=prop.height*this.scale,width=meta?meta.width/meta.height*height:height;
   const narrow=['arbol','pilar','farola','portal','sensor'].includes(prop.name);
   const radius=prop.collider?.rx*this.scale||(narrow?Math.max(6,height*.075):width*.4);
   const depth=prop.collider?.ry*this.scale||Math.max(4,Math.min(10,height*.14));
   const pos=this.world(room.x+prop.x,prop.y);
   return {...pos,r:Math.min(radius,depth),rx:radius,ry:depth,mapFootprint:true,block:!prop.mounted&&prop.y>=room.floorY-2,
    room,art:prop,type:'campaign',height,width};
  }
  laneAt(x){
   const logical=clamp(x/this.scale+this.phase.x,this.phase.x,this.phase.end-.001),lane=MapWorld.laneAt(this.data,logical);
   return {top:this.offsetY+lane.top*this.scale,bottom:this.offsetY+lane.bottom*this.scale};
  }
  bounds(radius=0){return {minX:Math.max(18*this.scale,this.arena?.left??0)+radius,maxX:Math.min(this.walkEnd,this.arena?.right??Infinity)-radius,minY:this.offsetY+226*this.scale+radius*.35,maxY:this.offsetY+342*this.scale-radius*.35};}
  onFloor(point,radius=0){
   if(!finite(point))return false;const bounds=this.bounds(radius),lane=this.laneAt(point.x),depth=radius*.35;
   return point.x>=bounds.minX-1e-7&&point.x<=bounds.maxX+1e-7&&point.y>=lane.top+depth-1e-7&&point.y<=lane.bottom-depth+1e-7;
  }
  blocked(point,radius=14,obstacles=this.props,{ignoreProps=false}={}){
   if(!this.onFloor(point,radius))return true;if(ignoreProps)return false;
   return obstacles.some(p=>{if(!p.block)return false;const rx=(p.rx??p.r)+radius,ry=(p.ry??p.r)+(p.mapFootprint?radius*.35:radius);return ((point.x-p.x)/rx)**2+((point.y-p.y)/ry)**2<1-1e-8;});
  }
  clipSegment(a,b,radius=14,obstacles=this.props,{ignoreProps=false}={}){
   if(!finite(a)||!finite(b))throw Error('Invalid campaign motion');
   let fraction=1;
   if(!ignoreProps)for(const p of obstacles){if(!p.block)continue;const entry=ellipseEntry(a,b,p,(p.rx??p.r)+radius,(p.ry??p.r)+(p.mapFootprint?radius*.35:radius));if(entry!==null)fraction=Math.min(fraction,entry);}
   // Sampling the full segment catches a narrow bridge even when both endpoints
   // are in wide plazas. Refinement keeps fast attacks flush with the wall.
   const span=Math.hypot(b.x-a.x,b.y-a.y),steps=Math.max(1,Math.ceil(span/3));let previous=0;
   for(let i=1;i<=steps;i++){
    const u=Math.min(fraction,i/steps),p={x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u};
    if(!this.onFloor(p,radius)){let low=previous,high=u;for(let k=0;k<18;k++){const m=(low+high)/2,q={x:a.x+(b.x-a.x)*m,y:a.y+(b.y-a.y)*m};if(this.onFloor(q,radius))low=m;else high=m;}fraction=Math.min(fraction,low);break;}
    previous=u;if(u>=fraction)break;
   }
   const blocked=fraction<1-1e-8,u=blocked?Math.max(0,fraction-.025/Math.max(span,.025)):1;
   return {end:{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u},fraction,blocked};
  }
  clampPoint(point,radius=14,obstacles=this.props,{ignoreProps=false}={}){
   const box=this.bounds(radius),x=clamp(point.x,box.minX,box.maxX),lane=this.laneAt(x),depth=radius*.35;
   const candidate={x,y:clamp(point.y,lane.top+depth,lane.bottom-depth)};
   if(!this.blocked(candidate,radius,obstacles,{ignoreProps}))return candidate;
   for(let distance=4;distance<=140;distance+=4)for(let i=0;i<24;i++){
    const a=i*Math.PI/12,p={x:candidate.x+Math.cos(a)*distance,y:candidate.y+Math.sin(a)*distance};
    if(!this.blocked(p,radius,obstacles,{ignoreProps}))return p;
   }
   return null;
  }
  move(from,dx,dy,radius=14,obstacles=this.props,{ignoreProps=false}={}){
   const options={ignoreProps},hit=this.clipSegment(from,{x:from.x+dx,y:from.y+dy},radius,obstacles,options);
   let p=hit.end;if(!hit.blocked)return p;
   // Slide along an edge instead of making diagonal movement stick to it.
   p=this.clipSegment(p,{x:from.x+dx,y:p.y},radius,obstacles,options).end;
   return this.clipSegment(p,{x:p.x,y:from.y+dy},radius,obstacles,options).end;
  }
  spawn(radius=21){return this.clampPoint({x:100*this.scale,y:this.offsetY+285*this.scale},radius)||{x:180*this.scale,y:this.offsetY+285*this.scale};}
  atExit(point){return point.x>=this.exit.x-this.exit.range&&this.onFloor(point,0);}
  progress(x){return clamp(x/(this.exit.x-this.exit.range),0,1);}
 }
 return {Level,ellipseEntry};
});
