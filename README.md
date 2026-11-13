# Ben 10 · Demo PC V31

La versión vigente es **V31**, basada en la última demo del usuario. Incluye los diez aliens, el HUD, la progresión y los árboles de habilidades de V30, la corrección del daño de Fuego y el nuevo prólogo en cómic.

La entrada principal es [index.html](index.html). Conserva la carpeta `assets` junto al HTML: el prólogo utiliza [el cómic original](assets/prologo-comic.png). Los sprites jugables permanecen incrustados en el HTML.

![Demo PC V31](docs/preview.png)

## Jugar

Abre `index.html` en un navegador de PC o inicia el servidor local:

```sh
npm start
```

Visita http://localhost:8000. Para jugar no hace falta instalar dependencias; el servidor utiliza Python 3.

## Prólogo en cómic

Las doce viñetas aparecen progresivamente, en orden de lectura. Las anteriores permanecen visibles. El avance automático deja tiempo para leer y, al terminar, entra a la demo. La imagen conserva sus proporciones, bordes y separadores.

- **Espacio, Enter, flecha derecha o clic:** avanzar.
- **Flecha izquierda:** volver a la viñeta anterior.
- **P:** pausar o reanudar.
- **Esc:** saltar a la demo.

El reproductor pausa el juego durante el prólogo y suspende el avance automático al ocultar la pestaña o perder el foco. La cinemática anterior y sus recursos de Gwen y Max se han retirado de esta versión.

## Controles de PC

| Acción | Control |
| --- | --- |
| Moverse y orientarse | WASD o flechas |
| Ataque leve | Clic izquierdo |
| Ataque fuerte o habilidad propia | Clic derecho |
| Dash | Espacio |
| Abrir el Omnitrix | R |
| Elegir alien con el Omnitrix abierto | 1–9 y 0 |
| Volver a Ben | T o centro del reloj |
| Árbol de evolución | K |
| Habilidad desbloqueada | F |
| Panel de pruebas | F9 |

Aliens: Cuatro Brazos, Fuego, XLR8, Diamante, Cannonbolt, Fantasmático, Insectoide, Wildvine, Blitzwolfer y Ultra T. Los árboles contienen 46 nodos por alien. Las mejoras se guardan localmente en el navegador.

Esta entrega utiliza teclado y ratón; se eliminaron el joystick, los botones táctiles y los ajustes específicos para móvil.

## Corrección de Fuego y validación

Los proyectiles conservan el multiplicador de ataque del momento del disparo. Volver a Ben antes del impacto ya no aumenta su daño. Con las estadísticas iniciales, la bola normal causa 16 de daño y la explosiva 36 en ambos casos.

Se probaron las doce viñetas, pausa, retroceso, salto, transición a la demo, diez transformaciones y ambos proyectiles. El cómic completo coincide píxel por píxel con la imagen original. La ejecución final en Chromium no registró errores JavaScript ni peticiones fallidas. Los resultados están en [docs/v31-validation.json](docs/v31-validation.json).
