# Ben 10 — Demo PC V37 · El Rey Eterno

V37 añade al **Rey Eterno** en el último tramo del laboratorio, después de despejar la última oleada. Su vida tiene tres fases: armadura cristalina con defensa rompible, furia con embestidas y esquivas, y retirada sin cristal con ayudantes básicos. Solo **Cuatro Brazos y Fuego** están disponibles al empezar. Derrotar al rey y terminar su caída desbloquea a **Diamante**, con una pantalla de recompensa y guardado persistente. Los otros siete aliens del catálogo permanecen bloqueados.

V36 reduce la vida compartida a **50 PV**: Ben y los diez aliens mantienen la misma vida máxima y la misma vida restante al transformarse. Las defensas de cada alien siguen siendo distintas. El reloj tiene **90 de energía**, los ataques de Ben hacen menos daño y los caballeros coordinan mejor sus movimientos a medida que avanza el recorrido.

V35 incorpora los Caballeros Eternos al recorrido: cinco roles con tres rangos de armadura, 16 combates, 28 oleadas y un campeón con hacha al final de cada fase. Las arenas bloquean el avance hasta eliminar la última oleada; los apoyos priorizan aliados de mayor rango y sus curas se pueden interrumpir. Los fondos se restauraron en 29 tramos de mayor resolución, con solapamientos continuos, objetos recolocados y agua animada sobre la fuente del parque.

Al llegar a una entrada, pulsa **E** o el botón para pasar a la siguiente fase. La transformación, la vida, la energía, la experiencia y las mejoras se conservan. Los proyectiles, venenos y acciones de la zona anterior se limpian. El final del laboratorio permite volver al inicio del recorrido.

V33 simplifica las conexiones de los árboles y añade poses dibujadas para las 70 técnicas de los diez aliens. Conserva los sprites originales de movimiento y ataques básicos, el escenario y el cómic.

## Jugar

Extrae toda la carpeta y abre [index.html](index.html) en Chrome, Edge o Firefox de PC. Mantén `assets` junto al HTML. También puedes ejecutar `npm start` y visitar http://localhost:8000.

| Acción | Control |
| --- | --- |
| Moverse | WASD / flechas |
| Entrar al castillo / laboratorio | E o botón de entrada |
| Ataque leve / fuerte | Clic izquierdo / derecho |
| Dash | Espacio |
| Omnitrix y elección | R, después 1–9 o 0 |
| Volver a Ben | T |
| Árbol de habilidades | K |
| Habilidad aprendida | F |
| Añadir puntos para probar | F9 |

El prólogo mantiene su fondo blanco, «Da clic» y avance automático. Esc permite entrar directamente a la demo.

## Árboles y progresión

Cada alien conserva sus 24 mejoras y su propia forma de árbol. Hay una conexión principal por nodo: 23 conexiones por árbol, con énfasis en la mejora seleccionada. Atributos, seis combos y F siguen mezclados. Los aliens comienzan con atributos limitados y mejoran mediante compras.

Las partidas V32 conservan las mejoras aprendidas, nivel, XP y puntos aunque cambie el recorrido de las conexiones. Las versiones anteriores a V32 conservan nivel y XP y recuperan sus puntos. Las técnicas sólo se ejecutan al aprenderlas y completar su combinación; la vista previa indica entrada, coste y requisitos.

## Selección de objetivo y energía

Las técnicas dirigidas dan prioridad al enemigo golpeado durante el combo. Si no hay uno válido, eligen el que señalas con el ratón, el que está frente al personaje o el más cercano dentro del sector frontal. Un aro en el suelo indica la selección.

Cada técnica conserva su alcance y respeta los obstáculos. Las invocaciones fijan el punto al comenzar: un enemigo que se aparta puede esquivarlas. Los agarres pueden fallar antes de sujetar al enemigo; la técnica no cambia de víctima a mitad de animación.

Si intentas una técnica sin energía suficiente, el reloj del HUD destella en rojo y recupera su color. No aparece texto de energía insuficiente ni se gasta energía.

