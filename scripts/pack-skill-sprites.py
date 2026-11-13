"""Pack transparent margins without changing any visible sprite pixel.
Requires Pillow. Every cell keeps a common body anchor, including jumps/whips.
"""
from pathlib import Path
from PIL import Image, ImageChops
import hashlib,json,math,os

root=Path(__file__).resolve().parents[1]/'assets'/'skills'
book=json.loads((root/'catalog.json').read_text())
before=after=0
for spec in book:
 for skill in spec['skills']:
  if os.environ.get('SKILL_FORM') and spec['id']!=os.environ['SKILL_FORM']:continue
  file=root/(spec['id']+'-'+skill['id']+'.png');image=Image.open(file).convert('RGBA')
  cw,ch=image.width//9,image.height//8
  base=(704,320,352,280) if spec['id']=='wildvine' else (384,288,192,248)
  if (cw,ch)!=base[:2] and skill.get('layout'):continue
  ax,ay=base[2:];tiles=[];bounds=[]
  for n in range(72):
   tile=image.crop((n%9*cw,n//9*ch,n%9*cw+cw,n//9*ch+ch));bbox=tile.getchannel('A').getbbox()
   assert bbox,(file,n,'empty frame');assert min(bbox[0],bbox[1],cw-bbox[2],ch-bbox[3])>=2,(file,n,'clipped source')
   tiles.append(tile);bounds.append(bbox)
  left=max(0,min(b[0] for b in bounds)-8);top=max(0,min(b[1] for b in bounds)-8)
  right=min(cw,max(b[2] for b in bounds)+8);bottom=min(ch,max(b[3] for b in bounds)+8)
  width=math.ceil((right-left)/8)*8;height=math.ceil((bottom-top)/8)*8
  packed=Image.new('RGBA',(width*9,height*8))
  for n,tile in enumerate(tiles):
   crop=tile.crop((left,top,right,bottom));packed.paste(crop,(n%9*width,n//9*height))
   rebuilt=packed.crop((n%9*width,n//9*height,n%9*width+right-left,n//9*height+bottom-top))
   assert ImageChops.difference(crop,rebuilt).getbbox() is None,(file,n,'pixel changed')
  before+=file.stat().st_size;packed.save(file,optimize=True,compress_level=9);after+=file.stat().st_size
  skill['layout']={'cellWidth':width,'cellHeight':height,'anchorX':ax-left,'anchorY':ay-top,'bodyHeight':160}
  assert all(tiles[d*18].tobytes()==tiles[d*18+17].tobytes() for d in range(4)),(file,'guard return changed')
 print(spec['name']+': lossless atlas packing complete')
(root/'catalog.json').write_text(json.dumps(book,ensure_ascii=False,indent=2)+'\n')
manifest=[]
for spec in book:
 for skill in spec['skills']:
  file=root/(spec['id']+'-'+skill['id']+'.png');im=Image.open(file)
  manifest.append({'form':spec['id'],'skill':skill['id'],'motion':skill['motion'],'file':file.name,'frames':72,'width':im.width,'height':im.height,'layout':skill['layout'],'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'losslessPixels':True})
(root/'atlas-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Packed sprite PNGs: {before:,} → {after:,} bytes; original pixels preserved.')
