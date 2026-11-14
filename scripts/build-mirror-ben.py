from pathlib import Path
from PIL import Image
import numpy as np,json,math
root=Path(__file__).resolve().parents[1];out=root/'fase2-circo';im=Image.open(out/'assets/source/ben-mirror-jump.png').convert('RGBA');poses=[]
for row in range(2):
 for col in range(8):
  cell=im.crop((round(col*im.width/8),round(row*im.height/2),round((col+1)*im.width/8),round((row+1)*im.height/2)));a=np.array(cell)[:,:,3];yy,xx=np.nonzero(a>150);assert len(xx)>300
  box=(max(0,int(xx.min())-3),max(0,int(yy.min())-3),min(cell.width,int(xx.max())+4),min(cell.height,int(yy.max())+4));poses.append(cell.crop(box))
scale=128/np.median([poses[7].height,poses[15].height]);w=math.ceil(max(p.width*scale for p in poses)+24);h=160;atlas=Image.new('RGBA',(w*8,h*2));frames=[]
for n,pose in enumerate(poses):
 pose=pose.resize((round(pose.width*scale),round(pose.height*scale)),Image.Resampling.NEAREST);x=(n%8)*w+round((w-pose.width)/2);y=(n//8)*h+148-pose.height;assert y>=8;atlas.alpha_composite(pose,(x,y));frames.append({'x':n%8*w,'y':n//8*h,'width':w,'height':h,'anchorX':w/2,'anchorY':148})
file=out/'assets/atlases/ben-mirror-jump.png';atlas.save(file,optimize=True);(out/'data/mirror-ben.json').write_text(json.dumps({'atlas':'assets/atlases/ben-mirror-jump.png','nativeBodyHeight':128,'frames':frames,'poseCount':16},indent=2)+'\n');print('Registered 16 Ben jump poses')
