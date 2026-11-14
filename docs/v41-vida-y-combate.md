# V41 · Vida de Ben y señales de combate

## Vida y transformación

Ben y todos los aliens conservan **50 PV máximos** y sus defensas distintas. El alien comienza con la vida que tenga Ben: por ejemplo, Ben con 25/50 se convierte en un alien con 25/50. El daño recibido como alien reduce únicamente su vida activa. Volver voluntariamente o agotar la energía devuelve a Ben los 25/50 que conservó antes de transformarse.

Si el alien pierde toda su vida, vuelve a Ben con su reserva, el reloj se vacía y queda bloqueado hasta recargarse. La reversión cancela ataques pendientes y da 1,35 segundos de protección para evitar un golpe simultáneo sobre Ben. Solo perder toda la vida como Ben muestra la derrota y el reintento del combate.

Las curaciones recogidas como alien benefician tanto a la forma activa como a la reserva de Ben, con un límite de 50 PV en cada caso. Las curaciones de fin de combate también se conservan al regresar. Nivel, XP, costes de energía, árboles y ADN siguen funcionando igual. Los tres archivos de V40 se conservan y continúan desde sus puntos de control.

## Cápsulas de salud

Un caballero eliminado tiene entre **7% y 18%** de probabilidad de soltar una cápsula. El máximo sigue siendo poco frecuente; la probabilidad depende de la vida de Ben, incluida su reserva al estar transformado. Herir al alien sin herir a Ben no aumenta esa probabilidad. Con Ben a mitad de vida es aproximadamente un 11,3%.

La cápsula cura **8 PV** al pasar por ella, sin botón. Aparece junto al enemigo, rebota, flota, se inclina y brilla sobre una sombra fija. La cruz clara y el núcleo rojo la distinguen de la energía del reloj. Dura 22 segundos; no se consume si ambos estados tienen la vida completa. Solo hay una tirada por enemigo y no se generan más de diez cápsulas a la vez. El Rey Eterno conserva su recompensa propia.

## Menú y recorrido

El fondo de la pantalla principal avanza mediante columnas y filas generadas a medida que se desplazan fuera de la pantalla. Las hélices, las masas verdes y las burbujas mantienen sus trayectorias: no reinician una posición dentro de la imagen. Continúa respetando reducir movimiento y detiene su dibujo al entrar a la demo.

Los avisos usan placas de grafito, bordes metálicos, luces verdes y el emblema del Omnitrix. Muestran **Combate**, **Ronda** y **Combate superado**. El panel del recorrido conserva los enemigos restantes y la dificultad. Al despejar un combate aparece durante 4,8 segundos una flecha hacia el siguiente paso; indica la entrada correspondiente al terminar una fase. Se oculta al comenzar otro combate o al abrir la pausa y los paneles.

## Verificación

- `npm run test:stats`: 17 comprobaciones del módulo que se incrusta en el juego, energía, reservas, XP y coherencia entre fuente y HTML.
- `npm run test:recovery`: reservas de vida de los diez aliens, derrota y recarga, probabilidades, aparición y recogida de cápsulas, flotación, señales de combate y flecha. La prueba en Chromium elimina un enemigo real para generar y recoger su cápsula.
- El fondo se verifica antes y después de los instantes donde antes saltaba; se comparan píxeles de fotogramas adyacentes y las trayectorias de cada elemento.
- `npm test` conserva las regresiones de las 70 técnicas, mapas, enemigos, jefe, HUD, secretos y tres partidas.
- `npm run test:package` abre el ZIP extraído con controles reales.

El sprite nuevo está en `assets/ui/health-pickup.png`; sus píxeles originales se mantienen intactos. Los 24 gráficos incrustados de los personajes se conservan. `systems/player-stats.js` vuelve a ser la fuente del módulo incrustado y mantiene la curva de XP y el bloqueo rojo de la versión vigente.
