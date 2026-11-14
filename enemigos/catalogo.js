(function(){
 'use strict';
 const api=window.EnemySprites,{data}=api,cards=[];
 let ready=false,time=0,last=performance.now(),playing=true,speed=1,key='walk';
 const groups=[
  ['recruit','I','Reclutas','Menor rango · protección ligera y equipo sencillo.',u=>u.tier==='recruit'],
  ['elite','II','Veteranos','Armadura cerrada · placas reforzadas y detalles de rango.',u=>u.tier==='elite'],
  ['crystal','III','Armadura de ADN de Diamante','Cristales petrosapien integrados en las placas y en el armamento.',u=>u.tier==='crystal'&&u.kind==='soldier'],
  ['champion','✦','Campeones del hacha','Minijefes · más masa, un hacha enorme y golpes con preparación.',u=>u.kind==='miniboss']
 ];
 for(const [tier,badge,title,note,filter] of groups){const section=document.createElement('section');section.className='group';section.dataset.tier=tier;section.innerHTML='<div class="group-heading"><span class="badge">'+badge+'</span><div><h2>'+title+'</h2><p>'+note+'</p></div></div><div class="cards"></div>';document.getElementById('groups').appendChild(section);for(const unit of data.units.filter(filter)){const a=document.createElement('a');a.href='index.html?unit='+unit.id;a.className='card';a.dataset.unit=unit.id;a.innerHTML='<canvas aria-label="'+unit.name+' · '+unit.tierLabel+'"></canvas><div class="card-info"><small>'+unit.roleLabel+(unit.kind==='miniboss'?' · '+unit.tierLabel:'')+'</small><strong>'+unit.name+'</strong><span>↗</span></div>';section.querySelector('.cards').appendChild(a);cards.push({unit,canvas:a.querySelector('canvas')});}}
 function resize(){const d=Math.min(devicePixelRatio||1,2);for(const {canvas} of cards){const r=canvas.getBoundingClientRect();canvas.width=Math.max(1,Math.round(r.width*d));canvas.height=Math.max(1,Math.round(r.height*d));}}
 function render(){if(!ready)return;for(const {canvas,unit} of cards){const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,clip=unit.animations[key];ctx.clearRect(0,0,w,h);const z=unit.bodyHeight/unit.nativeBodyHeight,scale=Math.min((w-20)/(unit.cellWidth*z),(h-20)/(unit.cellHeight*z)),x=(w-unit.cellWidth*z*scale)/2+unit.anchorX*z*scale,y=(h-unit.cellHeight*z*scale)/2+unit.anchorY*z*scale;api.shadow(ctx,x,y,unit.bodyHeight*scale*.17);api.draw(ctx,unit,key,api.frameAt(clip,time,true),x,y,scale);}}
 function tick(now){const dt=Math.min(.08,(now-last)/1000);last=now;if(playing)time+=dt*speed;render();requestAnimationFrame(tick)}
 document.getElementById('action').addEventListener('change',e=>{key=e.target.value;time=0});document.getElementById('play').addEventListener('click',e=>{playing=!playing;e.target.textContent=playing?'Ⅱ Pausar':'▶ Reproducir'});document.getElementById('speed').addEventListener('change',e=>speed=+e.target.value);window.addEventListener('resize',resize);resize();requestAnimationFrame(tick);
 window.enemyCatalogReady=api.ready.then(()=>{ready=true;resize();render();return true});
 window.EnemyArtCatalog={data,snapshot:()=>({ready,count:cards.length,action:key,playing}),setFrame:n=>{const clip=data.units[0].animations[key];time=clip.durations.slice(0,n).reduce((a,b)=>a+b,0)/1000+.001;playing=false;render()}};
})();
