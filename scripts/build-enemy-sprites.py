"""Register complete drawn silhouettes into padded, fixed-pivot sprite atlases.

No poses or body parts are synthesised here: every pose comes from the retained
image-generation source. Component ownership preserves swords/axes extending
past their nominal source cell, without cropping them at that cell's border.
"""
from pathlib import Path
from PIL import Image
from scipy import ndimage
import numpy as np
import json,hashlib,argparse,math

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'enemigos'
COLS=ROWS=6
KEYS=['idle','walk','attack','secondary','hurt','defeat']
ROLE_MOVES={
 'melee':('Tajo de espada','Estocada'),
 'ranged':('Disparo de ballesta','Disparo arrodillado'),
 'support':('Pulso del emisor','Canalización de apoyo'),
 'agile':('Doble corte','Estocada en carrera'),
 'defender':('Golpe de escudo','Guardia de hierro'),
 'champion':('Hachazo vertical','Barrido del hacha'),
}
TIER_NOTES={'recruit':'Placas ligeras, articulaciones de tela y equipo de rango bajo.','elite':'Coraza cerrada, hombreras y grebas más sólidas; remates de rango.','normal':'Campeón de gran masa con armadura pesada y hacha de dos manos.','crystal':'Placas facetadas de ADN petrosapien integradas en la armadura y el arma.'}

def components(image):
    rgba=np.array(image)
    labels,count=ndimage.label(rgba[:,:,3]>160,np.ones((3,3)))
    sizes=np.bincount(labels.ravel());sizes[0]=0
    cells=[[] for _ in range(36)]
    slices=ndimage.find_objects(labels)
    for ident in np.flatnonzero(sizes>=12):
        sl=slices[ident-1]
        yy,xx=np.nonzero(labels[sl]==ident)
        x=float(xx.mean()+sl[1].start);y=float(yy.mean()+sl[0].start)
        row=min(5,int(y*ROWS/image.height));col=min(5,int(x*COLS/image.width))
        cells[row*COLS+col].append((int(sizes[ident]),int(ident)))
    return rgba,labels,cells

