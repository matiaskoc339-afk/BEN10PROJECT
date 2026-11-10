/* Upgrade's eye beam stops at the first obstruction; the blade sweeps its path. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./speed-route.js'));else root.Ben10Upgrade=factory(root.Ben10Speed);})(typeof globalThis!=='undefined'?globalThis:this,function(Speed){
 'use strict';
 const config=Object.freeze({lightDamage:[18,22,36],lightReach:98,massReach:112,laserDamage:34,laserRange:480,laserDuration:.24,bladeDamage:82,bladeRange:320,bladeSpeed:1120,radius:20});
 function heading(dx,dy){const n=Math.hypot(dx,dy);if(!Number.isFinite(n)||!n)throw new Error('Invalid Upgrade direction');return {x:dx/n,y:dy/n};}
 function valid(p){if(!p||!Number.isFinite(p.x)||!Number.isFinite(p.y))throw new Error('Invalid Upgrade origin');}
 class EyeBeams{
  constructor(){this.beams=[];this.serial=0;}
  clear(){this.beams=[];}
  fire(origin,dx,dy,world={},targets=[],onHit=()=>{},offset={x:0,y:-90}){
   valid(origin);valid(offset);const h=heading(dx,dy),clip=Speed.clipSegment(origin,{x:origin.x+h.x*config.laserRange,y:origin.y+h.y*config.laserRange},world,2);let distance=Math.hypot(clip.end.x-origin.x,clip.end.y-origin.y),target=null;
   for(const d of targets){if(!d.alive)continue;const x=d.x-origin.x,y=d.y-origin.y,along=x*h.x+y*h.y,side=x*h.y-y*h.x;if(along<12||Math.abs(side)>20)continue;const entry=Math.max(0,along-Math.sqrt(400-side*side));if(entry<distance&&!Speed.clipSegment(origin,d,world,0).blocked){distance=entry;target=d;}}
   const beam={id:++this.serial,origin:{...origin},heading:h,offset:{...offset},end:{x:origin.x+h.x*distance,y:origin.y+h.y*distance},age:0,target};this.beams.push(beam);if(target)onHit(target,config.laserDamage,beam);return beam;
  }
  tick(dt){if(!Number.isFinite(dt)||dt<=0)return;for(const b of this.beams)b.age+=dt;this.beams=this.beams.filter(b=>b.age<config.laserDuration);}
 }
 class BladeRush{
  constructor(origin,dx,dy,world={}){valid(origin);const h=heading(dx,dy),end=Speed.clipSegment(origin,{x:origin.x+h.x*config.bladeRange,y:origin.y+h.y*config.bladeRange},world,config.radius).end;this.motion=new Speed.Rush([{...origin},end],{speed:config.bladeSpeed,radius:config.radius});this.hits=new Set();}
  get position(){return this.motion.position;}
  get heading(){return this.motion.heading;}
  get active(){return this.motion.active;}
  step(dt,world={},targets=[],onHit=()=>{}){this.motion.step(dt,world,targets,d=>{if(this.hits.has(d)||Speed.clipSegment(this.position,d,world,0).blocked)return;this.hits.add(d);onHit(d,config.bladeDamage);});}
 }
 return {config,EyeBeams,BladeRush};
});
