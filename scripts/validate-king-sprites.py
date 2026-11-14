"""Check authored boss silhouettes, anchors, events and phase transitions."""
from pathlib import Path
from PIL import Image
import json,hashlib,numpy as np

ROOT=Path(__file__).resolve().parents[1];ART=ROOT/'jefe-final'
data=json.loads((ART/'data/manifest.json').read_text())
assert data['spriteOnly'] and len(data['phases'])==3
assert data['totalClips']==19 and data['totalPoses']==114
report={'phases':3,'clips':19,'poses':114,'units':[]}
for unit in data['phases']:
    atlas=Image.open(ART/unit['atlas']).convert('RGBA');w=unit['cellWidth'];h=unit['cellHeight']
    assert atlas.size==(w*6,h*unit['rows'])
    assert hashlib.sha256((ART/unit['source']).read_bytes()).hexdigest()==unit['sourceSha256']
    assert json.loads((ART/unit['atlas']).with_suffix('.json').read_text())==unit
    assert unit['bodyHeight']==132 and unit['nativeBodyHeight']==176
    margin=10000;heights={};body_heights={};crystal={}
    for row,(key,clip) in enumerate(unit['animations'].items()):
        assert len(clip['frames'])==len(clip['durations'])==6 and min(clip['durations'])>0
        assert all(0<=f<6 for f in [*clip['contactFrames'],*clip['eventFrames'].values()])
        hashes=[];heights[key]=[];body_heights[key]=[];crystal[key]=[]
        for col,f in enumerate(clip['frames']):
            assert (f['x'],f['y'],f['width'],f['height'])==(col*w,row*h,w,h)
            assert (f['anchorX'],f['anchorY'])==(unit['anchorX'],unit['anchorY'])
            im=atlas.crop((f['x'],f['y'],f['x']+w,f['y']+h));p=np.array(im);ys,xs=np.nonzero(p[:,:,3]>16)
            assert xs.size>900, (unit['id'],key,col,'empty body')
            edge=int(min(xs.min(),ys.min(),w-1-xs.max(),h-1-ys.max()));assert edge>=8,(unit['id'],key,col,'clipping')
            margin=min(margin,edge);hashes.append(hashlib.sha256(im.tobytes()).hexdigest());heights[key].append(int(ys.max()-ys.min()+1))
            # The separate DNA reward above the fallen king is taller than his
            # prone body. Measure the broad body, rather than that narrow prop.
            density=(p[:,:,3]>16).sum(axis=1);body_rows=np.flatnonzero(density>density.max()*.35)
            body_heights[key].append(int(body_rows.max()-body_rows.min()+1))
            r,g,b,a=[p[:,:,n].astype(float) for n in range(4)];mint=(a>160)&(g>r*1.2)&(b>r*1.15)&(g>90)
            crystal[key].append(int(mint.sum()))
        assert len(set(hashes))==6,(unit['id'],key,'repeated poses')
    if unit['id']=='fase-2':
        assert crystal['shatter'][-1]<crystal['idle'][0]*.30, 'Shattering must expose normal armor'
        report['crystalArmorRemoved']=True
    if unit['id']=='fase-3':
        assert max(body_heights['defeat'][-2:])<np.median(body_heights['idle'])*.62, 'King must end fallen'
        assert unit['animations']['defeat']['eventFrames']=={'helpersDie':4,'diamondheadDNA':5}
        assert not unit['rules']['defenseBar'] and unit['rules']['helpersDieOnBossDefeat']
        assert unit['animations']['retreat']['nativeFacing']=='left'
        report['royalFallProneRatio']=round(max(body_heights['defeat'][-2:])/float(np.median(body_heights['idle'])),3)
    report['units'].append({'id':unit['id'],'poses':len(unit['animations'])*6,'minimumMargin':margin})
first,second,third=data['phases']
assert first['rules']['fireBreaksDefenseFaster'] and first['rules']['allAliensCanBreakDefense']
assert second['rules']['defenseLowerThanPhase1'] and second['rules']['canDodge']
report['passed']=True
out=ROOT/'artifacts/rey-eterno';out.mkdir(parents=True,exist_ok=True);(out/'asset-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print('Rey Eterno: 3 phases, 19 clips, 114 distinct padded poses, armor removal and royal fall verified.')
