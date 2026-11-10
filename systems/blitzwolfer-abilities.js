/* Claw rushes stop at contact; sonic fronts travel through a forward cone. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./speed-route.js'));else root.Ben10Wolf=factory(root.Ben10Speed);})(typeof globalThis!=='undefined'?globalThis:this,function(Speed){
 'use strict';
 const config=Object.freeze({lightDamage:[20,24,32],lightReach:96,biteReach:88,rushDamage:52,rushDistance:185,rushSpeed:740,rushWindup:.22,radius:20,clawContact:46,sonicDamage:78,sonicSpeed:640,sonicRange:390,sonicSpread:.36,sonicTail:.18});
 function heading(dx,dy){const n=Math.hypot(dx,dy);if(!Number.isFinite(n)||!n)throw new Error('Invalid wolf direction');return {x:dx/n,y:dy/n};}
 function valid(p){if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))throw new Error('Invalid wolf origin');}
 class ClawRush{
  constructor(origin,dx,dy){valid(origin);this.position={...origin};this.heading=heading(dx,dy);this.time=0;this.distance=0;this.active=true;this.hits=new Set();}
  tick(dt,world={},targets=[],onHit=()=>{}){
   if(!Number.isFinite(dt)||dt<=0||!this.active)return;
   const before=this.time;this.time+=dt;const elapsed=Math.max(0,this.time-config.rushWindup)-Math.max(0,before-config.rushWindup);
   const travel=Math.min(config.rushDistance-this.distance,elapsed*config.rushSpeed);if(travel<=0)return;
   const a={...this.position},b={x:a.x+this.heading.x*travel,y:a.y+this.heading.y*travel};
   const contact={...world,obstacles:[...(world.obstacles||[]),...targets.filter(d=>d.alive).map(d=>({x:d.x,y:d.y,r:config.clawContact-config.radius,block:true}))]};
   const clipped=Speed.clipSegment(a,b,contact,config.radius),end=clipped.end;
   for(const d of targets){if(!d.alive||this.hits.has(d)||Speed.distanceToSegment(a,end,d)>config.clawContact+.1)continue;const forward=(d.x-a.x)*this.heading.x+(d.y-a.y)*this.heading.y;if(forward<0||Speed.clipSegment(a,d,world,0).blocked)continue;this.hits.add(d);onHit(d,config.rushDamage);}
   this.distance+=Math.hypot(end.x-a.x,end.y-a.y);this.position=end;if(clipped.blocked||this.distance>=config.rushDistance-1e-7)this.active=false;
  }
 }
 class SonicField{
  constructor(){this.waves=[];this.serial=0;}
  clear(){this.waves=[];}
  launch(origin,dx,dy,offset={x:0,y:-82}){valid(origin);valid(offset);const w={id:++this.serial,origin:{...origin},heading:heading(dx,dy),offset:{...offset},age:0,hits:new Set()};this.waves.push(w);return w;}
  tick(dt,world={},targets=[],onHit=()=>{}){
   if(!Number.isFinite(dt)||dt<=0)return;
   for(const w of this.waves){const previous=w.age;w.age+=dt;const from=Math.min(config.sonicRange,previous*config.sonicSpeed),front=Math.min(config.sonicRange,w.age*config.sonicSpeed);
    if(previous>config.sonicRange/config.sonicSpeed)continue;
    for(const d of targets){if(!d.alive||w.hits.has(d))continue;const x=d.x-w.origin.x,y=d.y-w.origin.y,along=x*w.heading.x+y*w.heading.y,side=Math.abs(x*w.heading.y-y*w.heading.x);
     if(along<20||along>config.sonicRange||along+16<from||along-16>front||side>18+along*config.sonicSpread||Speed.clipSegment(w.origin,d,world,0).blocked)continue;
     w.hits.add(d);onHit(d,config.sonicDamage,w);
    }
   }
   this.waves=this.waves.filter(w=>w.age<config.sonicRange/config.sonicSpeed+config.sonicTail);
  }
 }
 return {config,ClawRush,SonicField};
});
