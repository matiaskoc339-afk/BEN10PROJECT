const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8'),file=path.join(root,'index.html');let html=read('index.html');
function replaceBetween(start,end,value){const a=html.indexOf(start),b=html.indexOf(end,a);if(a<0||b<0)throw Error('Missing V32 embedding markers: '+start);html=html.slice(0,a)+value+'\n'+html.slice(b)}
replaceBetween('// EVOLUTION_PANEL_V32_START','// TEMP: administrador','// EVOLUTION_PANEL_V32_START\nconst SKILL_BOOK='+JSON.stringify(JSON.parse(read('assets/skills/catalog.json')))+';\n'+read('systems/evolution-v32.js').replace('// UI:',read('systems/skill-choreography-v33.js')+'\n'+read('systems/combat-targeting.js')+'\n'+read('systems/skill-effects-v33.js')+'\n// UI:'));
replaceBetween('/* Desktop DNA archive.','/* ADMIN V13',read('systems/evolution-panel.css')+'\n'+read('systems/combat-targeting.css'));
replaceBetween('<div id="evolutionLayer"','<!-- ADMINISTRADOR DE PRUEBAS',read('systems/evolution-panel.html'));
const begin='<!-- SKILL_ART_START -->',end='<!-- SKILL_ART_END -->',a=html.indexOf(begin),b=html.indexOf(end,a);if(a<0||b<0)throw Error('Missing sprite renderer markers');html=html.slice(0,a)+begin+'\n<script>'+read('systems/skill-sprites.js')+'</script>\n'+html.slice(b);
html=html.replace('(d,damage)=>damageDummy(d,damage,false,{slime:true,port:1})','(d,damage)=>damageDummy(d,damage,false,{slime:true,port:1,rememberTarget:false})');
fs.writeFileSync(file,html);console.log('Embedded V33 sparse trees, drawn sprites and per-technique choreography.');
