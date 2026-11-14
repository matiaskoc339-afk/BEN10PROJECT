/* Shared player health: changing form never changes the health pool. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.Ben10Balance=factory()})(typeof globalThis==='undefined'?this:globalThis,function(){
 'use strict';
 const PLAYER_CONFIG=Object.freeze({maxHealth:50,maxEnergy:90});
 const HUMAN_ATTACKS=Object.freeze({light:Object.freeze([4,5,6]),heavy:9,special:18});
 function humanAttackDamage({special=false,heavy=false,combo=1}={}){return special?HUMAN_ATTACKS.special:heavy?HUMAN_ATTACKS.heavy:HUMAN_ATTACKS.light[Math.max(0,Math.min(2,(combo||1)-1))];}
 function createPlayerStats(Stats){return new Stats.PlayerStats(PLAYER_CONFIG);}
 return {PLAYER_CONFIG,HUMAN_ATTACKS,humanAttackDamage,createPlayerStats};
});
