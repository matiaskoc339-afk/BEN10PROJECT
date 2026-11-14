function wheelFace(c,key,scale=1){
 const size=82*scale,index=ROSTER_KEYS.indexOf(key),id=PLAYABLE_SLOTS.get(index)?.id,locked=!campaignAlienUnlocked(id);
 if(locked){Ben10SecretDNA.draw(c,size);return;}
 const icon=pixelWheelIcons[key];if(!icon||!icon.complete||!icon.naturalWidth)return;
 c.save();c.imageSmoothingEnabled=false;c.drawImage(icon,-size/2,-size/2,size,size);c.restore();
}
