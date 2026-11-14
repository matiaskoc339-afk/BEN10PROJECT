# Rey Eterno · sprites y animaciones

Tres versiones del mismo jefe, con **19 animaciones y 114 poses dibujadas**. El casco negro de cuernos, el rostro, la capa y el tabardo rojo conservan su identidad. La coraza y la espada usan cristal de ADN de Diamante.

Abre **index.html** después de extraer toda la carpeta. «Ver las tres fases» reproduce el recorrido de animaciones hasta la caída y la recompensa. También puedes elegir acciones, reproducirlas a 0,25×, avanzar fotograma a fotograma, cambiar de lado y comparar su altura con Ben. Los PNG y JSON se descargan desde el visor. Todas las imágenes y los datos están incluidos; no hay fuentes, servicios ni descargas externas.

Esta entrega contiene el arte, el visor y los datos para integrar el jefe. El combate jugable de la demo V36 sigue conservado; las reglas del jefe descritas abajo todavía no se ejecutan en esa demo.

| Fase | Diseño | Animaciones |
| --- | --- | --- |
| 1 · Coraza petrosapien | Cristal intacto, espada larga de doble filo con cruceta dorada | Reposo, marcha, tajo, guardia, descubierto y ruptura de defensa |
| 2 · Furia del rey | Coraza agrietada, postura agresiva | Reposo, carrera, embestida, esquiva, doble tajo, golpe recibido y rotura de armadura |
| 3 · El último mandato | Armadura normal de metal oscuro, espada quebrada | Reposo, retirada, tajo desesperado, invocación, golpe recibido y caída real con ADN |

## Reglas previstas para el combate

La primera fase protege la vida con una barra de defensa. Fuego rompe esa defensa más rápido, y los demás aliens también pueden hacerlo. Una vez rota, el rey queda descubierto y puede perder vida. La pérdida de vida permite pasar a la siguiente fase.

En la segunda fase aumenta la agresividad, la movilidad y el daño. El rey embiste con la espada y puede esquivar; la defensa cristalina resulta más fácil de romper. La transición termina retirando las placas de cristal, dejando visible la misma armadura normal de la tercera fase.

En la tercera fase desaparece la defensa, llama a soldados básicos y huye. Su derrota elimina también a sus ayudantes y entrega el ADN de Diamante. Los datos no fijan todavía cifras de vida, daño ni umbrales de fase.

## Archivos

- `assets/source`: las tres láminas dibujadas originales, sin recortar ni sobrescribir.
- `assets/reference`: diseño del rey y referencias de escala y escenario existentes.
- `assets/atlases`: PNG registrados y JSON por fase.
- `assets/posters`: primer fotograma completo de cada fase.
- `data/designs.json`: acciones, tiempos y reglas de las fases.
- `data/manifest.json` y `data/catalog.js`: el mismo catálogo; el JS permite abrir el visor sin `fetch`.
- `data/prompts.json`: instrucciones de dibujo conservadas como procedencia.

Cada acción tiene seis fotogramas. Los atlas de las fases 1 y 3 tienen seis filas; el de la fase 2 tiene siete. Lee las dimensiones de las celdas de sus JSON. Todas las poses de una fase usan una escala común y el mismo anclaje. Hay al menos 20 píxeles de margen transparente en las poses exportadas; las armas, las capas y las caídas no se cortan al atravesar la división de origen.

El rey mide 132 unidades de juego y Ben 70. Se refleja la figura completa al cambiar de lado. La retirada está dibujada mirando a la izquierda y declara `nativeFacing: "left"`; las demás acciones miran a la derecha. El renderizador respeta esa diferencia. No se retuercen ni se estiran partes del sprite para fabricar ataques.

`contactFrames` marca los contactos de espada. `eventFrames` marca las acciones de integración: `exposed`, `evadeStart`, `evadeEnd`, `armorRemoved`, `summonBasicHelpers`, `helpersDie` y `diamondheadDNA`. Son índices desde cero. `durations` usa milisegundos; `motion` y `cycleTravel` proponen desplazamientos de juego. La invocación no crea soldados en el visor: muestra la animación y el evento previsto.

La derrota se reproduce una sola vez y conserva su último fotograma. Primero cae el rey y después aparece el ADN. La pose final incluye el símbolo de ADN como parte del dibujo; el evento de recompensa permite crear un objeto recogible separado durante la integración del combate.

## Reconstruir y verificar

Desde la raíz del repositorio:

```sh
npm run build:king
npm run test:king
npm run package:king
```

El empaquetador necesita Python 3, Pillow, NumPy y SciPy. Conserva las siluetas completas y las registra; no genera las poses. Las pruebas comprueban las 114 poses, transparencia, márgenes, anclajes, rotura de armadura, caída, eventos, los 19 clips en Chromium, controles y descarga de PNG. El navegador administrado se prueba mediante un servidor local, bloqueando cualquier conexión externa.
