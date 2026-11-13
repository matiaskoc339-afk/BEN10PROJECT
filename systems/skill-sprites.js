/* New attack frames preserve the original atlas pixels and proportions.
   Authored poses deform the textured body; the baker writes standalone PNGs. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Ben10SkillArt=factory();})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v));
 const smooth=(a,b,p)=>{const n=clamp((p-a)/(b-a));return n*n*(3-2*n)};
 function pose(m,p){
  const authored=m;
  m=({windKick:'kick',mirrorRush:'sprint',bounce:'ball',ballOrbit:'ballSpin',brake:'ball',returnRoll:'ball',comet:'ballJump',phaseClaw:'phase',appear:'phase',haunt:'unveil',toxicCloud:'spit',stickySpit:'spit',tailSweep:'sting',vineCage:'root',forest:'root',packHowl:'jaw'})[m]||m;
  const e=Math.sin(Math.PI*p),w=Math.sin(Math.PI*clamp(p/.34)),h=smooth(.27,.5,p)*(1-smooth(.73,1,p));
  let v={lean:0,squat:0,lift:0,turn:0,left:[-27,-49],right:[29,-51],lowerLeft:[-33,-37],lowerRight:[35,-36],kick:0,open:0,wing:0,curl:0,stretch:0,tail:0,alpha:1,h};
  switch(m){
   case 'idle':v.squat=Math.sin(p*Math.PI*2)*.6;v.left[1]+=Math.sin(p*Math.PI*2);v.right[1]+=Math.sin(p*Math.PI*2);break;
   case 'slam':v.left=[-24+16*h,-49-54*w+49*h];v.right=[27-15*h,-50-54*w+49*h];v.lowerLeft=[-34+19*h,-36-48*w+37*h];v.lowerRight=[35-20*h,-36-48*w+37*h];v.squat=14*h;v.lean=9*h;break;
   case 'elbow':v.lift=27*Math.sin(Math.PI*clamp((p-.14)/.7));v.lean=24*h-9*w;v.right=[15+15*h,-87+6*h];v.left=[-24,-60-8*h];v.lowerRight=[15,-30-7*h];v.kick=.4*e;break;
   case 'upper':v.lean=9*Math.sin(p*Math.PI*3)*e;v.right=[19+12*h,-48-51*Math.sin(Math.PI*clamp((p-.22)/.42))];v.left=[-23+24*h,-48-45*Math.sin(Math.PI*clamp((p-.42)/.4))];v.squat=7*w;break;
   case 'clap':v.left=[-28-21*w+66*h,-64];v.right=[31+22*w-15*h,-65];v.lowerLeft=[-34-17*w+69*h,-46];v.lowerRight=[34+18*w-18*h,-46];v.lean=5*h;break;
   case 'throw':case 'seed':v.squat=10*w;v.left=[-22+67*h,-48-49*w];v.right=[25+34*h,-47-46*w];v.lean=-9*w+17*h;break;
   case 'grab':v.right=[27+24*e,-50-24*h];v.left=[-24+56*e,-49-25*h];v.lowerLeft=[-31+57*e,-32-14*h];v.lowerRight=[31+15*e,-34-15*h];v.squat=10*smooth(.63,.75,p)*e;v.lean=11*e;break;
   case 'spin':v.turn=Math.sin(p*Math.PI*6)*e;v.left=[-28-30*e,-55-8*Math.sin(p*18)];v.right=[29+31*e,-56+8*Math.sin(p*18)];v.lowerLeft=[-32-19*e,-35];v.lowerRight=[33+22*e,-34];v.lean=Math.sin(p*22)*7*e;break;
   case 'orbit':v.squat=16*e;v.lean=27*e;v.left=[-37,-43];v.right=[-8,-62];v.kick=Math.sin(p*30)*e*.5;break;
   case 'hook':case 'cross':v.lean=11*h;v.right=[27+28*Math.sin(p*Math.PI*2.1)*e,-53-17*e];v.left=[-27+67*Math.sin(p*Math.PI*2.1-1.3)*e,-48-13*e];break;
   case 'jet':v.left=[-30-8*e,-40+22*e];v.right=[32+9*e,-40+22*e];v.lift=33*Math.sin(Math.PI*clamp((p-.18)/.68));v.squat=10*w;v.lean=7*h;break;
   case 'volley':case 'fan':case 'flame':v.right=[27+38*h,-54-9*h];v.left=[-26+59*smooth(.43,.6,p)*e,-47-6*h];v.lean=10*h;v.squat=m==='flame'?15*e:5*w;break;
   case 'flare':case 'surge':v.left=[-27-29*h,-50-16*h];v.right=[29+29*h,-51-16*h];v.squat=9*w;v.open=h;v.stretch=m==='surge'?h*.3:0;break;
   case 'root':v.left=[-26+8*h,-49+43*h];v.right=[28-8*h,-49+44*h];v.squat=19*h;v.lean=10*h;break;
   case 'kick':v.left=[-29-7*h,-53-8*h];v.right=[29-11*h,-53-12*h];v.kick=h;v.lean=-18*h;break;
   case 'flurry':v.right=[27+34*Math.max(0,Math.sin(p*27))*e,-58];v.left=[-27+75*Math.max(0,-Math.sin(p*27))*e,-55];v.lean=7*e;break;
   case 'sprint':v.squat=19*e;v.lean=32*e;v.right=[-16,-52+Math.sin(p*30)*10*e];v.left=[-39,-44-Math.sin(p*30)*10*e];v.kick=Math.sin(p*30)*.4*e;break;
   case 'drift':v.squat=26*e;v.lean=-15*e;v.kick=.9*e;v.right=[35,-58+10*e];v.left=[-35,-49+17*e];break;
   case 'blade':case 'piston':v.right=[28+45*h,-55];v.left=[-26,-47];v.lean=12*h;v.stretch=m==='piston'?h:.25*h;break;
   case 'stomp':v.kick=-.8*w;v.squat=12*h;v.right=[31,-56-16*w];v.left=[-28,-53-15*w];break;
   case 'guard':case 'cage':v.right=[28-18*w+22*h,-54-10*e];v.left=[-27+38*w+8*h,-53-10*e];v.squat=9*e;break;
   case 'ball':case 'ballSpin':case 'ballJump':v.curl=Math.sin(Math.PI*smooth(0,1,p));v.curl=clamp(v.curl*1.5);v.left=[-27+21*v.curl,-49-14*v.curl];v.right=[29-22*v.curl,-50-14*v.curl];v.squat=14*v.curl;v.turn=p*18;v.lift=m==='ballJump'?39*Math.sin(Math.PI*clamp((p-.18)/.62)):m==='ballSpin'?6*e:0;break;
   case 'phase':v.alpha=1-.65*e;v.lift=10*e;v.right=[29+34*h,-50-13*h];v.left=[-27,-53-12*e];v.lean=13*h;break;
   case 'tendril':case 'whip':v.right=[29+64*h,-52+11*Math.sin(p*16)*e];v.left=[-27+71*Math.sin(p*8)*e,-50+14*Math.cos(p*13)*e];v.lean=10*h;v.open=h;v.stretch=h;break;
   case 'unveil':v.left=[-27-22*e,-55];v.right=[29+23*e,-55];v.open=e;v.lift=9*e;break;
   case 'sting':v.lift=13*e;v.squat=7*e;v.tail=h;v.right=[29,-57];v.left=[-27,-54];break;
   case 'spit':v.lean=6*Math.sin(p*25)*e;v.squat=4*e;v.open=e;break;
   case 'fly':case 'dive':v.wing=e;v.lift=(m==='fly'?30:39)*Math.sin(Math.PI*clamp((p-.12)/.74));v.tail=m==='dive'?h:0;v.lean=m==='dive'?28*h:3*e;break;
   case 'jaw':v.open=e;v.right=[35,-39];v.left=[-31,-39];v.squat=8*e;v.lean=13*h;break;
   case 'bite':v.open=e;v.lean=25*h;v.squat=11*e;v.left=[-18,-62];v.right=[30,-60];break;
   case 'pounce':v.squat=23*w;v.lift=35*Math.sin(Math.PI*clamp((p-.18)/.62));v.lean=25*h;v.left=[-25+54*h,-55];v.right=[29+25*h,-58];break;
   case 'cannon':v.right=[29+26*e,-59];v.left=[-27+69*e,-58];v.squat=12*e;v.lean=10*h;v.open=e;break;
   case 'sweep':v.lean=14*Math.sin((p-.25)*5)*e;v.right=[34,-54];v.left=[-30,-55];v.open=e;break;
   case 'morph':v.curl=e;v.stretch=e;v.lean=35*e;v.squat=20*e;break;
  }
  if(m==='fan'){v.left=[-27-20*h,-60-13*h];v.right=[29+37*h,-58-17*h]}
  if(m==='cage'){v.left=[-27+12*h,-53-33*h];v.right=[29-8*h,-53-33*h]}
  if(authored==='windKick'){v.turn=Math.sin(p*Math.PI*4)*e;v.kick=Math.sin(p*Math.PI*2)*e;v.right=[40,-65];v.left=[-35,-67]}
  if(authored==='mirrorRush'){v.lean=40*e;v.turn=Math.sin(p*22)*e*.5;v.left=[-43,-60];v.right=[-20,-70];v.kick=Math.sin(p*42)*e*.55}
  if(authored==='bounce'){v.lift=18*Math.sin(p*Math.PI);v.turn=p*10}
  if(authored==='brake'){v.lean=-22*h;v.turn=p*9;v.lift=Math.sin(p*18)*e*2}
  if(authored==='returnRoll'){v.turn=Math.sin(p*Math.PI*2)*9;v.lift=8*e}
  if(authored==='ballOrbit'){v.turn=p*24;v.lift=12*e;v.lean=Math.sin(p*12)*e*10}
  if(authored==='comet'){v.lift=53*Math.sin(Math.PI*clamp((p-.16)/.6));v.turn=p*23;v.squat=18*h}
  if(authored==='phaseClaw'){v.right=[29+47*h,-64];v.left=[-34,-59];v.alpha=1-.42*e}
  if(authored==='appear'){v.alpha=1-.88*e;v.lift=18*e;v.left=[-27+55*h,-44];v.right=[29+30*h,-49];v.open=.5*e}
  if(authored==='haunt'){v.left=[-28-32*e,-73];v.right=[29+35*e,-74];v.lift=19*e;v.open=Math.min(1,e*1.35)}
  if(authored==='toxicCloud'){v.left=[-33,-45];v.right=[35,-45];v.squat=8*e;v.lean=10*Math.sin(p*23)*e}
  if(authored==='stickySpit'){v.squat=13*w;v.lean=-9*w+17*h;v.left=[-14,-66];v.right=[16,-64]}
  if(authored==='tailSweep'){v.tail=Math.sin(p*Math.PI*2)*e;v.turn=Math.sin(p*8)*e;v.left=[-35,-50];v.right=[38,-51]}
  if(authored==='vineCage'){v.left=[-38+20*h,-45+39*h];v.right=[40-20*h,-45+39*h];v.squat=23*h;v.turn=Math.sin(p*8)*e*.25}
  if(authored==='forest'){v.left=[-31-10*h,-48+44*h];v.right=[33+10*h,-49+44*h];v.squat=25*h;v.lean=14*h}
  if(authored==='packHowl'){v.open=Math.min(1,e*1.3);v.left=[-40,-20];v.right=[42,-20];v.lean=-8*e+24*h;v.squat=15*e}
  const blend=smooth(0,.13,p)*(1-smooth(.87,1,p));
  for(const [key,base] of [['left',[-27,-49]],['right',[29,-51]],['lowerLeft',[-33,-37]],['lowerRight',[35,-36]]])v[key]=v[key].map((value,i)=>base[i]+(value-base[i])*blend);
  for(const key of ['lean','squat','lift','turn','kick','open','wing','curl','stretch','tail'])v[key]*=blend;
  v.alpha=1+(v.alpha-1)*blend;
  return v;
 }
 const models=new Map(),cells=new Map();
 const layout=id=>id==='wildvine'?{cellWidth:704,cellHeight:320,anchorX:352,anchorY:280,bodyHeight:160}:{cellWidth:384,cellHeight:288,anchorX:192,anchorY:248,bodyHeight:160};
 const sideHands={
  'four-arms':[[22,-96],[58,-97],[14,-65],[38,-58]],heatblast:[[-4,-78],[32,-86]],xlr8:[[7,-104],[43,-92]],diamondhead:[[46,-100],[23,-69]],
  cannonbolt:[[-48,-62],[58,-65]],ghostfreak:[[-27,-73],[30,-76]],stinkfly:[[24,-74],[51,-78]],wildvine:[[-22,-77],[30,-79]],blitzwolfer:[[-9,-45],[30,-45]],upgrade:[[-23,-43],[33,-44]]
 };
 function registerModels(entries){for(const entry of entries)models.set(entry.id,entry)}
 function recipe(id,m,p){
  const alias={windKick:'kick',mirrorRush:'sprint',bounce:'ball',ballOrbit:'ballSpin',brake:'ball',returnRoll:'ball',comet:'ballJump',phaseClaw:'phase',appear:'phase',haunt:'unveil',toxicCloud:'spit',stickySpit:'spit',tailSweep:'sting',vineCage:'root',forest:'root',packHowl:'jaw'};
  m=alias[m]||m;
  if(m==='idle')return {action:'idle',q:p};
  if(m==='elbow'||m==='clap'||m==='tendril'||m==='piston'||m==='surge'||m==='cage'||m==='guard')return {action:'idle',q:0};
  if(m==='ball'||m==='ballSpin'||m==='ballJump'){
   if(p<.24)return {action:'fold',q:smooth(0,.24,p)};
   if(p>.78)return {action:'unfold',q:smooth(.78,1,p)};
   return {action:'roll',q:(p*(m==='ballSpin'?4:m==='ballJump'?2:3))%1};
  }
  if(m==='root')return {action:id==='wildvine'?'plant':id==='diamondhead'?'light3':'heavy',q:p};
  if(m==='unveil'||m==='grab')return {action:id==='ghostfreak'?(m==='grab'?'capture':'unveil'):id==='blitzwolfer'?'light3':'heavy',q:p};
  if(m==='jaw')return {action:'howl',q:p};
  if(m==='sting')return {action:'heavy',q:p};
  if(m==='spit')return {action:['light1','light2','light3','light1'][Math.min(3,Math.floor(p*4))],q:(p*4)%1};
  if(m==='fly'||m==='dive'||m==='sprint'||m==='orbit'||m==='drift'||m==='pounce'||m==='jet')return {action:'dash',q:p};
  if(m==='cannon')return {action:'light3',q:p};
  if(m==='sweep'||m==='volley'||m==='fan'||m==='flame'||m==='flare')return {action:(m==='flare'||m==='flame')?'heavy2':'heavy',q:p};
  if(m==='throw'||m==='seed')return p<.56?{action:'heavy',q:p*.8}:{action:'light1',q:clamp((p-.35)/.65)};
  if(m==='morph')return {action:'blade',q:p};
  if(m==='spin')return {action:id==='wildvine'?'spin':'light3',q:p};
  if(m==='upper'||m==='hook'||m==='cross')return {action:'light2',q:p};
  if(m==='bite')return {action:'light3',q:p};
  if(m==='phase')return {action:'light1',q:p};
  if(m==='kick'||m==='stomp')return {action:'light3',q:p};
  if(m==='whip')return {action:p<.5?'light1':'light2',q:(p*2)%1};
  if(m==='flurry')return {action:p<.5?'light1':'light2',q:(p*2)%1};
  return {action:'heavy',q:p};
 }
 function nativeCell(id,m,p,dir){
  const model=models.get(id);if(!model)return null;
  let {action,q}=recipe(id,m,p),sourceDir=dir==='left'?'right':dir,d={down:0,up:1,right:2}[sourceDir]??2;
  if(p<.045||p>.955){action='idle';q=0}
  let row=d,col=0,flip=false;
  if(action==='idle'){col=Math.floor(q*7)%8}
  else if(action==='fold'||action==='roll'||action==='unfold'){row=(action==='fold'?4:action==='roll'?8:28)+d;col=clamp(Math.floor(q*8),0,7)}
  else if(id==='ghostfreak'&&(action==='unveil'||action==='capture')){row=(action==='unveil'?24:28)+d;col=clamp(Math.floor(q*8),0,7)}
  else{const table=model.motion[sourceDir],clip=table?.[action]||table?.[action==='heavy2'?'heavy2':'heavy1']||table?.heavy||table?.laser||table?.rush||table?.light3;
   if(clip){const phase=clamp(Math.floor(q*clip.poses.length),0,clip.poses.length-1);[row,col,flip]=clip.poses[phase]}
  }
  const frame=model.atlas.rows[row]?.[col]||model.atlas.rows[d][0],key=id+':'+row+':'+col+':'+!!flip;
  if(cells.has(key))return cells.get(key);
  const box=layout(id),canvas=document.createElement('canvas');canvas.width=box.cellWidth;canvas.height=box.cellHeight;const c=canvas.getContext('2d');c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';c.translate(box.anchorX,box.anchorY);if(flip)c.scale(-1,1);
  const scale=160/frame.bodyHeight;
  if(frame.image)c.drawImage(frame.image,frame.sourceX,frame.sourceY,frame.w,frame.h,-frame.anchorX*scale,-frame.anchorY*scale,frame.w*scale,frame.h*scale);
  else c.drawImage(frame.canvas,-frame.anchorX*scale,-frame.anchorY*scale,frame.w*scale,frame.h*scale);
  cells.set(key,canvas);if(cells.size>48)cells.delete(cells.keys().next().value);return canvas;
 }
 function triangle(c,image,a,b,d,A,B,D){
  const x0=a[0],y0=a[1],x1=b[0],y1=b[1],x2=d[0],y2=d[1],den=x0*(y2-y1)+x1*(y0-y2)+x2*(y1-y0);if(Math.abs(den)<.01)return;
  const transform=(u0,u1,u2)=>[(u0*(y2-y1)+u1*(y0-y2)+u2*(y1-y0))/den,(u0*(x1-x2)+u1*(x2-x0)+u2*(x0-x1))/den,(u0*(x2*y1-x1*y2)+u1*(x0*y2-x2*y0)+u2*(x1*y0-x0*y1))/den];
  const tx=transform(A[0],B[0],D[0]),ty=transform(A[1],B[1],D[1]);
  const center=[(A[0]+B[0]+D[0])/3,(A[1]+B[1]+D[1])/3],clip=[A,B,D].map(v=>{const dx=v[0]-center[0],dy=v[1]-center[1],len=Math.hypot(dx,dy)||1;return [v[0]+dx/len*1.15,v[1]+dy/len*1.15]});
  c.save();c.beginPath();c.moveTo(...clip[0]);c.lineTo(...clip[1]);c.lineTo(...clip[2]);c.closePath();c.clip();c.transform(tx[0],ty[0],tx[1],ty[1],tx[2],ty[2]);c.drawImage(image,0,0);c.restore();
 }
 function draw(c,id,m,p,dir='right',x=0,y=0,height=160){
  if(m==='spin'&&p>.13&&p<.87){const order=['right','down','left','up'];dir=order[(Math.max(0,order.indexOf(dir))+Math.floor(smooth(.13,.87,p)*8))%4]}
  const v=pose(m,clamp(p)),image=nativeCell(id,m,p,dir);if(!image)return;const box=layout(id),sx=box.anchorX-160,sy=box.anchorY-232;
  const side=dir==='right'||dir==='left',elastic=['wildvine','ghostfreak','upgrade'].includes(id),four=id==='four-arms',f=160/124,envelope=Math.sin(Math.PI*clamp(p)),factor=elastic?.85:.35;
  const hands=side?sideHands[id]:four?[[-53,-101],[53,-101],[-45,-67],[45,-67]]:[[-39,-78],[39,-78]];
  const moving=[v.left,v.right,v.lowerLeft,v.lowerRight],base=[[-27,-49],[29,-51],[-33,-37],[35,-36]];
  const anchors=[
   {s:[160,72],d:[v.lean*.35*f,v.squat*.6*f]},
   {s:[160,110],d:[v.lean*.5*f,v.squat*.6*f]},
   {s:[160,163],d:[v.lean*.15*f,v.squat*.7*f]},
   {s:[138,230],d:[0,0]}, {s:[183,230],d:[v.kick*44*f,-Math.max(0,v.kick)*34*f]},
   {s:[125,123],d:[v.lean*.3*f,v.squat*.45*f]}, {s:[188,123],d:[v.lean*.3*f,v.squat*.45*f]}
  ];
  hands.forEach((h,i)=>{const delta=[(moving[i][0]-base[i][0])*factor*f,(moving[i][1]-base[i][1])*factor*f];if(m==='elbow'&&four){if(i===1){delta[0]=-34*envelope;delta[1]=-24*envelope}else if(i===0){delta[0]=-6*envelope;delta[1]=-8*envelope}}
   anchors.push({s:[160+h[0],232+h[1]],d:delta});
  });
  if(m==='elbow'&&four)anchors.push({s:[192,139],d:[40*envelope,-6*envelope]});
  const headSide={'four-arms':[39,-145],heatblast:[12,-146],xlr8:[23,-142],diamondhead:[24,-143],cannonbolt:[28,-134],ghostfreak:[17,-143],stinkfly:[10,-128],wildvine:[5,-142],blitzwolfer:[29,-144],upgrade:[23,-142]},head=side?headSide[id]:[0,-142];
  for(const [ox,oy] of [[0,0],[-17,-15],[18,-15],[-15,16],[16,16]])anchors.push({s:[160+head[0]+ox,232+head[1]+oy],d:[v.lean*.35*f,v.squat*.6*f]});
  for(const a of anchors){a.s[0]+=sx;a.s[1]+=sy}
  const deform=(xx,yy)=>{let dx=0,dy=0,sum=0;for(const a of anchors){const d=(xx-a.s[0])**2+(yy-a.s[1])**2+110,w=1/(d*d);sum+=w;dx+=a.d[0]*w;dy+=a.d[1]*w}return [xx+dx/sum,yy+dy/sum]};
  c.save();c.translate(x,y-v.lift*f*height/160);c.scale(height/160*(dir==='left'?-1:1),height/160);c.globalAlpha*=v.alpha;c.translate(-box.anchorX,-box.anchorY);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
  if(m==='idle'||p<.025||p>.975)c.drawImage(image,0,0);
  else{const step=18,minX=1,maxX=image.width-1,minY=1,maxY=image.height-1;for(let yy=minY;yy<maxY;yy+=step)for(let xx=minX;xx<maxX;xx+=step){const bx=Math.min(xx+step,maxX),by=Math.min(yy+step,maxY),a=[xx,yy],b=[bx,yy],d=[xx,by],e=[bx,by],A=deform(...a),B=deform(...b),D=deform(...d),E=deform(...e);triangle(c,image,a,b,d,A,B,D);triangle(c,image,b,e,d,B,E,D)}}
  if(id==='four-arms'&&m==='throw'&&p>.14&&p<.57){c.save();c.translate(sx,sy);c.fillStyle='#aaa087';c.strokeStyle='#1d2521';c.lineWidth=2;c.beginPath();c.moveTo(139,72);c.lineTo(132,58);c.lineTo(148,44);c.lineTo(174,49);c.lineTo(183,65);c.lineTo(169,79);c.closePath();c.fill();c.stroke();c.fillStyle='#c8bba0';c.beginPath();c.moveTo(140,59);c.lineTo(154,48);c.lineTo(172,54);c.lineTo(160,67);c.closePath();c.fill();c.restore()}
  c.restore();
 }
 return {draw,pose,registerModels,layout,get modelsReady(){return models.size===10},frames:18,columns:9,cellWidth:384,cellHeight:288,anchorX:192,anchorY:248,bodyHeight:160};
});
