from pathlib import Path
from PIL import Image
import json,re,hashlib,numpy as np
r=Path(__file__).resolve().parents[1];book=json.loads((r/'assets/skills/catalog.json').read_text());manifest=json.loads((r/'assets/skills/atlas-manifest.json').read_text())
assert len(manifest)==70
poses=0
for spec in book:
 for skill in spec['skills']:
  im=Image.open(r/'assets/skills'/f'{spec["id"]}-{skill["id"]}.png').convert('RGBA');box=skill['layout'];w,h=box['cellWidth'],box['cellHeight'];assert im.size==(w*6,h*3)
  for i in range(18):
   a=np.array(im.crop((i%6*w,i//6*h,(i%6+1)*w,(i//6+1)*h)))[:,:,3]
   assert np.count_nonzero(a>32)>80,(spec['id'],skill['id'],i,'empty')
   assert not np.any(a[:4]>32) and not np.any(a[-4:]>32) and not np.any(a[:,:4]>32) and not np.any(a[:,-4:]>32),(spec['id'],skill['id'],i,'clipping')
   poses+=1
html=(r/'index.html').read_text();inline=[hashlib.sha256(x.encode()).hexdigest() for x in re.findall(r'data:image/[^;]+;base64,[A-Za-z0-9+/=]+',html)]
assert inline==json.loads((r/'docs/v33-original-sprites.json').read_text())
print(f'Validated {poses} drawn poses in 70 atlases: visible, padded, exact dimensions. All {len(inline)} original embedded images are unchanged.')
