# Caballeros Eternos · sprites y animaciones

Biblioteca de arte para la demo V34. Contiene **17 variantes, 102 clips y 612 poses dibujadas**, con fondo transparente. V35 incorpora estos sprites al combate mediante `systems/eternal-enemies.js`, `enemy-game.js` y `enemy-renderer.js`. El visor de esta carpeta sigue dedicado al arte. El jefe final se prepara en otra entrega.

Abre **[index.html](index.html)** para reproducir cada animación. **[catalogo.html](catalogo.html)** muestra las 17 variantes juntas. Ambos visores funcionan sin conexión: conserva toda la carpeta `enemigos` y no abras el HTML desde la vista previa de un ZIP; extráelo primero.

## Personajes

| Especialidad | Equipo | Ataque principal | Segunda acción |
| --- | --- | --- | --- |
| Físico · Espadachín | Espada y guantelete | Tajo de espada | Estocada baja |
| A distancia · Ballestero | Ballesta tecnológica | Disparo y recarga | Disparo arrodillado |
| Soporte · Artificiero | Mochila tecnológica y emisor | Pulso al frente | Canalización de apoyo |
| Ágil · Explorador | Dos dagas y bufanda | Cortes alternados | Estocada en carrera |
| Defensivo · Baluarte | Escudo y maza | Golpe de escudo | Guardia de hierro |
| Minijefe · Campeón del hacha | Hacha enorme de dos manos | Hachazo vertical | Barrido horizontal |

Los cinco soldados tienen tres versiones: **recluta**, con placas ligeras; **veterano**, con coraza y extremidades más protegidas; y **ADN de Diamante**, con placas cristalinas integradas en su armadura y sus armas. El campeón tiene dos versiones: normal y cristalina. Es un soldado de gran masa, sin corona ni elementos del rey final.

## Animaciones

Cada personaje dispone de seis filas y seis fotogramas por fila:

1. `idle`: reposo en guardia, respiración y cambio de peso.
2. `walk`: pasos con intercambio de pies y flexión de rodillas.
3. `attack`: preparación, ataque, contacto, seguimiento y recuperación.
4. `secondary`: segunda acción propia de su especialidad.
5. `hurt`: retroceso, desequilibrio y recuperación.
6. `defeat`: pierde el equilibrio, cae y termina tendido.

Los ataques no se reproducen en bucle por defecto y la derrota mantiene su último fotograma. El visor permite repetirlos, bajar a 0,25×, avanzar fotogramas, cambiar de lado y comparar rangos con Ben como referencia de tamaño. La canalización y la guardia son **poses de arte**, con sus efectos de juego definidos por separado en el sistema de combate.

## Archivos e integración posterior

- `assets/source`: láminas originales de las poses, el diseño general y el original previo a limpiar el fondo del defensor veterano.
- `assets/reference`: referencia de diseño de cada variante.
- `assets/atlases`: PNG registrado y JSON de cada personaje.
- `assets/posters`: primer fotograma completo, con el mismo margen.
- `assets/fx`: proyectiles separados cuando se dibujaron separados del arma.
- `assets/context`: Ben y tres fondos existentes, solo para comparar cómo encaja el arte.
- `data/manifest.json`: índice completo; `catalog.js` contiene los mismos datos para abrir el visor localmente sin `fetch`.
- `data/prompts-*.json`: instrucciones de dibujo conservadas como procedencia del arte.

Las poses se dibujaron en láminas nuevas. El empaquetador extrae sus siluetas completas, conserva las armas que sobrepasan una celda de origen y aplica **una misma escala a las 36 poses de cada personaje**. No fabrica movimientos deformando un recorte. Todas las celdas exportadas de un personaje comparten dimensiones y anclaje, con espacio transparente para armas y caídas. Las dimensiones varían entre personajes: lee los JSON en lugar de asumir celdas de 96 px.

`animations[clave].frames` indica `x`, `y`, `width`, `height`, `anchorX` y `anchorY`. Los tiempos de `durations` están en milisegundos; `contactFrames` usa índices desde cero y marca la pose de contacto para una futura integración. No constituye todavía una caja de daño.

El dibujo mira a la **derecha en tres cuartos lateral**. Para mirar a la izquierda se refleja el fotograma completo sobre el anclaje. No se han dibujado vistas frontal o trasera. `bodyHeight` conserva una propuesta de escala respecto a Ben (70 unidades); los campeones son mayores sin ocupar toda la pantalla. Se puede ajustar esa escala al incorporar el combate sin modificar el PNG.

Para dibujar un fotograma a escala de juego:

```js
const z = unit.bodyHeight / unit.nativeBodyHeight;
ctx.drawImage(atlas, f.x, f.y, f.width, f.height,
  actor.x - f.anchorX * z, actor.y - f.anchorY * z,
  f.width * z, f.height * z);
```

## Comprobaciones

Desde la raíz del repositorio:

```sh
npm run build:enemies
npm run test:enemies
npm run package:enemies
```

La reconstrucción requiere Python 3, Pillow, NumPy y SciPy. Las pruebas verifican las 612 poses, transparencia, márgenes, anclajes, caída final, reproducción en navegador, descarga de PNG/JSON y la integridad de las láminas originales. El ZIP se genera en `/workspace/outputs/BEN10_Caballeros_Eternos_Sprites.zip` por defecto, o en la ruta indicada mediante `--output`.
