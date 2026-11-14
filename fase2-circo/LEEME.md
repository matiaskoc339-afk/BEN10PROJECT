# Fase 2 · El circo de Zombozo

Entrega de **recursos de arte**, con visor independiente. Extrae todo el ZIP y abre **index.html** en Chrome o Edge. El botón «Recorrer», la barra y A/D permiten revisar los fondos. En «Payasos» puedes elegir la variante, reproducir o detener cada acción, cambiar la orientación y avanzar fotograma a fotograma. «Bombas y espejos» muestra los objetos y efectos animados. **muestra.html** reproduce una presentación automática.

## Payasos

| Rol | Normal | Loco | Acciones propias |
| --- | --- | --- | --- |
| Fuerte | Coloso del circo, gran mazo de madera | Coloso reforzado, mazo con aro metálico y postura agresiva | Mazazo descendente y barrido |
| Rápido | Saltimbanqui delgado, dos bastones | Maquillaje de arlequín, pelo erizado y equipo reforzado | Golpe fugaz y patada de retirada |
| Tramposo | Artificiero, faldones y bolsas de bombas | Melena blanca, traje reforzado y gestos desquiciados | Lanzamiento por arriba y bomba rasante |

Cada variante tiene **36 poses dibujadas**, repartidas en seis clips: reposo, marcha, ataque principal, segunda acción, reacción al golpe y derrota. Son **216 poses / 36 animaciones**. Las variantes locas tienen láminas y poses propias. La derrota termina en el suelo; los ataques incluyen preparación, contacto y recuperación. La mano de lanzamiento queda libre al soltar la bomba: el proyectil se dibuja aparte.

Los PNG transparentes preparados están en `assets/atlases/`. Sus JSON incluyen rectángulos, punto de apoyo, duración de cada fotograma, contacto y repetición. La orientación izquierda usa el mismo dibujo reflejado. Las láminas dibujadas completas se conservan en `assets/source/`; el registro añade espacio transparente para impedir recortes. Cada personaje conserva una escala constante entre poses. Ben sirve de referencia de altura; el fuerte es bastante mayor que el rápido.

## Tres recorridos

| Tramo | Zonas | Panorama exportado |
| --- | --- | --- |
| 1 · Vestíbulo | Entrada, taquilla, galería de espectáculos, archivo, rueda de fortuna, magia y cortina de salida | 5500 × 720 |
| 2 · Obstáculos | Aros, tramoya, máscaras, espejos deformantes, mecanismos, colchonetas y pasillo final | 5400 × 720 |
| 3 · Escenario principal | Vestuario e instrumentos, bastidores, gradas, pista central y escenario final vacío | 5374 × 720 |

Cada panorama reúne **tres dibujos diferentes**, alineados por sus soportes pintados y con suelo continuo. No se estiran horizontalmente ni se repite una misma pantalla para alargar el recorrido. El visor desplaza la cámara sobre el panorama; no cambia de imagen al alcanzar una unión. Los espejos decorativos de los fondos no reciben un segundo marco encima.

`assets/panoramas/` contiene cada recorrido completo, más copias separadas de **pared** y **suelo**. Las dos piezas se recomponen exactamente. Los originales de los nueve tramos, la entrada exterior y el fondo lateral de Ruta Cristal están en `assets/backgrounds/`. Los panoramas exportados conservan libres las posiciones reservadas para los espejos, que se colocan con su atlas independiente. La guía verde del visor es una referencia del área caminable; no queda pintada en los PNG.

Las posiciones, alturas, suelo, uniones y conexiones están en `data/manifest.json`. Coordenadas: altura lógica 360; ancho lógico de los recorridos 2750, 2700 y 2687. Se conservan los tamaños originales y su proporción. Las entradas y salidas por espejo preparan el recorrido **vestíbulo → Ruta Cristal → obstáculos → Ruta Cristal → escenario principal**.

## Bombas, objetos y animaciones ambientales

- Tres bombas de carcasa parecida: explosiva, ácida y confeti; seis poses de vuelo para cada una.
- Explosión con expansión, humo y final; salpicadura y charco ácido con burbujeo; confeti y destellos de curación.
- Espejo en reposo y apertura con remolino, manteniendo tamaño y punto de apoyo.
- Farol oscilante, banderines, resorte de trampa y plataforma de cristal con destellos, como piezas separadas.
- Entrada exterior con carpa enorme y puerta oscura; fondo de Ruta Cristal con perspectiva estrictamente lateral y plataformas reutilizables.

Las reglas futuras quedan anotadas: el ácido hará daño gradual **sin matar**; el confeti no dañará a Ben y podrá curar payasos. No se han añadido estadísticas, IA, oleadas, colisiones, plataformas jugables ni cambios de transformación a la demo. Zombozo y su combate final quedan pendientes. Los botones del visor de espejos solo revisan la conexión visual; no ejecutan el minijuego.

## Archivos y verificación

`data/catalog.js` contiene los mismos datos que el manifiesto para abrir el visor sin un servidor. `data/panoramas.json` documenta los recortes de pared/suelo. `data/art-jobs.json` conserva las instrucciones de dibujo y `data/provenance.json` sus huellas. Los informes de comprobación están en `data/validation.json` y `data/browser-validation.json`.

La demo PC V42 se conserva completa. Esta biblioteca se prepara aparte para integrar la fase del circo en una entrega posterior.
