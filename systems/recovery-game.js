// RECOVERY_GAME_START
const healthPickups=new Ben10HealthPickups.System(),healthPickupArt=new Ben10HealthPickups.Renderer();
function recoveryDrop(enemy){return healthPickups.attempt(enemy,stats,point=>campaign.clampPoint({x:point.x+Math.sign(player.x-point.x)*18,y:point.y+9},8,props))}
function recoveryTick(dt){healthPickups.update(dt,player,stats,(item,amount)=>{floatText(player.x,player.y-actorMetrics().height-10,'+'+Math.round(amount)+' PV','#d9f5b5',15);spawnDust(item.x,item.y-15,7,'#c5ef8c');hudSignature='';syncHud();gameSaveCurrent()})}
// RECOVERY_GAME_END
