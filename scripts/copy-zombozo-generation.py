from pathlib import Path
from PIL import Image
import json,sys,base64,hashlib,shutil
root=Path(__file__).resolve().parents[1];out=root/'zombozo';fp=json.loads(sys.argv[1]);rel=sys.argv[2]
found=[]
for p in Path('/workspace/generated_images').glob('*.png'):
 if abs(p.stat().st_size*4/3-fp['n'])>5:continue
 b=base64.b64encode(p.read_bytes()).decode('ascii')
 if len(b)==fp['n'] and b.startswith(fp['first']) and b.endswith(fp['last']):found.append(p)
assert found,'Generated original not located'
source=found[-1];dest=out/rel;assert dest.resolve().is_relative_to(out.resolve());dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(source,dest)
record={'source':str(source),'destination':rel,'size':Image.open(dest).size,'sha256':hashlib.sha256(dest.read_bytes()).hexdigest()}
log=out/'data/generated-log.json';rows=json.loads(log.read_text()) if log.exists() else [];rows.append(record);log.write_text(json.dumps(rows,indent=2)+'\n');print(json.dumps(record))
