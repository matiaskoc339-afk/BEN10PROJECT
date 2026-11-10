/* Swept collision keeps fast fireballs from skipping a target between frames. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.Ben10Fire=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function circleEntry(x,y,dx,dy,cx,cy,radius){
    const ox=x-cx,oy=y-cy,c=ox*ox+oy*oy-radius*radius;
    if(c<=0)return 0;
    const a=dx*dx+dy*dy;if(!a)return null;
    const b=2*(ox*dx+oy*dy),disc=b*b-4*a*c;
    if(disc<0)return null;
    const entry=(-b-Math.sqrt(disc))/(2*a);
    return entry>=0&&entry<=1?entry:null;
  }
  class ProjectileField{
    constructor(){this.shots=[];this.serial=0;}
    clear(){this.shots=[];}
    launch({x,y,dx,dy,special=false,kind='fire'}){
      const length=Math.hypot(dx,dy);
      if(!length||![x,y,dx,dy].every(Number.isFinite))throw new Error('Invalid fireball direction');
      if(!['fire','crystal'].includes(kind))throw new Error('Unknown projectile kind');
      const crystal=kind==='crystal';
      const shot={id:++this.serial,x,y,dx:dx/length,dy:dy/length,special:!!special,kind,
        speed:crystal?(special?500:600):(special?460:510),radius:crystal?(special?13:7):(special?12:8),damage:crystal?(special?72:28):(special?70:32),
        splash:special?(crystal?95:86):0,remaining:crystal?(special?680:640):(special?680:620),age:0};
      this.shots.push(shot);return shot;
    }
    tick(dt,{targets=[],obstacles=[],width=2400,height=1800},onImpact){
      if(!Number.isFinite(dt)||dt<=0)return;
      const current=this.shots;this.shots=[];
      for(const shot of current){
        const travel=Math.min(shot.remaining,shot.speed*dt),dx=shot.dx*travel,dy=shot.dy*travel;
        let entry=1,target=null,reason=null;
        // A solid at the same distance wins over a target behind it.
        for(const prop of obstacles){
          if(!prop.block)continue;
          const hit=circleEntry(shot.x,shot.y,dx,dy,prop.x,prop.y,prop.r+shot.radius);
          if(hit!==null&&hit<=entry){entry=hit;target=null;reason='wall';}
        }
        for(const dummy of targets){
          if(!dummy.alive)continue;
          const hit=circleEntry(shot.x,shot.y,dx,dy,dummy.x,dummy.y,18+shot.radius);
          if(hit!==null&&(hit<entry||(hit===entry&&reason===null))){entry=hit;target=dummy;reason='target';}
        }
        for(const [position,delta,limit] of [[shot.x,dx,width],[shot.y,dy,height]]){
          const edge=delta>0?(limit-position)/delta:delta<0?-position/delta:Infinity;
          if(edge>=0&&edge<entry){entry=edge;target=null;reason='edge';}
        }
        shot.x+=dx*entry;shot.y+=dy*entry;shot.remaining-=travel*entry;shot.age+=dt;
        if(reason||shot.remaining<=1e-8){onImpact({...shot,target,reason:reason||'range'});}
        else this.shots.push(shot);
      }
    }
  }
  return {ProjectileField,circleEntry};
});
