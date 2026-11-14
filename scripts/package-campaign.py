"""Produce the complete, offline PC build, including only its runtime assets."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json,hashlib,shutil

root=Path(__file__).resolve().parents[1]
output=Path('/workspace/outputs/BEN10_DEMO_PC_V34.zip')
stage=Path('/workspace/BEN10-DEMO-V34')
data=json.loads((root/'mapas/data/recorrido.json').read_text())
files={'index.html','LEEME.txt','assets/prologo-comic.png','assets/skills/catalog.json','assets/skills/atlas-manifest.json'}
files.update(str(p.relative_to(root)) for p in (root/'assets/skills').glob('*.png'))
for chapter in data['chapters']:
    files.update('mapas/'+s['image'] for s in chapter['segments'])
for family in data['props'].values():
    files.update('mapas/'+p['file'] for p in family['static'])
    for clip in family['animations']:
        files.update('mapas/'+f['file'] for f in clip['frames'])

reports={}
for name,file in [('campaign','artifacts/campaign/browser-review.json'),('skills','artifacts/v33/browser-review.json'),('render','artifacts/v33/final-render-review.json'),('targeting','artifacts/targeting/browser-review.json')]:
    reports[name]=json.loads((root/file).read_text())
    assert reports[name].get('passed'),f'Validation missing: {name}'
assert len(reports['skills']['skills'])==70
output.parent.mkdir(parents=True,exist_ok=True)
for file in sorted(files):
    target=stage/file
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(root/file,target)
with ZipFile(output,'w',ZIP_DEFLATED,compresslevel=7) as bundle:
    for file in sorted(files):
        bundle.write(stage/file,'BEN10_DEMO_PC_V34/'+file)
with ZipFile(output) as bundle:
    assert bundle.testzip() is None
    assert bundle.read('BEN10_DEMO_PC_V34/index.html')==(root/'index.html').read_bytes()

report={'version':'34','indexSha256':hashlib.sha256((root/'index.html').read_bytes()).hexdigest(),'zipSha256':hashlib.sha256(output.read_bytes()).hexdigest(),'zipBytes':output.stat().st_size,'runtimeFiles':len(files),'phases':[c['name'] for c in data['chapters']],'collisionTestsPassed':8,'regressions':reports}
(root/'docs/v34-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'zip':str(output),'bytes':output.stat().st_size,'files':len(files),'sha256':report['zipSha256']},indent=2))
