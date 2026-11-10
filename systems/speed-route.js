/* XLR8 plans in world coordinates and sweeps every travelled segment. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Ben10Speed=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const config=Object.freeze({holdThreshold:.18,planningTime:1.6,maxRoute:1800,tapDistance:180,rushSpeed:1900,radius:14});
 const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
 const finite=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y);
 function projection(a,b,p){const dx=b.x-a.x,dy=b.y-a.y,n=dx*dx+dy*dy;return n?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/n)):0;}
 function distanceToSegment(a,b,p){const u=projection(a,b,p);return Math.hypot(p.x-a.x-(b.x-a.x)*u,p.y-a.y-(b.y-a.y)*u);}
 function circleEntry(a,b,p,r){
  const dx=b.x-a.x,dy=b.y-a.y,ox=a.x-p.x,oy=a.y-p.y,c=ox*ox+oy*oy-r*r,dot=ox*dx+oy*dy,n=dx*dx+dy*dy;
  if(!n)return null;if(c<=1e-8)return dot>=0?null:0;
  const disc=dot*dot-n*c;if(disc<0)return null;const t=(-dot-Math.sqrt(disc))/n;return t>=0&&t<=1?t:null;
 }
 function clipSegment(a,b,world={},radius=config.radius){
  if(!finite(a)||!finite(b))throw new Error('Invalid route point');
  let fraction=1;
  const bounds=world.bounds||{minX:110+radius,minY:85+radius,maxX:(world.width||2400)-95-radius,maxY:(world.height||1800)-95-radius};
  for(const [start,end,min,max] of [[a.x,b.x,bounds.minX,bounds.maxX],[a.y,b.y,bounds.minY,bounds.maxY]]){
   if(end>max&&end!==start)fraction=Math.min(fraction,Math.max(0,(max-start)/(end-start)));
   if(end<min&&end!==start)fraction=Math.min(fraction,Math.max(0,(min-start)/(end-start)));
  }
  for(const prop of world.obstacles||[]){if(!prop.block)continue;const hit=circleEntry(a,b,prop,prop.r+radius);if(hit!==null)fraction=Math.min(fraction,hit);}
  const blocked=fraction<1,span=distance(a,b),u=blocked?Math.max(0,fraction-.05/Math.max(span,.05)):1;
  return {end:{x:a.x+(b.x-a.x)*u,y:a.y+(b.y-a.y)*u},blocked,fraction};
 }
 class RoutePlan{
  constructor(start,{maxLength=config.maxRoute,radius=config.radius,minSpacing=12,maxPoints=160}={}){
   if(!finite(start))throw new Error('Invalid route origin');this.points=[{...start}];this.length=0;this.maxLength=maxLength;this.radius=radius;this.minSpacing=minSpacing;this.maxPoints=maxPoints;this.blocked=false;
  }
  add(point,world={},force=false){
   if(!finite(point)||this.points.length>=this.maxPoints||this.length>=this.maxLength-1e-6)return false;
   const from=this.points[this.points.length-1],span=distance(from,point);
   if(span<.001||(!force&&span<this.minSpacing))return false;
   const remaining=this.maxLength-this.length,u=Math.min(1,remaining/span),limited={x:from.x+(point.x-from.x)*u,y:from.y+(point.y-from.y)*u};
   const clipped=clipSegment(from,limited,world,this.radius),travel=distance(from,clipped.end);this.blocked=clipped.blocked||u<1;
   if(travel<.001)return false;this.points.push(clipped.end);this.length+=travel;return true;
  }
 }
 function quickPath(start,dx,dy,world={},range=config.tapDistance,radius=config.radius){
  const length=Math.hypot(dx,dy);if(!length||!finite(start))throw new Error('Invalid rush facing');
  const end=clipSegment(start,{x:start.x+dx/length*range,y:start.y+dy/length*range},world,radius).end;
  return distance(start,end)>.001?[{...start},end,{...start}]:[{...start}];
 }
 class Rush{
  constructor(points,{speed=config.rushSpeed,radius=config.radius}={}){
   if(!points.length||!points.every(finite)||!Number.isFinite(speed)||speed<=0)throw new Error('Invalid rush path');
   this.points=points.map(p=>({...p}));this.position={...points[0]};this.index=1;this.speed=speed;this.radius=radius;this.contacts=new Set();this.hits=new Set();this.distance=0;this.heading={x:1,y:0};this.segments=[];this.active=points.length>1;
  }
  step(dt,world={},targets=[],onHit=()=>{}){
   this.segments=[];if(!Number.isFinite(dt)||dt<=0||!this.active)return;
   let budget=dt*this.speed;
   while(budget>1e-8&&this.index<this.points.length){
    const a={...this.position},target=this.points[this.index],remaining=distance(a,target);
    if(remaining<1e-7){this.index++;continue;}
    const travel=Math.min(budget,remaining),u=travel/remaining,clipped=clipSegment(a,{x:a.x+(target.x-a.x)*u,y:a.y+(target.y-a.y)*u},world,this.radius),b=clipped.end,moved=distance(a,b);
    if(moved>1e-8){
     this.segments.push({from:a,to:b});
     this.heading={x:(b.x-a.x)/moved,y:(b.y-a.y)/moved};
     // A continuous overlap is one hit. Leaving the target rearms the next
     // crossing, including return legs and several crossings in one frame.
     const radius=this.radius+18;
     const crossed=targets.filter(p=>p.alive&&!(this.contacts.has(p)&&distance(a,p)<=radius+1e-7)&&distanceToSegment(a,b,p)<=radius).sort((p,q)=>projection(a,b,p)-projection(a,b,q));
     for(const hit of crossed){this.hits.add(hit);onHit(hit);}
     this.contacts=new Set(targets.filter(p=>p.alive&&distance(b,p)<=radius+1e-7));
    }
    this.position=b;this.distance+=moved;budget-=moved;
    if(clipped.blocked){this.active=false;return;}
    if(travel>=remaining-1e-7)this.index++;else break;
   }
   this.active=this.index<this.points.length;
  }
 }
 return {config,RoutePlan,Rush,quickPath,distanceToSegment,clipSegment};
});
