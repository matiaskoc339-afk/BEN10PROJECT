// Shared combo focus. Selection happens once; an escaped target is not replaced mid-cast.
const combatTargetState={focus:null,energyWarningUntil:-1};
const COMBAT_SELF_SKILLS={
 'four-arms':['f','c5'],heatblast:['f','c4'],xlr8:['c3','c5'],diamondhead:['f'],
 cannonbolt:['c0','c3','c4'],ghostfreak:['f','c4','c5'],wildvine:['c2'],blitzwolfer:['c3'],upgrade:['f']
};
function combatTargetPolicy(form,skill){
 if(COMBAT_SELF_SKILLS[form]?.includes(skill.id))return {range:0};
 const route=EVO_MOVE_ROUTES[form]?.[skill.id];
 const capture=['grapple','drag','pullPunch'].includes(route);
 const grounded=({heatblast:['c3','c5'],diamondhead:['c0','c2','c3','c4','c5'],ghostfreak:['c3'],stinkfly:['f','c5'],wildvine:['f','c4','c5'],upgrade:['c5']})[form]?.includes(skill.id)||false;
 let range=capture?skill.reach:route==='flurry'?155:route==='pounceReturn'?skill.move+60:route==='liquid'?skill.move:route==='burrow'?skill.move+70:Math.max(skill.reach,skill.move||0);
 if(['elbow','clawRush','biteRush'].includes(route))range=Math.min(250,skill.move+skill.reach);
 return {range,capture,grounded};
}
function combatPointerWorld(){
 if(!pointer.active||typeof cam==='undefined')return null;
 return {x:cam.x+pointer.x/(dpr*cam.zoom),y:cam.y+pointer.y/(dpr*cam.zoom)};
}
function combatAimScore(c,d){
 const length=dist(c.x,c.y,d.x,d.y)||1,dot=((d.x-c.x)*c.dx+(d.y-c.y)*c.dy)/length;
 const point=combatPointerWorld();
 const cursor=point?Math.hypot(d.x-point.x,point.y-clamp(point.y,d.y-105,d.y)):Infinity;
 return {length,dot,cursor};
}
function combatCandidate(c,d,range){
 if(!d?.alive||!dummyList.includes(d))return false;
 const {length,dot}=combatAimScore(c,d);
 return length<=range&&dot>=.12&&!Ben10Speed.clipSegment({x:c.x,y:c.y},d,speedWorld(),0).blocked;
}
function combatChooseTarget(c,range){
 if(!(range>0))return null;
 const candidates=dummyList.filter(d=>combatCandidate(c,d,range));
 const focus=combatTargetState.focus;
 if(focus&&focus.form===c.form&&t-focus.time<=3.2&&candidates.includes(focus.target))return focus.target;
 const aimed=candidates.filter(d=>combatAimScore(c,d).cursor<=64).sort((a,b)=>combatAimScore(c,a).cursor-combatAimScore(c,b).cursor);
 if(aimed.length)return aimed[0];
 const looking=candidates.filter(d=>combatAimScore(c,d).dot>=.94).sort((a,b)=>combatAimScore(c,a).length-combatAimScore(c,b).length);
 return looking[0]||candidates.sort((a,b)=>combatAimScore(c,a).length-combatAimScore(c,b).length)[0]||null;
}
function combatRememberHit(d){
 if(!stats.form||progression.skill||!d.alive)return;
 const input=progression.comboLog.at(-1);if(!input||t-input.t>3.2)return;
 const c={x:player.x,y:player.y,dx:player.faceX,dy:player.faceY};
 const old=combatTargetState.focus;
 // Multi-target basic attacks remember the aimed/nearest victim, not array order.
 if(old&&old.form===stats.form.id&&old.inputTime===input.t&&old.target.alive){
  const a=combatAimScore(c,d),b=combatAimScore(c,old.target);
  if(b.cursor<=64&&(a.cursor>64||a.cursor>b.cursor))return;
  if((a.cursor===b.cursor||a.cursor>64&&b.cursor>64)&&a.length>=b.length)return;
 }
 combatTargetState.focus={target:d,form:stats.form.id,time:t,inputTime:input.t};
}
function combatLockTarget(c){
 c.targetPolicy=combatTargetPolicy(c.form,c.definition);c.targetRange=c.targetPolicy.range;
 c.target=combatChooseTarget(c,c.targetRange);c.targetLocked=true;
 if(!c.target)return;
 c.targetX=c.target.x;c.targetY=c.target.y;c.aim={x:c.target.x,y:c.target.y};
 const length=dist(c.x,c.y,c.aim.x,c.aim.y)||1;c.dx=(c.aim.x-c.x)/length;c.dy=(c.aim.y-c.y)/length;
 c.dir=Math.abs(c.dx)>Math.abs(c.dy)?c.dx<0?'left':'right':c.dy<0?'up':'down';
 faceFrom(c.dx,c.dy);
}
function combatTargetInReach(c){
 const d=c.target;if(!d?.alive||c.targetLost||!dummyList.includes(d))return false;
 if(Ben10Speed.clipSegment({x:player.x,y:player.y},d,speedWorld(),0).blocked)return false;
 if(c.captured)return true;
 return dist(c.x,c.y,d.x,d.y)<=c.targetRange&&(!c.aim||dist(c.aim.x,c.aim.y,d.x,d.y)<=75);
}
function combatGroundPoint(c,fallback=100){return c.aim?{...c.aim}:{x:c.x+c.dx*fallback,y:c.y+c.dy*fallback};}
function combatGroundStep(c,k,count,fallback){
 const end=combatGroundPoint(c,fallback),q=(k+1)/count;
 return {x:lerp(c.x,end.x,q),y:lerp(c.y,end.y,q)};
}
function combatHUDTime(){return typeof performance==='undefined'?t:performance.now()/1000;}
function combatEnergyDenied(){
 combatTargetState.energyWarningUntil=combatHUDTime()+.72;
 const hud=document.getElementById('hud');hud.classList.remove('is-energy-denied');void hud.getBoundingClientRect();syncHud();
}
function combatSyncEnergyWarning(){
 const active=combatHUDTime()<combatTargetState.energyWarningUntil,hud=document.getElementById('hud');
 hud.classList.toggle('is-energy-denied',active);
 const red=active||stats.snapshot().rechargeLocked;
 hudElements.energyFill.setAttribute('fill',red?'url(#hudRed)':'url(#hudGreen)');
 for(const element of [hudElements.energyTopFill,hudElements.energyBottomFill])element.setAttribute('fill',red?'url(#hudRedTop)':'url(#hudGreenTop)');
}
function combatDrawTarget(){
 const cast=progression.skill,focus=combatTargetState.focus;
 const target=cast?.target||(!cast&&focus&&focus.form===stats.form?.id&&t-focus.time<=3.2?focus.target:null);
 if(!target?.alive)return;
 ctx.save();ctx.strokeStyle='#c1fa85';ctx.globalAlpha=.75;ctx.lineWidth=2;
 for(let i=0;i<4;i++){ctx.beginPath();ctx.ellipse(target.x,target.y-2,27,11,0,i*Math.PI/2+.12,i*Math.PI/2+.62);ctx.stroke();}
 if(cast?.targetPolicy.grounded&&cast.aim&&cast.next===0){ctx.globalAlpha=.4;ctx.setLineDash([4,5]);ctx.beginPath();ctx.ellipse(cast.aim.x,cast.aim.y,40,16,0,0,7);ctx.stroke();}
 ctx.restore();
}
const combatNativeDamage=damageDummy;
damageDummy=function(d,damage,heavy,feedback={}){const result=combatNativeDamage(d,damage,heavy,feedback);if(result&&feedback.rememberTarget!==false)combatRememberHit(d);return result;};
const combatNativeSyncHud=syncHud;
syncHud=function(){combatNativeSyncHud();combatSyncEnergyWarning();};
