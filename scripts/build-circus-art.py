"""Register newly drawn circus poses and describe the three art-only routes."""
from pathlib import Path
import json,hashlib,importlib.util,argparse
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'fase2-circo'
spec=importlib.util.spec_from_file_location('enemy_art_registration',ROOT/'scripts/build-enemy-sprites.py')
baker=importlib.util.module_from_spec(spec)
spec.loader.exec_module(baker)
baker.OUT=OUT
baker.ROLE_MOVES={'fuerte':('Mazazo descendente','Barrido del mazo'),'rapido':('Ataque fugaz de bastones','Patada y retirada'),'tramposo':('Lanzamiento de bomba','Finta y bomba rasante')}
baker.TIER_NOTES={'normal':'Secuaz del circo de Zombozo. Poses completas dibujadas, vista lateral en tres cuartos.','loco':'Rango avanzado: vestuario reforzado, maquillaje alterado y gestos más agresivos. No es un cambio de color del atlas normal.'}
roles=[{'id':'fuerte','label':'Fuertes','name':'Coloso del circo'},{'id':'rapido','label':'Rápidos','name':'Saltimbanqui'},{'id':'tramposo','label':'Tramposos','name':'Artificiero'}]
def build_units(partial):
    units=[]
    for role in roles:
        for tier in ['normal','loco']:
            ident=role['id']+'-'+tier
            if not (OUT/'assets/source'/f'{ident}.png').exists():
                if partial:continue
                raise FileNotFoundError(ident)
            unit={'id':ident,'role':role['id'],'roleLabel':role['label'],'name':role['name']+(' loco' if tier=='loco' else ''),'tier':tier,'tierLabel':'Loco' if tier=='loco' else 'Normal','kind':'henchman','bodyHeight':{'fuerte':112 if tier=='normal' else 122,'rapido':80 if tier=='normal' else 84,'tramposo':92 if tier=='normal' else 96}[role['id']]}
            result=baker.register(unit)
            walk={'fuerte':130,'rapido':75,'tramposo':110}[role['id']]
            if tier=='loco':walk-=10
            result['animations']['walk']['durations']=[walk]*6
            result['animations']['attack']['durations']={'fuerte':[160,210,110,90,180,220],'rapido':[80,70,50,65,70,115],'tramposo':[120,170,80,80,120,150]}[role['id']]
            result['animations']['secondary']['durations']={'fuerte':[150,180,100,100,170,210],'rapido':[75,80,50,70,100,140],'tramposo':[110,140,100,90,150,170]}[role['id']]
            result['animations']['defeat']['durations']=[100,130,160,180,220,420]
            (OUT/result['atlas']).with_suffix('.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
            units.append(result)
            print('Registered',ident,flush=True)
    return units

def backgrounds():
    result=[]
    for i,(ident,name,summary) in enumerate([('01-vestibulo','Vestíbulo de la carpa','Entrada, taquilla y galería del espectáculo.'),('02-obstaculos','El espectáculo de obstáculos','Bastidores, aparatos y la zona de las trampas.'),('03-escenario','Escenario principal','Gradas, pista central y arena final reservada.')]):
        order=[ident+'-a',ident+'-b',ident] if i==2 else [ident,ident+'-b',ident+'-c']
        files=[OUT/'assets/backgrounds'/f'{key}.png' for key in order if (OUT/'assets/backgrounds'/f'{key}.png').exists()]
        if not files:continue
        tiles=[];cursor=0
        placements=[[0,780,1670],[0,780,1620],[0,865,1607]][i]
        joins=[[1020,1814],[1055,1819],[912,1740]][i]
        for n,file in enumerate(files):
            w,h=Image.open(file).size;width=w/h*360;overlap=0 if n==0 else width*.24
            x=placements[n];overlap=0 if n==0 else cursor-x
            tiles.append({'file':str(file.relative_to(OUT)),'x':round(x,3),'width':round(width,3),'height':360,'nativeWidth':w,'nativeHeight':h,'overlap':round(overlap,3),'sha256':hashlib.sha256(file.read_bytes()).hexdigest()})
            cursor=x+width
        result.append({'id':ident,'name':name,'summary':summary,'index':i,'height':360,'width':round(cursor,3),'tiles':tiles,'floorTop':230,'floorBottom':347,'entryMirror':{'x':65 if i==2 else 49,'y':228,'mode':'separate' if i==2 else 'painted'} if i else None,'exitMirror':{'x':round(cursor-85,3),'y':228,'mode':'separate'} if i<2 else None,'bossArena':{'left':round(cursor*.66,3),'right':round(cursor-50,3)} if i==2 else None,'seams':joins[:max(0,len(tiles)-1)],'next':i+1 if i<2 else None})
    return result

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--allow-partial',action='store_true');args=parser.parse_args()
    units=build_units(args.allow_partial)
    manifest={'version':1,'title':'Fase 2 · El circo de Zombozo','artOnly':True,'gameplayIntegrated':False,'bossIncluded':False,'roles':roles,'tiers':['normal','loco'],'animationKeys':['idle','walk','attack','secondary','hurt','defeat'],'units':units,'totalCharacterPoses':len(units)*36,'routes':backgrounds(),'referencePlayer':{'file':'assets/context/ben.png','cellWidth':96,'cellHeight':96,'anchorX':48,'anchorY':88,'sourceBodyHeight':56,'bodyHeight':70},'connections':[{'from':0,'through':'ruta-cristal','to':1},{'from':1,'through':'ruta-cristal','to':2}],'bombTypes':[{'id':'explosiva','name':'Explosiva','visual':'Detonación naranja y humo.'},{'id':'acida','name':'Ácida','visual':'Estallido verde y charco burbujeante.','futureRules':{'damageOverTime':True,'nonLethal':True}},{'id':'confeti','name':'Confeti','visual':'Papeles de color y destellos de curación.','futureRules':{'playerDamage':0,'healsClowns':True}}]}
    for key in ['fx','props']:
        file=OUT/'data'/f'{key}.json'
        if file.exists():manifest[key]=json.loads(file.read_text())
    for key,file in [('entrance','00-entrada.png'),('mirrorRealm','ruta-cristal.png')]:
        p=OUT/'assets/backgrounds'/file
        if p.exists():
            w,h=Image.open(p).size;manifest[key]={'file':str(p.relative_to(OUT)),'nativeWidth':w,'nativeHeight':h,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    (OUT/'data/manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    (OUT/'data/catalog.js').write_text('window.BEN10_CIRCUS_ART='+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\n')
    print(f'Built {len(units)} variants / {len(units)*36} drawn poses / {len(manifest["routes"])} panorama routes.')
if __name__=='__main__':main()
