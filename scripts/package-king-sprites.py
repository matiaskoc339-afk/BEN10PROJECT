"""Package the portable boss art viewer and its original source sheets."""
from pathlib import Path
import json,zipfile,hashlib,argparse

ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'jefe-final'
parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=Path('/workspace/outputs/BEN10_Rey_Eterno_Sprites.zip'));args=parser.parse_args()
data=json.loads((ART/'data/manifest.json').read_text());assert data['totalPoses']==114
baseline=json.loads((ROOT/'docs/v36-validation.json').read_text())
assert hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()==baseline['indexSha256'], 'Combat demo changed during sprite work'
checks={name:json.loads((ROOT/f'artifacts/rey-eterno/{name}.json').read_text()) for name in ['asset-validation','browser-review']}
assert all(r.get('passed') for r in checks.values())
args.output.parent.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(args.output,'w',zipfile.ZIP_DEFLATED,compresslevel=6) as archive:
    for p in sorted(ART.rglob('*')):
        if p.is_file():archive.write(p,p.relative_to(ROOT))
with zipfile.ZipFile(args.output) as archive:
    assert archive.testzip() is None
    for phase in data['phases']:
        for key in ['atlas','poster','source']:
            file='jefe-final/'+phase[key];assert archive.read(file)==(ROOT/file).read_bytes()
report={'file':str(args.output),'bytes':args.output.stat().st_size,'sha256':hashlib.sha256(args.output.read_bytes()).hexdigest(),'phases':3,'clips':19,'poses':114,'validation':checks,'combatDemoUnchanged':True}
(ROOT/'docs/rey-eterno-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:v for k,v in report.items() if k!='validation'},indent=2))
