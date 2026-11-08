# BEN 10: El Omnitrix Fracturado

Videojuego fan de acción y aventura top-down, en español, inspirado en Ben 10 clásico. Ben tiene diez años. Esta entrega contiene un capítulo compacto con principio, desarrollo y final. Canvas 2D, personajes ilustrados con atlas de fotogramas y audio sintetizado; incluye todas las imágenes en el repositorio y no depende de recursos de terceros durante la partida.

## Revisión 2.1: movimiento, profundidad y escenario vivo

Se conservan los modelos aprobados de la versión 2.0. La marcha utiliza ahora seis fotogramas consecutivos por dirección sin intercalar la pose de reposo. Se añadieron respiración, guardia al acercarse enemigos, apoyo de los pies, sombras proyectadas y pasos con polvo o hierba. Los golpes avanzan y los impactos desplazan gradualmente, en lugar de teletransportar los sprites.

El agua de la fuente circula y forma ondas, las copas se mueven con el viento manteniendo el tronco fijo, la hierba reacciona al paso y hay hojas, aves, farolas, humo tenue y luces de los mecanismos. Se recolocaron edificios y bancos que invadían calzadas. [Ver una captura y el detalle de la integración](docs/art-direction.md) · [Ver el clip de marcha, combate y jardín](docs/integration-v21.mp4).

La cámara centra el cuerpo del jugador incluso en los bordes. Bellwood y el distrito comercial tienen 2600 × 1900 unidades, calles conectadas por el norte y el sur, jardín, patios y accesos laterales. **M abre el mapa** sin avanzar la simulación.

Los golpes tienen preparación, contacto y recuperación. El daño, los proyectiles y los efectos se activan en el contacto; esquivar antes lo cancela. La dirección del golpe se fija al iniciarlo, la marcha sigue la dirección de desplazamiento y los pies dejan de animarse al chocar. La simulación usa pasos fijos de 60 Hz para conservar la misma velocidad cuando baja la frecuencia de renderizado.

## Ejecutar

Desde la carpeta del proyecto:

```sh
python3 -m http.server 8000
```

Abre el servidor en tu navegador de PC, en el puerto 8000. También puedes usar `npm start` si tienes Node.js. No hace falta instalar paquetes, compilar ni configurar credenciales. Se recomienda Chrome, Chromium, Edge o Firefox recientes.

Los scripts son clásicos y no usan `fetch` ni módulos, para permitir abrir `index.html` directamente cuando el navegador lo permita. **Esa modalidad no pudo verificarse aquí**: Chromium administrado bloquea `file://`. Usa el servidor para tener un origen estable y conservar la partida en `localStorage`.

## Contenido implementado

- Menú animado, nueva partida con confirmación si existe un guardado, continuar, pausa, opciones, controles reasignables, volumen, dificultad Historia/Normal y ajuste de sacudidas.
- Prólogo del extractor con los siete villanos, fractura del reloj y discusión cómica. Diálogos con retratos, nombres, expresiones, efecto de escritura, historial, cámara y opción de omitir escenas.
- Cinco zonas conectadas: calles de Bellwood, distrito comercial, fortaleza, sala del trono y ruta de evacuación. Colisiones, vehículos, edificios, tienda accesible, callejones, cajas destructibles, iluminación y secretos. Se puede regresar a zonas anteriores por las flechas del oeste.
- Ben humano, Fuego, Cuatro Brazos y, tras vencer al jefe, Diamante. Tienen siluetas y animaciones propias. Fuego combina proyectiles y áreas; Cuatro Brazos usa golpes, empujes, derribos, parry y onda de choque; Diamante usa esquirlas, resistencia y estructuras.
- Ataques dirigidos al cursor, combinaciones de tres ataques, ventana de combo, entrada anticipada, remates, esquiva con invulnerabilidad y cancelación de recuperación, bloqueo direccional y parry. Mantener J encadena ataques ligeros.
- Cinco clases de caballeros: básico, escudo, pesado, energía y comandante. Preparan sus ataques, se reposicionan, guardan distancias, defienden o evaden según su clase. Un máximo de dos ataques se preparan simultáneamente. Los comandantes fortalecen a sus aliados.
- Omnitrix con consumo, agotamiento, recuperación, conservación de energía al cancelar y salud compartida. Rueda de diez espacios, tres favoritos configurables y selección preparada al intentar cambiar directamente de alienígena.
- Árboles de seis mejoras para cada uno de los tres alienígenas de esta entrega: tres técnicas nuevas y tres maestrías dependientes. Las técnicas cambian el combate; no son botones decorativos. Cada 100 XP otorgan un punto.
- Compuerta térmica y levantamiento sostenido; conductos cristalinos que requieren calor y fuerza; puzle opcional con núcleo de energía; mejoras permanentes de salud y energía.
- Ejecutor Eterno con escudo y segunda etapa agresiva. Rey Eterno con dos placas térmicas, transición a espada y retirada con refuerzos limitados. El calor no caduca mientras cambias de forma.
- Recuperación de Diamante, anuncio de desbloqueo, asignación al tercer favorito y escape construyendo un puente y cristalizando un cierre. Reunión con Gwen y Max, pantalla de capítulo completado y regreso a la exploración.
- Guardado automático en transiciones, descansos, puzles, mejoras, favoritos y compras de habilidades. Conserva historia, ADN, XP, técnicas, mejoras permanentes, secretos y puntos de control. Al morir reapareces en la zona del último guardado con vida y energía restauradas. El guardado es local a ese navegador y origen.

