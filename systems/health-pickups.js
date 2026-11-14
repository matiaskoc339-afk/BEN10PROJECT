/* Rare health drops. The chance uses Ben's retained life, including while transformed. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Ben10HealthPickups=factory()})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const CONFIG=Object.freeze({baseChance:.07,maxChance:.18,heal:8,lifetime:22,collectDelay:.55,maxDrops:10});
 function chance(health,maxHealth=50){const fraction=Math.max(0,Math.min(1,health/Math.max(1,maxHealth)));return CONFIG.baseChance+(CONFIG.maxChance-CONFIG.baseChance)*Math.pow(1-fraction,1.35)}
 function pose(item){const settle=Math.min(1,item.age/.55),bob=Math.sin(item.age*3.5+item.id*.9);return {lift:9+bob*3+Math.sin(settle*Math.PI)*18,tilt:Math.sin(item.age*2.1+item.id)*.055,opacity:Math.min(1,Math.max(0,(CONFIG.lifetime-item.age)/2)),glow:.65+.18*Math.sin(item.age*4)}}
 class System{
  constructor({random=Math.random}={}){this.random=random;this.items=[];this.seen=new Set();this.nextId=0}
  clear(){this.items=[];this.seen.clear()}
  attempt(enemy,stats,ground){if(!enemy||enemy.kind==='finalboss'||this.seen.has(enemy.id))return null;this.seen.add(enemy.id);if(this.items.length>=CONFIG.maxDrops||this.random()>=chance(stats.benHealth??stats.health,stats.config.maxHealth))return null;const at=ground({x:enemy.x,y:enemy.y});if(!at)return null;const item={id:++this.nextId,x:at.x,y:at.y,age:0,value:CONFIG.heal};this.items.push(item);return item}
  update(dt,player,stats,onCollect=()=>{}){if(!Number.isFinite(dt)||dt<=0||stats.health<=0)return;const alive=[];for(const item of this.items){item.age+=dt;if(item.age>=CONFIG.lifetime)continue;const need=stats.health<stats.config.maxHealth||(stats.benHealth??stats.health)<stats.config.maxHealth;
    if(need&&item.age>=CONFIG.collectDelay&&Math.hypot((player.x-item.x)/25,(player.y-item.y)/17)<=1){const healed=stats.heal(item.value);if(healed){onCollect(item,healed);continue}}
    alive.push(item)
   }this.items=alive}
 }
 class Renderer{
  constructor(){this.image=new Image();this.box=BEN10_HEALTH_ART.box;this.ready=new Promise((resolve,reject)=>{this.image.onload=()=>resolve(this);this.image.onerror=()=>reject(Error('No se pudo cargar la cápsula de salud'));this.image.src='assets/ui/health-pickup.png'})}
  shadow(c,item){const p=pose(item);c.save();c.globalAlpha=p.opacity*.3;c.fillStyle='#07120c';c.beginPath();c.ellipse(item.x,item.y,11,4,0,0,Math.PI*2);c.fill();c.restore()}
  draw(c,item){const p=pose(item),b=this.box,height=27,width=height*b.width/b.height;c.save();c.globalAlpha=p.opacity;c.translate(item.x,item.y-p.lift-height*.5);const halo=c.createRadialGradient(0,0,1,0,0,21);halo.addColorStop(0,'#e8bc6b33');halo.addColorStop(1,'#e8bc6b00');c.fillStyle=halo;c.fillRect(-22,-22,44,44);c.rotate(p.tilt);c.imageSmoothingEnabled=false;c.drawImage(this.image,b.x,b.y,b.width,b.height,-width/2,-height/2,width,height);c.restore();
   c.save();c.globalAlpha=p.opacity*p.glow;c.fillStyle='#fff2be';const a=item.age*1.7;c.fillRect(item.x+Math.cos(a)*17-1,item.y-p.lift-12+Math.sin(a)*14-1,2,2);c.restore()}
 }
 return {CONFIG,chance,pose,System,Renderer};
});
