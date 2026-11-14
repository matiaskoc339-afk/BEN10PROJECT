"""Extract original authored environment panels into wall/floor layers and sprite atlases.

This is asset registration and packing. Artwork is drawn in the retained source
sheets; no generated scenery or character art is replaced by procedural drawings.
"""
from pathlib import Path
from PIL import Image
import numpy as np
from scipy import ndimage
import json

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'mapas'
ART=OUT/'assets'
W,H=640,360
CONNECTOR=128
CHAPTERS=[
 {'id':'ciudad','name':'Calles y parques','subtitle':'Bellwood · de la ciudad a la fortaleza','color':'#b8dc8f','start':0,'count':12},
 {'id':'castillo','name':'Castillo de los Eternos','subtitle':'Patios, murallas y pasadizos','color':'#e5b27d','start':12,'count':10},
 {'id':'laboratorio','name':'El ADN de Diamante','subtitle':'Contención petrosapien · laboratorio principal','color':'#8cddd0','start':22,'count':6}
]
# Source floor pivots are registered separately from the game walk line. Background
# upper storeys scroll out of view; the pavement extends downward without a hard edge.
NAMES=[
 ('El barrio de Ben','A · Calle residencial','asfalto','calle',264,208),
 ('La esquina comercial','Café y lavandería','asfalto','calle',264,208),
 ('La calle en obras','Un paso junto al parque','asfalto','sendero',259,208),
 ('Puerta del parque','Hierro, piedra y follaje','adoquin','arbol',260,208),
 ('Estanque de los sauces','Pasarela y agua en movimiento','madera','plaza',260,205),
 ('Plaza del pabellón','Fuente y pérgola','adoquin','ribera',256,192),
 ('Paseo del río','La ciudad se abre','losas','calle',180,178),
 ('Plaza cívica','La última parada urbana','losas','arco',260,208),
 ('Barrio antiguo','Calles de otra época','empedrado','puente',258,208),
 ('Puente del canal','El castillo aparece al fondo','piedra','camino',254,200),
 ('Camino de la fortaleza','Laderas y muros antiguos','grava','porton',261,208),
 ('El puente levadizo','Entrada a los Caballeros Eternos','piedra','porton',260,208),
 ('Patio de la puerta','Dentro de la fortaleza','piedra','muralla',258,208),
 ('La muralla exterior','Cielo sobre las almenas','piedra','arco',254,196),
 ('Sala de guardia','Antorchas y arcos de piedra','losas','armeria',258,208),
 ('Galería de armas','Herramientas de los Caballeros','losas','arco',260,208),
 ('El gran comedor','Madera, tapices y velas','losas','claustro',258,208),
 ('Claustro del jardín','Una pausa bajo los arcos','piedra','biblioteca',253,192),
 ('Archivo de los Eternos','Mesa de los sellos · espacio para un puzzle','baldosas','bodega',260,208),
 ('Bodega del mecanismo','El servicio de la fortaleza','piedra','escalera',260,208),
 ('Escalera oculta','La primera señal del laboratorio','piedra','boveda',260,208),
 ('La puerta de la bóveda','Piedra medieval y metal moderno','piedra','laboratorio',260,208),
 ('Acceso de servicio','Entrada al complejo científico','metal','laboratorio',260,208),
 ('Extracción de muestras','Tejido petrosapien bajo contención','metal','laboratorio',260,208),
 ('Análisis genético','Los patrones del ADN de Diamante','metal','laboratorio',260,208),
 ('Conductos de energía','Hacia el reactor central','metal','laboratorio',260,208),
 ('Cámara de observación','El laboratorio principal, al otro lado','metal','compuerta',260,208),
 ('Laboratorio principal','B · Espacio reservado para el Rey Eterno','metal','final',250,174)
]
PROP_NAMES={
 'ciudad':['arbol','banco','farola','papelera','hidrante','jardinera','verja','pilar','quiosco','baranda','obras','portal'],
 'castillo':['pilar','baranda','barril','cofre','cajas','escudo','jardinera','brasero','lampara','atril','torno','umbral'],
 'laboratorio':['consola','muestra','pilar','carro','cable','pedestal','sensor','caja','baranda','tubos','panel','umbral']
}

def fit_panel(image,width=W,height=H):
    # Preserve the pixel aspect ratio; a tiny excess of sky/foreground is cropped.
    scale=max(width/image.width,height/image.height)
    size=(round(image.width*scale),round(image.height*scale))
    image=image.resize(size,Image.Resampling.NEAREST)
    x=(image.width-width)//2;y=(image.height-height)//2
    return image.crop((x,y,x+width,y+height))

