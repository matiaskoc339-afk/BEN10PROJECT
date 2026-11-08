# BEN 10: El Omnitrix Fracturado

Aventura fan en español, ahora reconstruida como **beat ’em up lateral**. Ben tiene diez años. Incluye un capítulo completo: prólogo, calles de Bellwood, mercado, fortaleza, Rey Eterno, recuperación de Diamante y evacuación. Se ejecuta en Canvas 2D con teclado y mouse.

## Versión 3.0 — reconstrucción lateral

[Ver una partida de la nueva versión](docs/lateral-gameplay.mp4) · [Ver las cinco zonas y la dirección visual](docs/art-direction.md) · [Referencias consultadas](docs/references.md)

![Bellwood lateral](docs/lateral-city.png)

El mundo se reconstruyó para la nueva perspectiva. Los niveles son recorridos horizontales con una banda de suelo transitable: A/D avanzan y W/S cambian la profundidad. La cámara acompaña el avance horizontal y mantiene su altura al acercarte o alejarte del fondo. Los pies, las colisiones y el orden de dibujo comparten el mismo plano.

Las fachadas forman panoramas continuos, con cielo y siluetas lejanas, arquitectura intermedia, suelo, personajes y elementos de primer plano. Las capas se desplazan a velocidades distintas. Cada zona tiene su paleta, materiales e iluminación. Hay lámparas suspendidas que oscilan, luces que varían, agua animada, humo, hojas o motas, polvo en las pisadas y reflejos suaves en los interiores. El tiempo ambiental se detiene al abrir el mapa o pausar.

Ben, Fuego, Cuatro Brazos, Diamante y los caballeros tienen nuevas hojas de marcha lateral. Se mantienen los tres ataques ligeros y el fuerte de cada forma, con preparación, contacto y recuperación, mirando a izquierda o derecha. Los puños y las armas se encuadran mediante la silueta completa, incluso cuando sobresalen de la cuadrícula nominal de una hoja.

Los golpes cuerpo a cuerpo requieren una profundidad similar. Caminar hacia el fondo permite salir del alcance de un puño; los enemigos también buscan alinearse antes de atacar. Los proyectiles viajan por el plano de sus pies. La altura a la que se dibujan corresponde a manos o pies según el ataque. Los desplazamientos de impacto y las esquivas respetan las colisiones.

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
- Cinco niveles laterales con identidad propia: calle comercial al atardecer, mercado al anochecer, taller subterráneo, sala del trono y corredor de evacuación.
- Ben, Fuego, Cuatro Brazos y Diamante jugables. Combos, remates, bloqueo, parry, esquiva, técnicas comprables y tres árboles de seis mejoras.
- Caballeros básicos, escudos, pesados, energía y comandante. Preparaciones visibles, alineación de profundidad, separación entre enemigos y un máximo de dos ataques preparados simultáneamente.
- Ejecutor Eterno con segunda etapa; Rey Eterno con placas térmicas, espada y retirada con refuerzos limitados. En el prólogo, Driscoll conserva su armadura original.
- Mecanismos de calor y fuerza, conducto opcional, alijos, mejoras permanentes, descansos y cajas destructibles. Los secretos se recolocaron en la nueva banda transitable.
- Recuperación de Diamante, favorito 3, puente cristalino y cierre de seguridad para escapar. Final del capítulo y regreso a explorar.
- Guardado automático de ADN, XP, técnicas, mejoras, secretos, historia y puntos de control. Morir permite reintentar desde la zona guardada. Los guardados de versión 1 siguen siendo legibles: la posición se reconstruye en la entrada de la zona nueva.

<details>
<summary>Guía del capítulo (incluye soluciones)</summary>

1. Bellwood: derrota a las patrullas y avanza a la derecha. Calienta el motor de la compuerta con Fuego; vuelve a Ben, activa Cuatro Brazos y mantén E para levantarla.
2. Mercado: explora los bordes del recorrido para encontrar la mejora de vida y el conducto opcional. Derrótale al Ejecutor; su segunda fase es más rápida.
3. Fortaleza: calienta los dos soportes, después rompe cada uno con dos golpes fuertes de Cuatro Brazos. Cruza la puerta del trono.
4. Rey Eterno: aplica calor y dos golpes fuertes para romper una placa; repite con la segunda. Tras la espada y la retirada, derrota al rey y completa la conversación de recuperación.
5. Diamante: golpea el mecanismo antes del abismo para construir el puente. El puente permite cruzar por su parte central; los bordes siguen siendo un abismo. Cristaliza el cierre del final y llega a la salida.

El calor no se pierde por volver a Ben. Los puntos seguros restauran vida y energía fuera del combate.

</details>

## Alcance

La rueda contiene exactamente diez ADN. XLR8, Fantasmático, Blitzwolfer, Ultra T, Cannonbolt, Wildvine y Snare-oh tienen perfiles y permanecen bloqueados; sus misiones y sistemas de combate todavía no están implementados. `futureMissions` conserva sus asociaciones narrativas como datos para futuras entregas.

La presentación conserva la ilustración elegida por el usuario. Cosmic Invasion se usó como referencia de encuadre lateral, profundidad y composición; no se reutilizan sus imágenes dentro del juego. La procedencia del arte está en [assets/README.md](assets/README.md).

Las cinemáticas son escenas sencillas dentro del motor, sin doblaje. Los personajes narrativos conservan sus poses ilustradas con respiración e iluminación; no tienen animación completa de actuación. Se requiere teclado y mouse; no se incluyen controles táctiles ni soporte de mando.

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

Resultado: **34 pruebas de sistemas y 31 comprobaciones de navegador aprobadas**, sin errores de página. Incluyen geometría de la nueva banda, rutas y secretos accesibles, encuadres sin anatomía cortada, marcha lateral, golpes según profundidad, cámara, ambiente, pausa, guardado y la secuencia completa del capítulo. La prueba opcional con `file://` se omitió por la política del navegador administrado.

Las pruebas lejanas colocan explícitamente personajes y reinician recuperaciones para comprobar los encuentros de forma reproducible. No sustituyen una evaluación humana del equilibrio del juego. Las capturas de prueba se guardan en `artifacts/`, ignorado por Git.

Proyecto fan no oficial. Ben 10 y sus personajes pertenecen a sus respectivos titulares.
