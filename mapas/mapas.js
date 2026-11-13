/* Standalone environment preview. The combat demo is intentionally not imported. */
(function(){
 'use strict';
 const data=window.BEN10_MAPS,world=window.Ben10MapWorld,canvas=document.getElementById('map'),ctx=canvas.getContext('2d',{alpha:false});
 const $=id=>document.getElementById(id),images=new Map(),phaseMasks=new Map(),keys=new Set(),LW=640,LH=360;
 const state={ready:false,time:0,camera:0,free:false,auto:false,showBen:true,showFloor:false,room:0,phase:0,exitReady:false,hero:{x:72,y:285,dir:'right',moving:false,clock:0},view:{scale:1,x:0,y:0,width:640,height:360},drag:null,finished:false};
 let last=performance.now(),resizeObserver;
 function load(file){if(images.has(file))return images.get(file).promise;const image=new Image(),entry={image,promise:null};entry.promise=new Promise((resolve,reject)=>{image.onload=()=>resolve(image);image.onerror=()=>reject(Error('No se pudo cargar '+file));image.src=file});images.set(file,entry);return entry.promise;}
 function img(file){return images.get(file)?.image;}
 function resized(){const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*dpr));canvas.height=Math.max(1,Math.round(r.height*dpr));const scale=Math.min(canvas.width/LW,canvas.height/LH);state.view={scale,x:(canvas.width-LW*scale)/2,y:(canvas.height-LH*scale)/2,width:canvas.width,height:canvas.height};}
 function currentChapter(room){return data.chapters.find(c=>c.id===room.chapter);}
 function updateLabels(){const at=state.free?state.camera+LW*.48:state.hero.x,room=world.roomAt(data,at);if(state.room!==room.index||!$('roomName').textContent){state.room=room.index;const chapter=currentChapter(room);document.documentElement.style.setProperty('--accent',chapter.color);$('chapterLabel').textContent=chapter.name.toUpperCase()+' · '+String(room.index-chapter.start+1).padStart(2,'0')+'/'+chapter.count;$('roomName').textContent=room.name;$('roomSubtitle').textContent=room.subtitle;document.querySelectorAll('[data-chapter]').forEach(b=>b.classList.toggle('current',b.dataset.chapter===room.chapter));document.querySelectorAll('.room-card').forEach(b=>b.classList.toggle('current',+b.dataset.room===room.index));}
  const chapter=data.chapters[state.phase],progress=Math.max(0,Math.min(1,(at-chapter.x)/(chapter.end-chapter.x)));$('progress').style.width=progress*100+'%';$('positionDot').style.left=progress*100+'%';$('positionLabel').textContent=(state.phase+1)+' / 3 · '+Math.round(progress*100)+'%';$('follow').hidden=!state.free;
 }
 function jump(index){const room=data.rooms[index];if(!room)return;state.phase=data.chapters.findIndex(c=>c.id===room.chapter);const chapter=data.chapters[state.phase];state.hero={x:room.x+92,y:Math.max(room.walkTop+30,Math.min(room.walkBottom-25,285)),dir:'right',moving:false,clock:0};state.camera=Math.max(chapter.x,Math.min(chapter.end-LW,room.x));state.free=false;state.finished=false;state.exitReady=false;$('finish').hidden=true;$('phaseExit').hidden=true;$('chapterMarks').replaceChildren();setAuto(false);updateLabels();canvas.focus({preventScroll:true});}
 function enterPhase(){if(!state.exitReady||state.phase===2)return;jump(data.chapters[state.phase+1].start);}
 function setAuto(on){state.auto=on;state.free=false;$('auto').setAttribute('aria-pressed',String(on));$('auto').innerHTML=on?'Detener paseo <span>Ⅱ</span>':'Iniciar paseo <span>→</span>';}
 function tick(dt){state.time+=dt;if(!state.ready)return;
  const h=state.hero;let dx=0,dy=0;if(keys.has('a')||keys.has('arrowleft'))dx--;if(keys.has('d')||keys.has('arrowright'))dx++;if(keys.has('w')||keys.has('arrowup'))dy--;if(keys.has('s')||keys.has('arrowdown'))dy++;
  if(dx||dy){setAuto(false);state.free=false;}
  if(state.auto){dx=1;dy=0;}
  const length=Math.hypot(dx,dy)||1,oldX=h.x,oldY=h.y;if(dx||dy){const p=world.move(data,h,dx/length*145*dt,dy/length*108*dt);h.x=p.x;h.y=p.y;if(Math.abs(dx)>=Math.abs(dy))h.dir=dx>0?'right':'left';else h.dir=dy>0?'down':'up';}
  h.moving=Math.hypot(h.x-oldX,h.y-oldY)>.025;if(h.moving)h.clock+=dt;
  const chapter=data.chapters[state.phase];
  if(!state.free){const goal=Math.max(chapter.x,Math.min(chapter.end-LW,h.x-LW*.42));state.camera+=(goal-state.camera)*(1-Math.exp(-7*dt));}
  const arrival=h.x>=chapter.end-38;
  if(arrival&&state.phase<2){if(state.auto)setAuto(false);if(!state.exitReady){state.exitReady=true;$('exitTitle').textContent=state.phase===0?'Castillo de los Eternos':'El laboratorio oculto';$('enterPhase').innerHTML=chapter.entry+' <span>→</span>';$('phaseExit').hidden=false;}}
  else if(state.phase<2){state.exitReady=false;$('phaseExit').hidden=true;}
  if(arrival&&state.phase===2&&!state.finished){state.finished=true;setAuto(false);$('finish').hidden=false;}
  updateLabels();
 }
 function paintPhase(){const chapter=data.chapters[state.phase];for(const segment of chapter.segments){if(segment.x+segment.width<state.camera||segment.x>state.camera+LW)continue;ctx.drawImage(phaseMasks.get(segment.image)||img(segment.image),segment.x-state.camera,0);}}
 function preparePhaseImages(){for(const chapter of data.chapters)for(const segment of chapter.segments){if(!segment.overlap)continue;const image=img(segment.image),surface=document.createElement('canvas');surface.width=image.width;surface.height=image.height;const c=surface.getContext('2d');c.drawImage(image,0,0);c.globalCompositeOperation='destination-in';const g=c.createLinearGradient(0,0,segment.overlap,0);g.addColorStop(0,'transparent');g.addColorStop(1,'black');c.fillStyle=g;c.fillRect(0,0,surface.width,surface.height);phaseMasks.set(segment.image,surface);}}
 function paintSprite(meta,x,y,height,clip=null){const image=img(meta.file);if(!image)return;const scale=height/(clip?.referenceHeight||meta.height),anchorY=clip?.anchor==='top'?0:meta.anchorY;
  ctx.drawImage(image,Math.round(x-meta.anchorX*scale),Math.round(y-anchorY*scale),Math.round(meta.width*scale),Math.round(meta.height*scale));
 }
 function spriteFor(room,prop){const family=data.props[room.chapter];if(prop.animated!==undefined){const clip=family.animations[prop.animated],frame=clip.frames[Math.floor(state.time*clip.fps+room.index*1.3)%clip.frames.length];return {meta:frame,clip};}return {meta:family.static.find(p=>p.name===prop.name),clip:null};}
 function paintProp(room,prop){const {meta,clip}=spriteFor(room,prop);if(!meta)return;const x=room.x+prop.x-state.camera,ground=prop.y-room.elevation,y=ground-(clip?.anchor==='top'?prop.height:0);
  if(!prop.mounted&&prop.animated===undefined){ctx.save();ctx.fillStyle='#10192538';ctx.beginPath();ctx.ellipse(x,ground,Math.max(8,prop.height*.16),3,0,0,7);ctx.fill();ctx.restore();}
  paintSprite(meta,x,y,prop.height,clip);
 }
 function floorOverlay(room){const x=room.x-state.camera,z=room.elevation;ctx.fillStyle='#b9f77b24';ctx.fillRect(x,room.walkTop-z,room.width,room.walkBottom-room.walkTop);ctx.strokeStyle='#d8ffaf';ctx.globalAlpha=.5;ctx.lineWidth=1;ctx.strokeRect(x,room.walkTop-z,room.width,room.walkBottom-room.walkTop);ctx.globalAlpha=1;
  for(const p of room.props)if(p.collider){ctx.strokeStyle='#ffb782';ctx.beginPath();ctx.ellipse(x+p.x,p.y-z,p.collider.rx+6,p.collider.ry+3,0,0,7);ctx.stroke();}
  for(const p of data.puzzles.filter(p=>p.room===room.index)){ctx.fillStyle='#a7d6e52c';ctx.fillRect(p.x-state.camera,p.y-z,p.width,p.height);ctx.fillStyle='#d9f4f4';ctx.font='7px monospace';ctx.fillText('ZONA DE PUZZLE',p.x-state.camera,p.y-z-5);}
 }
 function ambience(room){ctx.save();ctx.translate(0,-room.elevation);const base=room.x-state.camera,t=state.time;for(const a of room.ambient){
  if(a.kind==='leaves'){for(let i=0;i<8;i++){const q=(t*(9+i%3)+i*89+a.seed)%700,x=base+q-30,y=90+((i*47+t*(5+i%2))%230);ctx.fillStyle=['#b7ae60aa','#c8bd6c99','#90ad6299'][i%3];ctx.fillRect(Math.round(x),Math.round(y),3,1);ctx.fillRect(Math.round(x+1),Math.round(y-1),2,1);}}
  else if(a.kind==='water'){ctx.strokeStyle='#d4efff88';ctx.lineWidth=1;for(let i=0;i<6;i++){const x=base+a.x+Math.sin(t*.5+i*2)*a.width*.45,y=a.y+i%3*5;ctx.beginPath();ctx.moveTo(Math.round(x),y);ctx.lineTo(Math.round(x+8+Math.sin(t*2+i)*4),y);ctx.stroke();}}
  else if(a.kind==='embers'){for(let i=0;i<5;i++){const age=(t*.4+i*.23)%1;ctx.globalAlpha=(1-age)*.5;ctx.fillStyle='#f6c47c';ctx.fillRect(Math.round(base+a.x+Math.sin(age*7+i)*8),Math.round(a.y-age*32),1,2);}ctx.globalAlpha=1;}
  else if(a.kind==='circuit'){ctx.globalAlpha=.2+.13*Math.sin(t*1.6+room.index);ctx.fillStyle='#96f6cf';for(let i=0;i<4;i++)ctx.fillRect(base+80+i*130,room.floorY+1,35,1);ctx.globalAlpha=1;}
  else if(a.kind==='reactor'){ctx.save();ctx.globalCompositeOperation='screen';ctx.globalAlpha=.04+.035*Math.sin(t*1.8);ctx.fillStyle='#8cebc6';ctx.beginPath();ctx.ellipse(base+a.x,a.y,a.width*.6,a.height*.55,0,0,7);ctx.fill();ctx.globalAlpha=.55;for(let i=0;i<7;i++){const age=(t*.15+i*.13)%1;ctx.fillRect(Math.round(base+a.x+Math.sin(i*3)*a.width*.25),Math.round(a.y+a.height*.45-age*a.height*.9),1,2);}ctx.restore();}
 }ctx.restore();}
 function drawBen(){const h=state.hero,art=data.player,image=img(art.file),d=art.walkRows[h.dir],frame=h.moving?Math.floor(h.clock*11)%8:Math.floor(state.time*1.5)%2,row=h.moving?d:art.idleRow,col=h.moving?frame:d*2+frame;
  const x=h.x-state.camera,y=h.y-world.elevationAt(data,h.x);ctx.fillStyle='#111e1d66';ctx.beginPath();ctx.ellipse(x,y,12,4,0,0,7);ctx.fill();ctx.drawImage(image,col*96,row*96,96,96,Math.round(x-art.anchorX),Math.round(y-art.anchorY),96,96);
 }
 function render(){ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#091415';ctx.fillRect(0,0,canvas.width,canvas.height);if(!state.ready)return;ctx.save();const v=state.view;ctx.translate(v.x,v.y);ctx.scale(v.scale,v.scale);ctx.imageSmoothingEnabled=false;ctx.beginPath();ctx.rect(0,0,LW,LH);ctx.clip();
  const chapter=data.chapters[state.phase],visible=data.rooms.filter(r=>r.chapter===chapter.id&&r.x+r.width+data.connectorWidth>=state.camera-130&&r.x<=state.camera+LW+130);
  paintPhase();
  if(state.showFloor)for(const room of visible)floorOverlay(room);
  for(const room of visible){for(const p of room.props)if(p.behind)paintProp(room,p);ambience(room);}
  const sorted=visible.flatMap(room=>room.props.filter(p=>!p.behind).map(p=>({y:p.y,draw:()=>paintProp(room,p)})));if(state.showBen)sorted.push({y:state.hero.y,draw:drawBen});sorted.sort((a,b)=>a.y-b.y);for(const item of sorted)item.draw();ctx.restore();
 }
 function frame(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;tick(dt);render();requestAnimationFrame(frame);}
 function exportPanorama(){const chapter=data.chapters[state.phase],width=chapter.end-chapter.x,out=document.createElement('canvas');out.width=width;out.height=LH;const dest=out.getContext('2d');
  const saved={width:canvas.width,height:canvas.height,view:state.view,camera:state.camera,showBen:state.showBen,showFloor:state.showFloor};
  canvas.width=LW;canvas.height=LH;state.view={scale:1,x:0,y:0,width:LW,height:LH};state.showBen=false;state.showFloor=false;
  for(let x=0;x<width;x+=LW){state.camera=chapter.x+x;render();const size=Math.min(LW,width-x);dest.drawImage(canvas,0,0,size,LH,x,0,size,LH);}
  canvas.width=saved.width;canvas.height=saved.height;Object.assign(state,{view:saved.view,camera:saved.camera,showBen:saved.showBen,showFloor:saved.showFloor});render();return out.toDataURL('image/png');
 }
 function install(){
  for(const chapter of data.chapters){const b=document.createElement('button');b.type='button';b.dataset.chapter=chapter.id;b.innerHTML='<span>0'+(data.chapters.indexOf(chapter)+1)+'</span>'+chapter.name;b.addEventListener('click',()=>{jump(chapter.start);setAuto(false)});$('chapters').appendChild(b);const mark=document.createElement('i');mark.style.left=data.rooms[chapter.start].x/data.width*100+'%';$('chapterMarks').appendChild(mark);
   const heading=document.createElement('h3');heading.textContent=chapter.name;$('roomList').appendChild(heading);
   for(const room of data.rooms.filter(r=>r.chapter===chapter.id)){const button=document.createElement('button');button.type='button';button.dataset.room=room.index;button.className='room-card';button.innerHTML='<img loading="lazy" src="'+room.image+'" alt=""><span>'+room.name+'<small>'+String(room.index+1).padStart(2,'0')+' / 28</small></span>';button.addEventListener('click',()=>{jump(room.index);setAuto(false);$('routePanel').hidden=true;$('routeToggle').setAttribute('aria-expanded','false')});$('roomList').appendChild(button);}
  }
  const toggle=()=>{const open=$('routePanel').hidden;$('routePanel').hidden=!open;$('routeToggle').setAttribute('aria-expanded',String(open));};$('routeToggle').addEventListener('click',toggle);$('routeClose').addEventListener('click',toggle);
  $('showBen').addEventListener('change',e=>state.showBen=e.target.checked);$('showFloor').addEventListener('change',e=>state.showFloor=e.target.checked);$('auto').addEventListener('click',()=>setAuto(!state.auto));$('restart').addEventListener('click',()=>jump(0));$('follow').addEventListener('click',()=>{state.free=false;updateLabels()});
  $('enterPhase').addEventListener('click',enterPhase);
  $('downloadPanorama').addEventListener('click',()=>{const a=document.createElement('a');a.download='ben10-'+data.chapters[state.phase].id+'-panorama.png';a.href='panoramas/'+data.chapters[state.phase].id+'.png';a.click();});
  $('timeline').addEventListener('click',e=>{const r=e.currentTarget.getBoundingClientRect(),position=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),chapter=data.chapters[state.phase];jump(world.roomAt(data,chapter.x+position*(chapter.end-chapter.x-1)).index);});
  window.addEventListener('keydown',e=>{const key=e.key.toLowerCase();if(key==='e'&&!e.repeat)enterPhase();if(['input','button','select'].includes(document.activeElement.tagName.toLowerCase())&&key===' ')return;if(['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)){e.preventDefault();keys.add(key);if(key===' '&&!e.repeat)setAuto(!state.auto);}if(key==='escape'){$('routePanel').hidden=true;$('routeToggle').setAttribute('aria-expanded','false');$('finish').hidden=true;}});window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>keys.clear());
  canvas.addEventListener('pointerdown',e=>{canvas.focus();canvas.setPointerCapture(e.pointerId);state.drag={x:e.clientX,camera:state.camera};setAuto(false);});canvas.addEventListener('pointermove',e=>{if(!state.drag)return;const pixelScale=canvas.getBoundingClientRect().width/LW;const chapter=data.chapters[state.phase];state.camera=Math.max(chapter.x,Math.min(chapter.end-LW,state.drag.camera-(e.clientX-state.drag.x)/pixelScale));state.free=true;updateLabels()});canvas.addEventListener('pointerup',()=>state.drag=null);canvas.addEventListener('pointercancel',()=>state.drag=null);
 }
 install();resizeObserver=new ResizeObserver(resized);resizeObserver.observe(canvas);resized();requestAnimationFrame(frame);
 const paths=new Set([data.player.file]);for(const chapter of data.chapters)for(const segment of chapter.segments)paths.add(segment.image);for(const family of Object.values(data.props)){for(const p of family.static)paths.add(p.file);for(const clip of family.animations)for(const p of clip.frames)paths.add(p.file);}
 window.mapReady=Promise.all([...paths].map(load)).then(()=>{preparePhaseImages();state.ready=true;$('loading').hidden=true;jump(0);return true}).catch(error=>{$('loading').innerHTML='<b>'+error.message+'</b><span>Conserva la carpeta assets junto a este archivo.</span>';throw error});
 window.Ben10Maps={data,snapshot:()=>({ready:state.ready,room:state.room,phase:state.phase,exitReady:state.exitReady,camera:state.camera,time:state.time,auto:state.auto,hero:{...state.hero},showFloor:state.showFloor,showBen:state.showBen,finished:state.finished}),jump,exportPanorama,advance:seconds=>{for(let n=0;n<Math.ceil(seconds*60);n++)tick(1/60);render()},setPosition:(x,y)=>{const chapter=data.chapters[state.phase];state.hero.x=Math.max(chapter.x+18,Math.min(chapter.end-18,x));state.hero.y=y;state.free=false;updateLabels()},laneAt:x=>world.laneAt(data,x)};
})();