## Nuevas técnicas

Las hojas nuevas contienen seis poses dibujadas por técnica y vista: anticipación, carga, acción, contacto, seguimiento y recuperación. Son 1.260 poses en 70 atlas, con vistas frontal, trasera y lateral; la izquierda refleja la lateral. No se deforma la textura del sprite original para simular una extremidad nueva. Los originales completos están en `assets/skills/source-v33`.

La coreografía implementa agarres y caídas reales, desplazamientos barridos, órbita de una pasada, intangibilidad, rebotes, proyectiles y efectos de suelo. La barrera de Diamante es defensiva; el cañón ocular atraviesa enemigos y se detiene ante obstáculos. El torpedo líquido emerge en un punto fijo y puede fallar. El daño de los proyectiles conserva la potencia de la forma al lanzarlos.

## Desarrollo

- `npm test`: progresión y combate, validación de los 1.260 fotogramas, ejecución de las 70 técnicas en Chromium y revisión de direcciones y arranque independiente.
- `npm run build:evolution`: incrusta catálogo, interfaz y código editable en el HTML.
- `npm run build:skill-sprites`: extrae y registra las láminas nuevas, empaqueta los atlas e incrusta sus metadatos. Requiere Python 3, Pillow, NumPy y SciPy.
- `npm run test:legacy`: pruebas históricas; algunas expectativas de interfaz y balance pertenecen a versiones anteriores.

Los sistemas de V33 están en `systems/skill-choreography-v33.js` y `systems/skill-effects-v33.js`. La interfaz y progresión siguen en `systems/evolution-v32.js`; el nombre se conserva para mantener las herramientas existentes.

## Mapas y colisiones

`systems/campaign-world.js` comparte la geometría entre caminar, dash, XLR8, Cannonbolt, intangibilidad, desplazamientos de técnicas y proyectiles. Examina el segmento completo para detener movimientos rápidos ante obstáculos o pasos estrechos. El tamaño del suelo y la cámara se mantienen al transformarse; Ben y los aliens conservan sus proporciones originales. El ratón tiene en cuenta las bandas de encuadre y la densidad de la pantalla.

- `npm run build:campaign`: incrusta los módulos de combate y los nuevos mapas en el HTML.
- `npm run test:campaign`: comprueba la geometría y recorre las tres fases en Chromium con los diez aliens.
- `npm run package:campaign`: prepara la demo PC completa en `/workspace/outputs`.

El [visor de arte](mapas/index.html) y la [documentación de capas](mapas/README.md) siguen disponibles para revisar los fondos por separado. El juego utiliza esos mismos panoramas.

## Caballeros Eternos

Los [sprites de Caballeros Eternos](enemigos/index.html) se revisan en un visor separado: cinco especialidades con tres rangos y dos campeones con hacha, con reposo, caminata, dos acciones, golpe y derrota. El [catálogo](enemigos/catalogo.html) permite ver las 17 variantes juntas. El juego utiliza sus atlas y animaciones en el combate. Consulta [los archivos y sus anclajes](enemigos/README.md).

Consulta [el combate del jefe y los desbloqueos de V37](docs/v37-rey-eterno.md), [los ajustes de vida, reloj e IA de V36](docs/v36-balance.md) y [el sistema de encuentros](docs/v35-combate.md). Las pruebas de combate se ejecutan con `npm run test:combat` y `npm run test:boss`; `npm run package:campaign` genera el ZIP completo de V37 para jugar sin conexión.

## Rey Eterno · arte del jefe final

El [visor del Rey Eterno](jefe-final/index.html) contiene los mismos sprites que usa el jefe jugable: tres fases, 19 animaciones y 114 poses nuevas. Incluye ruptura de defensa, embestida, esquiva, invocación, caída real y ADN de Diamante. El [contrato de animación](jefe-final/README.md) documenta sus eventos. El visor se reconstruye con `npm run build:king`, se verifica con `npm run test:king` y se exporta por separado con `npm run package:king`.
