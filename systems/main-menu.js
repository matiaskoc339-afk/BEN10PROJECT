/* Animated title artwork and the three-slot archive; gameplay is bridged separately. */
(function(root){'use strict';
 let storage;try{storage=root.localStorage}catch{}
 const bank=root.Ben10SaveBank=new Ben10SaveSlots.Bank(storage);
 root.Ben10GameStorage={getItem:key=>bank.readLegacy(key),setItem:(key,value)=>bank.writeLegacy(key,value)};
 const $=id=>document.getElementById(id),ui={home:$('mainMenu'),backdrop:$('menuBackdrop'),logo:$('menuLogo'),slots:$('saveSlotList'),notice:$('menuSaveNotice'),load:$('menuLoadStatus'),pause:$('gamePause'),remove:$('saveDeleteDialog'),button:$('gameMenuButton')};
 const state={screen:'home',ready:false,selected:0,deleting:null,logoReady:false,maskBounds:null};let callbacks={},last=0,clock=0,saveTimer;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const canvas=()=>document.createElement('canvas'),base=canvas(),mask=canvas(),dots=canvas(),logoContext=ui.logo.getContext('2d');
 for(const c of [base,mask,dots])c.width=c.height=720;
 const background=new Ben10MenuBackground.Renderer(ui.backdrop);
 const logoImage=new Image();
 const logoReady=new Promise(resolve=>{logoImage.onload=()=>{
  base.getContext('2d').drawImage(logoImage,0,0,720,720);
  const data=Ben10TitleMask;mask.width=data.width;mask.height=data.height;const mc=mask.getContext('2d');mc.fillStyle='#fff';for(const [x,y,width] of data.runs)mc.fillRect(x,y,width,1);state.maskBounds=data.bounds;state.logoReady=true;drawLogo(0);resolve();
 };logoImage.onerror=()=>{ui.load.textContent='No se pudo cargar el logo. Puedes entrar a tu partida.';resolve()};logoImage.src='assets/ui/ben10-title.png'});
 function drawLogo(t){if(!state.logoReady)return;const b=state.maskBounds,c=dots.getContext('2d');c.clearRect(0,0,720,720);c.globalCompositeOperation='source-over';c.fillStyle='#050705';
  const w=b.right-b.left,h=b.bottom-b.top;
  for(let i=0;i<15;i++){const x=b.left+w*(.5+.31*Math.sin(i*2.36+t*(.15+i%3*.035))),y=b.top+h*(.5+.34*Math.cos(i*1.71+t*(.18+i%4*.024))),r=7+i%5*5;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  c.globalCompositeOperation='destination-in';c.drawImage(mask,0,0,720,720);c.globalCompositeOperation='source-over';logoContext.clearRect(0,0,720,720);logoContext.drawImage(base,0,0);logoContext.drawImage(dots,0,0);
 }
 function drawBackground(time){background.draw(time)}
 function resize(){const d=Math.min(devicePixelRatio||1,1.5);ui.backdrop.width=Math.round(innerWidth*d);ui.backdrop.height=Math.round(innerHeight*d);drawBackground(clock)}
 function animate(now){const dt=last?Math.min(.07,(now-last)/1000):0;last=now;if(!document.hidden&&state.screen==='home'&&!reduced)clock+=dt;if(!document.hidden&&state.screen==='home'&&(!reduced||!state.lastPaint)&&(now-(state.lastPaint||0)>32||!state.lastPaint)){drawBackground(clock);drawLogo(clock);state.lastPaint=now;}requestAnimationFrame(animate)}
 function slotLabel(r){if(!r)return 'Nueva partida';if(r.checkpoint?.kind==='victory')return 'Aventura completada';return ['Las calles','Castillo Eterno','Laboratorio oculto'][r.checkpoint?.phase||0]}
 function renderSlots(){ui.slots.replaceChildren();const records=bank.snapshot();records.forEach((record,index)=>{
  const card=document.createElement('article');card.className='save-card'+(record?'':' empty');const button=document.createElement('button');button.type='button';button.dataset.saveSlot=index;button.disabled=!state.ready;button.setAttribute('aria-label','Espacio '+(index+1)+': '+slotLabel(record));
  const number=document.createElement('span');number.className='save-number';number.textContent='0'+(index+1);button.append(number);const body=document.createElement('span');body.className='save-body';
  const small=document.createElement('small');small.textContent=record?'CONTINUAR PARTIDA':'ESPACIO DISPONIBLE';const name=document.createElement('strong');name.textContent=slotLabel(record);const details=document.createElement('span');details.textContent=record?'Nivel '+(record.progression?.level||1)+' · '+(record.unlocks.diamondhead?'3':'2')+' ADN recuperados':'Comienza una nueva aventura';body.append(small,name,details);
  if(record){const meta=document.createElement('span');meta.className='save-meta';const p=record.checkpoint;meta.textContent=(p?.kind==='boss'?'Jefe final':p?.kind==='victory'?'El Rey ha caído':p?.kind==='encounter'?'Punto de control · combate':'Punto de control '+((p?.cleared||0)+1))+' · '+Math.floor(record.playSeconds/60)+' min';body.append(meta)}button.append(body);button.addEventListener('focus',()=>state.selected=index);button.addEventListener('click',()=>choose(index));card.append(button);
  if(record){const del=document.createElement('button');del.type='button';del.className='save-delete';del.textContent='BORRAR';del.setAttribute('aria-label','Borrar espacio '+(index+1));del.addEventListener('click',()=>confirmDelete(index));card.append(del)}ui.slots.append(card);
 });ui.notice.textContent=bank.error;ui.load.textContent=state.ready?'Selecciona un espacio para entrar.':'Preparando el Omnitrix…'}
 function choose(i){if(!state.ready||state.screen!=='home'||state.deleting!==null)return;state.selected=i;callbacks.start?.(i)}
 function setScreen(screen){state.screen=screen;ui.home.hidden=screen!=='home';ui.pause.hidden=screen!=='pause';ui.button.hidden=screen!=='game';document.body.classList.toggle('main-menu-active',screen==='home');document.getElementById('game').inert=screen!=='game';if(screen==='home'){renderSlots();ui.slots.querySelector('[data-save-slot="'+state.selected+'"]').focus({preventScroll:true})}if(screen==='pause')$('gameResume').focus({preventScroll:true});}
 function confirmDelete(index){state.deleting=index;$('saveDeleteDescription').textContent='Se eliminará únicamente el espacio '+(index+1)+', con sus mejoras y su avance.';ui.remove.hidden=false;$('saveDeleteCancel').focus()}
 function cancelDelete(){ui.remove.hidden=true;state.deleting=null;ui.slots.querySelector('[data-save-slot="'+state.selected+'"]')?.focus()}
 $('saveDeleteCancel').onclick=cancelDelete;$('saveDeleteConfirm').onclick=()=>{if(state.deleting===null)return;bank.remove(state.deleting);renderSlots();cancelDelete()};
 $('gameResume').onclick=()=>callbacks.resume?.();$('gameSaveExit').onclick=()=>callbacks.exit?.();ui.button.onclick=()=>callbacks.pause?.();
 document.addEventListener('keydown',e=>{if(state.screen==='game'){if(e.key.toLowerCase()==='p'&&!e.repeat&&callbacks.canPause?.()){e.preventDefault();e.stopImmediatePropagation();callbacks.pause()}return}if(e.ctrlKey||e.metaKey||e.altKey)return;if(e.key==='Tab'){const dialog=state.deleting!==null?ui.remove:state.screen==='pause'?ui.pause:ui.home,buttons=[...dialog.querySelectorAll('button:not(:disabled)')];const first=buttons[0],lastButton=buttons.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();lastButton?.focus()}else if(!e.shiftKey&&document.activeElement===lastButton){e.preventDefault();first?.focus()}e.stopImmediatePropagation();return;}if(state.deleting!==null){if(e.key==='Escape'){e.preventDefault();cancelDelete()}if(e.key==='Enter'||e.key===' ')return;}else if(state.screen==='pause'){if(e.key==='Escape'||e.key.toLowerCase()==='p'){e.preventDefault();callbacks.resume?.()}if(e.key==='Enter'||e.key===' ')return;}else{if(/^[123]$/.test(e.key))choose(Number(e.key)-1);if(['ArrowDown','ArrowUp'].includes(e.key)){state.selected=(state.selected+(e.key==='ArrowDown'?1:2))%3;ui.slots.querySelector('[data-save-slot="'+state.selected+'"]').focus()}if(e.key==='Enter'||e.key===' ')return;}e.preventDefault();e.stopImmediatePropagation();},{capture:true});
 root.Ben10MainMenu={state,logoReady,bind:fn=>callbacks=fn,enable(){state.ready=true;renderSlots();if(state.screen==='home')ui.slots.querySelector('[data-save-slot="'+state.selected+'"]').focus({preventScroll:true})},setScreen,renderSlots,notify(message){const el=$('gameSaveStatus');el.textContent=message;el.classList.add('show');clearTimeout(saveTimer);saveTimer=setTimeout(()=>el.classList.remove('show'),2200)}};
 addEventListener('resize',resize);addEventListener('storage',e=>{if(e.key===Ben10SaveSlots.KEY&&state.screen==='home'){bank.slots=bank.latest();renderSlots()}});resize();renderSlots();document.body.classList.add('main-menu-active');requestAnimationFrame(animate);
})(window);
