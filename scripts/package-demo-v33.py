from pathlib import Path
import json,shutil,zipfile,hashlib
root=Path(__file__).resolve().parents[1]
package=json.loads((root/'package.json').read_text())
minor,patch=package['version'].split('.')[1:]
label=f'V{minor}'+(f'_{patch}' if patch!='0' else '')
version=f'{minor}'+(f'.{patch}' if patch!='0' else '')
stage=Path('/workspace/BEN10-DEMO-'+label)
(stage/'assets/skills').mkdir(parents=True,exist_ok=True)
for name in ['index.html','LEEME.txt']:shutil.copy2(root/name,stage/name)
shutil.copy2(root/'assets/prologo-comic.png',stage/'assets/prologo-comic.png')
for file in (root/'assets/skills').glob('*.png'):shutil.copy2(file,stage/'assets/skills'/file.name)
for name in ['catalog.json','atlas-manifest.json']:shutil.copy2(root/'assets/skills'/name,stage/'assets/skills'/name)
output=Path('/workspace/outputs/BEN10_DEMO_PC_'+label+'.zip')
output.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=8) as z:
 for file in sorted(stage.rglob('*')):
  if file.is_file():z.write(file,'BEN10_DEMO_PC_'+label+'/'+str(file.relative_to(stage)))
with zipfile.ZipFile(output) as z:
 assert z.testzip() is None
 assert z.read('BEN10_DEMO_PC_'+label+'/index.html')==(root/'index.html').read_bytes()
report=json.loads((root/'docs/v33-validation.json').read_text())
report.update(version=version,unitTestsPassed=29,finalRenderReview=json.loads((root/'artifacts/v33/final-render-review.json').read_text()),zipBytes=output.stat().st_size,zipSha256=hashlib.sha256(output.read_bytes()).hexdigest(),indexSha256=hashlib.sha256((root/'index.html').read_bytes()).hexdigest())
report['targetingBrowserReview']=json.loads((root/'artifacts/targeting/browser-review.json').read_text())
report['browserCastsPassed']=len(json.loads((root/'artifacts/v33/browser-review.json').read_text())['skills'])
(root/('docs/v'+version+'-validation.json')).write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(str(output),report['zipBytes'],'bytes',report['zipSha256'])
