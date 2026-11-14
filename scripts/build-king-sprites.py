"""Pack newly drawn boss poses. Do not synthesize poses or deform limbs."""
from pathlib import Path
from PIL import Image
from scipy import ndimage
import numpy as np
import json, hashlib, math

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'jefe-final'
DESIGNS=json.loads((OUT/'data/designs.json').read_text())

def register(phase):
    source=OUT/'assets/source'/f'{phase["id"]}.png'
    image=Image.open(source).convert('RGBA')
    pixels=np.array(image)
    rows=len(phase['rows']);cw=image.width/6;ch=image.height/rows
    assert (pixels[:,:,3]<8).mean()>.18, 'Source must have a transparent background'
    labels,_=ndimage.label(pixels[:,:,3]>120,np.ones((3,3)))
    slices=ndimage.find_objects(labels);sizes=np.bincount(labels.ravel());sizes[0]=0
    ownership=[[] for _ in range(rows*6)]
    for ident in np.flatnonzero(sizes>=10):
        sl=slices[ident-1];yy,xx=np.nonzero(labels[sl]==ident)
        cx=xx.mean()+sl[1].start;cy=yy.mean()+sl[0].start
        row=min(rows-1,int(cy/ch));col=min(5,int(cx/cw))
        ownership[row*6+col].append((int(sizes[ident]),int(ident)))
    poses=[]
    for n,parts in enumerate(ownership):
        row,col=divmod(n,6)
        assert parts and max(parts)[0]>cw*ch*.02, f'{phase["id"]}: missing pose {row}:{col}'
        largest=max(parts)[0];chosen=[ident for size,ident in parts if size>=max(10,largest*.003)]
        mask=np.isin(labels,chosen);halo=ndimage.binary_dilation(mask,iterations=2)
        yy,xx=np.nonzero(halo);left=max(0,int(xx.min())-3);right=min(image.width,int(xx.max())+4);top=max(0,int(yy.min())-3);bottom=min(image.height,int(yy.max())+4)
        assert right-left<cw*1.5 and bottom-top<ch*1.3, f'{phase["id"]}: joined silhouettes {row}:{col}'
        art=pixels[top:bottom,left:right].copy();art[~halo[top:bottom,left:right],3]=0
        center=(col+.5)*cw
        # The lower central body locates the planted sole. Peripheral swords
        # and flying cape corners cannot lower the foot anchor.
        y0=max(0,int(row*ch+ch*.38));y1=min(image.height,math.ceil((row+1)*ch+ch*.06))
        x0=max(0,int(center-cw*.22));x1=min(image.width,math.ceil(center+cw*.2))
        by,_=np.nonzero(mask[y0:y1,x0:x1]);sole=y0+int(by.max())+1 if by.size else bottom-3
        poses.append({'art':Image.fromarray(art),'ax':center-left,'ay':sole-top,'box':[left,top,right-left,bottom-top]})
    native=DESIGNS['nativeBodyHeight'];source_height=float(np.median([p['ay']-3 for p in poses[:6]]));scale=native/source_height
    left=max(p['ax']*scale for p in poses);right=max((p['art'].width-p['ax'])*scale for p in poses)
    up=max(p['ay']*scale for p in poses);down=max((p['art'].height-p['ay'])*scale for p in poses)
    ax=math.ceil(left)+16;ay=math.ceil(up)+16
    width=math.ceil(max(256,left+right+32)/8)*8;height=math.ceil(max(224,up+down+32)/8)*8
    atlas=Image.new('RGBA',(width*6,height*rows));frames=[]
    for n,p in enumerate(poses):
        r,c=divmod(n,6);sprite=p['art'].resize((max(1,round(p['art'].width*scale)),max(1,round(p['art'].height*scale))),Image.Resampling.NEAREST)
        x=c*width+ax-round(p['ax']*scale);y=r*height+ay-round(p['ay']*scale)
        assert x>=c*width+8 and y>=r*height+8 and x+sprite.width<=(c+1)*width-8 and y+sprite.height<=(r+1)*height-8, 'Insufficient cell padding'
        atlas.alpha_composite(sprite,(x,y));frames.append({'x':c*width,'y':r*height,'width':width,'height':height,'anchorX':ax,'anchorY':ay,'sourceBox':p['box']})
    folder=OUT/'assets/atlases';folder.mkdir(parents=True,exist_ok=True);file=folder/f'{phase["id"]}.png';atlas.save(file,optimize=True)
    poster=OUT/'assets/posters'/f'{phase["id"]}.png';poster.parent.mkdir(parents=True,exist_ok=True);atlas.crop((0,0,width,height)).save(poster,optimize=True)
    animations={}
    for r,clip in enumerate(phase['rows']):
        animations[clip['id']]={**clip,'loop':clip.get('loop',False),'contactFrames':clip.get('contactFrames',[]),'eventFrames':clip.get('eventFrames',{}),'frames':frames[r*6:r*6+6]}
    unit={k:v for k,v in phase.items() if k!='rows'}
    unit.update({'atlas':str(file.relative_to(OUT)),'poster':str(poster.relative_to(OUT)),'source':str(source.relative_to(OUT)),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'bodyHeight':DESIGNS['bodyHeight'],'nativeBodyHeight':native,'cellWidth':width,'cellHeight':height,'anchorX':ax,'anchorY':ay,'columns':6,'rows':rows,'directions':{'right':{'flipX':False},'left':{'flipX':True}},'animations':animations})
    file.with_suffix('.json').write_text(json.dumps(unit,ensure_ascii=False,indent=2)+'\n');print('Packed',phase['id'],len(poses),'poses',width,height,flush=True)
    return unit

def main():
    phases=[register(p) for p in DESIGNS['phases']]
    data={'version':1,'title':DESIGNS['title'],'spriteOnly':True,'bossId':'forever-king','totalClips':sum(len(p['animations']) for p in phases),'totalPoses':sum(len(p['animations'])*6 for p in phases),'phases':phases,'referencePlayer':{'file':'assets/reference/ben.png','cellWidth':96,'cellHeight':96,'anchorX':48,'anchorY':88,'sourceBodyHeight':56,'bodyHeight':70},'background':'assets/reference/laboratorio.png','designReference':'assets/reference/rey-eterno-tres-fases.png'}
    (OUT/'data/manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    (OUT/'data/catalog.js').write_text('window.BEN10_KING_ART='+json.dumps(data,ensure_ascii=False)+';\n')
    print('Built',data['totalClips'],'clips /',data['totalPoses'],'drawn poses.')

if __name__=='__main__':main()
