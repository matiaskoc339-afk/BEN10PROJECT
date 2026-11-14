function wheelFace(c,key,scale=1){
 const icon=pixelWheelIcons[key];if(!icon||!icon.complete||!icon.naturalWidth)return;
 const size=82*scale,index=ROSTER_KEYS.indexOf(key),id=PLAYABLE_SLOTS.get(index)?.id,locked=!campaignAlienUnlocked(id);
 c.save();c.imageSmoothingEnabled=false;if(locked){c.globalAlpha=.22;c.filter='grayscale(1)'}c.drawImage(icon,-size/2,-size/2,size,size);c.restore();
 if(locked){c.save();c.scale(scale,scale);c.strokeStyle='#a3b3a8';c.fillStyle='#13251c';c.lineWidth=3;c.beginPath();c.arc(0,15,8,Math.PI,0);c.stroke();c.fillRect(-11,15,22,18);c.strokeRect(-11,15,22,18);c.fillStyle='#a3b3a8';c.fillRect(-2,21,4,6);c.restore()}
}
