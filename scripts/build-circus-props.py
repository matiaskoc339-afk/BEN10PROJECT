"""Register existing drawn prop/FX frames into padded atlases; never generate poses."""
from pathlib import Path
import json,hashlib,math
from PIL import Image
import numpy as np
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'fase2-circo'
SETS={
'props':('espejos-props',[
('mirror-idle','Espejo · reposo',170,True,150),('mirror-open','Espejo · apertura',170,False,110),('lantern','Farol oscilante',42,True,150),('pole','Soporte y banderines',224,True,160),('trap','Trampa de resorte',30,True,180),('platform','Plataforma de cristal',24,True,180)]),
'fx':('bombas-fx',[
('explosive-flight','Bomba explosiva',16,True,95),('acid-flight','Bomba ácida',16,True,95),('confetti-flight','Bomba de confeti',16,True,95),('explosion','Explosión',76,False,90),('acid','Ácido y charco',55,False,130),('confetti','Confeti y curación',78,False,110)])}
for group,(source,designs) in SETS.items():
 im=Image.open(OUT/'assets/source'/f'{source}.png').convert('RGBA');cw=im.width/6;ch=im.height/6
 if sum(im.getchannel('A').histogram()[:8])/(im.width*im.height)<.15:raise ValueError(source+' lacks transparency')
 row_bounds=[0,200,400,555,752,903,im.height] if group=='props' else [round(n*ch) for n in range(7)]
 rows=[]
 for row,design in enumerate(designs):
  poses=[]
  for col in range(6):
   box=(round(col*cw),row_bounds[row],round((col+1)*cw),row_bounds[row+1]);cell=im.crop(box);a=np.array(cell)[:,:,3];ys,xs=np.nonzero(a>100)
   if len(xs)<50:raise ValueError((source,row,col,'missing'))
   b=(max(0,int(xs.min())-3),max(0,int(ys.min())-3),min(cell.width,int(xs.max())+4),min(cell.height,int(ys.max())+4))
   poses.append((cell,b,box))
  rows.append(poses)
 # One scale per row, and shared mirror idle/activation scale; expansion FX keep their drawn size progression.
 scales=[min(200/(max(b[2] for _,b,_ in r)-min(b[0] for _,b,_ in r)),208/(max(b[3] for _,b,_ in r)-min(b[1] for _,b,_ in r))) for r in rows]
 if group=='props':scales[0]=scales[1]=min(scales[:2])
 atlas=Image.new('RGBA',(256*6,256*6));clips=[]
 for row,((ident,name,world_height,loop,ms),poses) in enumerate(zip(designs,rows)):
  scale=scales[row];bounds=rows[0]+rows[1] if group=='props' and row<2 else poses;bottom=max(b[3] for _,b,_ in bounds);center=(max(b[2] for _,b,_ in bounds)+min(b[0] for _,b,_ in bounds))/2;frames=[]
  for col,(cell,b,box) in enumerate(poses):
   sprite=cell.crop(b);sprite=sprite.resize((max(1,round(sprite.width*scale)),max(1,round(sprite.height*scale))),Image.Resampling.NEAREST)
   x=col*256+128+round((b[0]-center)*scale);y=row*256+238-round((bottom-b[1])*scale)
   if x<col*256+5 or x+sprite.width>(col+1)*256-5 or y<row*256+5 or y+sprite.height>(row+1)*256-5:raise ValueError((source,row,col,'padding'))
   atlas.alpha_composite(sprite,(x,y));frames.append({'x':col*256,'y':row*256,'width':256,'height':256,'anchorX':128,'anchorY':238,'sourceBox':list(box)})
  clips.append({'id':ident,'name':name,'atlas':f'assets/atlases/{source}.png','bodyHeight':world_height,'nativeBodyHeight':round(max(b[3]-b[1] for _,b,_ in poses)*scale),'animation':{'loop':loop,'durations':[ms]*6,'frames':frames}})
 if group=='fx':
  pool=json.loads(json.dumps(clips[4]));pool.update(id='acid-pool',name='Charco · burbujeo',bodyHeight=55);pool['animation']['frames']=pool['animation']['frames'][3:];pool['animation']['durations']=[200]*3;pool['animation']['loop']=True;clips.append(pool)
 path=OUT/'assets/atlases'/f'{source}.png';path.parent.mkdir(parents=True,exist_ok=True);atlas.save(path,optimize=True)
 data={'source':f'assets/source/{source}.png','sourceSha256':hashlib.sha256((OUT/'assets/source'/f'{source}.png').read_bytes()).hexdigest(),'clips':clips}
 (OUT/'data'/f'{group}.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');path.with_suffix('.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
 print(group,len(clips),'clips')
