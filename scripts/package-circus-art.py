"""Package the standalone artwork library, not a new game build."""
from pathlib import Path
import zipfile,json,hashlib
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'fase2-circo';OUT=Path('/workspace/outputs');OUT.mkdir(exist_ok=True)
required=['index.html','viewer.css','viewer.js','sprites.js','muestra.html','muestra.js','LEEME.md','data/manifest.json','data/validation.json','data/browser-validation.json']
for rel in required:assert (ART/rel).is_file(),rel
report=json.loads((ART/'data/validation.json').read_text());assert report['checkedCharacterFrames']==216
files=[p for p in sorted(ART.rglob('*')) if p.is_file() and not p.is_relative_to(ART/'assets/original')]
target=OUT/'BEN10_Fase2_Zombozo_Arte.zip'
with zipfile.ZipFile(target,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for p in files:z.write(p,'BEN10_Fase2_Zombozo_Arte/'+str(p.relative_to(ART)))
with zipfile.ZipFile(target) as z:
 assert z.testzip() is None
 for p in files:assert z.read('BEN10_Fase2_Zombozo_Arte/'+str(p.relative_to(ART)))==p.read_bytes()
result={'zip':target.name,'bytes':target.stat().st_size,'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'files':len(files),'characterPoses':216,'mainRoutes':3,'artOnly':True,'gameIndexSha256':hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()}
(ROOT/'docs/fase2-circo-entrega.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print(json.dumps(result,ensure_ascii=False,indent=2))