rooms=[]
for i,(name,subtitle,material,exit_kind,source_y,floor_y) in enumerate(NAMES):
    chapter=next(c for c in CHAPTERS if c['start']<=i<c['start']+c['count'])
    ident=f'{i+1:02d}'
    elevation=0
    bottom=310 if i in [9,13] else 325 if i in [14,15,18,19,20,21,22,25] else 342
    room={'id':ident,'index':i,'name':name,'subtitle':subtitle,'chapter':chapter['id'],'x':i*(W+CONNECTOR),'width':W,'height':H,'sourceFloorY':source_y,'floorY':floor_y,'walkTop':floor_y+18,'walkBottom':bottom,'elevation':elevation,'material':material,'exit':exit_kind,'sourceSheet':f'assets/source/fase-{chapter["id"]}.png','sourceCell':i%4,'wall':f'assets/{chapter["id"]}/{ident}-pared.png','floor':f'assets/{chapter["id"]}/{ident}-suelo.png','image':f'assets/{chapter["id"]}/{ident}-completo.png','props':[],'ambient':[]}
    # Hand-place a few foreground silhouettes, always outside the clear center lane.
    if chapter['id']=='ciudad':
        decorations=[('farola',75,floor_y+6,78),('banco',470,floor_y+6,35),('jardinera',565,340,34)]
        if i in [0,3,4,6,10]:decorations[2]=('arbol',570,355,170)
        if i in [2,8]:decorations[1]=('obras',485,floor_y+5,34)
        if i in [9,11]:decorations[1]=('baranda',450,floor_y+5,40)
        room['ambient']=[{'kind':'leaves','seed':i*17+5}]
        if i==4:room['ambient'].append({'kind':'water','x':380,'y':floor_y-48,'width':180})
        if i in [4,5]:room['props'].append({'name':'water-loop','x':210 if i==4 else 490,'y':floor_y+5,'height':62,'animated':0,'behind':True})
        if i in [3,6]:room['props'].append({'name':'leaves-loop','x':90,'y':122,'height':62,'animated':1,'behind':True})
    elif chapter['id']=='castillo':
        foreground=[('barril',52),('jardinera',48),('cofre',43),('cajas',46),('brasero',58),('jardinera',49),('barril',52),('cajas',47),('cofre',43),('brasero',57)][i-12]
        decorations=[('escudo',98,floor_y+5,48),('barril',510,floor_y+5,42),(foreground[0],580,349,foreground[1])]
        if i in [13,17]:decorations[0]=('jardinera',95,floor_y+6,50)
        if i==15:decorations[1]=('cajas',510,floor_y+5,43)
        if i==18:decorations[1]=('atril',475,floor_y+4,57)
        if i==19:decorations[1]=('torno',470,floor_y+4,48)
        room['ambient']=[{'kind':'embers','x':672,'y':floor_y-112,'seed':i*11}] if i%2==0 else []
    else:
        foreground=[('pilar',145),('cable',28),('tubos',66),('caja',42),('pilar',144),('cable',32)][i-22]
        decorations=[('consola',80,floor_y+5,52),('muestra',510,floor_y+5,67),(foreground[0],595,352,foreground[1])]
        if i==27:decorations=[('pedestal',65,floor_y+6,38),('carro',555,floor_y+4,40),('cable',555,354,35)]
        if i in [23,24,26]:room['props'].append({'name':'dna-loop','x':352,'y':floor_y+5,'height':79,'animated':0,'behind':True})
        if i in [22,24,25]:room['props'].append({'name':'fan-loop','x':135,'y':76,'height':29,'animated':1,'behind':True})
        room['ambient']=[{'kind':'circuit','seed':i*19,'x':300,'y':floor_y-58}]
        if i==27:room['ambient'].append({'kind':'reactor','x':320,'y':122,'width':94,'height':104})
    for j,(prop,x,y,height) in enumerate(decorations):
        room['props'].append({'name':prop,'x':x,'y':y,'height':height,'behind':j<2,'collider':{'rx':13 if prop in ['arbol','pilar'] else 18,'ry':7} if j==2 else None})
    # Grounded clusters give each prop a purpose and a scale relative to Ben.
    # Solid feet occupy the edges of the lane; the central route stays clear.
    if chapter['id']=='ciudad':
        clusters=[('papelera',515,floor_y+8,29),('hidrante',126,floor_y+9,28),('papelera',530,floor_y+8,29),('jardinera',155,floor_y+7,28),('papelera',548,floor_y+9,29),('papelera',545,floor_y+9,29),('jardinera',460,floor_y+7,30),('quiosco',110,floor_y+9,88),('jardinera',135,floor_y+8,30),('pilar',112,floor_y+7,57),('jardinera',142,floor_y+8,30),('portal',115,floor_y+6,76)]
        extra=clusters[i]
    elif chapter['id']=='castillo':
        clusters=[('cajas',468,floor_y+8,40),('brasero',155,floor_y+7,47),('cofre',145,floor_y+10,34),('escudo',462,floor_y+7,47),('cofre',150,floor_y+8,35),('jardinera',490,floor_y+9,34),('cofre',545,floor_y+9,31),('cajas',535,floor_y+9,36),('lampara',132,floor_y-48,30),('cajas',455,floor_y+8,37)]
        extra=clusters[i-12]
    else:
        extra=[('carro',155,floor_y+9,36),('tubos',463,floor_y+8,40),('carro',145,floor_y+9,37),('cable',470,floor_y+9,17),('sensor',145,floor_y+8,61),('consola',125,floor_y+8,48)][i-22]
    prop,x,y,height=extra
    room['props'].append({'name':prop,'x':x,'y':y,'height':height,'behind':True,'mounted':prop=='lampara'})
    # Bridge and rampart railings explain the narrower walkable lane.
    if i in [9,13]:
        for x in [85,260,435,610]:
            room['props'].append({'name':'baranda','x':x,'y':bottom+30,'height':39,'behind':False,'collider':{'rx':69,'ry':5}})
    rooms.append(room)

