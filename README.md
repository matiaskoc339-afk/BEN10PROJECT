# BEN 10: El Omnitrix Fracturado

Aventura fan en español, ahora reconstruida como **beat ’em up lateral**. Ben tiene diez años. Incluye un capítulo completo: prólogo, calles de Bellwood, mercado, fortaleza, Rey Eterno, recuperación de Diamante y evacuación. Se ejecuta en Canvas 2D con teclado y mouse.

## Versión 4.0 — actuación, escenarios y combate

[Ver la revisión en movimiento](docs/motion-gameplay.mp4) · [Galería y dirección visual](docs/art-direction.md) · [Referencias consultadas](docs/references.md)

![Parque del canal](docs/motion-city-park.png)

Los recorridos tienen lugares únicos en posiciones fijas. Bellwood pasa del barrio al parque del canal y la estación; el mercado avanza por galerías, bazar y plaza; la fortaleza une reactores, talleres y estandartes; el escape termina en los jardines del acueducto. La arquitectura no se repite en bucle. Las transiciones se solapan suavemente y el suelo cambia de material con cada tramo.

El prólogo tiene un laboratorio y un extractor propios, sin cristales de la fortaleza. Los personajes entran en encuadres según la conversación, gesticulan, reaccionan a la fractura y se enfrentan durante la pelea. Ben forcejea, se protege y corre hacia la salida de forma gradual. Driscoll lleva su armadura original.

Ben y los tres aliens tienen ocho dibujos de reposo y guardia y 24 de combate por personaje: seis poses para cada uno de los tres ligeros y el fuerte. Se mantienen los seis pasos de marcha por orientación. Los golpes tienen preparación, contacto y recuperación; el daño se aplica una sola vez y hay reacción, destello y una breve pausa al acertar. El Ejecutor y las dos fases de armadura del Rey tienen poses de guardia, preparación, ataque, daño y paso.

**Fuego:** J encadena puñetazo, codazo y patada cuerpo a cuerpo; K carga y lanza fuego con las manos. Camina a 255 unidades/s frente a las 185 de Cuatro Brazos, golpea más rápido y recupera antes su esquiva. El calor de los mecanismos puede aplicarse a distancia con K. Los enemigos y los golpes respetan la profundidad de la banda del suelo.

La cámara acompaña el avance horizontal y mantiene su altura al acercarte o alejarte del fondo. Sombras de contacto, luz ambiental, hojas, vapor, agua, polvo y reflejos integran los actores en el escenario. El ambiente y la actuación continúan en los diálogos y se detienen al pausar.

## Ejecutar

Desde la carpeta del proyecto:

```sh
python3 -m http.server 8000
```

Abre el servidor en tu navegador de PC, en el puerto 8000. También puedes usar `npm start`. El juego no necesita instalar dependencias, compilar ni configurar credenciales. Todas las imágenes están incluidas y se sirven localmente; el sonido usa Web Audio.

Los scripts clásicos permiten abrir `index.html` directamente en navegadores que lo admitan, pero esa modalidad no pudo verificarse aquí: el navegador administrado bloquea `file://`. Usa el servidor para mantener un origen estable y conservar el guardado en `localStorage`.

## Controles

| Acción                                      | Control inicial                   |
| ------------------------------------------- | --------------------------------- |
| Avanzar a izquierda / derecha               | A / D                             |
| Caminar hacia el fondo / acercarse a cámara | W / S                             |
| Mirar a izquierda o derecha                 | Desplazamiento horizontal o mouse |
| Ataque ligero, combo de tres movimientos    | J / clic izquierdo                |
| Ataque fuerte                               | K / clic derecho                  |
| Esquiva                                     | Espacio                           |
| Bloqueo y parry                             | Shift, mirando al ataque          |
| Especial                                    | F                                 |
| Interactuar / avanzar diálogo               | E; Enter también avanza diálogos  |
| Rueda del Omnitrix                          | Mantener Q, apuntar y soltar      |
| Favoritos                                   | 1, 2, 3                           |
| Volver a Ben                                | X                                 |
| Activar ADN preparado, estando como Ben     | E                                 |
| Habilidades                                 | Tab                               |
| Mapa de la ruta                             | M                                 |
| Pausa                                       | Esc                               |

Los controles son reasignables desde Opciones → Controles. Los favoritos 1/2/3 están reservados. Durante un diálogo, la primera pulsación revela la frase y la siguiente continúa. La rueda ralentiza el mundo. Los diálogos mantienen el ambiente animado mientras detienen la IA y el combate.

**El Control Maestro sigue bloqueado.** Para cambiar de Fuego a Cuatro Brazos: X y después 1. Elegir otro ADN mientras estás transformado lo prepara para activarlo al volver a Ben. La salud es compartida y cancelar conserva la energía.

## Capítulo jugable

