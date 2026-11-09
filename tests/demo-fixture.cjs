// Instrument only the response served by tests. The distributed HTML has no hooks.
const hook = `
window.__demo={player,stats,syncHud,updateStats,keys,touchMove,cam,ROW,FRAMES,readyPromise,framePlayer,paintPlayerSprite,actorMetrics,fourArmsActionClip,returnToBen,collide,attackContactTime,lightAttack,heavyAttack,dodge,toggleWheel,selectSlot,update,render,startMode,paintOmnitrix,
get watchIcon(){return watchIcon},get fourArmsAtlas(){return fourArmsAtlas},get mainAtlas(){return mainAtlas},get verticalAtlas(){return verticalAtlas},get state(){return state},get time(){return t},get props(){return props},get dummies(){return dummyList},
reset(){stats.reset();keys.clear();touchMove.x=0;touchMove.y=0;props=[];dummyList=[];pieces=[];impactPause=0;cam.zoom=actorMetrics().zoom;state.wheel=false;state.kills=0;document.getElementById('count').textContent='0';document.getElementById('wheelLayer').classList.remove('open');Object.assign(player,{x:1210,y:915,vx:0,vy:0,dir:'down',faceX:0,faceY:1,health:100,mode:'idle',modeTime:0,modeDur:0,runClock:0,lightN:0,heavyN:0,lastLight:-5,lastHeavy:-5,lastDash:-5,hit:false,moving:false,idleClock:0,selectedAlien:-1,pendingForm:null,specialQueued:false,specialAnimation:false,bufferedAttack:null,actionDir:'down',actionX:0,actionY:1});t=0;shake=0;flash=0;hudLevelFlash=0;hudHitFlash=0;hudLastHealth=100;hudSignature='';syncHud();},
tick(seconds){for(let left=seconds;left>0;left-=1/60)update(Math.min(left,1/60));updateStats(0);render();}};
`;
function instrument(html) {
  const at = html.lastIndexOf("\n})();");
  if (at < 0) throw new Error("Demo closure not found");
  return html.slice(0, at) + hook + html.slice(at);
}
module.exports = { instrument };
