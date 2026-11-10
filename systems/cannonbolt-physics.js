/* Cannonbolt shares swept collisions with speed-route.js, using his wider shell. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./speed-route.js'));else root.Ben10Cannon=factory(root.Ben10Speed);})(typeof globalThis!=='undefined'?globalThis:this,function(Speed){
 'use strict';
 const config=Object.freeze({radius:21,minCharge:.35,maxCharge:1.15,foldTime:.18,unfoldTime:.2,walkSpeed:270,ballHeight:118});
 function chargedAttack(seconds,powered=false){
  if(!Number.isFinite(seconds))throw new Error('Invalid charge time');
  const power=Math.max(0,Math.min(1,(seconds-config.minCharge)/(config.maxCharge-config.minCharge)));
  return {damage:40+Math.round(32*power)+(powered?18:0),distance:230+230*power,speed:950+500*power,returns:!!powered,power};
 }
 function lightAttack(){return {damage:32,distance:190,speed:900,returns:false,power:0};}
 function dodgeAttack(){return {damage:0,distance:200,speed:700,returns:false,power:0};}
 function createRush(origin,dx,dy,world,attack){
  const path=Speed.quickPath(origin,dx,dy,world,attack.distance,config.radius);
  return new Speed.Rush(attack.returns?path:path.slice(0,2),{speed:attack.speed,radius:config.radius});
 }
 return {config,chargedAttack,lightAttack,dodgeAttack,createRush};
});
