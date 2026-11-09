const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),file=path.join(root,'index.html');
const source=fs.readFileSync(path.join(root,'systems/fire-projectiles.js'),'utf8');
const block='<!-- FIRE_PROJECTILES_START -->\n<script>\n'+source+'\n</script>\n<!-- FIRE_PROJECTILES_END -->';
let html=fs.readFileSync(file,'utf8');
if(html.includes('<!-- FIRE_PROJECTILES_START -->'))html=html.replace(/<!-- FIRE_PROJECTILES_START -->[\s\S]*?<!-- FIRE_PROJECTILES_END -->/,()=>block);
else html=html.replace('<!-- PLAYER_STATS_END -->','<!-- PLAYER_STATS_END -->\n'+block);
fs.writeFileSync(file,html);
console.log('Embedded fire projectile model.');
