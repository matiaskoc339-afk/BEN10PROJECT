# Demo del personaje · versión 0.8

Abre [Ben10_Demo_PixelPerfect_v08.html](Ben10_Demo_PixelPerfect_v08.html) en un navegador. El archivo incluye las imágenes y funciona sin descargar recursos externos.

La versión 0.8 integra el diseño clásico preparado a partir de la referencia del usuario: carcasa y correa negras, paneles laterales grises, esfera con el símbolo verde y botón verde lateral. Las cuatro perspectivas del diseño se adaptan al tamaño de la muñeca y a sus ocho ángulos de giro. El anclaje de las manos y la oclusión se conservan de la versión 0.7.

La versión 0.7 corrige el aspecto y la colocación del reloj. Cada pose registra la mano y el codo; la pulsera se coloca en el extremo del antebrazo cercano a la mano y gira siguiendo ese brazo. Se corrigieron, entre otras, las posiciones de los golpes fuertes, el uppercut y la voltereta que dejaban el reloj sobre el codo o la cabeza.

El accesorio tiene cuatro perspectivas (frontal, inclinada, canto y correa) y ocho orientaciones, dibujadas sobre la cuadrícula de píxeles del personaje. Cuando el propio cuerpo tapa completamente la muñeca, se respeta esa oclusión; de espaldas se ve la correa. Los fotogramas invertidos usan el brazo correspondiente antes del reflejo. El atlas del accesorio está incluido en el HTML.

En la versión 0.6, el dash recorre 176 píxeles en 0,4 segundos: empieza con un impulso rápido y frena al final. En ese mismo tiempo, correr recorre unos 99 píxeles. También sigue el movimiento diagonal, con el mismo alcance total, y conserva las colisiones y el tiempo de recuperación.

El Omnitrix es un accesorio registrado en las 119 poses. Sigue la muñeca durante la respiración, los ataques y las volteretas. Sus vistas se generaron como sprite independiente; los dos atlas del personaje se conservan.

Esta revisión parte de la demo 0.4 proporcionada por el usuario y se centra en Ben:

- Los fotogramas se importan por su silueta completa, con margen transparente y un punto de apoyo en los pies. Las animaciones no se ajustan a una caja fija de 64 × 64.
- Los golpes leves y fuertes siguen la dirección de Ben en las cuatro orientaciones. Esa dirección se mantiene durante el golpe y también determina qué objetivo recibe daño.
- Al soltar el movimiento, Ben abandona inmediatamente el ciclo de carrera y adopta una guardia con respiración y cambios de pose. Al terminar un ataque también vuelve a esa guardia.
- El daño coincide con el fotograma de contacto. Se conserva el atlas original y se añaden poses de ataque y guardia frontal y posterior, generadas como complemento.

Controles: **WASD / flechas** para moverse y orientarse, **clic izquierdo** para golpe leve, **clic derecho** para fuerte, **espacio** para esquivar y **R** para el Omnitrix. En pantallas táctiles están disponibles el joystick y los botones. Las diez ranuras del Omnitrix siguen pendientes de aliens jugables en esta demo.

[Video de movimiento y ataques](demo-v08-review.mp4) · [Omnitrix clásico en las cuatro orientaciones](demo-v08-poses.png) · [Versión anterior 0.7](Ben10_Demo_PixelPerfect_v07.html)

## Verificación

Con Playwright y Chromium instalados:

```sh
node tests/demo/character-v08.test.cjs
```

El ejecutable predeterminado es `/usr/bin/chromium`; se puede configurar con `CHROMIUM_PATH`. Las 28 comprobaciones cubren las 119 poses, los márgenes, el espejado, la guardia, la dirección y el momento del daño, la cancelación al esquivar, la rueda del Omnitrix y el dash. Para el reloj se comprueba su cercanía a la mano, las poses concretas que fallaban, la oclusión y las 32 variantes de perspectiva y giro, sin recortes ni bordes suavizados. El alcance del dash se verifica a 30, 60 y 120 pasos por segundo. Las referencias para las pruebas se exponen únicamente en la copia servida en memoria; el HTML distribuido no contiene esas referencias.

## Recompilar el accesorio

El diseño preparado está en [assets/omnitrix-classic-source.png](assets/omnitrix-classic-source.png). Con Playwright y Chromium instalados, este comando vuelve a generar las 32 variantes y las incrusta en la demo 0.8:

```sh
node demos/tools/bake-omnitrix.cjs
```

El atlas compilado también se guarda en [assets/omnitrix-classic-atlas.png](assets/omnitrix-classic-atlas.png). No se necesita ejecutar este comando para jugar.
