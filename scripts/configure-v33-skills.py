"""Authored timing matches the new six-pose clips; original basic attacks are untouched."""
import json
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'assets/skills/catalog.json'
book=json.loads(p.read_text())
# [duration, contacts, damage, reach, movement], one row per F and six learned combos.
timings={
 'four-arms':[(1.12,[.56],70,170,0),(1.5,[.59],48,105,115),(1.35,[.4,.64],25,112,35),(1.25,[.56],48,235,0),(1.7,[.74],57,360,0),(1.6,[.75],65,155,0),(1.3,[.3,.45,.6,.75],21,140,0)],
 'heatblast':[(1.4,[.56],45,150,0),(1.35,[.56],38,115,30),(1.8,[.4,.55,.7],20,80,115),(1.4,[.4,.73],28,365,0),(1.5,[.44,.52,.6,.68],14,240,0),(1.6,[.35,.47,.59,.71],18,145,0),(1.65,[.56],75,280,0)],
 'xlr8':[(1.05,[.49],38,70,245),(.95,[.49],37,110,240),(1.5,[.3,.44,.59,.73],12,155,0),(1.15,[.54],42,120,165),(1.35,[.56],50,90,140),(1.2,[.56],42,280,0),(1.3,[.3,.51,.72],24,75,220)],
 'diamondhead':[(1.25,[.4],0,0,0),(1.35,[.56],47,150,0),(1.4,[.4,.65],30,145,0),(1.35,[.56,.66,.76],26,260,0),(1.5,[.56],42,220,0),(1.45,[.56],19,240,0),(1.8,[.44,.52,.6,.68,.76],23,320,0)],
 'cannonbolt':[(1.55,[.7],65,165,115),(1.8,[.4,.62,.83],22,105,0),(1.3,[.49,.65],24,120,95),(1.65,[.66],66,105,240),(1.5,[.4,.54,.68],21,125,0),(1.35,[.34,.68],39,105,220),(2.0,[.74],84,190,90)],
 'ghostfreak':[(1.4,[.56],43,150,0),(1.85,[.59,.73],22,135,40),(1.55,[.56,.73],24,230,0),(1.8,[.75],59,155,0),(2.1,[.52,.62,.72],21,135,170),(1.4,[.3,.45,.6,.75],19,150,0),(1.65,[.56],62,205,0)],
 'stinkfly':[(1.5,[.38,.49,.6,.71],10,210,0),(1.5,[.71],45,155,20),(1.3,[.27,.41,.56,.73],11,300,0),(1.6,[.7],48,135,155),(1.25,[.56],34,330,0),(1.4,[.44,.65],28,170,0),(1.8,[.36,.48,.6,.72],16,235,0)],
 'wildvine':[(1.75,[.46,.6,.74],30,250,0),(1.4,[.4,.65],25,210,0),(1.5,[.73],38,245,0),(1.4,[.3,.45,.6,.75],22,170,0),(1.5,[.4,.73],32,300,0),(1.6,[.56],49,220,0),(2.0,[.44,.56,.68,.8],29,250,0)],
 'blitzwolfer':[(1.3,[.56,.69],27,280,0),(1.25,[.4,.65],25,135,30),(1.2,[.56],45,115,130),(1.9,[.44,.56,.68],21,135,180),(1.4,[.32,.5,.68],23,150,0),(1.65,[.4,.56,.75],23,145,50),(1.8,[.44,.56,.7],29,350,0)],
 'upgrade':[(1.45,[.56],48,160,0),(1.4,[.56],45,165,35),(1.35,[.4,.65],28,175,30),(1.85,[.56,.66,.76],27,390,0),(1.55,[.27,.41,.56,.73],15,250,0),(1.5,[.4,.56,.73],26,320,0),(1.7,[.59],74,80,180)]
}
descriptions={
 'four-arms':['Aplaude con los dos pares de manos. Conserva la onda de choque circular del seísmo.','Salta como un luchador y cae con el codo por delante.','Dos uppercuts alternos desde los hombros; el par inferior mantiene la guardia.','Abre los cuatro brazos y junta ambos pares hacia delante.','Recoge del suelo una roca enorme, la carga al hombro y la lanza.','Agarra al rival de enfrente, lo levanta y lo estrella contra el suelo.','Gira de verdad con los cuatro puños y golpea alrededor.'],
 'heatblast':['Carga las llamas junto al cuerpo y estalla en un anillo solar.','Carga un puño enorme de magma. El impacto sacude la cámara y empuja al rival.','Levanta el cuerpo con dos chorros hacia abajo, avanza y quema el suelo antes de aterrizar.','Lanza dos grandes bolas de fuego, una con cada mano.','Se agacha y apoya ambas palmas: las llamas recorren el suelo hacia delante.','Prepara el giro y se convierte en un tornado de fuego.','Dispara un rayo al suelo y hace surgir una gran erupción delante.'],
 'xlr8':['Toma impulso y embiste con el puño por delante.','Carga y dispara una patada todavía más rápida.','Fija al rival de enfrente y lo golpea desde varios ángulos entre retiradas veloces.','Derrapa sobre sus ruedas con la pierna y la cola contrapesando el cuerpo.','Completa una sola órbita. Cada enemigo recibe un impacto por pasada.','Una patada rapidísima lanza un corte de viento a distancia.','Tres cambios rápidos de dirección con zarpazos en el recorrido.'],
 'diamondhead':['Endurece su cuerpo con cuarzo durante tres segundos. Es defensiva y no inflige daño.','Apunta al suelo y hace surgir una cuchilla de cristal delante.','Moldea ambos brazos como lanzas y corta en X a corta distancia.','Un pisotón hace crecer geodas hacia delante.','Dirige los cristales para encerrar al rival que tiene enfrente.','Apunta al suelo y levanta un abanico de astillas, sin dispararlas desde los brazos.','Planta ambas palmas y levanta una secuencia de pilares enormes hacia delante.'],
 'cannonbolt':['Se hace bola, salta y cae con una compresión clara de la coraza.','Rebota tres veces en el mismo sitio, dañando al aterrizar.','Rueda hacia delante y se abre antes del contacto para golpear con las garras.','Carga quieto hasta calentar la coraza y sale disparado con toda la potencia.','Revoluciona la coraza sin avanzar; la tierra que levanta golpea delante.','Embestida veloz de ida y vuelta, con un contacto en cada pasada.','Encadena botes cada vez más altos y cae como un cometa en llamas.'],
 'ghostfreak':['Abre la piel y libera los tentáculos anillados del vientre.','Desaparece un segundo y reaparece con dos garras dentro de la misma técnica.','Abre su vientre y usa sus tentáculos como dos látigos hacia delante.','Los tentáculos agarran al rival de enfrente, lo levantan y lo estampan.','Se hunde, avanza bajo el suelo y golpea con tentáculos enormes antes de reaparecer.','Gira sobre su eje con una silueta limpia y la cola recogida.','Abre todo el vientre y despliega sus tentáculos para aterrorizar a los enemigos cercanos.'],
 'stinkfly':['Apunta los cuatro conductos al suelo y deja una nube corrosiva delante.','Se eleva con las alas y clava la cola en un arco de escorpión.','Cuatro escupitajos con retrocesos distintos, uno por conducto.','Abre las alas, sube y cae de punta con cola y veneno.','Recoge los conductos y escupe una gran masa adhesiva hacia delante.','Afirma las cuatro patas y barre el frente con la cola.','Vuela y descarga varias gotas venenosas antes de posarse.'],
 'wildvine':['Planta los brazos y levanta raíces mayores con flores bomba.','Dos látigos alternos de sus brazos vegetales que cruzan el frente.','Alarga una liana, atrae al rival de enfrente y termina con un puñetazo.','Enrosca las raíces y gira los brazos con espinas.','Arranca dos semillas del cuerpo y las lanza como bombas.','Se pega al suelo para levantar una jaula de espinas delante.','Enraíza los brazos y hace crecer una planta carnívora que muerde al rival cercano y se retira.'],
 'blitzwolfer':['Abre la boca en cuatro partes y proyecta su aullido sónico.','Dos arañazos diagonales, uno con cada garra, forman una X.','Se lanza y muerde abriendo las cuatro partes de la mandíbula.','Salta al rival de enfrente, araña y muerde; después vuelve al punto de salida.','Gira el cuerpo y ataca con las garras alrededor.','Agarra al rival, alterna arañazos y termina arrojándolo al suelo.','Se afirma y abre toda su mandíbula para un aullido muchísimo mayor.'],
 'upgrade':['Se moldea como un escudo circular, emite un pulso y refuerza su defensa.','Moldea un puño pistón enorme y lo estampa hacia delante.','Forma dos cuchillas y realiza cortes cruzados.','Todo el cuerpo se convierte en un cañón ocular. El rayo alcanza a todos los que cruza hasta una pared.','Convierte los brazos en cables elásticos y golpea cuatro veces al frente.','Dispara tres láseres consecutivos desde el ojo.','Se hace líquido y emerge con un uppercut en un punto fijo delante. Si no hay enemigo allí, falla.']
}
for spec in book:
 for row,(skill,values) in enumerate(zip(spec['skills'],timings[spec['id']])):
  skill.update(zip(['duration','contacts','damage','reach','move'],values))
  skill['description']=descriptions[spec['id']][row]
  skill['artVersion']=33
  skill.pop('layout',None)
  if spec['id']=='diamondhead' and row==0:skill['style']='barrier'
  if spec['id']=='diamondhead' and row==2:skill['style']='melee'
  if spec['id']=='upgrade' and row==4:skill['style']='whip'
p.write_text(json.dumps(book,ensure_ascii=False,indent=2)+'\n')