# The playable art is authored as three long phase panoramas. Room labels are
# landmarks within a panorama, not a background image switch every screen.
phase_art=[]
cursor=0
for chapter,rows in zip(CHAPTERS,[3,3,2]):
    chapter['entry']=None if chapter['id']=='laboratorio' else 'Entrar al castillo' if chapter['id']=='ciudad' else 'Entrar al laboratorio'
    source=Image.open(ART/'source'/f'fase-{chapter["id"]}.png').convert('RGBA')
    folder=ART/'phases'/chapter['id'];folder.mkdir(parents=True,exist_ok=True)
    overlap=64
    # Repeated doorway views at strip ends are trimmed at their physical reveal,
    # so a gate isn't shown twice. No scenery is stretched horizontally.
    trims={'ciudad':[(0,0),(305,0),(245,0)],'castillo':[(680,0),(0,0),(0,0)],'laboratorio':[(0,0),(245,0)]}[chapter['id']]
    pivots={'ciudad':[290,270,270],'castillo':[275,270,280],'laboratorio':[250,250]}[chapter['id']]
    panels=[]
    for row in range(rows):
        left,right=trims[row]
        cell=source.crop((1+left,round(row*source.height/rows)+1,source.width-1-right,round((row+1)*source.height/rows)-1))
        width=round(cell.width/cell.height*H)
        raw=fit_panel(cell,width,H)
        # Camera registration: rear walls are cropped above the view, the floor
        # is its own layer projected into the broad beat-em-up walking plane.
        pivot=pivots[row];panel=Image.new('RGBA',(width,H))
        panel.paste(raw.crop((0,0,width,pivot)),(0,208-pivot))
        panel.paste(raw.crop((0,pivot,width,H)).resize((width,H-208),Image.Resampling.NEAREST),(0,208))
        panels.append(panel)
    total=sum(p.width for p in panels)-(rows-1)*overlap
    chapter.update(x=cursor,end=cursor+total,segments=[])
    assembled=Image.new('RGBA',(total,H))
    offset=0
    for row,panel in enumerate(panels):
        strip_width=panel.width
        prefix=f'assets/phases/{chapter["id"]}/{row+1:02d}'
        panel.save(OUT/f'{prefix}-completo.png',optimize=True)
        panel.crop((0,0,strip_width,208)).save(OUT/f'{prefix}-pared.png',optimize=True)
        panel.crop((0,208,strip_width,H)).save(OUT/f'{prefix}-suelo.png',optimize=True)
        assembled.paste(panel,(offset,0))
        chapter['segments'].append({'x':cursor+offset,'width':strip_width,'height':H,'overlap':overlap if row else 0,'image':f'{prefix}-completo.png','wall':f'{prefix}-pared.png','floor':f'{prefix}-suelo.png'})
        offset+=strip_width-overlap
    splits={'ciudad':[[0,.3,.5,.75,1],[0,.3,.58,.8,1],[0,.45,.62,.82,1]],'castillo':[[0,.2,.45,.7,1],[0,.4,.65,1],[0,.4,.74,1]],'laboratorio':[[0,.2,.6,1],[0,.34,.57,1]]}[chapter['id']]
    ranges=[]
    for row,marks in enumerate(splits):
        start=chapter['segments'][row]['x']-cursor
        stop=chapter['segments'][row+1]['x']-cursor if row+1<rows else total
        ranges.extend((round(start+a*(stop-start)),round(start+b*(stop-start))) for a,b in zip(marks,marks[1:]))
    for n,(local,end) in enumerate(ranges):
        room=rooms[chapter['start']+n]
        old_floor=room['floorY'];ratio=(end-local)/W
        room['props']=[p for p in room['props'] if not (p.get('animated')==1)]
        room.update(x=cursor+local,width=end-local,floorY=208,sourceFloorY=208,elevation=0,walkTop=226,walkBottom=310 if room['index'] in [9,13] else 342,sourceSheet=f'assets/source/fase-{chapter["id"]}.png',sourceCell=n,connection=None)
        for prop in room['props']:
            prop['x']=round(prop['x']*ratio);prop['y']+=208-old_floor
            if prop.get('collider') and prop['y']>room['walkBottom']+15:prop['y']=room['walkBottom']+26
        for a in room['ambient']:
            if 'x' in a:a['x']=round(min(620,a['x'])*ratio)
            if 'y' in a:a['y']+=208-old_floor
        # Gallery assets are landmarks cropped from the actual panorama.
        center=(local+end)//2;left=max(0,min(total-W,center-W//2));tile=assembled.crop((left,0,left+W,H))
        (OUT/room['image']).parent.mkdir(parents=True,exist_ok=True)
        tile.save(OUT/room['image'],optimize=True)
        tile.crop((0,0,W,208)).save(OUT/room['wall'],optimize=True)
        tile.crop((0,208,W,H)).save(OUT/room['floor'],optimize=True)
    cursor+=total+128
    phase_art.extend(chapter['segments'])

