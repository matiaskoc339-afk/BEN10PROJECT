"""Register retained, newly drawn Zombozo poses; never create poses by deforming a cutout."""
from pathlib import Path
from PIL import Image
from scipy import ndimage
import numpy as np,json,hashlib,math,argparse,shutil
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'zombozo'
DESIGNS=json.loads((OUT/'data/designs.json').read_text())
def source_frames(ident):
 path=OUT/'assets/source'/f'{ident}.png';im=Image.open(path).convert('RGBA');rgba=np.array(im);cw=im.width/6;ch=im.height/6
 assert (rgba[:,:,3]<8).mean()>.18,(ident,'background must be transparent')
 labels,_=ndimage.label(rgba[:,:,3]>110,np.ones((3,3)));sizes=np.bincount(labels.ravel());sizes[0]=0;slices=ndimage.find_objects(labels);owned=[[] for _ in range(36)]
 for label in np.flatnonzero(sizes>=8):
  sl=slices[label-1];yy,xx=np.nonzero(labels[sl]==label);x=xx.mean()+sl[1].start;y=yy.mean()+sl[0].start
  col=min(5,int(x/cw));row=min(5,int(y/ch));owned[row*6+col].append((int(sizes[label]),int(label)))
 poses=[]
 for n,parts in enumerate(owned):
  row,col=divmod(n,6);assert parts,(ident,row,col,'missing frame')
  largest=max(parts)[0];selected=[label for size,label in parts if size>=max(8,largest*.003)]
  # A detached bomb in the emergence/throw pose is a projectile, not a third hand.
  if ident=='p2-trucos' and n==10:
   kept=[]
   for label in selected:
    sl=slices[label-1];yy,xx=np.nonzero(labels[sl]==label);mx=xx.mean()+sl[1].start
    if sizes[label]<largest*.28 and mx>(col+.72)*cw and sl[0].stop-sl[0].start<ch*.55:continue
    kept.append(label)
   selected=kept
  mask=np.isin(labels,selected);halo=ndimage.binary_dilation(mask,iterations=2);yy,xx=np.nonzero(halo)
  x0=max(0,int(xx.min())-3);x1=min(im.width,int(xx.max())+4);y0=max(0,int(yy.min())-3);y1=min(im.height,int(yy.max())+4)
  assert x1-x0<cw*1.75 and y1-y0<ch*1.45,(ident,row,col,'joined silhouettes',x1-x0,y1-y0)
  pixels=rgba[y0:y1,x0:x1].copy();pixels[~halo[y0:y1,x0:x1],3]=0
  ys,_=np.nonzero(mask);bottom=int(ys.max())+1
  poses.append({'image':Image.fromarray(pixels),'ax':(col+.5)*cw-x0,'ay':bottom-y0,'box':[x0,y0,x1-x0,y1-y0],'bottom':bottom-row*ch,'height':int(ys.max()-ys.min()+1),'cellTop':row*ch,'col':col,'row':row})
 return poses,hashlib.sha256(path.read_bytes()).hexdigest(),cw,ch

def pack_frames(poses,scales,ident,*,fixed_rows=False):
 # Props retain their vertical bob and expanding FX around a common row anchor.
 if fixed_rows:
  for row in range(6):
   frames=poses[row*6:row*6+6];anchor=float(np.median([f['bottom'] for f in frames]))
   for f in frames:f['ay']=f['cellTop']+anchor-f['box'][1]
 left=max(p['ax']*z for p,z in zip(poses,scales));right=max((p['image'].width-p['ax'])*z for p,z in zip(poses,scales));up=max(p['ay']*z for p,z in zip(poses,scales));down=max((p['image'].height-p['ay'])*z for p,z in zip(poses,scales));pad=16
 ax=math.ceil(left)+pad;ay=math.ceil(up)+pad;w=math.ceil(max(256,left+right+pad*2)/8)*8;h=math.ceil(max(240,up+down+pad*2)/8)*8
 atlas=Image.new('RGBA',(w*6,h*6));frames=[]
 for n,(p,z) in enumerate(zip(poses,scales)):
  r,c=divmod(n,6);sprite=p['image'].resize((max(1,round(p['image'].width*z)),max(1,round(p['image'].height*z))),Image.Resampling.NEAREST);x=c*w+ax-round(p['ax']*z);y=r*h+ay-round(p['ay']*z)
  assert x>=c*w+8 and y>=r*h+8 and x+sprite.width<=(c+1)*w-8 and y+sprite.height<=(r+1)*h-8,(ident,n,'padding')
  atlas.alpha_composite(sprite,(x,y));frames.append({'x':c*w,'y':r*h,'width':w,'height':h,'anchorX':ax,'anchorY':ay,'sourceBox':p['box']})
 path=OUT/'assets/atlases'/f'{ident}.png';path.parent.mkdir(parents=True,exist_ok=True);atlas.save(path,optimize=True)
 return frames,str(path.relative_to(OUT)),w,h

