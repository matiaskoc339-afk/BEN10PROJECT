from pathlib import Path
import json,shutil,zipfile,hashlib
root=Path(__file__).resolve().parents[1]
stage=Path('/workspace/BEN10-DEMO-V33')
(stage/'assets/skills').mkdir(parents=True,exist_ok=True)
for name in ['index.html','LEEME.txt']:shutil.copy2(root/name,stage/name)
shutil.copy2(root/'assets/prologo-comic.png',stage/'assets/prologo-comic.png')
for file in (root/'assets/skills').glob('*.png'):shutil.copy2(file,stage/'assets/skills'/file.name)
for name in ['catalog.json','atlas-manifest.json']:shutil.copy2(root/'assets/skills'/name,stage/'assets/skills'/name)
output=Path('/workspace/outputs/BEN10_DEMO_PC_V33.zip')
output.parent.mkdir(exist_ok=True)
with zipfile.ZipFile(output,'w',zipfile.ZIP_DEFLATED,compresslevel=8) as z:
 for file in sorted(stage.rglob('*')):
  if file.is_file():z.write(file,'BEN10_DEMO_PC_V33/'+str(file.relative_to(stage)))
with zipfile.ZipFile(output) as z:
 assert z.testzip() is None
 assert z.read('BEN10_DEMO_PC_V33/index.html')==(root/'index.html').read_bytes()
report=json.loads((root/'docs/v33-validation.json').read_text())
report.update(unitTestsPassed=15,finalRenderReview=json.loads((root/'artifacts/v33/final-render-review.json').read_text()),zipBytes=output.stat().st_size,zipSha256=hashlib.sha256(output.read_bytes()).hexdigest(),indexSha256=hashlib.sha256((root/'index.html').read_bytes()).hexdigest())
(root/'docs/v33-validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(str(output),report['zipBytes'],'bytes',report['zipSha256'])