def register(unit):
    source=OUT/'assets/source'/f'{unit["id"]}.png'
    image=Image.open(source).convert('RGBA')
    rgba,labels,cells=components(image)
    cell_w=image.width/6;cell_h=image.height/6
    if (rgba[:,:,3]<8).mean()<.15:raise ValueError(f'{unit["id"]}: background is not transparent')
    projectiles=[]
    # Detached crossbow bolts are exported as projectiles, not accidentally
    # attached to the next figure when a bolt crosses the source cell boundary.
    if unit['role']=='ranged':
        for n,parts in enumerate(cells):
            row,col=divmod(n,6)
            if row not in [2,3] or not parts:continue
            largest,primary=max(parts);keep=[]
            for size,ident in parts:
                yy,xx=np.nonzero(labels==ident);w=xx.max()-xx.min()+1;h=yy.max()-yy.min()+1;cy=(yy.mean()-row*cell_h)/cell_h
                if ident!=primary and .25<cy<.70 and h<cell_h*.12 and w>h*1.6 and size<largest*.08:
                    mask=ndimage.binary_dilation(labels==ident,iterations=2);py,px=np.nonzero(mask);box=(max(0,int(px.min())-2),max(0,int(py.min())-2),min(image.width,int(px.max())+3),min(image.height,int(py.max())+3));pixels=rgba[box[1]:box[3],box[0]:box[2]].copy();pixels[~mask[box[1]:box[3],box[0]:box[2]],3]=0
                    projectiles.append(Image.fromarray(pixels))
                else:keep.append((size,ident))
            cells[n]=keep
    frames=[]
    for n,parts in enumerate(cells):
        row,col=divmod(n,6)
        if not parts or max(parts)[0]<cell_w*cell_h*.025:raise ValueError(f'{unit["id"]}: missing body in {row}:{col}')
        largest=max(parts)[0]
        chosen=[ident for size,ident in parts if size>=max(12,largest*.01)]
        mask=np.isin(labels,chosen)
        # Retain the existing antialias edge, not isolated matte/noise pixels.
        halo=ndimage.binary_dilation(mask,iterations=3)
        yy,xx=np.nonzero(halo)
        left=max(0,int(xx.min())-4);right=min(image.width,int(xx.max())+5)
        top=max(0,int(yy.min())-4);bottom=min(image.height,int(yy.max())+5)
        if right-left>cell_w*1.65 or bottom-top>cell_h*1.28:raise ValueError(f'{unit["id"]}: joined figures in {row}:{col}')
        pixels=rgba[top:bottom,left:right].copy();pixels[~halo[top:bottom,left:right],3]=0
        art=Image.fromarray(pixels)
        center=(col+.5)*cell_w
        # Read soles in the central lower body, excluding a sword/axe tip to the
        # side. One horizontal pivot is shared by the whole unit, not re-centred
        # on each changing weapon silhouette.
        body_band=mask[max(0,int(row*cell_h+cell_h*.40)):min(image.height,math.ceil((row+1)*cell_h+cell_h*.08)),max(0,int(center-cell_w*.23)):min(image.width,math.ceil(center+cell_w*.20))]
        by,_=np.nonzero(body_band)
        sole=(int(row*cell_h+cell_h*.40)+int(by.max())+1) if by.size else bottom-4
        frames.append({'image':art,'anchorX':center-left,'anchorY':sole-top,'sourceBox':[left,top,right-left,bottom-top],'row':row,'column':col,'standingHeight':sole-top})
    source_height=float(np.median([f['standingHeight']-4 for f in frames[:6]]))
    native_height=176 if unit['kind']=='miniboss' else 128
    scale=native_height/source_height
    up=max(f['anchorY']*scale for f in frames);down=max((f['image'].height-f['anchorY'])*scale for f in frames)
    left=max(f['anchorX']*scale for f in frames);right=max((f['image'].width-f['anchorX'])*scale for f in frames)
    pad=12
    anchor_x=math.ceil(left)+pad;anchor_y=math.ceil(up)+pad
    width=max(224,math.ceil(left+right)+pad*2);height=max(208,math.ceil(up+down)+pad*2)
    # Keep spare space around even the widest prone body and axe follow-through.
    width=math.ceil(width/8)*8;height=math.ceil(height/8)*8
    atlas=Image.new('RGBA',(width*6,height*6))
    registered=[]
    for n,f in enumerate(frames):
        sprite=f['image'].resize((max(1,round(f['image'].width*scale)),max(1,round(f['image'].height*scale))),Image.Resampling.NEAREST)
        row,col=f['row'],f['column'];x=col*width+anchor_x-round(f['anchorX']*scale);y=row*height+anchor_y-round(f['anchorY']*scale)
        if x<col*width+6 or y<row*height+6 or x+sprite.width>(col+1)*width-6 or y+sprite.height>(row+1)*height-6:raise ValueError(f'{unit["id"]}: insufficient atlas padding')
        atlas.alpha_composite(sprite,(x,y))
        registered.append({'x':col*width,'y':row*height,'width':width,'height':height,'anchorX':anchor_x,'anchorY':anchor_y,'sourceBox':f['sourceBox']})
    folder=OUT/'assets/atlases';folder.mkdir(parents=True,exist_ok=True)
    path=folder/f'{unit["id"]}.png';atlas.save(path,optimize=True)
    poster=OUT/'assets/posters'/f'{unit["id"]}.png';poster.parent.mkdir(exist_ok=True);atlas.crop((0,0,width,height)).save(poster,optimize=True)
    walk_time=75 if unit['role']=='agile' else 150 if unit['kind']=='miniboss' else 110 if unit['tier']=='elite' else 120 if unit['tier']=='crystal' else 95
    attack=[180,260,120,120,180,220] if unit['kind']=='miniboss' else [110,130,80,80,120,160]
    durations=[[150]*6,[walk_time]*6,attack,[140,180,100,90,150,190],[60,80,90,90,90,110],[100,130,150,170,220,450]]
    names=['Reposo','Caminata',*ROLE_MOVES[unit['role']],'Reacción al golpe','Derrota']
    animations={key:{'name':names[row],'loop':key in ['idle','walk'],'durations':durations[row],'contactFrames':[3] if key in ['attack','secondary'] else [],'frames':registered[row*6:row*6+6]} for row,key in enumerate(KEYS)}
    result={**unit,'description':TIER_NOTES[unit['tier']],'atlas':str(path.relative_to(OUT)),'poster':str(poster.relative_to(OUT)),'source':str(source.relative_to(OUT)),'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'cellWidth':width,'cellHeight':height,'anchorX':anchor_x,'anchorY':anchor_y,'nativeBodyHeight':native_height,'columns':6,'rows':6,'directions':{'right':{'flipX':False},'left':{'flipX':True}},'animations':animations}
    if projectiles:
        bolt=max(projectiles,key=lambda p:p.width);bolt=bolt.resize((max(1,round(bolt.width*scale)),max(1,round(bolt.height*scale))),Image.Resampling.NEAREST)
        file=OUT/'assets/fx'/f'{unit["id"]}-bolt.png';file.parent.mkdir(exist_ok=True);bolt.save(file,optimize=True)
        result['projectile']={'file':str(file.relative_to(OUT)),'width':bolt.width,'height':bolt.height,'muzzleX':native_height*.56,'muzzleY':-native_height*.55}
    path.with_suffix('.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--allow-partial',action='store_true');args=parser.parse_args()
    designs=json.loads((OUT/'data/designs.json').read_text());units=[];missing=[]
    for unit in designs['units']:
        source=OUT/'assets/source'/f'{unit["id"]}.png'
        if not source.exists():missing.append(unit['id']);continue
        units.append(register(unit))
        print('Registered',unit['id'],flush=True)
    if missing and not args.allow_partial:raise FileNotFoundError('Missing authored sheets: '+', '.join(missing))
    data={'version':1,'title':'Caballeros Eternos · biblioteca de animaciones','spriteOnly':True,'finalBossIncluded':False,'roles':designs['roles'],'units':units,'animationKeys':KEYS,'totalPoses':len(units)*36,'referencePlayer':{'file':'assets/context/ben-reference.png','cellWidth':96,'cellHeight':96,'anchorX':48,'anchorY':88,'sourceBodyHeight':56,'bodyHeight':70},'missing':missing}
    (OUT/'data/manifest.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    (OUT/'data/catalog.js').write_text('window.BEN10_ENEMY_ART='+json.dumps(data,ensure_ascii=False)+';\n')
    print(f'Built {len(units)} character variants / {len(units)*6} clips / {len(units)*36} drawn poses.')

if __name__=='__main__':main()
