/* V47 Desert route. Data only; browser and Node compatible. */
(function(root,factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.Ben10Desert=api;
})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const ZONES=[
  {id:'desert-village',title:'Pueblo de las Arenas',subtitle:'Las primeras señales de Vilgax',name:['Entrada polvorienta','Mercado abandonado','Plaza del pozo','Últimas casas'],width:3000,rooms:12},
  {id:'desert-wastes',title:'Mar de Arena',subtitle:'Las arenas esconden algo vivo',name:['La duna del silencio','Campos de escombros','La tormenta se acerca','La senda del lobo'],width:3000,rooms:12},
  {id:'desert-cavern',title:'Cueva de la Manada',subtitle:'El Alfa aguarda al final',name:['Boca de la cueva','Galería de las garras','Túneles marcados','La guarida del Alfa'],width:3000,rooms:6}
 ];
 let start=0;
 const chapters=ZONES.map((z,i)=>{const a={id:z.id,name:z.title,subtitle:z.subtitle,x:start,end:start+z.width,entry:i===0?'Salir del pueblo':i===1?'Entrar a la cueva':'Volver al selector',color:'#d7a071',segments:[]};start+=z.width+120;return a;});
 const rooms=ZONES.flatMap((z,i)=>Array.from({length:z.rooms},(_,j)=>({index:j,chapter:z.id,name:z.name[Math.min(3,Math.floor(j/(z.rooms/4)))],x:chapters[i].x+(j/z.rooms)*z.width,width:z.width/z.rooms,floorY:230,walkTop:230,walkBottom:342,elevation:0,props:[],ambient:[]})));
 const props=Object.fromEntries(chapters.map(ch=>[ch.id,{static:[],animations:[]}]));
 const level={story:'desert',version:1,height:360,width:start,connectorWidth:120,chapters,rooms,props};
 const ASSET='desierto-blitz/assets/';
 const backgrounds=[
  ['village-a.png','village-b.png','village-c.png'],
  ['wastes-a.png','wastes-b.png','wastes-c.png'],
  ['cavern-a.png','cavern-b.png','cavern-c.png']
 ];
 const robotSheets=[
  ['robot-physical-weak.png','robot-physical-mid.png','robot-physical-strong.png'],
  ['robot-ranged-weak.png','robot-ranged-mid.png','robot-ranged-strong.png'],
  ['robot-mixed-weak.png','robot-mixed-mid.png','robot-mixed-strong.png']
 ];
 const bossSheets=['alpha-walk.png','alpha-claw.png','alpha-charge.png','alpha-dodge.png','alpha-howl.png','alpha-rage.png'];
 return{level,ZONES,ASSET,backgrounds,robotSheets,bossSheets,worm:'worm.png',portrait:'alpha-portrait.png'};
});