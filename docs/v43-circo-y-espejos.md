# V43 · Selección de villanos y circo de Zombozo

Al derrotar al Rey Eterno y continuar desde la recompensa de Diamante, aparece **Elige tu próximo rival**. Zombozo tiene retrato y acceso a su nivel. El selector prepara una campaña por destinos elegidos por el jugador, en lugar de encadenar automáticamente el siguiente villano. Los otros destinos y la ruta final permanecen pendientes de sus respectivos niveles; no se presentan como combates jugables.

**Probar a Diamante** conserva la posibilidad de usar el ADN recién conseguido en la sala del rey. La salida del laboratorio permite abrir el selector después. Los tres espacios guardan también el destino actual, los actos despejados y el progreso por los espejos. Las partidas anteriores mantienen sus mejoras y ADN.

## El circo

Desde la selección se llega a una entrada exterior caminable, con la carpa enorme y su puerta oscura. Acércate y pulsa **E / Enter** o el botón de entrada. Zombozo da la bienvenida, con diálogo en pantalla y voz del navegador si hay una voz española instalada. El silencio, la pausa y la salida de escena cancelan esa voz.

Los tres panoramas son los creados en la biblioteca de arte:

1. **Vestíbulo de la carpa:** primera función, taquilla y galerías.
2. **El espectáculo de obstáculos:** tramoya, espejos deformantes y aparatos.
3. **Escenario principal:** bastidores, gradas y pista final.

Cada acto tiene tres combates que impiden avanzar hasta despejar sus rondas. El primer coloso aparece como **minijefe**, acompañado por dos rápidos. Los siguientes colosos pasan a formar parte de las oleadas normales. Las variantes locas se introducen en los combates posteriores del segundo acto y predominan progresivamente en el tercero.

## Estadísticas y comportamiento

Valores base, antes de la defensa del alien del jugador:

| Enemigo | Vida normal / loco | Daño normal / loco | Defensa normal / loco | Velocidad normal / loco |
| --- | --- | --- | --- | --- |
| Fuerte | 180 / 288 | 12 / 16 | 18% / 26% | 72 / 84 |
| Rápido | 56 / 90 | 5 / 7 | 2% / 10% | 185 / 215 |
| Tramposo | 86 / 138 | 14 / 18 | 6% / 14% | 102 / 118 |
| Primer coloso, minijefe | 420 | 16 | 25% | 72 |

Los fuertes resisten interrupciones de golpes sueltos y anuncian sus mazazos. Los rápidos buscan ángulos distintos, se comprometen con su ataque y se retiran antes de volver a entrar. Los tramposos mantienen distancia y los locos anticipan parte del desplazamiento del jugador. Las siluetas, los ataques y las caídas usan las seis láminas dibujadas previamente.

Las bombas viajan en arco y señalan su punto de caída antes de explotar:

- **Explosiva:** daño de área, con explosión y humo.
- **Ácida:** charco temporal e intoxicación breve que continúa tras salir. Sus pulsos no pueden reducir la vida de Ben por debajo de 1 PV.
- **Confeti:** no daña al jugador. Cura 10 PV a los payasos normales o 17 a los locos cercanos, sin superar su vida máxima.

Las cápsulas poco frecuentes curan **20 / 22 / 24 PV** según el acto del circo. Se conservan la reserva de vida de Ben, las defensas de los aliens, el consumo del reloj y los árboles de habilidades.

## Ruta Cristal

Al terminar los actos uno y dos, acércate al espejo y pulsa **E / Enter** o el botón de entrada. El juego cambia a una vista de plataformas estrictamente lateral y vuelve a Ben. El selector, las transformaciones, los ataques y el dash quedan desactivados durante la ruta.

- **A / D o ← / →:** desplazamiento.
- **Espacio / W / ↑:** salto; soltar antes la tecla permite un salto más corto.
- **P:** pausa y guardado.
- **Espejo final:** se atraviesa automáticamente al tocarlo sobre su plataforma.

Cada ruta tiene fosos, plataformas, trampas temporizadas y un punto de control. La segunda es más larga y añade una plataforma móvil, un peligro oscilante y un haz intermitente. Las trampas quitan 8 PV, los fosos 10 PV, el orbe 9 PV y el haz 12 PV. Hay protección breve tras un golpe y tolerancia al saltar desde un borde. Caer en un foso devuelve al punto de control con daño; perder toda la vida permite reintentar allí. Al salir se conserva la vida restante y se recupera el desplazamiento normal del siguiente acto.

Ben tiene 16 poses nuevas para lanzamiento, ascenso, ápice, descenso y aterrizaje. Los fondos mantienen su proporción y un desplazamiento suave, mientras las plataformas y trampas tienen geometría y colisión propias.

## Límite de esta entrega

El recorrido llega al escenario principal de Zombozo. **Su combate todavía no está implementado**, tal como se dejó para una entrega posterior. Despejar el tercer acto registra que llegaste al escenario y permite volver al selector. Eso no cuenta como derrotar a Zombozo ni desbloquea la ruta del villano final.

## Verificación

`npm run test:adventure` comprueba estadísticas, IA, bombas, saltos y un recorrido real en Chromium: victoria sobre el Rey Eterno, selección, acceso exterior, nueve combates, primer minijefe, transformación y golpe del jugador, las dos rutas completas mediante sus físicas, daño y reintento, vuelta al mundo normal y guardado persistente. Las pruebas generales conservan los diez aliens, sus 70 técnicas y 1.260 poses originales, el jefe, los tres espacios y el audio.
