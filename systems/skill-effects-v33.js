// Environmental effects accompany, rather than substitute for, the new body drawings.
const evolutionPlantImage=new Image();evolutionPlantImage.src='assets/skills/carnivorous-plant.png';
function evolutionDrawEffects(){
 combatDrawTarget();
 const fields=progression.fields,fx=progression.fx;
 const custom=new Set(['groundFire','geyser','jets','cross','dirt','groundTentacles','flowerRoots','carnivore','lightning','uppercut','cable','armor','bite']);
 progression.fields=[];progression.fx=fx.filter(e=>!custom.has(e.kind));evolutionDrawBaseEffects();progression.fields=fields;progression.fx=fx;
 for(const f of fields){
  ctx.save();const color=f.source.color;
  if(f.kind==='bud'){ctx.fillStyle='#b74c79';ctx.strokeStyle='#33552c';ctx.lineWidth=3;ctx.beginPath();ctx.ellipse(f.x,f.y-9,12,15,0,0,7);ctx.fill();ctx.stroke();}else if(f.kind==='pool'){
   ctx.fillStyle=f.source.form==='heatblast'?'#e661284a':'#91c64055';ctx.strokeStyle=color;ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(f.x,f.y-3,f.radius,f.radius*.43,0,0,7);ctx.fill();ctx.stroke();
   for(let i=0;i<6;i++){const x=f.x+Math.sin(i*2.8)*f.radius*.75,y=f.y+Math.cos(i*2.8)*f.radius*.28;ctx.fillStyle=color;ctx.fillRect(x,y-4-Math.sin(f.age*7+i)*3,3,4);}
  }else{
   const z=f.style==='seed'?Math.sin(clamp(f.travel/f.range,0,1)*Math.PI)*55:f.style==='rock'?62:f.style==='fire'?60:35;
   ctx.translate(f.x,f.y-z);ctx.rotate(Math.atan2(f.dy,f.dx));ctx.strokeStyle='#15211c';ctx.lineWidth=2;
   if(f.style==='rock'){
    ctx.rotate(f.age*5);ctx.fillStyle='#928b78';ctx.beginPath();for(let i=0;i<8;i++){const a=i*Math.PI/4,r=f.radius*(i%2?.83:1);i?ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r):ctx.moveTo(Math.cos(a)*r,Math.sin(a)*r);}ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#c2b79d';ctx.beginPath();ctx.moveTo(-20,-13);ctx.lineTo(-3,-27);ctx.lineTo(17,-13);ctx.lineTo(6,5);ctx.closePath();ctx.fill();
   }else if(f.style==='fire'){
    for(let i=3;i>=0;i--){ctx.fillStyle=['#fff4aa','#ffce3a','#ff822b','#dd3b21'][i];ctx.beginPath();ctx.moveTo(-12-i*12,Math.sin(f.age*30+i)*7);ctx.quadraticCurveTo(-18,-f.radius-i*3,f.radius-i*4,-8);ctx.quadraticCurveTo(f.radius+5,12,-12-i*12,Math.sin(f.age*30+i)*7);ctx.fill();}
    ctx.fillStyle='#fff9c0';ctx.beginPath();ctx.ellipse(2,0,12,10,0,0,7);ctx.fill();
   }else if(f.style==='wind'){
    ctx.strokeStyle='#abf5ff';ctx.lineWidth=5;ctx.beginPath();ctx.ellipse(-10,0,17,35,0,-1.5,1.5);ctx.stroke();ctx.strokeStyle='#4cc8ec';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(-18,0,20,43,0,-1.5,1.5);ctx.stroke();
   }else if(f.style==='crystal')skillGem(ctx,0,0,18,color);
   else{ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(0,0,f.radius+3,f.radius,0,0,7);ctx.fill();ctx.stroke();ctx.fillStyle='#e8ffbf';ctx.fillRect(-4,-4,5,4);}
  }ctx.restore();
 }
 for(const e of fx){if(!custom.has(e.kind))continue;const q=1-e.life/e.duration;ctx.save();ctx.translate(e.x,e.y);ctx.globalAlpha=Math.min(1,e.life*6);ctx.lineCap='round';
  if(e.kind==='groundFire'||e.kind==='geyser'||e.kind==='jets'){
   const count=e.kind==='geyser'?7:4,height=e.kind==='geyser'?e.radius:e.kind==='jets'?45:e.radius*.9;
   for(let i=0;i<count;i++){const x=(i-(count-1)/2)*10,h=height*(.5+.5*Math.sin(i*4+q*14)**2)*(1-q*.4);ctx.fillStyle=i%2?'#ff8b27':'#f1441f';ctx.beginPath();ctx.moveTo(x-10,0);ctx.quadraticCurveTo(x-15,-h*.5,x+Math.sin(i+q*15)*14,-h);ctx.quadraticCurveTo(x+20,-h*.45,x+12,0);ctx.fill();ctx.fillStyle='#ffe275';ctx.beginPath();ctx.moveTo(x-5,0);ctx.lineTo(x+2,-h*.7);ctx.lineTo(x+7,0);ctx.fill();}
  }else if(e.kind==='cross'){
   ctx.translate(e.dx*45,e.dy*45-63);ctx.strokeStyle='#eaffdd';ctx.lineWidth=4;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(-32+i*5,-28);ctx.lineTo(35+i*5,30);ctx.moveTo(-32+i*5,30);ctx.lineTo(35+i*5,-28);ctx.stroke();}
  }else if(e.kind==='dirt'){
   for(let i=0;i<14;i++){const x=e.dx*(12+q*65)+(i%3-1)*9,y=e.dy*(12+q*65)-Math.sin(Math.PI*q)*35+(i%5)*5;ctx.fillStyle=i%2?'#8b7963':'#c0aa85';ctx.fillRect(x,y,5+i%3,4+i%4);}
  }else if(e.kind==='groundTentacles'){
   for(let i=0;i<5;i++){
    const x=(i-2)*19,height=(55+i%3*25)*Math.sin(Math.PI*clamp(q*1.1,0,1));
    const path=()=>{ctx.beginPath();ctx.moveTo(x,4);ctx.bezierCurveTo(x-23,-height*.6,x+50,-height*1.3,x+10,-height);};
    ctx.strokeStyle='#142534';ctx.lineWidth=15;path();ctx.stroke();ctx.strokeStyle='#b9dbce';ctx.lineWidth=10;ctx.setLineDash([10,13]);path();ctx.stroke();ctx.setLineDash([]);
   }
  }else if(e.kind==='flowerRoots'){
   for(let i=-2;i<=2;i++){const x=i*18,h=55+Math.sin(i*4)*20;ctx.strokeStyle='#2c612a';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x,4);ctx.quadraticCurveTo(x-14,-h*.5,x+8,-h);ctx.stroke();skillGem(ctx,x+8,-h*.7,12,'#89b84e');if(i%2===0){ctx.fillStyle='#b24770';ctx.beginPath();ctx.ellipse(x+8,-h,11,13,0,0,7);ctx.fill();ctx.strokeStyle='#37542b';ctx.lineWidth=3;ctx.stroke();}}
  }else if(e.kind==='carnivore'){
   const im=evolutionPlantImage;if(im.complete&&im.naturalWidth){const frame=Math.min(5,Math.floor(q*6)),w=im.naturalWidth/6,h=im.naturalHeight,scale=175/h;ctx.imageSmoothingEnabled=false;ctx.drawImage(im,frame*w,0,w,h,-w*scale/2,-h*scale*.88,w*scale,h*scale);}
  }else if(e.kind==='lightning'){
   ctx.translate(0,-55);ctx.strokeStyle='#8edaff';ctx.lineWidth=2;for(let j=0;j<4;j++){ctx.beginPath();for(let k=0;k<5;k++){const a=j*Math.PI/2+q*4,r=25+k*9,x=Math.cos(a)*r+(k%2?7:-7),y=Math.sin(a)*r; k?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.stroke();}
  }else if(e.kind==='uppercut'){
   ctx.strokeStyle='#bdff74';ctx.lineWidth=3;for(let i=-1;i<=1;i++){ctx.beginPath();ctx.moveTo(i*17,0);ctx.quadraticCurveTo(i*32,-45,i*13,-100*q);ctx.stroke();}
  }else if(e.kind==='cable'){
   ctx.translate(0,-60);ctx.strokeStyle='#17241d';ctx.lineWidth=8;ctx.beginPath();ctx.moveTo(0,0);ctx.quadraticCurveTo(e.dx*e.radius*.5-e.dy*18,e.dy*e.radius*.5+e.dx*18,e.dx*e.radius,e.dy*e.radius);ctx.stroke();ctx.strokeStyle='#90d942';ctx.lineWidth=2;ctx.stroke();
  }else if(e.kind==='armor'){
   ctx.strokeStyle='#b6ffe3';ctx.globalAlpha*=.24+.16*Math.sin(q*25);ctx.lineWidth=3;ctx.translate(0,-50);ctx.beginPath();ctx.moveTo(-29,-32);ctx.lineTo(0,-58);ctx.lineTo(30,-32);ctx.lineTo(27,24);ctx.lineTo(0,43);ctx.lineTo(-27,24);ctx.closePath();ctx.stroke();
  }else if(e.kind==='bite'){
   ctx.translate(0,-48);ctx.strokeStyle='#d1e9b6';ctx.lineWidth=3;for(let i=0;i<4;i++){const a=i*Math.PI/2;ctx.beginPath();ctx.arc(0,0,25+q*15,a-.25,a+.25);ctx.stroke();}
  }ctx.restore();
 }
}
