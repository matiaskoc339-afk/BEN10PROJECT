# Ben 10 · Demo PC V34

La demo ya recorre los nuevos mapas de **El camino de los Eternos**. La antigua plaza de pruebas, sus maniquíes y su cartel de entrenamiento se sustituyen por tres fases: calles y parques, castillo de los Eternos y laboratorio de ADN de Diamante. Cada fase tiene cámara lateral continua, suelo transitable, paredes y objetos con colisiones por sus pies. El archivo conserva su alcoba para un puzzle y el laboratorio su arena final; los enemigos y el jefe se añadirán después.

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
