/* A short sequence of plant eruptions, clipped to the arena and solid cover. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./speed-route.js'));else root.Ben10Wild=factory(root.Ben10Speed);})(typeof globalThis!=='undefined'?globalThis:this,function(Speed){
 'use strict';
 const config=Object.freeze({lightDamage:[18,22,28],lightReach:124,doubleReach:124,spinDamage:56,spinReach:108,waveDamage:74,distances:[58,113,168],delay:.1,nodeDuration:.75,hitStart:.14,hitEnd:.48,radius:36,depth:24});
 function plan(origin,dx,dy,world={}){
  const length=Math.hypot(dx,dy);if(!length||![origin?.x,origin?.y,dx,dy].every(Number.isFinite))throw new Error('Invalid root direction');
  const heading={x:dx/length,y:dy/length},nodes=[];
  for(const [i,d] of config.distances.entries()){
   const point={x:origin.x+heading.x*d,y:origin.y+heading.y*d};
   if(Speed.clipSegment(origin,point,world,16).blocked)break;
   nodes.push({...point,delay:i*config.delay,index:i});
  }
  return {origin:{...origin},heading,nodes};
 }
 class ThornField{
  constructor(){this.waves=[];this.serial=0;}
  clear(){this.waves=[];}
  launch(origin,dx,dy,world={}){const wave={id:++this.serial,...plan(origin,dx,dy,world),age:0,hits:new Set()};this.waves.push(wave);return wave;}
  tick(dt,world={},targets=[],onHit=()=>{}){
   if(!Number.isFinite(dt)||dt<=0)return;
   for(const wave of this.waves){
    const previous=wave.age;wave.age+=dt;
    for(const node of wave.nodes){
     const from=previous-node.delay,to=wave.age-node.delay;
     if(from>config.hitEnd||to<config.hitStart)continue;
     for(const d of targets){
      if(!d.alive||wave.hits.has(d)||((d.x-node.x)/(config.radius+8))**2+((d.y-node.y)/(config.depth+8))**2>1)continue;
      if(Speed.clipSegment(node,d,world,0).blocked||Speed.clipSegment(wave.origin,d,world,0).blocked)continue;
      wave.hits.add(d);onHit(d,config.waveDamage,node,wave);
     }
    }
   }
   this.waves=this.waves.filter(w=>w.age<(w.nodes.length?(w.nodes.length-1)*config.delay:0)+config.nodeDuration);
  }
 }
 return {config,plan,ThornField};
});
