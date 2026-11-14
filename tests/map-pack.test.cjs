const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),data=JSON.parse(fs.readFileSync(root+'/mapas/data/recorrido.json')),world=require('../mapas/world.js');
test('28 distinct stretches form three connected chapters, with a shorter laboratory',()=>{
 assert.equal(data.rooms.length,28);assert.deepEqual(data.chapters.map(c=>c.count),[12,10,6]);assert.equal(data.enemies.length,0);assert.equal(data.combat,false);
 for(let i=0;i<27;i++)assert.equal(data.rooms[i+1].x,data.rooms[i].x+data.rooms[i].width+(data.rooms[i].chapter===data.rooms[i+1].chapter?0:data.chapterGap));
 assert.equal(data.width,data.rooms.at(-1).x+data.rooms.at(-1).width);assert.equal(data.rooms.at(-1).name,'Laboratorio principal');
 const hashes=new Set(data.rooms.map(r=>crypto.createHash('sha256').update(fs.readFileSync(root+'/mapas/'+r.image)).digest('hex')));assert.equal(hashes.size,28);
});
test('every referenced wall, floor, prop and animation frame exists locally',()=>{
 const files=[data.player.file];for(const r of data.rooms)files.push(r.wall,r.floor,r.image);
 for(const family of Object.values(data.props)){assert.equal(family.static.length,12);assert.equal(family.animations.length,2);for(const p of family.static)files.push(p.file);for(const clip of family.animations){assert.equal(clip.frames.length,6);assert.ok(clip.referenceHeight>0);files.push(...clip.frames.map(f=>f.file));}}
 for(const file of files)assert.ok(fs.existsSync(root+'/mapas/'+file),file);
});
test('each phase is continuously walkable and stops at its entrance, never crossing automatically',()=>{
 const visited=new Set();for(const chapter of data.chapters){let p={x:chapter.x+20,y:280};for(let i=0;i<6000&&p.x<chapter.end-19;i++){
  const next=world.move(data,p,2.4,0),lane=world.laneAt(data,next.x);assert.ok(next.y>=lane.top&&next.y<=lane.bottom);assert.ok(next.x>=p.x);p=next;visited.add(world.roomAt(data,p.x).id);
 }assert.ok(p.x>=chapter.end-19);assert.equal(world.move(data,p,10000,0).x,chapter.end-18);assert.equal(world.move(data,p,-10000,0).x,chapter.x+18);}
 assert.equal(visited.size,28);
});
test('wall and foreground boundaries constrain movement in every room and connector',()=>{
 const floorOnly={...data,rooms:data.rooms.map(r=>({...r,props:[]}))};
 for(const r of data.rooms){for(const x of [r.x+20,r.x+r.width/2,r.x+r.width-1]){const lane=world.laneAt(data,x),p={x,y:(lane.top+lane.bottom)/2};assert.equal(world.move(floorOnly,p,0,-1000).y,lane.top);assert.equal(world.move(floorOnly,p,0,1000).y,lane.bottom);}
  if(r.index<27&&r.chapter===data.rooms[r.index+1].chapter){const a=world.laneAt(data,r.x+r.width-64),b=world.laneAt(data,r.x+r.width-.001),c=data.rooms[r.index+1];assert.equal(a.top,r.walkTop);assert.ok(Math.abs(b.top-c.walkTop)<.001);assert.ok(Math.abs(b.bottom-c.walkBottom)<.001);}}
});
test('foreground props have physical foot bounds, rather than blocking their whole image',()=>{
 const room=data.rooms.find(r=>r.props.some(p=>p.collider)),p=room.props.find(p=>p.collider);assert.equal(world.blocked(data,room.x+p.x,p.y),true);assert.equal(world.blocked(data,room.x+p.x,p.y-65),false);
});
test('each ambient loop has genuine distinct authored frames',()=>{
 for(const family of Object.values(data.props))for(const clip of family.animations){const hashes=new Set(clip.frames.map(f=>crypto.createHash('sha256').update(fs.readFileSync(root+'/mapas/'+f.file)).digest('hex')));assert.ok(hashes.size>=4);}
});
test('the game embeds the same three-phase art catalogue as the independent map viewer',()=>{
 const html=fs.readFileSync(root+'/index.html','utf8'),match=html.match(/window\.BEN10_CAMPAIGN_DATA=(\{[^\n]+\});<\/script>/);assert.ok(match);assert.deepEqual(JSON.parse(match[1]),data);
});
test('three long panoramas have few registered joins and a reserved puzzle',()=>{
 assert.ok(new Set(data.rooms.map(r=>r.walkBottom)).size>=2);
 for(const chapter of data.chapters){assert.ok(chapter.segments.length<=3);let end=chapter.x;for(const segment of chapter.segments){assert.equal(segment.x,end-segment.overlap);end=segment.x+segment.width;for(const f of [segment.wall,segment.floor,segment.image])assert.ok(fs.existsSync(root+'/mapas/'+f));}assert.equal(end,chapter.end);}
 assert.equal(data.puzzles.length,1);const puzzle=data.puzzles[0],r=data.rooms[puzzle.room];assert.equal(r.chapter,'castillo');assert.ok(puzzle.reserved);assert.ok(puzzle.x>=r.x&&puzzle.x+puzzle.width<=r.x+r.width);assert.ok(puzzle.y>=r.walkTop&&puzzle.y+puzzle.height<=r.walkBottom);
});
