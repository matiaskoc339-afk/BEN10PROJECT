"""Validate the standalone art contract used by the V35 combat integration."""
from pathlib import Path
from PIL import Image
import json, hashlib, numpy as np

ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'enemigos'
data=json.loads((ART/'data/manifest.json').read_text())
assert data['spriteOnly'] and not data['finalBossIncluded'] and not data['missing']
assert len(data['units'])==17 and data['totalPoses']==612
roles={r['id'] for r in data['roles']}
assert len(roles)==5
soldiers=[u for u in data['units'] if u['kind']=='soldier']
minis=[u for u in data['units'] if u['kind']=='miniboss']
assert len(soldiers)==15 and len(minis)==2
assert {(u['role'],u['tier']) for u in soldiers}=={(r,t) for r in roles for t in ['recruit','elite','crystal']}
assert {u['tier'] for u in minis}=={'normal','crystal'}
assert all(u['role']=='champion' and u['bodyHeight']>max(v['bodyHeight'] for v in soldiers) for u in minis)
keys=['idle','walk','attack','secondary','hurt','defeat']
report={'variants':17,'clips':102,'poses':612,'units':[]}
for unit in data['units']:
    atlas=Image.open(ART/unit['atlas']).convert('RGBA')
    assert atlas.size==(unit['cellWidth']*6,unit['cellHeight']*6), unit['id']
    assert list(unit['animations'])==keys
    assert unit['directions']=={'right':{'flipX':False},'left':{'flipX':True}}
    assert 0<unit['anchorX']<unit['cellWidth'] and 0<unit['anchorY']<unit['cellHeight']
    assert hashlib.sha256((ART/unit['source']).read_bytes()).hexdigest()==unit['sourceSha256']
    assert json.loads((ART/unit['atlas']).with_suffix('.json').read_text())==unit
    heights={};unique={};minimum_margin=10000
    for row,key in enumerate(keys):
        clip=unit['animations'][key]
        assert len(clip['frames'])==len(clip['durations'])==6 and min(clip['durations'])>0
        assert clip['loop']==(key in ['idle','walk'])
        assert clip['contactFrames']==([3] if key in ['attack','secondary'] else [])
        hashes=[];heights[key]=[]
        for col,frame in enumerate(clip['frames']):
            assert (frame['x'],frame['y'])==(col*unit['cellWidth'],row*unit['cellHeight'])
            assert (frame['anchorX'],frame['anchorY'])==(unit['anchorX'],unit['anchorY'])
            cell=atlas.crop((frame['x'],frame['y'],frame['x']+frame['width'],frame['y']+frame['height']))
            pixels=np.array(cell);y,x=np.nonzero(pixels[:,:,3]>16)
            assert x.size>500,(unit['id'],key,col,'empty pose')
            margin=min(x.min(),y.min(),cell.width-1-x.max(),cell.height-1-y.max())
            minimum_margin=min(minimum_margin,int(margin))
            assert margin>=6,(unit['id'],key,col,'clipped or bleeding cell')
            assert pixels[0,0,3]==0 and pixels[-1,-1,3]==0
            hashes.append(hashlib.sha256(cell.tobytes()).hexdigest())
            heights[key].append(int(y.max()-y.min()+1))
        unique[key]=len(set(hashes))
        assert unique[key]==6,(unit['id'],key,'duplicate poses')
    assert max(heights['defeat'][-2:])<np.median(heights['idle'])*.65,(unit['id'],'defeat must end prone')
    report['units'].append({'id':unit['id'],'distinctPoses':sum(unique.values()),'minimumMargin':minimum_margin,'proneHeightRatio':round(max(heights['defeat'][-2:])/float(np.median(heights['idle'])),3)})
ref=json.loads((ART/'data/demo-reference.json').read_text())
report['originalSpriteDeliveryReference']=ref['sha256']
report['combatDemoSha256']=hashlib.sha256((ROOT/'index.html').read_bytes()).hexdigest()
out=ROOT/'artifacts/enemigos';out.mkdir(parents=True,exist_ok=True)
(out/'asset-validation.json').write_text(json.dumps(report,indent=2)+'\n')
print('17 variants / 102 clips / 612 distinct poses: transparent padded cells, fixed pivots, prone defeats verified.')
