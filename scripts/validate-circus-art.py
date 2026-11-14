"""Validate drawn atlas geometry, sequence coverage and panorama exports."""
from pathlib import Path
from PIL import Image
import json,hashlib
import numpy as np
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'fase2-circo';D=json.loads((OUT/'data/manifest.json').read_text())
assert D['artOnly'] and not D['gameplayIntegrated'] and not D['bossIncluded']
assert len(D['units'])==6 and D['totalCharacterPoses']==216
assert {(u['role'],u['tier']) for u in D['units']}=={(r,t) for r in ['fuerte','rapido','tramposo'] for t in ['normal','loco']}
report={'variants':6,'characterPoses':216,'characterClips':36,'checkedCharacterFrames':0,'routes':[],'gameIndexUnchanged':False}
for u in D['units']:
 source=OUT/u['source'];assert hashlib.sha256(source.read_bytes()).hexdigest()==u['sourceSha256']
 im=Image.open(OUT/u['atlas']).convert('RGBA');heights={}
 assert (np.array(Image.open(source).convert('RGBA'))[:,:,3]<8).mean()>.15
 for key in D['animationKeys']:
  c=u['animations'][key];assert len(c['frames'])==len(c['durations'])==6
  assert c['loop']==(key in ['idle','walk']);assert c['contactFrames']==([3] if key in ['attack','secondary'] else [])
  assert all(40<=ms<=500 for ms in c['durations'])
  hashes=set();anchors=set();sizes=[]
  for f in c['frames']:
   tile=im.crop((f['x'],f['y'],f['x']+f['width'],f['y']+f['height']));a=np.array(tile)[:,:,3];yy,xx=np.nonzero(a>8)
   assert xx.min()>=6 and yy.min()>=6 and xx.max()<tile.width-6 and yy.max()<tile.height-6,(u['id'],key,'cropped')
   assert len(xx)>500;hashes.add(hashlib.sha256(tile.tobytes()).hexdigest());anchors.add((f['anchorX'],f['anchorY']));sizes.append(int(yy.max()-yy.min()+1));report['checkedCharacterFrames']+=1
  assert len(hashes)==6,(u['id'],key,'duplicate frames');assert len(anchors)==1
  heights[key]=sizes
 assert heights['defeat'][-1]<np.median(heights['idle'])*.65,(u['id'],'must finish prone')
for group in ['props','fx']:
 for c in D[group]['clips']:
  im=Image.open(OUT/c['atlas']).convert('RGBA');a=c['animation'];assert len(a['frames'])==len(a['durations'])
  for f in a['frames']:
   tile=np.array(im.crop((f['x'],f['y'],f['x']+256,f['y']+256)))[:,:,3];ys,xs=np.nonzero(tile>100);assert len(xs)>50
   assert xs.min()>=5 and ys.min()>=5 and xs.max()<251 and ys.max()<251,(c['id'],'cropped')
assert len(D['routes'])==3 and len(D['connections'])==2
for r in D['routes']:
 assert len(r['tiles'])==3 and r['width']>=2600
 assert 220<=r['floorTop']<r['floorBottom']<=360
 assert r['tiles'][0]['x']==0 and abs(r['tiles'][-1]['x']+r['tiles'][-1]['width']-r['width'])<.01
 for prev,t,seam in zip(r['tiles'],r['tiles'][1:],r['seams']):
  assert t['x']<seam<prev['x']+prev['width'];assert t['overlap']>0
 for t in r['tiles']:
  p=OUT/t['file'];im=Image.open(p);assert im.width/im.height==t['width']/360
  assert hashlib.sha256(p.read_bytes()).hexdigest()==t['sha256']
 if r['exitMirror']:assert r['width']-150<r['exitMirror']['x']<r['width']-50
 report['routes'].append({'id':r['id'],'logicalWidth':r['width'],'uniqueTiles':3,'seams':r['seams']})
for p in json.loads((OUT/'data/panoramas.json').read_text()):
 im=Image.open(OUT/p['full']).convert('RGBA');wall=Image.open(OUT/p['wall']).convert('RGBA');floor=Image.open(OUT/p['floor']).convert('RGBA');rebuilt=Image.new('RGBA',im.size);rebuilt.paste(wall,(0,0));rebuilt.paste(floor,(0,wall.height));assert im.tobytes()==rebuilt.tobytes()
 assert im.size==(p['width'],720) and np.array(im)[:,:,3].min()==255,'Panorama has empty border'
prior=json.loads((ROOT/'docs/v42-validation.json').read_text());assert hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()==prior['indexSha256'];report['gameIndexUnchanged']=True
assert D['bombTypes'][1]['futureRules']['nonLethal'] and D['bombTypes'][2]['futureRules']['playerDamage']==0
(OUT/'data/validation.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n');print(json.dumps(report,ensure_ascii=False,indent=2))
