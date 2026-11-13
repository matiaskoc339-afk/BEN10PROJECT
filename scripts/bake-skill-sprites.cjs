// V33 uses newly drawn sheets, not deformation of native character textures.
const path=require('node:path'),{execFileSync}=require('node:child_process');
execFileSync('python3',[path.join(__dirname,'compile-drawn-skills.py')],{stdio:'inherit'});
require('./embed-evolution.cjs');
