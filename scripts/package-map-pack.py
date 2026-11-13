"""Package the PC map walkthrough with its registered art and complete panoramas."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from PIL import Image
import json

root=Path(__file__).resolve().parents[1]
source=root/'mapas'
out=root/'artifacts'/'mapas'
out.mkdir(parents=True,exist_ok=True)

# Browser screenshots are encoded losslessly again for a smaller offline package.
for path in (source/'panoramas').glob('*.png'):
    with Image.open(path) as image:
        image.save(path,optimize=True)

target=out/'BEN10_Mapas_3_Fases_PC.zip'
with ZipFile(target,'w',ZIP_DEFLATED,compresslevel=7) as bundle:
    for path in sorted(source.rglob('*')):
        if path.is_file():
            bundle.write(path,path.relative_to(root))

data=json.loads((source/'data'/'recorrido.json').read_text())
print(json.dumps({'archive':str(target),'bytes':target.stat().st_size,'phases':[{'name':c['name'],'width':c['end']-c['x'],'landmarks':c['count'],'longArtSections':len(c['segments'])} for c in data['chapters']],'puzzle':data['puzzles'][0]['name'],'combat':data['combat']},ensure_ascii=False,indent=2))
