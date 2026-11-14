/* Small swept slime projectiles and timed poison on the ground plane. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./fire-projectiles.js'));else root.Ben10Stink=factory(root.Ben10Fire);})(typeof globalThis!=='undefined'?globalThis:this,function(Fire){
 'use strict';
 const config=Object.freeze({spitDamage:5,spitSpeed:520,spitRange:130,spitRadius:3,tailDamage:42,tailReach:130,poolRadius:62,poolDepth:34,poolDuration:4.2,poisonDamage:6,poisonInterval:.45,globSpeed:380});
 const orders=Object.freeze([[0,3,1,2],[2,1,3,0],[1,0,2,3]]);
 function blocked(a,b,obstacles=[],world=null){if(world?.clipSegment)return world.clipSegment(a,b,0,world).blocked;return obstacles.some(p=>p.block&&Fire.circleEntry(a.x,a.y,b.x-a.x,b.y-a.y,p.x,p.y,p.r)!==null);}
 class SlimeField{
  constructor(){this.shots=[];this.pools=[];this.bursts=new Set();this.serial=0;this.burstSerial=0;this.time=0;}
  clear(){this.shots=[];this.pools=[];this.bursts.clear();this.time=0;}
  beginBurst(session){const b={id:++this.burstSerial,session,launched:0,live:0,closed:false,hit:false,credited:false};this.bursts.add(b);return b;}
  closeBurst(b){if(b)b.closed=true;}
  spit({x,y,dx,dy,height=65,port=0,burst,delay=0}){
   const length=Math.hypot(dx,dy);if(!length||![x,y,dx,dy,height].every(Number.isFinite)||!burst||!this.bursts.has(burst)||burst.closed)throw new Error('Invalid slime shot');
   const shot={id:++this.serial,kind:'spit',x,y,dx:dx/length,dy:dy/length,height,startHeight:height,age:0,speed:config.spitSpeed,radius:config.spitRadius,remaining:config.spitRange,total:config.spitRange,damage:config.spitDamage,port,burst,delay:Math.max(0,delay)};
   burst.launched++;burst.live++;this.shots.push(shot);return shot;
  }
  glob({x,y,endX,endY,height=60}){
   const length=Math.hypot(endX-x,endY-y);if(![x,y,endX,endY,height].every(Number.isFinite))throw new Error('Invalid poison landing');
   const shot={id:++this.serial,kind:'glob',x,y,dx:length?(endX-x)/length:1,dy:length?(endY-y)/length:0,height,startHeight:height,age:0,speed:config.globSpeed,radius:6,remaining:length,total:Math.max(.001,length),damage:0};this.shots.push(shot);return shot;
  }
  addPool(x,y,born=this.time){const pool={id:++this.serial,x,y,born,age:0,radius:config.poolRadius,depth:config.poolDepth,duration:config.poolDuration,next:new Map()};this.pools.push(pool);return pool;}
  tick(dt,world={},onImpact=()=>{},onBurstEnd=()=>{},onPoison=()=>{}){
   if(!Number.isFinite(dt)||dt<=0)return;
   const start=this.time,end=start+dt,targets=world.targets||[],obstacles=world.obstacles||[],width=world.width||2400,height=world.height||1800;
   const shots=this.shots;this.shots=[];
   for(const s of shots){
    const wait=Math.min(dt,s.delay||0),elapsed=dt-wait;s.delay=Math.max(0,(s.delay||0)-dt);if(elapsed<=0){this.shots.push(s);continue;}
    const travel=Math.min(s.remaining,s.speed*elapsed),dx=s.dx*travel,dy=s.dy*travel;let entry=1,target=null,reason=null;
    if(world.clipSegment){const clip=world.clipSegment(s,{x:s.x+dx,y:s.y+dy},s.radius,world);if(clip.blocked){entry=clip.fraction;reason='wall';}}
    for(const p of obstacles){if(!p.block||(world.clipSegment&&p.mapFootprint))continue;const hit=Fire.circleEntry(s.x,s.y,dx,dy,p.x,p.y,p.r+s.radius);if(hit!==null&&hit<=entry){entry=hit;reason='wall';target=null;}}
    if(s.kind==='spit')for(const d of targets){if(!d.alive)continue;const hit=Fire.circleEntry(s.x,s.y,dx,dy,d.x,d.y,18+s.radius);if(hit!==null&&(hit<entry||(hit===entry&&!reason))){entry=hit;target=d;reason='target';}}
    const limits=world.clipSegment?[]:[[s.x,dx,110+s.radius,width-95-s.radius],[s.y,dy,85+s.radius,height-95-s.radius]];
    for(const [position,delta,min,max] of limits){
     if(position<min||position>max){entry=0;target=null;reason='edge';break;}
     const hit=delta>0?(max-position)/delta:delta<0?(min-position)/delta:Infinity;
     if(hit>=0&&hit<entry){entry=hit;target=null;reason='edge';}
    }
    s.x+=dx*entry;s.y+=dy*entry;s.remaining-=travel*entry;s.age+=elapsed;
    const progress=Math.max(0,Math.min(1,1-s.remaining/s.total));s.height=s.kind==='glob'?s.startHeight*(1-progress)+Math.sin(progress*Math.PI)*24:s.startHeight+(48-s.startHeight)*progress;
    if(reason||s.remaining<=1e-8){
     if(s.kind==='glob'&&reason!=='edge'){const at=start+wait+(s.speed?travel*entry/s.speed:0);this.addPool(s.x,s.y,at);}
     if(s.burst){s.burst.live--;if(target)s.burst.hit=true;}
     onImpact({...s,target,reason:reason||'range'});
    }else this.shots.push(s);
   }
   for(const b of this.bursts)if(b.closed&&!b.live){this.bursts.delete(b);onBurstEnd(b);}
   for(const p of this.pools){
    const until=Math.min(end,p.born+p.duration),from=Math.max(start,p.born);p.age=Math.max(0,end-p.born);
    if(until<from)continue;
    for(const d of targets){
     const grow=Math.min(1,Math.max(0,(until-p.born)/.16));
     const inside=d.alive&&((d.x-p.x)/(p.radius*grow+8))**2+((d.y-p.y)/(p.depth*grow+5))**2<=1&&!blocked(p,d,obstacles,world);
     if(!inside){p.next.delete(d);continue;}
     let next=p.next.has(d)?p.next.get(d):from;
     while(d.alive&&next<=until+1e-8&&next<p.born+p.duration-1e-8){onPoison(d,config.poisonDamage,p);next+=config.poisonInterval;}
     p.next.set(d,next);
    }
   }
   this.pools=this.pools.filter(p=>end<p.born+p.duration-1e-8);this.time=end;
  }
 }
 return {config,orders,SlimeField,blocked};
});
