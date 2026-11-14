"""Register native source pixels and hand-place set dressing for the PC campaign.

This only extracts source rectangles / edits level metadata; it does not redraw art.
"""
from pathlib import Path
from PIL import Image
import json

ROOT=Path(__file__).resolve().parents[1]
file=ROOT/'mapas/data/recorrido.json';data=json.loads(file.read_text())
trims={'ciudad':[(0,0),(305,0),(245,0)],'castillo':[(680,0),(0,0),(0,0)],'laboratorio':[(0,0),(245,0)]}
pivots={'ciudad':[290,270,270],'castillo':[275,270,280],'laboratorio':[250,250]}
for chapter in data['chapters']:
    source='assets/source/fase-'+chapter['id']+'.png';image=Image.open(ROOT/'mapas'/source);rows=len(chapter['segments'])
    for row,segment in enumerate(chapter['segments']):
        left,right=trims[chapter['id']][row];top=round(row*image.height/rows)+1;bottom=round((row+1)*image.height/rows)-1;h=bottom-top;w=image.width-2-left-right
        segment['native']={'file':source,'x':1+left,'y':top,'width':w,'height':h,'wallTop':(pivots[chapter['id']][row]-208)*h/360,'wallHeight':208*h/360,'floorTop':pivots[chapter['id']][row]*h/360,'floorHeight':(360-pivots[chapter['id']][row])*h/360}

def prop(name,x,y,height,behind=True,rx=None,ry=7,mounted=False):
    item={'name':name,'x':round(x),'y':y,'height':height,'behind':behind,'mounted':mounted}
    if rx is not None:item['collider']={'rx':rx,'ry':ry}
    return item

for room in data['rooms']:
    n=room['index'];w=room['width'];bottom=room['walkBottom'];items=[]
    if room['chapter']=='ciudad':
        # Ben is 56 map units tall: lamp posts 104, benches 46, bins 37.
        if n in [0,3,4,5,6,10]:items.append(prop('farola',w*.11,219,104))
        if n in [0,4,5,6,10]:
            x=w*(.20 if n==5 else .70);items.extend([prop('banco',x,220,46),prop('papelera',x+62,221,37)])
        if n==1:items.extend([prop('hidrante',w*.18,228,31,True,9,5),prop('jardinera',w*.87,221,44)])
        if n==2:items.extend([prop('obras',w*.72,219,46),prop('papelera',w*.83,220,36),prop('jardinera',w*.91,350,44,False,24,7)])
        if n in [0,3,4,10]:items.append(prop('arbol',w*.94,357,188,False,13,7))
        if n==3:items.append(prop('jardinera',w*.25,222,43))
        if n==5:items.append(prop('jardinera',w*.94,350,44,False,25,7))
        if n==6:items.append(prop('jardinera',w*.82,350,42,False,24,7))
        if n==7:items.extend([prop('quiosco',w*.20,222,112),prop('papelera',w*.34,222,37),prop('jardinera',w*.92,350,46,False,25,7)])
        if n==8:items.extend([prop('obras',w*.79,219,47),prop('jardinera',w*.91,350,45,False,25,7)])
        if n==9:
            items.append(prop('pilar',w*.12,219,74))
            for q in [.13,.41,.69,.96]:items.append(prop('baranda',w*q,bottom+23,48,False,69,5))
        if n==11:items.extend([prop('portal',w*.18,219,112),prop('farola',w*.84,219,105)])
    elif room['chapter']=='castillo':
        if n not in [13,17]:items.append(prop('escudo',w*.16,178,45,True,mounted=True))
        if n in [12,14,16,19,20,21]:
            x=w*.82;items.extend([prop('cajas',x,221,51),prop('barril',x-49,223,54)])
        if n in [14,15,18,20]:items.append(prop('cofre',w*.92,350,51,False,26,8))
        if n in [12,16,21]:items.append(prop('brasero',w*.91,350,70,False,18,7))
        if n in [13,17]:items.extend([prop('jardinera',w*.17,220,58),prop('jardinera',w*.91,bottom+22,57,False,28,8)])
        if n==13:
            for q in [.13,.41,.69,.96]:items.append(prop('baranda',w*q,bottom+23,48,False,69,5))
        if n==15:items.append(prop('cajas',w*.77,222,56))
        if n==18:items.extend([prop('atril',w*.69,222,71),prop('cofre',w*.80,222,48)])
        if n==19:items.append(prop('torno',w*.69,222,79))
        if n==20:items.append(prop('lampara',w*.28,142,37,True,mounted=True))
    else:
        if n in [22,24,25,27]:items.append(prop('consola',w*.14,222,65))
        if n in [22,23,24,26]:items.append(prop('muestra',w*.84,222,100))
        if n in [22,24,27]:items.append(prop('carro',w*.28,224,49))
        if n in [22,26]:items.append(prop('pilar',w*.95,354,156,False,15,8))
        if n in [23,25,27]:items.extend([prop('caja',w*.90,350,54,False,24,7),prop('cable',w*.80,351,25,False,25,4)])
        if n in [23,24]:items.append(prop('tubos',w*.71,221,74))
        if n==26:items.append(prop('sensor',w*.19,183,51,True,mounted=True))
    for item in items:
        if not item['behind'] and item.get('collider') and item['name']!='arbol':item['y']=bottom+1
    room['props']=items
    room['ambient']=[a for a in room['ambient'] if a['kind']!='water']

segment=data['chapters'][0]['segments'][1]
# The ONE fountain is already painted in the panorama. Overlay water only.
data['sceneEffects']=[{'id':'fuente-pabellon','chapter':'ciudad','file':'assets/effects/fuente-agua-source.png','columns':3,'rows':2,'frames':6,'fps':8,'insetX':30,'insetY':8,'x':segment['x']+1203,'y':21,'width':259,'height':151,'blend':'screen','opacity':.48}]
data['version']=4;data['renderMode']='native-source';data['combat']=True
jobs_file=ROOT/'mapas/data/remaster-jobs.json'
if jobs_file.exists():
    jobs=json.loads(jobs_file.read_text())['jobs']
    if all((ROOT/j['output']).exists() for j in jobs):
        for chapter in data['chapters']:
            for sn,segment in enumerate(chapter['segments']):
                tiles=[]
                for job in [j for j in jobs if j['chapter']==chapter['id'] and j['segment']==sn]:
                    source=ROOT/job['output'];im=Image.open(source);assert abs(im.width/im.height-job['logicalWidth']/360)<.05,(job['id'],im.size)
                    runtime=source.parent/'runtime'/(source.stem+'.webp');runtime.parent.mkdir(exist_ok=True)
                    if not runtime.exists() or runtime.stat().st_mtime<source.stat().st_mtime:im.save(runtime,'WEBP',lossless=True,method=6,exact=True)
                    x=segment['x']+job['localX'];overlap=tiles[-1]['x']+tiles[-1]['width']-x if tiles else segment['overlap']
                    tiles.append({'file':str(runtime.relative_to(ROOT/'mapas')),'sourceFile':str(source.relative_to(ROOT/'mapas')),'x':x,'width':job['logicalWidth'],'height':360,'overlap':overlap,'nativeWidth':im.width,'nativeHeight':im.height})
                segment['tiles']=tiles
        data['renderMode']='hd-tiles';data['hdTiles']=len(jobs)
file.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(ROOT/'mapas/data/recorrido.js').write_text('window.BEN10_MAPS='+json.dumps(data,ensure_ascii=False)+';\n')
print('Registered native panorama pixels, one animated background fountain and contextual prop clusters in all 28 landmarks.')
