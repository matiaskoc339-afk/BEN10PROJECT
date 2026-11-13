"""Extract authored grid cells, register the body, and pack lossless runtime atlases.

No synthesized anatomy, UV deformation, or interpolated character images. The source
drawings are retained in source-v33; only atlas extraction and uniform scaling occur.
"""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage
import json, hashlib, statistics

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'assets/skills'
book=json.loads((FOLDER/'catalog.json').read_text())
manifest=[]

def extract(sheet,row,col,rows=7):
    w,h=sheet.size
    box=(round(col*w/6),round(row*h/rows),round((col+1)*w/6),round((row+1)*h/rows))
    cell=sheet.crop(box)
    # Use solid pixels to locate each drawing, not translucent glow in the gutters.
    data=np.asarray(cell)
    mask=data[:,:,3]>190
    labels,count=ndimage.label(mask)
    sizes=np.bincount(labels.ravel());sizes[0]=0
    if not count or sizes.max()<80:raise ValueError(f'Empty pose {row}:{col}')
    main=labels==sizes.argmax()
    # Bound all substantial pieces in the cell (held rock, spikes, long hands).
    keep=sizes>max(45,sizes.max()*.015);keep[0]=False
    pieces=keep[labels]
    yy,xx=np.nonzero(pieces)
    left,top,right,bottom=max(0,int(xx.min())-3),max(0,int(yy.min())-3),min(cell.width,int(xx.max())+4),min(cell.height,int(yy.max())+4)
    # Body registration uses the low solid body, not forward-flying projectiles.
    my,mx=np.nonzero(main)
    footline=int(np.percentile(my,98))
    low=main & (np.indices(main.shape)[0]>=int(np.percentile(my,72)))
    ly,lx=np.nonzero(low)
    anchor=float(np.median(lx)) if len(lx) else float(np.median(mx))
    return cell.crop((left,top,right,bottom)),anchor-left,footline-top,float(my.max()-my.min()+1),box

for spec in book:
    sources={view:Image.open(FOLDER/'source-v33'/f'{spec["id"]}-{view}.png').convert('RGBA') for view in ['down','up','right']}
    cells={view:[[extract(image,r,c) for c in range(6)] for r in range(7)] for view,image in sources.items()}
    # A single scale per view preserves the size of crouches, balls and airborne poses.
    scales={view:160/statistics.median(cells[view][r][0][3] for r in range(7)) for view in cells}
    for row,skill in enumerate(spec['skills']):
        frames=[]
        for view in ['down','up','right']:
            factor=scales[view]
            for col in range(6):
                image,ax,ay,_,source_box=cells[view][row][col]
                if spec['id']=='upgrade' and skill['id']=='c2' and view=='up':
                    cannon=Image.open(FOLDER/'source-v33/upgrade-cannon-up.png').convert('RGBA')
                    image,ax,ay,_,source_box=extract(cannon,0,2 if col in [3,4] else col,1)
                    factor=160/extract(cannon,0,0,1)[3]
                size=(max(1,round(image.width*factor)),max(1,round(image.height*factor)))
                frames.append((image.resize(size,Image.Resampling.NEAREST),round(ax*factor),round(ay*factor),view,source_box))
        left=max(ax for im,ax,ay,_,_ in frames)+8
        top=max(ay for im,ax,ay,_,_ in frames)+8
        right=max(im.width-ax for im,ax,ay,_,_ in frames)+8
        bottom=max(im.height-ay for im,ax,ay,_,_ in frames)+8
        width,height=left+right,top+bottom
        atlas=Image.new('RGBA',(width*6,height*3))
        for i,(im,ax,ay,view,source_box) in enumerate(frames):
            atlas.alpha_composite(im,(i%6*width+left-ax,i//6*height+top-ay))
        file=f'{spec["id"]}-{skill["id"]}.png'
        atlas.save(FOLDER/file,optimize=True)
        skill['layout']={'cellWidth':width,'cellHeight':height,'anchorX':left,'anchorY':top,'bodyHeight':160}
        skill['frameTimes']=[0,.14,.3,.49,.7,.88]
        if spec['id']=='four-arms' and skill['id']=='c0':skill['frameTimes']=[0,.12,.24,.52,.64,.88]
        if spec['id']=='cannonbolt' and skill['id']=='c0':
            skill['frameTimes']=[0,.14,.22,.36,.42,.56,.63,.77,.84,.94]
            skill['frameMap']=[0,1,3,2,4,2,4,2,5,0]
        if spec['id']=='wildvine' and skill['id']=='c5':skill['frameMap']=[0,1,2,2,2,5]
        manifest.append({'form':spec['id'],'skill':skill['id'],'file':file,'artVersion':33,'frames':18,'drawnKeyPoses':18,'views':['down','up','right'],'mirroredView':'left','width':atlas.width,'height':atlas.height,'sha256':hashlib.sha256((FOLDER/file).read_bytes()).hexdigest(),'sourceSheets':[f'source-v33/{spec["id"]}-{v}.png' for v in sources]+(['source-v33/upgrade-cannon-up.png'] if spec['id']=='upgrade' and skill['id']=='c2' else [])})
    print(spec['id']+': seven new drawn clips, three views + mirrored left',flush=True)
(FOLDER/'catalog.json').write_text(json.dumps(book,ensure_ascii=False,indent=2)+'\n')
(FOLDER/'atlas-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(f'Packed {len(manifest)} clips, {len(manifest)*18} actual drawn key poses.')
