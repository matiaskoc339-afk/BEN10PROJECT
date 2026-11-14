// V33: drawn key poses and per-technique choreography. Original basic atlases stay intact.
const EVO_MOVE_ROUTES={
 'four-arms':{c0:'elbow',c1:'step',c4:'grapple'},
 heatblast:{c0:'step',c1:'hover'},
 xlr8:{f:'rush',c0:'kickRush',c1:'flurry',c2:'drift',c3:'orbitOnce',c5:'zigzag'},
 diamondhead:{},
 cannonbolt:{f:'meteor',c0:'bounce',c1:'clawRush',c2:'hotRush',c3:'rev',c4:'return',c5:'comet'},
 ghostfreak:{c0:'phase',c2:'grapple',c3:'burrow'},
 stinkfly:{c0:'hoverSting',c2:'dive',c5:'rainHover'},
 wildvine:{c1:'pullPunch'},
 blitzwolfer:{c0:'step',c1:'biteRush',c2:'pounceReturn',c4:'drag'},
 upgrade:{c0:'step',c5:'liquid'}
};
function evolutionSkillIntangible(){
 const c=progression.skill;if(!c)return false;const p=c.age/c.duration;
 return c.form==='ghostfreak'&&((c.definition.id==='c0'&&p>.15&&p<.57)||(c.definition.id==='c3'&&p>.2&&p<.83));
}
function evolutionFindTarget(c,range){
 if(c.targetLocked)return combatTargetInReach(c)?c.target:null;
 return combatChooseTarget(c,range);
}
function evolutionCancelSkill(){
 const c=progression.skill;for(const d of dummyList){d.skillLift=0;d.skillHidden=false;d.skillTilt=0;}
 progression.skill=null;progression.casts=[];
 if(player.mode==='skill'){const landing=speedSafeLanding({x:player.x,y:player.y},{x:c?.dx||1,y:c?.dy||0});player.x=landing.x;player.y=landing.y;player.mode='idle';player.modeTime=0;player.modeDur=0;}
 stats.setInvulnerable(false);
}
function evolutionBeginSkill(index,skill){
 if(progression.skill||stats.form?.id!==SKILL_BOOK[index].id||player.mode!=='idle')return false;
 const bonus=evolutionBonus(),last=progression.abilityTimes[stats.form.id+skill.id]??-100;
 if(stats.energy<skill.cost){combatEnergyDenied();return false;}
 if(t-last<skill.cooldown){showToast('RECARGANDO · '+skill.name.toUpperCase());return false;}
 faceForAction();const duration=skill.duration,c={form:stats.form.id,index,definition:skill,style:skill.style,label:skill.name,age:0,time:duration,duration,x:player.x,y:player.y,dx:player.faceX,dy:player.faceY,dir:player.dir,power:{...bonus},next:0,hit:new Set(),contacts:new Set(),target:null,color:SKILL_BOOK[index].color,z:0,alpha:1};
 c.route=EVO_MOVE_ROUTES[c.form]?.[skill.id]||'stationary';
 combatLockTarget(c);
 c.destination={x:c.x+c.dx*skill.move,y:c.y+c.dy*skill.move};
 if(c.route==='liquid'&&c.aim)c.destination={...c.aim};
 if(c.route==='burrow'&&c.aim){const travel=Math.max(0,Math.min(skill.move,dist(c.x,c.y,c.aim.x,c.aim.y)-45));c.destination={x:c.x+c.dx*travel,y:c.y+c.dy*travel};}
 stats.energy-=skill.cost;progression.abilityTimes[c.form+skill.id]=t;progression.comboLog=[];progression.skill=c;progression.casts=[c];
 startMode('skill',duration);player.moving=false;player.runClock=0;evolutionTexture(index,skill);
 showCombo(skill.name.toUpperCase()+' · −'+skill.cost+' ENERGÍA');syncHud();return true;
}
function evolutionShiftTarget(c,d,x,y){
 const clipped=Ben10Speed.clipSegment({x:d.x,y:d.y},{x,y},speedWorld(),18);d.x=clipped.end.x;d.y=clipped.end.y;
}
function evolutionKnock(c,d,strength){evolutionShiftTarget(c,d,d.x+c.dx*strength,d.y+c.dy*strength);}
function evolutionFrontAt(c,x,y,damage,reach,width=60,once=false){
 let hits=0;for(const d of dummyList){const dx=d.x-x,dy=d.y-y,along=dx*c.dx+dy*c.dy,side=Math.abs(dx*c.dy-dy*c.dx);
  if(!d.alive||(once&&c.hit.has(d))||along<0||along>reach||side>width||Ben10Speed.clipSegment({x,y},d,speedWorld(),0).blocked)continue;
  if(evolutionHit(c,d,damage)){hits++;if(once)c.hit.add(d);}
 }return hits;
}
function evolutionTargetContact(c,damage,{slam=false,knock=0}={}){
 const d=c.target;if(!combatTargetInReach(c))return 0;
 if(evolutionHit(c,d,damage)){if(slam){d.skillLift=0;d.skillTilt=0;d.stunTime=1.1;evolutionEffect(c,'impact',d.x,d.y,80);shake=Math.max(shake,7);}if(knock)evolutionKnock(c,d,knock);return 1;}return 0;
}
function evolutionGroundSpike(c,x,y,radius,damage,size=75,kind='pillar'){
 const point=Ben10Speed.clipSegment({x:c.x,y:c.y},{x,y},speedWorld(),0).end;x=point.x;y=point.y;
 evolutionEffect(c,kind,x,y,size,.85);return evolutionArea(c,x,y,radius,damage,{front:true});
}
function evolutionProjectile(c,k,kind,angle=0){
 const a=Math.atan2(c.dy,c.dx)+angle,spread=kind==='fire'?(k%2?1:-1)*13:(k%2?1:-1)*9;
 progression.fields.push({kind:'projectile',style:kind,source:c,x:player.x+c.dx*28-c.dy*spread,y:player.y+c.dy*28+c.dx*spread,dx:Math.cos(a),dy:Math.sin(a),speed:kind==='rock'?390:kind==='seed'?360:kind==='slime'||kind==='sticky'?350:kind==='wind'?650:480,life:2,age:0,travel:0,range:c.definition.reach,radius:kind==='rock'?35:kind==='fire'?24:kind==='wind'?20:kind==='sticky'?14:8,damage:c.definition.damage,hit:new Set()});
}
function evolutionBeam(c,damage,range,width,kind='beam'){
 const origin={x:player.x,y:player.y},end={x:origin.x+c.dx*range,y:origin.y+c.dy*range};
 const clip=Ben10Speed.clipSegment(origin,end,speedWorld(),0),reach=dist(origin.x,origin.y,clip.end.x,clip.end.y);
 const hits=evolutionFrontAt(c,origin.x,origin.y,damage,reach,width);evolutionEffect(c,kind,origin.x,origin.y,reach,.3);return hits;
}
function evolutionContact(c,k){
 const s=c.definition,id=s.id,p=c.age/c.duration,r=s.reach,front=(step=95)=>({x:c.x+c.dx*step,y:c.y+c.dy*step});let hit=0;
 if(c.form==='diamondhead'&&id==='f'){progression.buffs[c.form]={time:3,def:.4};evolutionEffect(c,'armor',player.x,player.y,60,3);return;}
 if(c.form==='heatblast'&&id==='c0'){
  hit=evolutionForward(c,s.damage,r,65);for(const d of dummyList){const x=d.x-player.x,y=d.y-player.y;if(d.alive&&x*c.dx+y*c.dy>=0&&dist(player.x,player.y,d.x,d.y)<=r)evolutionKnock(c,d,80);}if(hit){shake=Math.max(shake,9);impactPause=Math.max(impactPause,.065);}
 }else if(c.form==='heatblast'&&id==='c1'){
  hit=evolutionArea(c,player.x,player.y,78,s.damage);progression.fields.push({kind:'pool',source:c,x:player.x,y:player.y,life:2.2,age:0,next:.6,radius:58,damage:7});evolutionEffect(c,'jets',player.x,player.y,90,.35);
 }else if(c.form==='heatblast'&&id==='c3'){
  const at=combatGroundStep(c,k,s.contacts.length,225);hit=evolutionGroundSpike(c,at.x,at.y,48,s.damage,70,'groundFire');
 }else if(c.form==='heatblast'&&id==='c5'){
  const at=combatGroundPoint(c,140);hit=evolutionGroundSpike(c,at.x,at.y,83,s.damage,165,'geyser');shake=Math.max(shake,7);
 }else if(c.form==='xlr8'&&id==='c1'){
  hit=evolutionTargetContact(c,s.damage);if(c.target)evolutionEffect(c,'lightning',c.target.x,c.target.y,75,.22);
 }else if(c.form==='xlr8'&&id==='c4'){evolutionProjectile(c,k,'wind');return;
 }else if(c.form==='xlr8'&&['f','c0','c2','c3','c5'].includes(id)){
  // Their swept motion owns contact detection; it cannot double-hit on a key pose.
  return;
 }else if(c.form==='diamondhead'&&id==='c0'){
  const at=combatGroundPoint(c,105);hit=evolutionGroundSpike(c,at.x,at.y,65,s.damage,100);
 }else if(c.form==='diamondhead'&&id==='c1'){
  hit=evolutionForward(c,s.damage,145,70);evolutionEffect(c,'cross',player.x,player.y,100);
 }else if(c.form==='diamondhead'&&id==='c4'){
  for(let j=-2;j<=2;j++){const at=combatGroundPoint(c,90+Math.abs(j)*25);at.x-=c.dy*j*44;at.y+=c.dx*j*44;hit+=evolutionGroundSpike(c,at.x,at.y,28,s.damage,70);}
 }else if(c.form==='diamondhead'&&id==='c5'){
  const at=combatGroundStep(c,k,s.contacts.length,296);hit=evolutionGroundSpike(c,at.x,at.y,55,s.damage,100+k*14);shake=Math.max(shake,5);
 }else if(c.form==='cannonbolt'&&id==='c0'){
  hit=evolutionArea(c,c.x,c.y,105,s.damage);evolutionEffect(c,'impact',c.x,c.y,100);shake=Math.max(shake,4);
 }else if(c.form==='cannonbolt'&&id==='c3'){
  hit=evolutionFrontAt(c,c.x,c.y,s.damage,125,55);evolutionEffect(c,'dirt',c.x+c.dx*55,c.y+c.dy*55,95,.3);
 }else if(c.form==='cannonbolt'&&['c2','c4'].includes(id)){return;
 }else if(c.form==='ghostfreak'&&id==='c0'){
  hit=evolutionForward(c,s.damage,135,65);evolutionEffect(c,'slash',player.x,player.y,100);
 }else if(c.form==='ghostfreak'&&id==='c2'){
  hit=evolutionTargetContact(c,s.damage,{slam:true});
 }else if(c.form==='ghostfreak'&&id==='c3'){
  const at=c.aim?{...c.aim}:{x:player.x+c.dx*45,y:player.y+c.dy*45};hit=evolutionArea(c,at.x,at.y,65,s.damage,{front:true});evolutionEffect(c,'groundTentacles',at.x,at.y,115,.25);
 }else if(c.form==='wildvine'&&id==='c1'){
  hit=evolutionTargetContact(c,s.damage,{knock:45});evolutionEffect(c,'impact',player.x+c.dx*45,player.y+c.dy*45,65);
 }else if(c.form==='wildvine'&&id==='f'){
  const at=combatGroundStep(c,k,s.contacts.length,190);hit=evolutionGroundSpike(c,at.x,at.y,65,s.damage,105,'flowerRoots');progression.fields.push({kind:'bud',source:c,x:at.x,y:at.y,life:.65,age:0,radius:58,damage:10});
 }else if(c.form==='wildvine'&&id==='c5'){
  const target=combatTargetInReach(c)?c.target:null,at=combatGroundPoint(c,125);
  if(!target&&c.target){c.target.skillHidden=false;c.target.skillLift=0;}
  if(k===0){c.plantX=at.x;c.plantY=at.y;evolutionEffect(c,'carnivore',at.x,at.y,110,1.1);}
  if(target){target.skillLift=8;target.skillHidden=k>0&&k<3;hit=evolutionTargetContact(c,s.damage);if(k===3){target.skillHidden=false;evolutionKnock(c,target,35);}}
 }else if(c.form==='blitzwolfer'&&id==='c4'){
  hit=evolutionTargetContact(c,s.damage,{slam:k===s.contacts.length-1,knock:k===s.contacts.length-1?70:0});evolutionEffect(c,'cross',player.x,player.y,100);
 }else if(c.form==='blitzwolfer'&&id==='c2'){
  hit=evolutionTargetContact(c,s.damage);if(c.target)evolutionEffect(c,k===2?'bite':'slash',c.target.x,c.target.y,75);
 }else if(c.form==='upgrade'&&id==='c5'){
  // The selected point is fixed at the start; an enemy can leave before emergence.
  const at=c.destination;hit=evolutionFrontAt(c,at.x-c.dx*30,at.y-c.dy*30,s.damage,65,45);evolutionEffect(c,'uppercut',at.x,at.y,85);
 }else if(c.form==='upgrade'&&id==='c2'){
  hit=evolutionBeam(c,s.damage,r,40);shake=Math.max(shake,5);
 }else if(c.form==='upgrade'&&id==='c3'){
  hit=evolutionForward(c,s.damage,r,60);evolutionEffect(c,'cable',player.x,player.y,r,.18);
 }else if(['rock','fire','crystal','slime','sticky','seed'].includes(s.style)){evolutionProjectile(c,k,s.style);return;
 }else if(['melee','lunge','whip'].includes(s.style))hit=evolutionForward(c,s.damage,r,s.style==='whip'?80:65,s.style==='lunge');
 else if(['spin','quake','meteor','burn','siphon','fear','emp'].includes(s.style))hit=evolutionArea(c,player.x,player.y,r,s.damage,{stun:s.style==='fear'?1.8:0});
 else if(s.style==='grab')hit=evolutionTargetContact(c,s.damage,{slam:true});
 else if(s.style==='pillars'){const at=combatGroundStep(c,k,s.contacts.length,168);hit=evolutionGroundSpike(c,at.x,at.y,55,s.damage,75);}
 else if(s.style==='prison'){const at=combatGroundPoint(c,110);hit=evolutionArea(c,at.x,at.y,80,s.damage,{front:true,stun:1.8});evolutionEffect(c,'prison',at.x,at.y,85,1.4);}
 else if(['toxin','rain'].includes(s.style)){const step=85+k*32,at=combatGroundPoint(c,step),offset=(k%2?1:-1)*25;at.x-=c.dy*offset;at.y+=c.dx*offset;progression.fields.push({kind:'pool',source:c,x:at.x,y:at.y,life:3.5,age:0,next:0,radius:52,damage:s.damage});evolutionEffect(c,'slime',at.x,at.y,40);}
 else if(['wave','flame','sonic','beam','sweep'].includes(s.style))hit=evolutionBeam(c,s.damage,r,s.style==='sonic'?95:60,s.style);
 if(s.style==='siphon'&&hit)stats.setHealth(stats.health+8);
 if(s.style==='emp')progression.buffs[c.form]={time:4,def:.3};
 if(s.style==='burn')progression.fields.push({kind:'pool',source:c,x:player.x,y:player.y,life:2.4,age:0,next:.5,radius:130,damage:8});
 if(['spin','quake','meteor','burn','emp'].includes(s.style))evolutionEffect(c,s.style,player.x,player.y,r);
 if(['melee','whip'].includes(s.style))evolutionEffect(c,'slash',player.x,player.y,r);
 if(hit){shake=Math.max(shake,['quake','meteor'].includes(s.style)?8:3);impactPause=Math.max(impactPause,.035);spawnDust(player.x+c.dx*55,player.y+c.dy*55,7,c.color);}
}
function evolutionMove(c,dt){
 const s=c.definition,p=c.age/c.duration,route=c.route;let q=0,goal=null;c.z=0;c.alpha=1;
 const along=(n,side=0)=>({x:c.x+c.dx*n-c.dy*side,y:c.y+c.dy*n+c.dx*side});
 if(['step','elbow','hover','rush','kickRush','drift','clawRush','hotRush','biteRush','dive','meteor','comet'].includes(route)){
  const ends={rush:[.29,.57],kickRush:[.33,.53],drift:[.3,.62],clawRush:[.18,.43],hotRush:[.58,.76],biteRush:[.26,.52],elbow:[.24,.58],hover:[.27,.74],meteor:[.25,.69],comet:[.49,.73],dive:[.28,.69],step:[.29,.58]};
  const [a,b]=ends[route]||[.25,.7];q=smoothSkill(a,b,p);const stopBeforeTarget=['clawRush','biteRush','elbow'].includes(route)&&c.target;const travel=stopBeforeTarget?Math.min(s.move,Math.max(0,dist(c.x,c.y,c.targetX,c.targetY)-35)):s.move;goal=along(travel*q);
 }
 if(route==='return'){q=p<.49?smoothSkill(.2,.42,p):1-smoothSkill(.52,.78,p);goal=along(s.move*q);}
 if(route==='orbitOnce'){const a=smoothSkill(.22,.79,p)*Math.PI*2;goal=along(Math.sin(a)*s.move,(1-Math.cos(a))*s.move*.6);}
 if(route==='zigzag'){const a=smoothSkill(.22,.79,p)*3,leg=Math.min(2,Math.floor(a)),f=a-leg;goal=along((leg%2?1-f:f)*s.move,Math.sin(a*Math.PI)*45);}
 if(route==='pounceReturn'){
  q=p<.68?smoothSkill(.22,.43,p):1-smoothSkill(.75,.94,p);const distance=c.target?Math.max(0,Math.min(s.move,dist(c.x,c.y,c.targetX,c.targetY)-35)):s.move;goal=along(distance*q);c.z=p<.44?Math.sin(Math.PI*smoothSkill(.2,.44,p))*60:p>.74?Math.sin(Math.PI*smoothSkill(.74,.94,p))*35:0;
 }
 if(route==='flurry'&&c.target){const a=smoothSkill(.22,.78,p)*Math.PI*6,r=p<.22?1-smoothSkill(.1,.22,p):p>.78?smoothSkill(.78,.96,p):0;
  const xx=c.targetX-c.dx*45*Math.cos(a)-c.dy*35*Math.sin(a),yy=c.targetY-c.dy*45*Math.cos(a)+c.dx*35*Math.sin(a);goal={x:lerp(xx,c.x,r),y:lerp(yy,c.y,r)};if(combatTargetInReach(c))c.target.stunTime=.2;
 }
 if(route==='phase'){c.alpha=p>.17&&p<.54?.05:1;goal=along(s.move*smoothSkill(.2,.56,p));}
 if(route==='burrow'||route==='liquid'){const a=route==='burrow'?.24:.25,b=route==='burrow'?.49:.5;q=smoothSkill(a,b,p);goal={x:lerp(c.x,c.destination.x,q),y:lerp(c.y,c.destination.y,q)};if(p>.23&&p<.48)c.alpha=.08;if(route==='burrow'&&p>.48&&p<.81)c.alpha=0;}
 if(route==='elbow')c.z=95*Math.sin(Math.PI*smoothSkill(.19,.6,p));
 if(route==='hover'){c.z=50*smoothSkill(.18,.35,p)*(1-smoothSkill(.75,.9,p));if(p>.28&&p<.77&&Math.floor(c.age*14)!==Math.floor((c.age-dt)*14))evolutionEffect(c,'jets',player.x,player.y,60,.12);}
 if(['meteor','comet','dive'].includes(route)){const a=route==='comet'?.42:.22,b=route==='comet'?.74:.7;c.z=(route==='comet'?155:90)*Math.sin(Math.PI*smoothSkill(a,b,p));if(route==='comet'&&p>.2&&p<.42)c.z=Math.abs(Math.sin((p-.2)/.22*Math.PI*2))*32;}
 if(route==='bounce'){const points=[[.2,.4,35],[.4,.62,60],[.62,.83,83]];for(const [a,b,h]of points)if(p>=a&&p<b)c.z=Math.sin((p-a)/(b-a)*Math.PI)*h;}
 if(route==='hoverSting'||route==='rainHover')c.z=(route==='rainHover'?45:25)*smoothSkill(.15,.3,p)*(1-smoothSkill(.74,.92,p));
 if(goal){const from={x:player.x,y:player.y},clip=Ben10Speed.clipSegment(from,goal,speedWorld(),actorMetrics().radius);player.x=clip.end.x;player.y=clip.end.y;
  const mx=player.x-from.x,my=player.y-from.y;if(Math.hypot(mx,my)>1)c.drawDir=Math.abs(mx)>Math.abs(my)?mx>0?'right':'left':my>0?'down':'up';
  if(['rush','kickRush','drift','hotRush','return','orbitOnce','zigzag'].includes(route)&&p>.2&&p<.84){const touching=new Set();for(const d of dummyList){if(!d.alive)continue;const rad=actorMetrics().radius+22,touched=Ben10Speed.distanceToSegment(from,clip.end,d)<rad;
    const once=['rush','kickRush','drift','hotRush','orbitOnce'].includes(route);if(touched&&!(once?c.hit.has(d):c.contacts.has(d))){evolutionHit(c,d,s.damage);c.hit.add(d);evolutionEffect(c,'impact',d.x,d.y,55,.2);}
    if(dist(player.x,player.y,d.x,d.y)<rad+3)touching.add(d);
   }c.contacts=touching;}
 }
 if(['grapple','drag','pullPunch'].includes(route)&&c.target?.alive&&p>=.27){if(!combatTargetInReach(c)){c.targetLost=true;c.target.skillLift=0;return;}c.captured=true;const d=c.target,grab=smoothSkill(.27,route==='pullPunch'?.65:.43,p),distance=route==='pullPunch'?45:48;
  evolutionShiftTarget(c,d,lerp(c.targetX,player.x+c.dx*distance,grab),lerp(c.targetY,player.y+c.dy*distance,grab));
  if(route==='grapple')d.skillLift=p<.43?0:p<.6?90*smoothSkill(.43,.6,p):p<.75?90*(1-smoothSkill(.6,.75,p)):0;
  if(route==='drag')d.stunTime=.2;
 }
}
function evolutionTick(dt){
 for(const [id,b]of Object.entries(progression.buffs)){b.time-=dt;if(b.time<=0)delete progression.buffs[id];}
 const c=progression.skill;if(c){if(stats.form?.id!==c.form||stats.health<=0)evolutionCancelSkill();else{c.age=Math.min(c.duration,c.age+dt);c.time=c.duration-c.age;player.modeTime=c.age;evolutionMove(c,dt);while(c.next<c.definition.contacts.length&&c.age/c.duration>=c.definition.contacts[c.next])evolutionContact(c,c.next++);stats.setInvulnerable(evolutionSkillIntangible());if(c.age>=c.duration)evolutionCancelSkill();}}
 for(const f of progression.fields){f.life-=dt;f.age+=dt;if(f.kind==='projectile'){
  const from={x:f.x,y:f.y},to={x:f.x+f.dx*f.speed*dt,y:f.y+f.dy*f.speed*dt},clip=Ben10Speed.clipSegment(from,to,speedWorld(),f.radius);f.x=clip.end.x;f.y=clip.end.y;f.travel+=dist(from.x,from.y,f.x,f.y);
  const candidates=dummyList.filter(d=>d.alive&&!f.hit.has(d)&&Ben10Speed.distanceToSegment(from,clip.end,d)<f.radius+18).sort((a,b)=>dist(from.x,from.y,a.x,a.y)-dist(from.x,from.y,b.x,b.y));
  const hit=candidates[0];if(hit){evolutionHit(f.source,hit,f.damage);f.hit.add(hit);if(f.style==='sticky')hit.stunTime=1.8;}
  if((hit&&f.style!=='wind')||clip.blocked||f.travel>f.range){if(f.style==='seed')evolutionArea(f.source,f.x,f.y,80,f.damage);evolutionEffect(f.source,f.style==='rock'?'impact':f.style,f.x,f.y,f.radius*2);f.life=0;}
 }else if(f.kind==='bud'){if(f.age>=.5&&!f.exploded){f.exploded=true;evolutionArea(f.source,f.x,f.y,f.radius,f.damage,{front:true});evolutionEffect(f.source,'impact',f.x,f.y,70,.4);f.life=0;}}else if(f.kind==='pool'){f.next-=dt;if(f.next<=0){evolutionArea(f.source,f.x,f.y,f.radius,f.damage);f.next+=.6;}}}
 progression.fields=progression.fields.filter(f=>f.life>0);for(const e of progression.fx)e.life-=dt;progression.fx=progression.fx.filter(e=>e.life>0);
}
function evolutionDrawActor(){
 const c=progression.skill;if(!c||c.form!==stats.form?.id)return false;
 ctx.save();ctx.fillStyle='#020a0966';ctx.beginPath();ctx.ellipse(player.x,player.y-2,actorMetrics().shadow,7,0,0,7);ctx.fill();
 ctx.globalAlpha=c.alpha??1;const dir=['rush','return','orbitOnce','zigzag','flurry','kickRush'].includes(c.route)?c.drawDir||c.dir:c.dir;
 evolutionPaintSkill(ctx,c.index,c.definition,c.age/c.duration,dir,player.x,player.y-(c.z||0),actorMetrics().height);ctx.restore();return true;
}
