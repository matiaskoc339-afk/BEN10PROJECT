# Arte local — versión lateral

El arte se generó con la herramienta de imágenes de la sesión y se integra mediante Canvas 2D. Los nuevos sprites usan como referencia los diseños aprobados de los personajes. Las referencias externas se documentan en [docs/references.md](../docs/references.md); sus imágenes no forman parte del juego.

## Recursos activos de la vista lateral

| Archivo                     | Contenido                                                                                             |
| --------------------------- | ----------------------------------------------------------------------------------------------------- |
| `stages/city.png`           | Fachadas continuas de Bellwood al atardecer                                                           |
| `stages/market.png`         | Mercado y arcadas iluminadas al anochecer                                                             |
| `stages/fort.png`           | Taller y reactores de los Caballeros Eternos                                                          |
| `stages/throne.png`         | Cámara del trono con arcos, columnas y antorchas                                                      |
| `stages/escape.png`         | Corredor dañado de evacuación                                                                         |
| `stages/props.png`          | Rustbucket de lado, caja, columna, reactor, consola, dos lámparas y fuente frontal                    |
| `characters/*-side.png`     | Ben, Fuego, Cuatro Brazos, Diamante y caballeros: reposo, guardia y seis pasos, a derecha e izquierda |
| `characters/*-combat.png`   | Preparación y contacto de tres ataques ligeros y un fuerte; se usan sus orientaciones laterales       |
| `characters/*-atlas.png`    | Recuperaciones, esquiva, expresiones, combate de caballeros y retratos                                |
| `characters/story-cast.png` | Reparto narrativo y variantes de jefes                                                                |

Los atlas de marcha anteriores y el conjunto `world/` se conservan para compatibilidad de los renderizadores de recursos y como historial de arte; los niveles nuevos usan los panoramas y objetos de `stages/`.

## Registro y dibujo

`js/atlas-frames.js` registra las siluetas completas de combate, marcha lateral y objetos. `scripts/register-combat-atlas.py` regenera esas coordenadas leyendo las componentes alfa; no modifica píxeles. Pillow sólo se necesita para ejecutar ese script de desarrollo. El juego no lo requiere al ejecutarse.

Los encuadres incluyen un margen. El renderizador conserva la relación de aspecto, ancla el pie o la base y aplica una luz de ambiente coherente con cada zona. Las imágenes escaladas, iluminadas y las sombras se reutilizan en caché. Los panoramas se repiten como módulos arquitectónicos y los extremos se integran con apoyos.

Las imágenes proceden del mismo servidor que sirve el juego. No se descargan recursos oficiales ni imágenes de terceros durante la partida. Los elementos vivos —luces, oscilación de lámparas, vapor, ondas, chispas y contactos del suelo— se dibujan en el motor y usan el tiempo del mundo.
