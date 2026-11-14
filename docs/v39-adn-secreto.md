# V39 — ADN por descubrir

La interfaz muestra únicamente las identidades que el jugador ya ha recuperado. Una partida inicial conserva Cuatro Brazos y Fuego.

El reloj utiliza el mismo retrato anónimo en todas las casillas desconocidas. La nueva imagen tiene una silueta neutral y una interrogación verde; no deriva del aspecto de ningún alien del catálogo. La casilla no dibuja el retrato real debajo de la imagen. Al pasar el ratón aparece «ADN desconocido», y elegirla con el ratón o el teclado muestra un aviso genérico sin iniciar una transformación. Las teclas de formas que todavía no están implementadas también evitan revelar nombres.

«Tus aliens» genera botones únicamente para los ADN conseguidos. El contador muestra cuántos tienes, sin anunciar el tamaño del catálogo. Los árboles de formas no recuperadas no se pueden seleccionar. Una selección antigua o inválida vuelve a una forma conocida, y las compras históricas no revelan automáticamente identidades nuevas.

Cuando se recupera un ADN, se reconstruye la lista y se revela su retrato en la casilla original del reloj. Los botones conservan el índice real de cada alien: una nueva tercera opción en la lista no se confunde con la tercera casilla del Omnitrix. El árbol usa sus mejoras guardadas y el desbloqueo persiste después de recargar la página.

El nuevo sprite está en `assets/ui/unknown-alien.png`. Se conserva el original generado, con transparencia, sin modificar las imágenes anteriores. `docs/unknown-dna-art.json` guarda su procedencia. La imagen es externa al HTML y está incluida en el ZIP para funcionar sin conexión.

La ocultación corresponde a la interfaz del juego. Se conserva el catálogo completo de arte y sistemas para los futuros desbloqueos; la documentación de desarrollo y los archivos fuente contienen sus nombres.

`npm run test:secrets` compara los ocho retratos desconocidos y exige que sean idénticos. Prueba nombres visibles y etiquetas de accesibilidad, selección con ratón y teclado, guardados antiguos, selección obsoleta y recuperación desde un guardado válido. `npm run test:boss` verifica la revelación después de ganar el combate real, incluida la selección correcta del nuevo árbol. `npm test` también conserva las comprobaciones de las 70 técnicas, el HUD, las fases y las colisiones.
