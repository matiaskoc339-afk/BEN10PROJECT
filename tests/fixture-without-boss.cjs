// Existing ten-form art/combat regressions inspect the complete sprite catalogue.
// The V37 boss integration test runs the unmodified release gates and unlocks.
module.exports=html=>html.replace('function campaignAlienUnlocked(id){','function campaignAlienUnlocked(id){return true;').replace('function kingCanExit(){','function kingCanExit(){return true;').replace('function kingGameTick(dt){','function kingGameTick(dt){return;');
