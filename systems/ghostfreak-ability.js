/* Timing and safe materialisation, shared by the standalone and Node tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Ben10Ghost=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const config=Object.freeze({holdThreshold:.16,maxPhase:1.8,phaseSpeed:1.15,revealDuration:.8,contactTime:.4,cooldown:1.05,damage:44,comboDamage:72,reach:140,comboReach:160,radius:16});
 function intangible(time){return Number.isFinite(time)&&time>=config.holdThreshold&&time<config.maxPhase;}
 function attack(powered=false){return {damage:powered?config.comboDamage:config.damage,reach:powered?config.comboReach:config.reach};}
 function bounds(point,world,radius=config.radius){return {x:Math.max(110+radius,Math.min(world.width-95-radius,point.x)),y:Math.max(85+radius,Math.min(world.height-95-radius,point.y))};}
 function safeLanding(origin,fallback,isBlocked,world){
  const start=bounds(origin,world);if(!isBlocked(start.x,start.y))return start;
  for(let radius=8;radius<=240;radius+=8)for(let i=0;i<32;i++){
   const angle=i*Math.PI/16,p=bounds({x:start.x+Math.cos(angle)*radius,y:start.y+Math.sin(angle)*radius},world);
   if(!isBlocked(p.x,p.y))return p;
  }
  const last=bounds(fallback,world);return !isBlocked(last.x,last.y)?last:null;
 }
 return {config,intangible,attack,bounds,safeLanding};
});
