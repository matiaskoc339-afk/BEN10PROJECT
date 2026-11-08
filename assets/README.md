# Recursos ilustrados locales

Estas imágenes fueron generadas para esta revisión mediante la herramienta de generación de imágenes de la sesión, siguiendo el estilo de ilustración 2D elegido por el usuario. No son capturas ni recursos oficiales de Ben 10. La integración, los estados de animación, las colisiones y los tiempos de contacto se implementan en JavaScript.

| Archivo                        | Distribución         | Uso                                                    |
| ------------------------------ | -------------------- | ------------------------------------------------------ |
| `characters/ben-atlas.png`     | 6 columnas × 4 filas | Ben de diez años, cuatro orientaciones                 |
| `characters/four-atlas.png`    | 6 × 4                | Cuatro Brazos                                          |
| `characters/heat-atlas.png`    | 6 × 4                | Fuego                                                  |
| `characters/diamond-atlas.png` | 6 × 4                | Diamante                                               |
| `characters/knight-atlas.png`  | 6 × 4                | Caballeros, movimiento y espada                        |
| `characters/story-cast.png`    | 4 × 3                | Reparto narrativo y variantes de jefes                 |
| `world/props.png`              | 4 × 4                | Edificios, Rustbucket, vehículos, árboles y maquinaria |
| `world/terrain.png`            | 2 × 2                | Césped, aceras, asfalto y piedra                       |

Los atlas animados se ordenan por filas: sur, este, norte, oeste. Sus columnas son reposo, paso izquierdo, paso derecho, preparación, contacto y recuperación. El cargador calcula los límites transparentes y fija un anclaje común de cuerpo para que extender un brazo no desplace al personaje. La vista de combate utiliza el ángulo capturado al comenzar el ataque.

No se necesitan servidores de imágenes ni descargas de terceros. La primera carga lee aproximadamente 18 MB de PNG del mismo servidor que sirve el juego. Los personajes bloqueados conservan indicadores de ADN y nombre, sin anunciar animaciones jugables que no están implementadas.
