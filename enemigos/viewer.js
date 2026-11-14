(function(){
 'use strict';
 const api=window.EnemySprites,{data,images}=api,$=id=>document.getElementById(id),canvas=$('stage'),ctx=canvas.getContext('2d'),LW=960,LH=440;
 const initial=new URLSearchParams(location.search).get('unit');
 const state={unit:data.units.find(u=>u.id===initial)||data.units[0],action:'walk',time:0,playing:true,repeat:false,speed:1,facing:'right',compare:false,ben:true,pivot:false,background:'plain',role:'all',tier:'all',ready:false,globalTime:0};
 let last=performance.now(),view={scale:1,x:0,y:0},cards=[];
 function resize(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));const scale=Math.min(canvas.width/LW,canvas.height/LH);view={scale,x:(canvas.width-LW*scale)/2,y:(canvas.height-LH*scale)/2};for(const item of cards){const box=item.canvas.getBoundingClientRect();item.canvas.width=Math.max(1,Math.round(box.width*d));item.canvas.height=Math.max(1,Math.round(box.height*d));}}
 function selectedClip(){return state.unit.animations[state.action];}
 function updateLabels(){const u=state.unit;document.documentElement.style.setProperty('--gold',u.tier==='crystal'?'#a3ead3':'#e2b771');$('unitCategory').textContent=u.roleLabel.toUpperCase()+' · '+u.tierLabel.toUpperCase();$('unitName').textContent=u.name;$('unitDescription').textContent=u.description;$('actionLabel').textContent=selectedClip().name.toUpperCase();$('downloadAtlas').href=u.atlas;$('downloadAtlas').download=u.id+'.png';$('downloadData').href=u.atlas.replace('.png','.json');$('downloadData').download=u.id+'.json';$('play').textContent=state.playing?'Ⅱ Pausar':'▶ Reproducir';$('play').setAttribute('aria-label',state.playing?'Pausar':'Reproducir');
  document.querySelectorAll('[data-action]').forEach(b=>{b.classList.toggle('active',b.dataset.action===state.action);b.textContent=u.animations[b.dataset.action].name;});
  for(const card of cards)card.button.classList.toggle('selected',card.unit.id===u.id);
 }
 function selectUnit(id){const unit=data.units.find(u=>u.id===id);if(!unit)return;state.unit=unit;state.time=0;state.playing=true;updateLabels();render();}
 function selectAction(key){if(!state.unit.animations[key])return;state.action=key;state.time=0;state.playing=true;updateLabels();render();}
 function setFrame(n){n=Math.max(0,Math.min(5,n));state.time=selectedClip().durations.slice(0,n).reduce((a,b)=>a+b,0)/1000+.001;state.playing=false;updateLabels();render();}
 function comparedUnits(){return state.compare?data.units.filter(u=>u.role===state.unit.role):[state.unit];}
 function backdrop(){
  ctx.fillStyle='#132130';ctx.fillRect(0,0,LW,LH);
  if(state.background==='alpha'){for(let y=0;y<LH;y+=16)for(let x=0;x<LW;x+=16){ctx.fillStyle=(x/16+y/16)%2?'#2f3e4e':'#3b4b5b';ctx.fillRect(x,y,16,16);}}
  else if(state.background!=='plain'){const image=images.get('assets/context/'+state.background+'.png');if(image){const z=Math.max(LW/image.width,LH/image.height);ctx.drawImage(image,(LW-image.width*z)/2,(LH-image.height*z)/2,image.width*z,image.height*z);}}
  else{ctx.fillStyle='#1c2d3e';ctx.fillRect(0,342,LW,LH-342);ctx.strokeStyle='#385268';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(0,342.5);ctx.lineTo(LW,342.5);ctx.stroke();for(let x=10;x<LW;x+=45){ctx.strokeStyle='#263d50';ctx.beginPath();ctx.moveTo(x,347);ctx.lineTo(x-12,LH);ctx.stroke();}}
 }
 function projectile(unit,frame,x,y,z,relative){
  if(!unit.projectile||!['attack','secondary'].includes(state.action)||frame<3)return;
  const p=unit.projectile,image=images.get(p.file);if(!image)return;const scale=unit.bodyHeight/unit.nativeBodyHeight*z,sign=state.facing==='left'?-1:1,flight=Math.max(0,relative-.48)*180;
  ctx.save();ctx.translate(x+sign*(p.muzzleX*scale+flight),y+p.muzzleY*scale);if(sign<0)ctx.scale(-1,1);ctx.drawImage(image,0,-p.height*scale/2,p.width*scale,p.height*scale);ctx.restore();
 }
 function render(){
  ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#0d1824';ctx.fillRect(0,0,canvas.width,canvas.height);if(!state.ready)return;
  ctx.save();ctx.translate(view.x,view.y);ctx.scale(view.scale,view.scale);ctx.imageSmoothingEnabled=false;ctx.beginPath();ctx.rect(0,0,LW,LH);ctx.clip();backdrop();
  const units=comparedUnits(),scale=units.length===1?1.65:units.length===2?1.20:1.25,xs=units.length===1?[510]:units.length===2?[380,725]:[300,535,770],floor=342;
  if(state.ben){api.ben(ctx,units.length===1?125:105,floor,scale,state.globalTime);ctx.font='10px Consolas,monospace';ctx.textAlign='center';ctx.fillStyle='#c1ddaf';ctx.fillText('BEN · ESCALA',units.length===1?125:105,floor+30);}
  const selectedDuration=api.duration(selectedClip()),normalTime=(selectedClip().loop||state.repeat)?state.time%selectedDuration:Math.min(state.time,selectedDuration);
  units.forEach((unit,i)=>{const clip=unit.animations[state.action],time=normalTime/selectedDuration*api.duration(clip),frame=api.frameAt(clip,time,state.repeat);api.shadow(ctx,xs[i],floor,unit.bodyHeight*scale*(state.action==='defeat'&&frame>=3?.29:.17));api.draw(ctx,unit,state.action,frame,xs[i],floor,scale,state.facing,state.pivot);projectile(unit,frame,xs[i],floor,scale,normalTime/selectedDuration);ctx.font='11px Consolas,monospace';ctx.textAlign='center';ctx.fillStyle=unit.tier==='crystal'?'#bcefdc':'#e6d4b2';ctx.fillText(unit.tierLabel.toUpperCase(),xs[i],floor+30);});
  ctx.restore();const frame=api.frameAt(selectedClip(),state.time,state.repeat);$('frameLabel').textContent=(frame+1)+' / 6';document.querySelectorAll('[data-frame]').forEach(b=>{b.classList.toggle('current',+b.dataset.frame===frame);b.classList.toggle('contact',selectedClip().contactFrames.includes(+b.dataset.frame));});
 }
 function drawCards(){if(!state.ready)return;for(const card of cards){if(card.button.hidden)continue;const c=card.canvas.getContext('2d'),w=card.canvas.width,h=card.canvas.height;if(w<=14||h<=18)continue;c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,w,h);const unit=card.unit,clip=unit.animations.walk,f=api.frameAt(clip,state.globalTime+card.index*.11),unitScale=unit.bodyHeight/unit.nativeBodyHeight,scale=Math.min((h-18)/(unit.cellHeight*unitScale),(w-14)/(unit.cellWidth*unitScale)),x=(w-unit.cellWidth*unitScale*scale)/2+unit.anchorX*unitScale*scale,y=(h-unit.cellHeight*unitScale*scale)/2+unit.anchorY*unitScale*scale;api.shadow(c,x,y,unit.bodyHeight*scale*.15);api.draw(c,unit,'walk',f,x,y,scale);}}
 function filter(){let visible=0;for(const card of cards){const show=(state.role==='all'||state.role===card.unit.role)&&(state.tier==='all'||state.tier===card.unit.tier);card.button.hidden=!show;if(show)visible++;}$('visibleCount').textContent=visible+' / '+data.units.length;requestAnimationFrame(resize);}
 function tick(dt){state.globalTime+=dt;if(state.playing){state.time+=dt*state.speed;const clip=selectedClip();if(!clip.loop&&!state.repeat&&state.time>=api.duration(clip)){state.time=api.duration(clip);state.playing=false;updateLabels();}}}
 function frame(now){const dt=Math.max(0,Math.min(.08,(now-last)/1000));last=now;tick(dt);render();drawCards();requestAnimationFrame(frame);}
 for(const key of data.animationKeys){const b=document.createElement('button');b.type='button';b.dataset.action=key;b.addEventListener('click',()=>selectAction(key));$('animations').appendChild(b);}
 for(let i=0;i<6;i++){const b=document.createElement('button');b.type='button';b.dataset.frame=i;b.textContent=i+1;b.setAttribute('aria-label','Fotograma '+(i+1));b.addEventListener('click',()=>setFrame(i));$('frames').appendChild(b);}
 for(const role of [{id:'all',label:'Todos'},...data.roles,{id:'champion',label:'Minijefes'}]){const b=document.createElement('button');b.type='button';b.dataset.role=role.id;b.textContent=role.label;b.classList.toggle('active',role.id==='all');b.addEventListener('click',()=>{state.role=role.id;document.querySelectorAll('[data-role]').forEach(el=>el.classList.toggle('active',el===b));filter()});$('roleFilters').appendChild(b);}
 data.units.forEach((unit,index)=>{const b=document.createElement('button');b.type='button';b.className='unit-card';b.dataset.unit=unit.id;b.dataset.tier=unit.tier;b.dataset.kind=unit.kind;b.innerHTML='<canvas aria-label="Caminata de '+unit.name+'"></canvas><strong>'+unit.name+'</strong><small>'+unit.tierLabel+'</small>';b.addEventListener('click',()=>selectUnit(unit.id));$('unitList').appendChild(b);cards.push({button:b,canvas:b.querySelector('canvas'),unit,index});});
 $('totalLabel').textContent=data.units.length+' VARIANTES · '+data.totalPoses+' POSES';$('tierFilter').addEventListener('change',e=>{state.tier=e.target.value;filter()});
 $('play').addEventListener('click',()=>{if(!state.playing&&state.time>=api.duration(selectedClip()))state.time=0;state.playing=!state.playing;updateLabels()});
 $('previous').addEventListener('click',()=>setFrame(api.frameAt(selectedClip(),state.time,state.repeat)-1));$('next').addEventListener('click',()=>setFrame(api.frameAt(selectedClip(),state.time,state.repeat)+1));
 $('speed').addEventListener('change',e=>state.speed=+e.target.value);$('repeat').addEventListener('change',e=>state.repeat=e.target.checked);$('compare').addEventListener('change',e=>{state.compare=e.target.checked;render()});$('showBen').addEventListener('change',e=>state.ben=e.target.checked);$('showPivot').addEventListener('change',e=>state.pivot=e.target.checked);$('background').addEventListener('change',e=>state.background=e.target.value);
 document.querySelectorAll('[data-facing]').forEach(b=>b.addEventListener('click',()=>{state.facing=b.dataset.facing;document.querySelectorAll('[data-facing]').forEach(x=>x.classList.toggle('active',x===b));render()}));
 window.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea'))return;if(e.key===' '){e.preventDefault();$('play').click()}else if(e.key==='ArrowLeft'){e.preventDefault();$('previous').click()}else if(e.key==='ArrowRight'){e.preventDefault();$('next').click()}});
 new ResizeObserver(resize).observe(canvas);resize();filter();updateLabels();requestAnimationFrame(frame);
 window.enemyArtReady=api.ready.then(()=>{state.ready=true;$('loading').hidden=true;resize();render();return true}).catch(error=>{$('loading').textContent='No se pudo cargar una lámina. Conserva assets y data junto al visor.';throw error});
 window.EnemyArtViewer={data,selectUnit,selectAction,setFrame,advance:seconds=>{tick(seconds);render();drawCards()},snapshot:()=>({unit:state.unit.id,action:state.action,frame:api.frameAt(selectedClip(),state.time,state.repeat),playing:state.playing,facing:state.facing,compare:state.compare,ready:state.ready,visible:cards.filter(c=>!c.button.hidden).length})};
})();