- Menú, continuar partida, pausa, dificultad, volumen, controles reasignables y opciones persistentes.
- Prólogo con los siete villanos, extractor y fractura del Omnitrix; diálogos con retratos, expresiones, historial y opción de omitir escenas.
- Cinco niveles laterales con doce tramos únicos, más el laboratorio del prólogo.
- Ben, Fuego, Cuatro Brazos y Diamante jugables. Combos, remates, bloqueo, parry, esquiva, técnicas comprables y tres árboles de seis mejoras.
- Caballeros básicos, escudos, pesados, energía y comandante. Preparaciones visibles, alineación de profundidad, separación entre enemigos y un máximo de dos ataques preparados simultáneamente.
- Ejecutor Eterno con segunda etapa; Rey Eterno con placas térmicas, espada y retirada con refuerzos limitados. En el prólogo, Driscoll conserva su armadura original.
- Mecanismos de calor y fuerza, conducto opcional, alijos, mejoras permanentes, descansos y cajas destructibles. Los secretos se recolocaron en la nueva banda transitable.
- Recuperación de Diamante, favorito 3, puente cristalino y cierre de seguridad para escapar. Final del capítulo y regreso a explorar.
- Guardado automático de ADN, XP, técnicas, mejoras, secretos, historia y puntos de control. Morir permite reintentar desde la zona guardada. Los guardados de versión 1 siguen siendo legibles: la posición se reconstruye en la entrada de la zona nueva.

<details>
<summary>Guía del capítulo (incluye soluciones)</summary>

1. Bellwood: derrota a las patrullas y avanza a la derecha. Calienta el motor de la compuerta con la llamarada K de Fuego; vuelve a Ben, activa Cuatro Brazos y mantén E para levantarla.
2. Mercado: explora los bordes del recorrido para encontrar la mejora de vida y el conducto opcional. Derrótale al Ejecutor; su segunda fase es más rápida.
3. Fortaleza: calienta los dos soportes con K de Fuego, después rompe cada uno con dos golpes fuertes de Cuatro Brazos. Cruza la puerta del trono.
4. Rey Eterno: aplica calor y dos golpes fuertes para romper una placa; repite con la segunda. Tras la espada y la retirada, derrota al rey y completa la conversación de recuperación.
5. Diamante: golpea el mecanismo antes del abismo para construir el puente. El puente permite cruzar por su parte central; los bordes siguen siendo un abismo. Cristaliza el cierre del final y llega a la salida.

El calor no se pierde por volver a Ben. Los puntos seguros restauran vida y energía fuera del combate.

</details>

## Alcance

La rueda contiene exactamente diez ADN. XLR8, Fantasmático, Blitzwolfer, Ultra T, Cannonbolt, Wildvine y Snare-oh tienen perfiles y permanecen bloqueados; sus misiones y sistemas de combate todavía no están implementados. `futureMissions` conserva sus asociaciones narrativas como datos para futuras entregas.

La presentación conserva la ilustración elegida por el usuario. Cosmic Invasion, Castle Crashers, TMNT y Streets of Rage 4 se consultaron como referencias de encuadre, actuación y combate; no se reutilizan sus imágenes dentro del juego. La procedencia del arte está en [assets/README.md](assets/README.md).

Las cinemáticas usan actuación por poses dentro del motor, sin doblaje ni sincronización labial fonética. Se requiere teclado y mouse; no se incluyen controles táctiles ni soporte de mando.

## Arquitectura

| Archivo              | Responsabilidad                                                              |
| -------------------- | ---------------------------------------------------------------------------- |
| `js/data.js`         | ADN, controles, mejoras y guiones                                            |
| `js/world.js`        | Niveles laterales, encuentros, mecanismos y transiciones                     |
| `js/actors.js`       | Movimiento, colisiones de los pies, defensa y transformaciones               |
| `js/combat.js`       | Contactos, combos, alineación de profundidad, IA, jefes y proyectiles        |
| `js/scenery.js`      | Capas del escenario, materiales, luces, mobiliario y presentación de actores |
| `js/assets.js`       | Imágenes, encuadres completos, orientación lateral, sombras y luz de escena  |
| `js/atlas-frames.js` | Metadatos de siluetas de combate, marcha lateral y objetos                   |
| `js/world-life.js`   | Contactos del suelo, pisadas, polvo, viento y caducidad de efectos           |
| `js/cinematic.js`    | Encuadres, actuación y desplazamiento narrativo del prólogo                  |
| `js/render.js`       | Orden por profundidad, efectos, menú y escenas                               |
| `js/game.js`         | Simulación, entrada, cámara, guardado y coordinación                         |
| `js/ui.js`           | HUD, mapa de ruta, narrativa, opciones y habilidades                         |
| `js/audio.js`        | Sonidos sintetizados y pisadas                                               |

La simulación usa pasos de 60 Hz. Las versiones escaladas e iluminadas, las sombras y los suelos se guardan en caché. La frecuencia de dibujo depende del equipo.

## Verificar

```sh
npm test
npm run test:browser
```

Las pruebas de sistemas no necesitan dependencias. Para las pruebas de navegador se necesitan Playwright y Chromium; el ejecutable predeterminado es `/usr/bin/chromium`, configurable mediante `CHROMIUM_PATH`. Si Playwright no está disponible, instala la dependencia de desarrollo con `npm install --no-save --package-lock=false playwright`.

Resultado: **38 pruebas de sistemas y 34 comprobaciones de navegador aprobadas**, sin errores de página. Incluyen geometría de la nueva banda, rutas y secretos accesibles, encuadres sin anatomía cortada, marcha lateral, golpes según profundidad, cámara, ambiente, pausa, guardado y la secuencia completa del capítulo. La prueba opcional con `file://` se omitió por la política del navegador administrado.

Las pruebas lejanas colocan explícitamente personajes y reinician recuperaciones para comprobar los encuentros de forma reproducible. No sustituyen una evaluación humana del equilibrio del juego. Las capturas de prueba se guardan en `artifacts/`, ignorado por Git.

Proyecto fan no oficial. Ben 10 y sus personajes pertenecen a sus respectivos titulares.
