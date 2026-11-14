/* Fixed-step side-on platform physics: one-way platforms, coyote time and buffered jumps. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Ben10Mirror=factory()})(globalThis,function(){'use strict';
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function layout(index=0){const hard=index===1,width=hard?2280:1800,ground=hard?[[0,260],[390,630],[785,1020],[1190,1440],[1600,1840],[1990,2280]]:[[0,350],[445,715],[805,1100],[1220,1510],[1620,1800]],upper=hard?[[240,110,270],[620,130,264],[1000,130,258],[1120,110,220],[1420,130,260],[1830,120,262]]:[[285,105,268],[690,135,264],[1070,120,268],[1175,100,230],[1490,105,267]];
 return{index,width,height:360,exit:{x:width-65,y:322},checkpoint:hard?{x:1250,y:322}:{x:870,y:322},platforms:[...ground.map(([x,end],n)=>({id:'floor-'+n,x,width:end-x,y:322,ground:true})),...upper.map(([x,width,y],n)=>({id:'step-'+n,x,width,y,move:hard&&n===1?28:0,phase:n}))],hazards:(hard?[520,920,1340,1740,2100]:[600,980,1390]).map((x,n)=>({kind:'trap',x,y:322,radius:18,period:hard?2.15:2.8,phase:n*.7})).concat(hard?[{kind:'orb',x:945,y:237,radius:15,period:2.4,phase:.7},{kind:'beam',x:1705,y:165,radius:9,period:3.2,phase:.2}]:[])}
}
class Run{
 constructor(index=0,{checkpoint=0,onHurt=()=>{}}={}){this.data=layout(index);this.onHurt=onHurt;this.time=0;this.invul=0;this.jumpBuffer=0;this.coyote=0;this.lastJump=false;this.complete=false;this.checkpoint=checkpoint?{...this.data.checkpoint}:{x:85,y:322};this.checkpointReached=!!checkpoint;this.player={...this.checkpoint,vx:0,vy:0,width:20,height:52,onGround:true,facing:'right',jumpAge:0,jumpCount:0,landLeft:0,platform:'floor-0'};this.player.platform=this.platforms().find(p=>p.x<=this.player.x&&p.x+p.width>=this.player.x&&p.y===this.player.y)?.id}
 platforms(){return this.data.platforms.map(p=>({...p,x:p.x+(p.move?p.move*Math.sin(this.time*1.15+(p.phase||0)):0)}))}
 hazardActive(h){const phase=(this.time+h.phase)%h.period;return h.kind==='orb'||phase>h.period*.48&&phase<h.period*.81}
 hurt(n,reason){if(this.invul>0)return false;this.invul=1.15;this.onHurt(n,reason);return true}
 respawn(){Object.assign(this.player,{...this.checkpoint,vx:0,vy:0,onGround:true,jumpAge:0,landLeft:0});this.player.platform=this.platforms().find(p=>p.x<=this.player.x&&p.x+p.width>=this.player.x&&p.y===this.player.y)?.id;this.coyote=.12;this.invul=Math.max(this.invul,1.15)}
 update(dt,input={}){if(this.complete||!(dt>0))return;for(let rest=Math.min(dt,.1);rest>1e-8&&!this.complete;rest-=Math.min(rest,1/120))this.step(Math.min(rest,1/120),input)}
 step(dt,input){const p=this.player,oldPlatforms=this.platforms();this.time+=dt;this.invul=Math.max(0,this.invul-dt);p.landLeft=Math.max(0,p.landLeft-dt);p.jumpAge+=dt;const platforms=this.platforms(),standing=platforms.find(a=>a.id===p.platform),before=oldPlatforms.find(a=>a.id===p.platform);if(p.onGround&&standing&&before)p.x+=standing.x-before.x;
  const pressed=!!input.jump;if(pressed&&!this.lastJump)this.jumpBuffer=.13;this.lastJump=pressed;this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);this.coyote=p.onGround?.11:Math.max(0,this.coyote-dt);
  const x=clamp(input.x||0,-1,1);p.vx+=(x*195-p.vx)*(1-Math.exp(-dt*(p.onGround?22:12)));if(x)p.facing=x>0?'right':'left';
  if(this.jumpBuffer>0&&this.coyote>0){p.vy=-448;p.onGround=false;p.platform=null;p.jumpAge=0;p.jumpCount++;this.jumpBuffer=this.coyote=0;input.onJump?.()}
  const previousY=p.y;p.x=clamp(p.x+p.vx*dt,15,this.data.width-15);p.vy+=1080*dt*(p.vy<0&&!pressed?1.75:1);p.y+=p.vy*dt;p.onGround=false;p.platform=null;
  if(p.vy>=0)for(const a of platforms)if(previousY<=a.y+2&&p.y>=a.y&&p.x+p.width*.35>a.x&&p.x-p.width*.35<a.x+a.width){p.y=a.y;if(p.vy>120)p.landLeft=.14;p.vy=0;p.onGround=true;p.platform=a.id;break}
  if(p.onGround&&p.x>=this.data.checkpoint.x&&!this.checkpointReached){this.checkpointReached=true;this.checkpoint={...this.data.checkpoint};input.onCheckpoint?.()}
  if(p.y>425){this.hurt(10,'fall');this.respawn();return}
  for(const h of this.data.hazards){if(!this.hazardActive(h))continue;const hy=h.kind==='orb'?h.y+Math.sin(this.time*2.6)*47:h.y;const hit=h.kind==='beam'?Math.abs(p.x-h.x)<h.radius+p.width*.35&&p.y>h.y:Math.abs(p.x-h.x)<h.radius+p.width*.35&&p.y>hy-12&&p.y-p.height<hy+12;if(hit)this.hurt(h.kind==='trap'?8:h.kind==='orb'?9:12,h.kind)}
  if(p.onGround&&Math.abs(p.x-this.data.exit.x)<32&&Math.abs(p.y-this.data.exit.y)<8){this.complete=true;input.onExit?.()}
 }
}
return{layout,Run};});