puzzle_room=rooms[18]
puzzles=[{'id':'archivo','chapter':'castillo','room':18,'x':puzzle_room['x']+round(puzzle_room['width']*.67),'y':248,'width':112,'height':48,'name':'Mesa de los sellos','reserved':True,'description':'Alcoba del archivo con atril y cofre; espacio reservado para un puzzle de sellos. Sin bloquear el recorrido.'}]

props={}
for chapter,names in PROP_NAMES.items():
    source=Image.open(ART/'source'/f'props-{chapter}.png').convert('RGBA')
    folder=ART/'props'/chapter;folder.mkdir(parents=True,exist_ok=True)
    entries=[]
    for row in range(4):
        for col in range(6):
            cell=source.crop((round(col*source.width/6),round(row*source.height/4),round((col+1)*source.width/6),round((row+1)*source.height/4)))
            data=np.asarray(cell);mask=data[:,:,3]>180
            labels,count=ndimage.label(mask)
            sizes=np.bincount(labels.ravel());sizes[0]=0
            if not count or sizes.max()<35:raise ValueError(f'Empty prop: {chapter}:{row}:{col}')
            keep=sizes>max(18,sizes.max()*.005);keep[0]=False
            yy,xx=np.nonzero(keep[labels]);box=(max(0,int(xx.min())-4),max(0,int(yy.min())-4),min(cell.width,int(xx.max())+5),min(cell.height,int(yy.max())+5))
            image=cell.crop(box)
            name=names[row*6+col] if row<2 else f'animation-{row-2}-{col}'
            file=f'assets/props/{chapter}/{name}.png';image.save(OUT/file,optimize=True)
            entries.append({'name':name,'file':file,'width':image.width,'height':image.height,'anchorX':cell.width/2-box[0],'anchorY':image.height-4,'row':row,'column':col})
    props[chapter]={'static':entries[:12],'animations':[{'name':'agua' if chapter=='ciudad' else 'antorcha' if chapter=='castillo' else 'adn','frames':entries[12:18],'fps':7,'loop':True,'referenceHeight':max(p['height'] for p in entries[12:18]),'anchor':'bottom'},{'name':'viento' if chapter=='ciudad' else 'tela' if chapter=='castillo' else 'rotor','frames':entries[18:24],'fps':8,'loop':True,'referenceHeight':max(p['height'] for p in entries[18:24]),'anchor':'top' if chapter=='castillo' else 'bottom'}]}

manifest={'version':3,'title':'El camino de los Eternos','width':CHAPTERS[-1]['end'],'height':H,'sceneWidth':W,'connectorWidth':0,'chapterGap':128,'chapters':CHAPTERS,'rooms':rooms,'props':props,'puzzles':puzzles,'player':{'file':'assets/ben-reference.png','cellWidth':96,'cellHeight':96,'anchorX':48,'anchorY':88,'bodyHeight':56,'walkRows':{'down':0,'up':1,'right':2,'left':3},'idleRow':4},'enemies':[],'combat':False}
(OUT/'data/recorrido.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
(OUT/'data/recorrido.js').write_text('window.BEN10_MAPS='+json.dumps(manifest,ensure_ascii=False)+';\n')
print(f'Built 3 panoramic phases, {len(phase_art)} long art sections, {len(rooms)} landmarks, 36 props and 6 animated sprite loops.')

# Preserve V35 native source registration and authored object clusters on rebuild.
import subprocess,sys
subprocess.run([sys.executable,str(ROOT/"scripts/refine-map-layout.py")],check=True)
