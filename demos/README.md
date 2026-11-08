# Demo del personaje · versión 0.5

Abre [Ben10_Demo_PixelPerfect_v05.html](Ben10_Demo_PixelPerfect_v05.html) en un navegador. El archivo incluye las imágenes y funciona sin descargar recursos externos.

Esta revisión parte de la demo 0.4 proporcionada por el usuario y se centra en Ben:

- Los fotogramas se importan por su silueta completa, con margen transparente y un punto de apoyo en los pies. Las animaciones no se ajustan a una caja fija de 64 × 64.
- Los golpes leves y fuertes siguen la dirección de Ben en las cuatro orientaciones. Esa dirección se mantiene durante el golpe y también determina qué objetivo recibe daño.
- Al soltar el movimiento, Ben abandona inmediatamente el ciclo de carrera y adopta una guardia con respiración y cambios de pose. Al terminar un ataque también vuelve a esa guardia.
- El daño coincide con el fotograma de contacto. Se conserva el atlas original y se añaden poses de ataque y guardia frontal y posterior, generadas como complemento.

Controles: **WASD / flechas** para moverse y orientarse, **clic izquierdo** para golpe leve, **clic derecho** para fuerte, **espacio** para esquivar y **R** para el Omnitrix. En pantallas táctiles están disponibles el joystick y los botones. Las diez ranuras del Omnitrix siguen pendientes de aliens jugables en esta demo.

[Video de movimiento y ataques](demo-v05-review.mp4) · [Comparación de las cuatro orientaciones](demo-v05-poses.png)

## Verificación

Con Playwright y Chromium instalados:

```sh
node tests/demo/character-v05.test.cjs
```

El ejecutable predeterminado es `/usr/bin/chromium`; se puede configurar con `CHROMIUM_PATH`. Las 17 comprobaciones cubren las 119 poses, los márgenes, el espejado, la guardia, la dirección y el momento del daño, la cancelación al esquivar y el Omnitrix. Las referencias para las pruebas se exponen únicamente en la copia servida en memoria; el HTML distribuido no contiene esas referencias.
