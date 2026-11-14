from pathlib import Path
import json
root=Path(__file__).resolve().parents[1];art=json.loads((root/'fase2-circo/data/manifest.json').read_text());chapters=[];rooms=[];cursor=0
for n,r in enumerate(art['routes']):
 x=cursor;chapter={'id':r['id'],'name':r['name'],'subtitle':'El circo de Zombozo','x':x,'end':x+r['width'],'entry':'Entrar al espejo','segments':[],'color':'#c7a4ed'}
 for k in range(3):
  start=k*r['width']/3;rooms.append({'index':len(rooms),'chapter':r['id'],'name':[r['name'],'La función continúa','El último acto'][k],'x':x+start,'width':r['width']/3,'floorY':230,'walkTop':230,'walkBottom':342,'elevation':0,'props':[],'ambient':[]})
 chapters.append(chapter);cursor=chapter['end']+128
level={'story':'circus','version':1,'height':360,'width':cursor-128,'connectorWidth':0,'chapters':chapters,'rooms':rooms,'props':{c['id']:{'static':[],'animations':[]} for c in chapters}}
entrance={'story':'circus','version':1,'height':360,'width':1080,'connectorWidth':0,'chapters':[{'id':'circus-entrance','name':'La carpa de Zombozo','x':0,'end':1080,'segments':[],'entry':'Entrar a la carpa'}],'rooms':[{'index':0,'chapter':'circus-entrance','name':'La entrada del circo','x':0,'width':1080,'floorY':248,'walkTop':248,'walkBottom':342,'elevation':0,'props':[],'ambient':[]}],'props':{'circus-entrance':{'static':[],'animations':[]}}}
(root/'fase2-circo/data/level.json').write_text(json.dumps({'level':level,'entrance':entrance},ensure_ascii=False,indent=2)+'\n')
print('Prepared 3 circus routes and walkable tent approach')
