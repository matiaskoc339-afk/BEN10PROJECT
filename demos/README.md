# Demo del personaje · versión 0.6

Abre [Ben10_Demo_PixelPerfect_v06.html](Ben10_Demo_PixelPerfect_v06.html) en un navegador. El archivo incluye las imágenes y funciona sin descargar recursos externos.

En la versión 0.6, el dash recorre 176 píxeles en 0,4 segundos: empieza con un impulso rápido y frena al final. En ese mismo tiempo, correr recorre unos 99 píxeles. También sigue el movimiento diagonal, con el mismo alcance total, y conserva las colisiones y el tiempo de recuperación.

El Omnitrix es ahora un accesorio con su posición registrada en las 119 poses. Sigue la muñeca durante la respiración, los ataques y las volteretas. Los fotogramas invertidos usan la otra muñeca antes de reflejarse para mantener el reloj en el brazo izquierdo. El accesorio se generó como sprite independiente; los dos atlas del personaje se conservan.

Esta revisión parte de la demo 0.4 proporcionada por el usuario y se centra en Ben:

- Los fotogramas se importan por su silueta completa, con margen transparente y un punto de apoyo en los pies. Las animaciones no se ajustan a una caja fija de 64 × 64.
- Los golpes leves y fuertes siguen la dirección de Ben en las cuatro orientaciones. Esa dirección se mantiene durante el golpe y también determina qué objetivo recibe daño.
- Al soltar el movimiento, Ben abandona inmediatamente el ciclo de carrera y adopta una guardia con respiración y cambios de pose. Al terminar un ataque también vuelve a esa guardia.
- El daño coincide con el fotograma de contacto. Se conserva el atlas original y se añaden poses de ataque y guardia frontal y posterior, generadas como complemento.

Controles: **WASD / flechas** para moverse y orientarse, **clic izquierdo** para golpe leve, **clic derecho** para fuerte, **espacio** para esquivar y **R** para el Omnitrix. En pantallas táctiles están disponibles el joystick y los botones. Las diez ranuras del Omnitrix siguen pendientes de aliens jugables en esta demo.

[Video de movimiento y ataques](demo-v06-review.mp4) · [Omnitrix en las cuatro orientaciones](demo-v06-poses.png) · [Versión anterior 0.5](Ben10_Demo_PixelPerfect_v05.html)

## Verificación

Con Playwright y Chromium instalados:

```sh
node tests/demo/character-v06.test.cjs
```

El ejecutable predeterminado es `/usr/bin/chromium`; se puede configurar con `CHROMIUM_PATH`. Las 25 comprobaciones cubren las 119 poses, los márgenes, el espejado, la guardia, la dirección y el momento del daño, la cancelación al esquivar, la rueda del Omnitrix, la presencia del reloj y el alcance, las diagonales, las colisiones y la recuperación del dash. El alcance se verifica a 30, 60 y 120 pasos por segundo. Las referencias para las pruebas se exponen únicamente en la copia servida en memoria; el HTML distribuido no contiene esas referencias.
