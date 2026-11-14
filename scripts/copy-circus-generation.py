"""Copy a generated original by exact byte fingerprint, independent of concurrent jobs."""
from pathlib import Path
import sys,json,base64,shutil,hashlib
from PIL import Image
root=Path(__file__).resolve().parents[1]
match=json.loads(sys.argv[1]);relative=sys.argv[2]
found=[]
for p in Path('/workspace/generated_images').glob('*.png'):
    if abs(p.stat().st_size*4/3-match['n'])>5:continue
    b=base64.b64encode(p.read_bytes()).decode('ascii')
    if len(b)==match['n'] and b.startswith(match['first']) and b.endswith(match['last']):found.append(p)
if not found:raise ValueError('Generated image not located')
source=found[-1];dest=root/'fase2-circo'/relative
if not dest.resolve().is_relative_to((root/'fase2-circo').resolve()):raise ValueError('Invalid destination')
dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest)
record={'source':str(source),'destination':relative,'size':Image.open(dest).size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
log=root/'fase2-circo/data/generated-log.json'
rows=json.loads(log.read_text()) if log.exists() else []
rows.append(record);log.write_text(json.dumps(rows,indent=2)+'\n')
print(json.dumps(record))