## Controles

| Acción                        | Tecla inicial                            |
| ----------------------------- | ---------------------------------------- |
| Moverse                       | WASD                                     |
| Apuntar                       | Mouse                                    |
| Ataque ligero                 | J / clic izquierdo                       |
| Ataque fuerte                 | K / clic derecho                         |
| Esquiva                       | Espacio                                  |
| Bloqueo y parry               | Shift, mirando al ataque                 |
| Especial                      | F; consume 10 de energía y tiene recarga |
| Interactuar / avanzar diálogo | E; Enter también avanza diálogos         |
| Rueda del Omnitrix            | Mantener Q, apuntar, soltar Q            |
| Favoritos                     | 1, 2, 3                                  |
| Volver a Ben                  | X                                        |
| Usar ADN preparado            | E, estando como Ben                      |
| Árbol de habilidades          | Tab                                      |
| Mapa de la zona               | M                                        |
| Pausa                         | Esc                                      |

Los controles se pueden cambiar desde Opciones → Controles o desde el menú principal. Los favoritos 1/2/3 están reservados. Durante un diálogo, la primera pulsación revela la frase y la siguiente continúa. La acción y el movimiento se pausan durante conversaciones y menús. La rueda ralentiza el mundo: no lo detiene por completo.

**El Control Maestro no está desbloqueado.** Para cambiar de Fuego a Cuatro Brazos: X, después 1. Elegir otra forma mientras estás transformado solamente la prepara; vuelve a Ben y pulsa E para activarla.

<details>
<summary>Guía breve del capítulo (incluye soluciones)</summary>

1. Derrota las patrullas. Apunta con Fuego al motor de la compuerta del este hasta llenar su indicador. Vuelve a Ben y selecciona Cuatro Brazos; mantén E junto al motor hasta levantarla.
2. Explora el distrito. Entra en Archivos por su puerta para encontrar vida permanente. El conducto del callejón del sur esconde un núcleo del Omnitrix: fúndelo con Fuego y recoge la recompensa con E.
3. En la plaza, esquiva las preparaciones del Ejecutor. Los golpes fuertes rompen su defensa; los proyectiles también sirven si aprovechas su recuperación o atacas sus flancos.
4. En la fortaleza, calienta ambos conductos cristalinos. Rompe cada uno con dos golpes fuertes de Cuatro Brazos. La puerta principal se abre.
5. Rey Eterno: llena el calor con Fuego, vuelve a Ben, selecciona Cuatro Brazos y da dos golpes fuertes. Repite una vez para la segunda placa. Después puede recibir daño de cualquiera de las dos formas. En su última fase, persíguelo y esquiva los disparos; los refuerzos simultáneos están limitados a dos.
6. Con Diamante en el favorito 3, ataca el mecanismo antes del abismo para formar un puente. Haz lo mismo con el cierre del este. Cruza hasta la salida y completa la conversación final.

