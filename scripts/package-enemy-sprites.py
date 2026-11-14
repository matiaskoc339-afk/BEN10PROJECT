"""Bundle the standalone art workshop, without the 98 MB combat demo."""
from pathlib import Path
import argparse,hashlib,json,zipfile

ROOT=Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser()
parser.add_argument('--output',type=Path,default=Path('/workspace/outputs/BEN10_Caballeros_Eternos_Sprites.zip'))
args=parser.parse_args()
data=json.loads((ROOT/'enemigos/data/manifest.json').read_text())
assert not data['missing'] and len(data['units'])==17
args.output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(args.output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
    for file in sorted((ROOT/'enemigos').rglob('*')):
        if file.is_file():z.write(file,file.relative_to(ROOT))
with zipfile.ZipFile(args.output) as z:
    assert z.testzip() is None
    names=set(z.namelist())
    assert {'enemigos/index.html','enemigos/catalogo.html','enemigos/data/catalog.js'}.issubset(names)
    for unit in data['units']:
        for key in ['atlas','poster','reference','source']:assert 'enemigos/'+unit[key] in names
    assert all(n.startswith('enemigos/') for n in names)
print(json.dumps({'file':str(args.output),'bytes':args.output.stat().st_size,'sha256':hashlib.sha256(args.output.read_bytes()).hexdigest(),'variants':17,'poses':612},indent=2))
