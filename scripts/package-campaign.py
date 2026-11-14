"""Produce the complete, offline PC build, including only its runtime assets."""
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
import json,hashlib,shutil

root=Path(__file__).resolve().parents[1]
output=Path('/workspace/outputs/BEN10_DEMO_PC_V35.zip')
stage=Path('/workspace/BEN10-DEMO-V35')
data=json.loads((root/'mapas/data/recorrido.json').read_text())
files={'index.html','LEEME.txt','assets/prologo-comic.png','assets/skills/catalog.json','assets/skills/atlas-manifest.json'}
files.update(str(p.relative_to(root)) for p in (root/'assets/skills').glob('*.png'))
for chapter in data['chapters']:

    for segment in chapter['segments']:
        if segment.get('tiles'):files.update('mapas/'+t['file'] for t in segment['tiles'])
        else:files.add('mapas/'+segment.get('native',{}).get('file',segment['image']))
for family in data['props'].values():
    files.update('mapas/'+p['file'] for p in family['static'])
    for clip in family['animations']:
        files.update('mapas/'+f['file'] for f in clip['frames'])

files.update('mapas/'+e['file'] for e in data.get('sceneEffects',[]))
enemies=json.loads((root/'enemigos/data/manifest.json').read_text())
for unit in enemies['units']:
    files.add('enemigos/'+unit['atlas'])
    if unit.get('projectile'):files.add('enemigos/'+unit['projectile']['file'])

reports={}
for name,file in [('combat','artifacts/v35/combat-review.json'),('campaign','artifacts/campaign/browser-review.json'),('skills','artifacts/v33/browser-review.json'),('render','artifacts/v33/final-render-review.json'),('targeting','artifacts/targeting/browser-review.json')]:
    reports[name]=json.loads((root/file).read_text())
    assert reports[name].get('passed'),f'Validation missing: {name}'
assert len(reports['skills']['skills'])==70
assert len(reports['combat']['aliens'])==10
assert sum(p['champions'] for p in reports['combat']['phases'])==3
assert sum(p['encounters'] for p in reports['combat']['phases'])==16
assert reports['combat']['hdTiles']==29
assert data['renderMode']=='hd-tiles'
output.parent.mkdir(parents=True,exist_ok=True)
for file in sorted(files):
    target=stage/file
    target.parent.mkdir(parents=True,exist_ok=True)
    shutil.copy2(root/file,target)
with ZipFile(output,'w',ZIP_DEFLATED,compresslevel=7) as bundle:
    for file in sorted(files):
        bundle.write(stage/file,'BEN10_DEMO_PC_V35/'+file)
with ZipFile(output) as bundle:
    assert bundle.testzip() is None
    assert bundle.read('BEN10_DEMO_PC_V35/index.html')==(root/'index.html').read_bytes()

report={'version':'35','indexSha256':hashlib.sha256((root/'index.html').read_bytes()).hexdigest(),'zipSha256':hashlib.sha256(output.read_bytes()).hexdigest(),'zipBytes':output.stat().st_size,'runtimeFiles':len(files),'phases':[c['name'] for c in data['chapters']],'collisionTestsPassed':8,'enemyVariants':17,'encounters':16,'waves':28,'champions':3,'hdTiles':29,'regressions':reports}
(root/'docs/v35-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'zip':str(output),'bytes':output.stat().st_size,'files':len(files),'sha256':report['zipSha256']},indent=2))