def boss_sheet(spec):
 ident=spec['id'];poses,sha,_,_=source_frames(ident);source_height=float(np.median([poses[n]['height'] for n in spec['scaleReference']]));scale=DESIGNS['nativeBodyHeight']/source_height
 frames,atlas,w,h=pack_frames(poses,[scale]*36,ident)
 clips={}
 for row,design in enumerate(spec['rows']):
  key=design['id'];clips[key]={**design,'loop':design.get('loop',False),'eventFrames':design.get('eventFrames',{}),'contactFrames':design.get('contactFrames',[]),'frames':frames[row*6:row*6+6],'atlas':atlas,'sheet':ident,'bodyHeight':DESIGNS['bodyHeight'],'nativeBodyHeight':DESIGNS['nativeBodyHeight']}
 data={'id':ident,'phase':spec['phase'],'atlas':atlas,'source':f'assets/source/{ident}.png','sourceSha256':sha,'scale':scale,'bodyHeight':DESIGNS['bodyHeight'],'nativeBodyHeight':DESIGNS['nativeBodyHeight'],'cellWidth':w,'cellHeight':h,'animations':clips}
 (OUT/atlas).with_suffix('.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 print('Registered',ident,'36 poses',w,h,flush=True);return data

def prop_sheet(spec):
 ident=spec['id'];poses,sha,_,_=source_frames(ident);scales=[];natives=[];shared=None
 if ident=='props-caja-adn':shared=128/float(np.median([p['height'] for p in poses[:6]]))
 for row,c in enumerate(spec['rows']):
  group=poses[row*6:row*6+6]
  if c.get('static'):
   for p in group:scales.append(min(170/p['image'].width,180/p['image'].height));natives.append(p['height']*scales[-1])
  else:
   z=shared if c.get('group')=='box' else min(190/max(p['image'].width for p in group),190/max(p['image'].height for p in group))
   scales.extend([z]*6);natives.extend([max(p['height'] for p in group)*z]*6)
 frames,atlas,w,h=pack_frames(poses,scales,ident,fixed_rows=True);clips=[]
 for row,c in enumerate(spec['rows']):
  if c.get('static'):
   for col,key in enumerate(c['static']):clips.append({'id':key,'name':c['names'][col],'static':True,'atlas':atlas,'bodyHeight':c['heights'][col],'nativeBodyHeight':natives[row*6+col],'loop':False,'durations':[1000],'eventFrames':{},'contactFrames':[],'frames':[frames[row*6+col]]})
  else:clips.append({**c,'atlas':atlas,'bodyHeight':c['height'],'nativeBodyHeight':natives[row*6],'loop':c.get('loop',False),'eventFrames':c.get('eventFrames',{}),'contactFrames':[],'frames':frames[row*6:row*6+6]})
 result={'id':ident,'source':f'assets/source/{ident}.png','sourceSha256':sha,'atlas':atlas,'cellWidth':w,'cellHeight':h,'clips':clips}
 (OUT/atlas).with_suffix('.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n');print('Registered',ident,len(clips),'clips',flush=True);return result

def main():
 parser=argparse.ArgumentParser();parser.add_argument('--allow-partial',action='store_true');args=parser.parse_args();sheets=[];props=[]
 for s in DESIGNS['sheets']:
  if not (OUT/'assets/source'/f'{s["id"]}.png').exists() and args.allow_partial:continue
  sheets.append(boss_sheet(s))
 for s in DESIGNS['props']:
  if not (OUT/'assets/source'/f'{s["id"]}.png').exists() and args.allow_partial:continue
  props.append(prop_sheet(s))
 phases=[]
 for phase in DESIGNS['phases']:
  animations={key:c for sheet in sheets if sheet['phase']==len(phases) for key,c in sheet['animations'].items()};phases.append({**phase,'animations':animations})
 shared=json.loads((ROOT/'fase2-circo/data/fx.json').read_text())['clips'];shared=[c for c in shared if c['id'] in ['explosive-flight','explosion']]
 (OUT/'assets/shared').mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/'fase2-circo/assets/atlases/bombas-fx.png',OUT/'assets/shared/bombas-circo.png')
 bombs=[]
 for c in shared:
  a=c['animation'];bombs.append({'id':'shared-'+c['id'],'name':c['name'],'atlas':'assets/shared/bombas-circo.png','bodyHeight':c['bodyHeight'],'nativeBodyHeight':c['nativeBodyHeight'],'reused':True,**a,'eventFrames':{},'contactFrames':[]})
 data={'version':1,'title':DESIGNS['title'],'spriteOnly':True,'gameplayIntegrated':False,'bossId':'zombozo','phases':phases,'sheets':sheets,'props':props,'shared':bombs,'bossClips':sum(len(p['animations']) for p in phases),'bossPoses':len(sheets)*36,'newPropDrawings':len(props)*36,'referencePlayer':{'file':'assets/reference/ben.png','cellWidth':96,'cellHeight':96,'anchorX':48,'anchorY':88,'sourceBodyHeight':56,'bodyHeight':70},'background':'assets/reference/escenario.png','model':'assets/reference/zombozo-model.png'}
 (OUT/'data/manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');(OUT/'data/catalog.js').write_text('window.BEN10_ZOMBOZO_ART='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n');print('Built',data['bossClips'],'boss clips /',data['bossPoses'],'boss poses /',data['newPropDrawings'],'prop/FX drawings')
if __name__=='__main__':main()
