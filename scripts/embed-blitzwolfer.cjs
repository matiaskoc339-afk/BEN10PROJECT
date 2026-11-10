const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),file=path.join(root,'index.html');let html=fs.readFileSync(file,'utf8');
const physics='<!-- BLITZWOLFER_ABILITIES_START -->\n<script>\n'+fs.readFileSync(path.join(root,'systems/blitzwolfer-abilities.js'),'utf8')+'\n</script>\n<!-- BLITZWOLFER_ABILITIES_END -->';
if(html.includes('<!-- BLITZWOLFER_ABILITIES_START -->'))html=html.replace(/<!-- BLITZWOLFER_ABILITIES_START -->[\s\S]*?<!-- BLITZWOLFER_ABILITIES_END -->/,()=>physics);else html=html.replace('<!-- WILDVINE_ROOTS_END -->',()=> '<!-- WILDVINE_ROOTS_END -->\n'+physics);
const game='// BLITZWOLFER_GAME_START\n'+fs.readFileSync(path.join(root,'systems/blitzwolfer-game.js'),'utf8')+'// BLITZWOLFER_GAME_END';
// Clips must initialize after combatClip and before the first animation frame.
if(html.includes('// BLITZWOLFER_GAME_START'))html=html.replace(/\/\/ BLITZWOLFER_GAME_START[\s\S]*?\/\/ BLITZWOLFER_GAME_END/,()=>game);else html=html.replace('function framePlayer(){',()=>game+'\nfunction framePlayer(){');fs.writeFileSync(file,html);console.log('Embedded Blitzwolfer claw rush and sonic howl.');
