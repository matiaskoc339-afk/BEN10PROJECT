# V38 — Ventana de habilidades arcade

La ventana que se abre con **K** usa marcos metálicos de bordes rectos, un emblema del Omnitrix y la paleta verde del HUD del juego. El árbol y los detalles conservan el color propio de cada alien. Los retratos y las vistas previas siguen usando sus imágenes y animaciones originales.

- La lista lateral muestra los diez aliens y cuántos ADN has recuperado. Los bloqueados conservan su candado y su retrato atenuado.
- El encabezado del árbol muestra el estado del ADN, las mejoras aprendidas y una barra de progreso. Diamante indica que su ADN está en poder del Rey Eterno hasta desbloquearlo.
- Los atributos usan iconos de fuerza, defensa y velocidad; los combos usan espadas cruzadas y la habilidad activa conserva la F. Las mejoras aprendidas muestran una marca. Se mantienen los 24 nodos y las 23 conexiones de cada árbol.
- La vista inicial muestra la figura completa del árbol. Elegir un nodo desde esa vista lo acerca. Los controles +, − y Ver forma permiten cambiar la escala; el mapa conserva el desplazamiento habitual.
- El panel derecho reúne la animación, coste de aprendizaje, combinación de teclas, coste de energía, atributos y requisitos. El botón de compra queda siempre separado del contenido que se desplaza.

La interfaz se adapta a ventanas de PC de 1024×768, 1280×720, 1440×900 y 1920×1080. Los dos paneles laterales tienen desplazamiento propio. Si redimensionas la ventana mientras ves el árbol completo, se reajusta la escala. El modo de movimiento reducido desactiva los destellos de la interfaz.

Se conserva la progresión y el balance de V37: comienzas con Cuatro Brazos y Fuego, Diamante se habilita al derrotar al rey y los demás ADN siguen bloqueados. Los costes, requisitos, mejoras, secuencias y tiempos de las 70 técnicas no cambian. Las compras anteriores y el desbloqueo de Diamante siguen guardados.

`npm run test:hud` abre la demo sin alterar sus bloqueos y prueba las cuatro ventanas de PC, compras, puntos, progreso, requisitos de ADN, detalles de combo, cierre, reapertura y conservación de mejoras tras recargar. `npm test` ejecuta también las comprobaciones de las 70 técnicas, los 16 encuentros, las tres fases del jefe, las colisiones y la vida compartida. El empaquetador exige que todas las pruebas estén aprobadas antes de generar el ZIP.
