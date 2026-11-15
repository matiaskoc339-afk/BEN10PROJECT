"""Validate authored poses, registration, timed events and unchanged V43 game."""
from pathlib import Path
from PIL import Image
import json,hashlib,numpy as np
ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'zombozo'
d=json.loads((ART/'data/manifest.json').read_text())
assert d['spriteOnly'] and not d['gameplayIntegrated']
assert (d['bossClips'],d['bossPoses'],d['newPropDrawings'])==(30,180,72)
report={'phases':3,'bossClips':30,'bossPoses':180,'newPropDrawings':72,'sheets':[]}
measurements={};solid_heights={}
for sheet in d['sheets']+d['props']:
    atlas=Image.open(ART/sheet['atlas']).convert('RGBA');w,h=sheet['cellWidth'],sheet['cellHeight']
    assert atlas.size==(w*6,h*6)
    assert hashlib.sha256((ART/sheet['source']).read_bytes()).hexdigest()==sheet['sourceSha256']
    assert json.loads((ART/sheet['atlas']).with_suffix('.json').read_text())==sheet
    source=np.array(Image.open(ART/sheet['source']).convert('RGBA'))
    assert (source[:,:,3]<8).mean()>.18
    clips=list(sheet['animations'].values()) if 'animations' in sheet else sheet['clips']
    margin=999;count=0
    for c in clips:
        n=1 if c.get('static') else 6
        assert len(c['frames'])==len(c['durations'])==n and min(c['durations'])>0
        assert all(0<=f<n for f in [*c['eventFrames'].values(),*c['contactFrames']])
        if 'visibility' in c:assert len(c['visibility'])==n and all(0<=v<=1 for v in c['visibility'])
        hashes=[];bounds=[];solid=[]
        for f in c['frames']:
            assert f['x']%w==0 and f['y']%h==0 and (f['width'],f['height'])==(w,h)
            assert 0<=f['anchorX']<w and 0<=f['anchorY']<h
            im=atlas.crop((f['x'],f['y'],f['x']+w,f['y']+h));p=np.array(im);ys,xs=np.nonzero(p[:,:,3]>16)
            assert xs.size>30,(sheet['id'],c['id'],'empty frame')
            edge=int(min(xs.min(),ys.min(),w-1-xs.max(),h-1-ys.max()))
            assert edge>=8,(sheet['id'],c['id'],'atlas clips drawing')
            margin=min(margin,edge);hashes.append(hashlib.sha256(im.tobytes()).hexdigest())
            bounds.append((int(xs.max()-xs.min()+1),int(ys.max()-ys.min()+1)))
            density=(p[:,:,3]>16).sum(axis=1);rows=np.flatnonzero(density>density.max()*.4)
            solid.append(int(rows.max()-rows.min()+1))
        assert len(set(hashes))==n,(sheet['id'],c['id'],'duplicated drawings')
        measurements[c['id']]=bounds;solid_heights[c['id']]=solid;count+=n
    assert count==36
    report['sheets'].append({'id':sheet['id'],'poses':count,'minimumMargin':margin})
first,second,third=d['phases'];a,b=second['animations'],third['animations']
assert not first['rules']['damageable'] and first['rules']['nextPhaseCondition']=='helpers-defeated'
assert a['vanish']['visibility'][-1]==0 and a['reappear']['visibility'][0]==0 and a['reappear']['visibility'][-1]==1
assert a['ground-bomb']['eventFrames']['releaseBomb']==4
assert [b['bomb-volley']['eventFrames'][k] for k in ['releaseBomb','releaseSecondBomb','releaseThirdBomb']]==[1,3,5]
assert b['box-shield']['eventFrames']['releaseBomb']==3 and max(b['box-shield']['visibility'])<.6
assert b['defeat']['eventFrames']['ghostfreakDNA']==5
fall=max(h for _,h in measurements['defeat'][-2:]);standing=float(np.median([h for _,h in measurements['rage-idle']]))
assert fall<standing*.6,'Death must end on the floor'
report['proneHeightRatio']=round(fall/standing,3)
# Wood collapses into a low pile; wisps above it are part of the authored FX.
assert solid_heights['box-break'][-1]<solid_heights['box-idle'][0]*.65
assert max(w*h for w,h in measurements['box-explosion'])>measurements['box-explosion'][0][0]*measurements['box-explosion'][0][1]*2
assert 'sink' in third['rules']['inheritsPhase2Animations']
expected=json.loads((ROOT/'docs/v43-validation.json').read_text())['indexSha256']
if json.loads((ROOT/'package.json').read_text())['version']=='0.43.0':
    assert hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()==expected
report.update({'referenceGameVersion':'V43','referenceIndexSha256':expected,'passed':True})
out=ROOT/'artifacts/zombozo';out.mkdir(parents=True,exist_ok=True)
(out/'asset-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print('Zombozo: 180 distinct boss poses + 72 prop drawings; alpha, margins, events, prone fall and original source integrity passed.')
