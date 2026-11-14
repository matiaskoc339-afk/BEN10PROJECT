# El camino de los Eternos · mapas

Abre **[index.html](index.html)** en un navegador de PC, conservando esta carpeta completa. Es un recorrido de escenarios independiente de la demo de combate.

Hay tres fases. La cámara acompaña a Ben y se desplaza continuamente dentro de cada panorama. Las puertas del castillo y del laboratorio detienen el paseo y muestran un botón para entrar; también funciona **E**. La última fase termina en la arena del Rey Eterno.

| Fase | Recorrido |
| --- | --- |
| Calles y parques | Barrio → comercios → obras → parque → estanque → fuente → ribera → plaza → barrio antiguo → canal → acceso al castillo |
| Castillo | Patio → muralla y rampa → guardia → armería → comedor → claustro → archivo → bodega → pasadizo → bóveda del laboratorio |
| Laboratorio | Acceso → extracción de ADN petrosapien → análisis → energía → observación → laboratorio principal y arena |

El archivo tiene una alcoba con mesa, sellos y espacio despejado para un futuro puzzle. Se identifica en el catálogo y con **Suelo transitable**. El puzzle y el jefe están pendientes; este paquete prepara sus lugares y no incorpora enemigos.

## Probar el recorrido

- **WASD / flechas**: caminar por el suelo, también en profundidad.
- **Espacio**: iniciar o detener el paseo automático de la fase actual.
- **Arrastrar**: explorar el panorama con la cámara; «Volver a Ben» recupera el seguimiento.
- **Ver recorrido**: seleccionar fase o punto de referencia; descargar el panorama completo de la fase.
- **Suelo transitable**: ver los límites, los pies de los obstáculos y la reserva del puzzle.

Los 28 puntos del catálogo son referencias del recorrido. No activan cambios de fondo: la imagen del mundo continúa mientras caminas. La versión descargable funciona sin conexión, sin librerías externas ni instalación.

## Arte y capas

`assets/phases` contiene los ocho tramos largos que forman los tres panoramas. Cada uno exporta `completo`, `pared` y `suelo`, con el mismo origen. `assets/source/fase-*.png` conserva las ilustraciones originales. El montaje registra pared y piso por separado para que el suelo tenga profundidad suficiente y la arquitectura conserve su escala.

`assets/props` contiene 36 objetos transparentes y seis secuencias de seis fotogramas: agua, follaje, antorcha, bandera, ADN y ventilador. El visor combina los objetos con sombras de contacto, orden por profundidad, partículas de ambiente, agua y contenedores animados. `assets/ben-reference.png` reutiliza las poses originales de Ben como referencia de escala.

`data/recorrido.json` registra los panoramas, límites de las fases, posiciones de los puntos de referencia, objetos, colisiones y la reserva del puzzle. `recorrido.js` contiene los mismos datos para abrir el visor directamente desde un archivo local. Las coordenadas del mundo son píxeles lógicos, con una cámara de **640 × 360**. Los obstáculos se calculan por sus pies, no por la caja completa de la imagen; árboles y barandas se dibujan por delante cuando corresponde.

Las tres imágenes de `panoramas` muestran cada fase entera sin interfaz ni personaje. Se pueden abrir con zoom o descargar desde el visor. Desde V34, el `index.html` principal utiliza estos mismos fondos con el HUD, los diez aliens y sus técnicas. El visor mantiene su función de revisión de arte; el juego añade colisiones compartidas por todas las habilidades y entradas con E o botón.

## Reconstruir y verificar

Desde la raíz del repositorio:

```sh
npm run build:maps
npm run test:maps
EXPORT_MAP_PANORAMAS=1 npm run test:maps:browser
```

La extracción de capas requiere Python 3, Pillow, NumPy y SciPy. Las pruebas de navegador usan Playwright y Chromium. `scripts/bake-map-player.cjs` sólo es necesario si se quiere volver a extraer el atlas de Ben desde la demo original.

Las comprobaciones cubren el camino completo de las tres fases, la detención ante sus entradas, la entrada manual, límites y obstáculos, carga local de recursos, galería, descarga de panoramas y la coincidencia del catálogo con el juego. Las capturas del visor quedan en `artifacts/mapas`; las de la demo integrada, en `artifacts/campaign`.