Los puntos seguros restauran vida y energía fuera del combate. Si se agota el reloj durante un puzle, espera como Ben: los mecanismos conservan el calor durante esa visita.

</details>

## Ampliación y límites de esta entrega

La rueda contiene **exactamente diez** ADN. Los otros siete permanecen bloqueados: XLR8, Fantasmático, Blitzwolfer, Ultra T, Cannonbolt, Wildvine y Snare-oh. Tienen perfiles, siluetas e información de procedencia; **sus sistemas de combate y misiones aún no están implementados**. No hay capítulos falsos seleccionables, ni misión parcial de Blitzwolfer, ni orden inventado para las próximas misiones.

`B10.futureMissions` registra las asociaciones de ADN con sus villanos y la obtención de Blitzwolfer mediante escaneo independiente. Sirve como registro extensible, no como campaña ya desarrollada. El cambio directo de forma admite una futura bandera de Control Maestro, pero ninguna acción de este capítulo la activa.

Las cinemáticas son escenas dentro del motor, con actuaciones y cámara sencillas; no son videos ni tienen doblaje. El arte usa sprites ilustrados locales generados para esta entrega; su procedencia se explica en `assets/README.md`. El sonido usa Web Audio. No se incluyen recursos oficiales de la serie. La interfaz se adapta a ventanas pequeñas, pero el juego requiere teclado y mouse: no tiene controles táctiles ni soporte de mando.

## Arquitectura

| Archivo            | Responsabilidad                                                         |
| ------------------ | ----------------------------------------------------------------------- |
| `js/data.js`       | ADN, controles, árboles, guiones y futuras misiones                     |
| `js/game.js`       | Bucle, entrada, cámara, transiciones, almacenamiento y coordinación     |
| `js/actors.js`     | Jugador, colisiones, movimiento, defensa y transformaciones             |
| `js/world.js`      | Zonas, encuentros, objetos, puzles, secretos y navegación               |
| `js/combat.js`     | Combos, daño, IA, jefes, proyectiles y áreas persistentes               |
| `js/assets.js`     | Carga de imágenes locales, selección de fotogramas, anclajes y retratos |
| `js/world-life.js` | Pisadas, viento, agua, vegetación, luces y ambiente                     |
| `js/render.js`     | Personajes, escenarios, efectos y presentación del menú                 |
| `js/ui.js`         | HUD, rueda, narrativa, opciones, habilidades y favoritos                |
| `js/audio.js`      | Efectos sintetizados con Web Audio                                      |

Las nuevas misiones se añaden con datos de zona, encuentros, objetos y guiones; se reutilizan el guardado, las transformaciones, los diálogos y los disparadores. No se necesita un worktree: cada tarea en la nube ya usa un entorno aislado.

## Pruebas

Pruebas de sistemas sin dependencias (Node.js 18+):

```sh
npm test
```

29 pruebas cubren combate, parry, coordinación, consumo, agotamiento, conservación, colisiones, ambos jefes, puzles, mejoras y técnicas.

Pruebas de navegador opcionales, con Playwright y Chromium disponibles:

```sh
# Solo si Playwright no está instalado en el entorno:
npm install --no-save --package-lock=false playwright
npm run test:browser
```

El ejecutable predeterminado es `/usr/bin/chromium`; usa `CHROMIUM_PATH` para indicar otro Chromium instalado. El runner levanta y cierra su propio servidor en el puerto 8765. Genera capturas en `artifacts/`, ignoradas por Git.

Resultado en este entorno: **29 pruebas de sistemas y 24 comprobaciones de integración aprobadas**, sin errores de página. Se comprobaron teclado, daño de IA, opciones, favoritos, diálogos, guardado, muerte, puzles y la secuencia de finalización. Las pruebas de encuentros usan colocación explícita y reinicio de recuperaciones para hacer reproducibles las situaciones; no equivalen a una partida humana completa ni a una evaluación exhaustiva del equilibrio. La prueba opcional de `file://` se omitió por la política del navegador administrado.

Proyecto fan no oficial, sin fines comerciales. Ben 10 y sus personajes pertenecen a sus respectivos titulares.
