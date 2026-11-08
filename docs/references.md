# Referencias usadas en la reconstrucción lateral

## Composición de niveles y combate

[MARVEL Cosmic Invasion — página oficial de Dotemu](https://www.dotemu.com/games/marvel-cosmic-invasion/).

Se consultaron las capturas oficiales del [escenario exterior](https://www.dotemu.com/wp-content/uploads/2025/08/marvel_cosmic_invasion_screenshot_1.png) y del [interior](https://www.dotemu.com/wp-content/uploads/2025/08/marvel_cosmic_invasion_screenshot_5.png), además de la presentación del juego. Se observaron la franja de suelo en la parte inferior, la altura constante de cámara, la lectura de las siluetas laterales, el contraste entre personajes y fondo, y los elementos arquitectónicos que se superponen a distinta profundidad.

Aplicación al proyecto: niveles horizontales, movimiento en profundidad dentro de una banda acotada, orden por los pies, golpes que necesitan alineación, fachadas continuas, materiales menos contrastados en el suelo y capas con desplazamiento distinto. Los fondos, personajes, objetos y música de Marvel no se incorporan al juego.

## Animación de sprites

[SLYNYRD — Pixelblog 8: Intro to Animation](https://www.slynyrd.com/blog/2018/8/19/pixelblog-8-intro-to-animation).

Se consultaron sus ejemplos y explicación de ciclos, poses y animación de reposo. La implementación mantiene un reposo separado de la marcha, usa seis poses de paso por orientación y avanza el ciclo según la distancia realmente recorrida. Los pies se anclan por su base y la animación se detiene al empujar una pared.

Los movimientos de combate conservan preparación, contacto y recuperación. La dirección se fija al empezar el golpe y el daño se aplica una sola vez en el contacto. El encuadre de cada silueta se registra completo, incluyendo manos o armas que sobresalen de la cuadrícula nominal.

La referencia arcade se aplica a composición, movimiento y lectura; el acabado permanece en la ilustración 2D elegida para este proyecto.
