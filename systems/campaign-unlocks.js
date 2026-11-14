(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Ben10CampaignUnlocks=factory()})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const KEY='ben10.campaign.v37.unlocks';
 class Unlocks{
  constructor(storage){this.storage=storage;this.diamondhead=false;try{const saved=JSON.parse(storage?.getItem(KEY)||'null');this.diamondhead=saved?.version===1&&saved.diamondhead===true}catch{}}
  has(id){return id==='four-arms'||id==='heatblast'||id==='diamondhead'&&this.diamondhead}
  unlockDiamondhead(){const fresh=!this.diamondhead;this.diamondhead=true;try{this.storage?.setItem(KEY,JSON.stringify({version:1,diamondhead:true}))}catch{}return fresh}
 }
 return {KEY,Unlocks};
});
