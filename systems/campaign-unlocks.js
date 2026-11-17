(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Ben10CampaignUnlocks=factory()})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const KEY='ben10.campaign.v37.unlocks';
 class Unlocks{
  constructor(storage){this.storage=storage;this.diamondhead=false;this.ghostfreak=false;this.blitzwolfer=false;try{const saved=JSON.parse(storage?.getItem(KEY)||'null');this.diamondhead=saved?.version===1&&saved.diamondhead===true;this.ghostfreak=saved?.version===1&&saved.ghostfreak===true;this.blitzwolfer=saved?.version===1&&saved.blitzwolfer===true}catch{}}
  has(id){return id==='four-arms'||id==='heatblast'||id==='diamondhead'&&this.diamondhead||id==='ghostfreak'&&this.ghostfreak||id==='blitzwolfer'&&this.blitzwolfer}
  unlockDiamondhead(){const fresh=!this.diamondhead;this.diamondhead=true;try{this.storage?.setItem(KEY,JSON.stringify({version:1,diamondhead:true,ghostfreak:this.ghostfreak,blitzwolfer:this.blitzwolfer}))}catch{}return fresh}
  unlockGhostfreak(){const fresh=!this.ghostfreak;this.ghostfreak=true;try{this.storage?.setItem(KEY,JSON.stringify({version:1,diamondhead:this.diamondhead,ghostfreak:true,blitzwolfer:this.blitzwolfer}))}catch{}return fresh}
  unlockBlitzwolfer(){const fresh=!this.blitzwolfer;this.blitzwolfer=true;try{this.storage?.setItem(KEY,JSON.stringify({version:1,diamondhead:this.diamondhead,ghostfreak:this.ghostfreak,blitzwolfer:true}))}catch{}return fresh}
 }
 return {KEY,Unlocks};
});
