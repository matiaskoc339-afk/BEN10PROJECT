# Arte local — versión 4.0

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

## Recursos añadidos en 4.0

- `stages/intro.png` y `stages/extractor.png`: laboratorio industrial y máquina propios del prólogo, sin cristales.
- `stages/city-park.png`, `city-station.png`, `market-bazaar.png`, `market-plaza.png`, `fort-works.png`, `fort-hall.png`, `escape-garden.png`: siete lugares adicionales para los recorridos. Cada pintura se usa una sola vez por nivel.
- `characters/*-idle.png`: cuatro reposos y cuatro guardias para Ben y cada alien jugable.
- `characters/*-fight.png`: cuatro movimientos de seis dibujos por personaje, orientados a derecha y reflejados para izquierda.
- `characters/cast-act-a.png` y `cast-act-b.png`: 60 poses de actuación para diez personajes.
- `characters/boss-act.png`: 18 poses para Ejecutor, Rey cristalino y Rey con armadura rota.

Las hojas de combate anteriores se conservan para los retratos, la vista de recursos y los enemigos. El combate lateral de Ben y los tres aliens usa las nuevas hojas `fight`.

## Registro y dibujo

`js/atlas-frames.js` registra las siluetas completas de combate, marcha lateral y objetos. `scripts/register-combat-atlas.py` regenera esas coordenadas leyendo las componentes alfa; no modifica píxeles. En las hojas de actuación registra también el contorno exterior de cada cuerpo: Canvas lo usa como máscara para excluir fragmentos de poses vecinas que coinciden dentro de un rectángulo de atlas. Pillow sólo se necesita para ejecutar ese script de desarrollo. El juego no lo requiere al ejecutarse.

Los encuadres incluyen un margen. El renderizador conserva la relación de aspecto, ancla el pie o la base y aplica una luz de ambiente coherente con cada zona. Las imágenes escaladas, iluminadas y las sombras se reutilizan en caché. Los panoramas ocupan tramos fijos y no se repiten. Sus extremos se solapan con máscaras suaves en tiempo de dibujo.

Las imágenes proceden del mismo servidor que sirve el juego. No se descargan recursos oficiales ni imágenes de terceros durante la partida. Los elementos vivos —luces, oscilación de lámparas, vapor, ondas, chispas y contactos del suelo— se dibujan en el motor y usan el tiempo del mundo.
