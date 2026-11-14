/* One anonymous portrait conceals every undiscovered form. */
(function(root){
 'use strict';
 const image=new Image(),file='assets/ui/unknown-alien.png';
 const ready=new Promise((resolve,reject)=>{image.onload=()=>resolve();image.onerror=()=>reject(Error('No se pudo cargar el ADN desconocido'));});
 image.src=file;
 function draw(ctx,size=82){if(!image.complete||!image.naturalWidth)return;ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(image,-size/2,-size/2,size,size);ctx.restore();}
 root.Ben10SecretDNA={ready,draw,file};
})(typeof globalThis==='undefined'?this:globalThis);
