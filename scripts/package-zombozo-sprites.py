"""Package the standalone Zombozo art viewer, original drawings and timing data."""
from pathlib import Path
import json,zipfile,hashlib,argparse
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'zombozo'
p=argparse.ArgumentParser();p.add_argument('--output',type=Path,default=Path('/workspace/outputs/BEN10_Zombozo_Sprites.zip'));a=p.parse_args()
d=json.loads((ART/'data/manifest.json').read_text());assert d['bossPoses']==180 and not d['gameplayIntegrated']
checks={name:json.loads((ROOT/f'artifacts/zombozo/{name}.json').read_text()) for name in ['asset-validation','browser-review']}
assert all(r['passed'] for r in checks.values())
(ART/'data/validation.json').write_text(json.dumps(checks,ensure_ascii=False,indent=2)+'\n')
a.output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(a.output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as z:
 for f in sorted(ART.rglob('*')):
  if f.is_file():z.write(f,f.relative_to(ROOT))
with zipfile.ZipFile(a.output) as z:
 assert z.testzip() is None
 for f in ART.rglob('*'):
  if f.is_file():assert z.read(str(f.relative_to(ROOT)))==f.read_bytes()
report={'file':str(a.output),'bytes':a.output.stat().st_size,'sha256':hashlib.sha256(a.output.read_bytes()).hexdigest(),'phases':3,'bossClips':30,'bossPoses':180,'newPropDrawings':72,'standaloneArtViewer':True,'gameplayIntegrated':False,'validation':checks}
(ROOT/'docs/zombozo-art-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='validation'},indent=2))
