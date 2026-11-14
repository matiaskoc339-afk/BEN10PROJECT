// Skill and map-geometry regression fixtures own artificial targets. Keep their
// scope isolated from the real encounter director, tested in v35-combat-browser.
module.exports=html=>html.replace('function enemyGameTick(dt,before){','function enemyGameTick(dt,before){return;').replace('encounters.setPhase(index);campaign.arena=null;','encounters.setPhase(index);encounters.complete=true;campaign.arena=null;');
