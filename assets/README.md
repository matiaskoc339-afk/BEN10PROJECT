# Recursos ilustrados locales

Las imágenes se generaron mediante la herramienta de generación de imágenes de la sesión, con el estilo de ilustración 2D elegido por el usuario. No son capturas ni recursos oficiales de Ben 10. El movimiento, las colisiones y los tiempos de contacto se implementan en JavaScript. Todos los PNG se sirven desde el propio juego, sin servidores de imágenes externos.

## Personajes

Los atlas aprobados `characters/ben-atlas.png`, `four-atlas.png`, `heat-atlas.png` y `diamond-atlas.png` conservan los diseños, reposos y recuperaciones. `knight-atlas.png` y `story-cast.png` conservan a enemigos y reparto. Los cinco ciclos `*-walk.png` siguen aportando seis poses de marcha por dirección.

La revisión 2.2 añade `ben-combat.png`, `four-combat.png`, `heat-combat.png` y `diamond-combat.png`. Cada hoja contiene 32 poses: preparación y contacto de tres ataques ligeros y un fuerte en cuatro direcciones. Las filas lógicas son sur, este, norte y oeste; las columnas lógicas agrupan los ataques por parejas. La recuperación procede del atlas anterior. Son poses dibujadas distintas, sin cambiar el sistema de daño por contacto.

`js/atlas-frames.js` delimita las siluetas completas, incluyendo las manos que rebasan la cuadrícula nominal. El script opcional `scripts/register-combat-atlas.py` lee las componentes alfa y regenera esos metadatos si cambia el arte; no modifica los píxeles. Requiere Pillow para esa operación de desarrollo. El juego usa los metadatos ya incluidos y no requiere Python ni Pillow en el navegador.

## Escenario

| Archivo               | Distribución | Uso                                                                              |
| --------------------- | ------------ | -------------------------------------------------------------------------------- |
| `world/buildings.png` | 2 × 2        | Garaje, mercado, edificio cívico y café completos, con márgenes transparentes    |
| `world/props.png`     | 4 × 4        | Vehículos, árboles, fuente, bancos, cajas, columnas, maquinaria y módulo de muro |
| `world/flora.png`     | 2 × 2        | Arbusto, flores, seto con jardinera y jardinera circular                         |
| `world/terrain.png`   | 2 × 2        | Césped, pavimento, asfalto y piedra con una paleta común                         |

Los edificios usan la hoja dedicada de mayor resolución. El conjunto de objetos y los materiales de suelo se renovaron para esta revisión. Cada ilustración se dibuja completa, conservando su relación de aspecto y anclando su base. El mismo rectángulo se usa para la imagen, la sombra y, en la fuente, el agua animada.

La carga inicial lee aproximadamente 36 MiB de PNG. Las imágenes escaladas y las sombras se guardan en caché; el suelo y la jardinería se componen una vez por zona. La prueba de navegador revisa los bordes transparentes y la proporción de los objetos para detectar recortes y deformaciones.
