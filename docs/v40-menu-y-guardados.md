# V40 · BEN 10: Omnitrix Fragmentado

La demo arranca en una pantalla de título nueva. El logo conserva el diseño clásico de la referencia: BEN en amarillo y verde, 10 blanco y contornos negros. Las motas negras se desplazan dentro del cero sin invadir sus bordes. El fondo se dibuja en tiempo real: hélices que rotan, filamentos con profundidad, masas verdes que suben y se deforman y pequeñas burbujas. El menú detiene su animación al entrar al juego; respeta la preferencia de reducir movimiento.

## Tres partidas

- Elige un espacio con el ratón, con 1–3 o con las flechas y Enter. Un espacio vacío empieza una partida con el cómic original.
- Cada espacio conserva nivel, XP, puntos, mejoras por alien, ADN recuperado, tiempo jugado y avance del recorrido. Las tarjetas muestran el nivel y la zona sin revelar identidades de ADN desconocidos.
- Pulsa **P** o **Menú** para pausar. **Guardar y volver al inicio** permite cambiar de partida. La simulación, los ataques enemigos y el consumo de energía se detienen durante la pausa y en el inicio.
- Hay guardado automático cada tres segundos de juego, al comprar, al terminar un combate, al cambiar de fase, al completar el cómic y al ganar al jefe. También se guarda al salir de la página.
- Continuar coloca a Ben con 50 PV y 90 de energía en el punto de control. Un combate pendiente se repite desde su primera oleada; un jefe pendiente comienza desde su primera fase. Las zonas ya despejadas y las mejoras se conservan. Una victoria guardada conserva el ADN y no genera otra vez al jefe.
- Borrar un espacio abre una confirmación. Cancelar lo conserva; confirmar borra únicamente esa partida.

Los guardados pertenecen al navegador y al origen desde el que se abre el juego; el ZIP incluye el juego, no los datos del navegador. La primera apertura de V40 importa automáticamente el progreso anterior que encuentre al espacio 1, sin modificar sus claves originales. Los espacios 2 y 3 quedan libres. Si el almacenamiento no está disponible, el menú informa del problema y permite jugar durante la sesión.

## Implementación y revisión

`systems/save-slots.js` mantiene tres registros independientes bajo `ben10.omnitrix-fragmentado.saves.v1`. `systems/main-menu-game.js` toma instantáneas del progreso y restaura los puntos de control usando las colisiones reales. `systems/main-menu.js` dibuja el fondo, anima el logo y controla el menú. No se cambian las imágenes ni los atlas de los personajes.

La máscara del cero se calcula al preparar el arte con `scripts/bake-title-mask.py` y se incrusta como datos en el HTML. No necesita peticiones de datos ni leer píxeles de imágenes locales durante la partida, por lo que funciona abriendo el HTML sin conexión. El PNG original se conserva íntegro en `assets/ui/ben10-title.png`.

`npm run test:menu` comprueba independencia, migración, fallos de almacenamiento, borrado, cambios entre pestañas, animación, límites del cero, tres resoluciones de PC, pausa, recarga y puntos de control del jefe y victoria. `npm test` incluye además las regresiones anteriores de combate, habilidades, HUD, secretos y recorrido. `npm run test:package` abre el juego empaquetado con controles reales.
