(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Ben10MapWorld=factory()})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function roomAt(data,x){let lo=0,hi=data.rooms.length-1;while(lo<hi){const mid=Math.ceil((lo+hi)/2);if(data.rooms[mid].x<=x)lo=mid;else hi=mid-1;}return data.rooms[lo];}
 function chapterAt(data,x){return data.chapters.find(c=>c.id===roomAt(data,x).chapter)}
 function elevationAt(data,x){const room=roomAt(data,x),next=data.rooms[room.index+1],local=x-room.x;
  if(next&&next.chapter===room.chapter&&local>room.width){const q=clamp((local-room.width)/data.connectorWidth,0,1);return room.elevation+(next.elevation-room.elevation)*q;}
  return room.elevation;
 }
 function laneAt(data,x){const room=roomAt(data,x),next=data.rooms[room.index+1],local=x-room.x;let top=room.walkTop,bottom=room.walkBottom;
  if(next&&next.chapter===room.chapter&&local>room.width-64){const q=clamp((local-room.width+64)/64,0,1);top+=(next.walkTop-top)*q;bottom+=(next.walkBottom-bottom)*q;}
  return {top,bottom};
 }
 function obstacles(data,x){const room=roomAt(data,x);return data.rooms.slice(Math.max(0,room.index-1),room.index+2).flatMap(r=>r.props.filter(p=>p.collider).map(p=>({x:r.x+p.x,y:p.y,rx:p.collider.rx,ry:p.collider.ry})));}
 function blocked(data,x,y,radius=6){return obstacles(data,x).some(p=>((x-p.x)/(p.rx+radius))**2+((y-p.y)/(p.ry+radius*.55))**2<1)}
 function move(data,from,dx,dy){const chapter=chapterAt(data,from.x);let x=clamp(from.x+dx,chapter.x+18,chapter.end-18),lane=laneAt(data,x),y=clamp(from.y+dy,lane.top,lane.bottom);
  if(blocked(data,x,y)){if(!blocked(data,x,from.y))y=clamp(from.y,lane.top,lane.bottom);else{x=from.x;lane=laneAt(data,x);y=clamp(from.y+dy,lane.top,lane.bottom);if(blocked(data,x,y))y=from.y;}}
  return {x,y};
 }
 return {roomAt,chapterAt,elevationAt,laneAt,blocked,move};
});
