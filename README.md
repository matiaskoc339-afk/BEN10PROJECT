# Ben 10 · Demo v0.8

La demo v0.8 es la única versión jugable de este repositorio. La entrada principal es [index.html](index.html), un archivo autónomo que incluye los sprites de Ben, Cuatro Brazos y Fuego, el escenario, el Omnitrix clásico y el HUD. Se puede jugar sin conexión.

![Demo v0.8](docs/preview.png)

Abre `index.html` en un navegador o inicia el servidor local:

```sh
npm start
```

Visita [http://localhost:8000](http://localhost:8000). Para jugar no hace falta instalar dependencias; el servidor utiliza Python 3.

## Controles

| Acción               | Control        |
| -------------------- | -------------- |
| Moverse y orientarse | WASD o flechas |
| Golpe leve           | Clic izquierdo |
| Golpe fuerte         | Clic derecho   |
| Dash                 | Espacio        |
| Abrir el Omnitrix    | R              |
| Elegir Cuatro Brazos | 1, dentro de la rueda |
| Elegir Fuego         | 2, dentro de la rueda |
| Volver a Ben        | T, o el centro de la rueda |

En pantallas táctiles están disponibles el joystick y los botones. Toca el reloj, elige el retrato del alien y toca el centro de la rueda para volver a Ben. Las otras ocho ranuras se reservan para aliens de la serie clásica y están bloqueadas.

## Primer alien: Cuatro Brazos

Cuatro Brazos utiliza sus propios sprites de guardia, marcha, puñetazos alternados, golpes pesados y carga. Sus cuatro brazos y el emblema del Omnitrix en el hombro siguen el diseño clásico. Ben tiene una escala de niño: se redujo su tamaño un 37,5 % respecto a la demo anterior. Cuatro Brazos mide aproximadamente 1,6 veces la altura de Ben; su escala se redujo un 30 % respecto a la primera entrega del alien. La sombra y la colisión acompañan ese tamaño. Camina a 190 unidades por segundo frente a las 247 de Ben; sus golpes tienen más daño y alcance.

La cámara centra el cuerpo completo con un encuadre más cercano, idéntico para Ben y ambos aliens: transformarse no aleja la vista. Los fotogramas se registran por el centro del torso y el suelo, con margen para los brazos extendidos. Así, las piernas en movimiento no desplazan todo el cuerpo de un lado a otro. Cada ataque incluye preparación, contacto y recuperación hasta la misma guardia; una pulsación rápida queda en espera sin reiniciar el golpe actual. El impacto sísmico conserva la orientación del personaje. Si hace falta espacio para el cuerpo del alien, la transformación busca suelo libre cercano.

![Cuatro Brazos en la demo](docs/four-arms.png)

## Fuego clásico y daño de Ben

Fuego tiene 256 fotogramas propios de guardia, carrera, dash y combate en cuatro direcciones. La carrera usa ocho poses de apoyo, compresión, paso y vuelo, con zancadas amplias, brazos opuestos y la llama siguiendo el movimiento. La cadencia acompaña la distancia recorrida y los pies se levantan en las fases de vuelo. Su cuerpo de roca roja, las grietas de lava, la cabeza en llamas y el Omnitrix en el pecho siguen el diseño clásico. Es más alto que Ben y más pequeño que Cuatro Brazos, conservando el mismo encuadre.

El combo leve alterna un recto, un gancho con giro de torso y una patada frontal, con tiempos de preparación y recuperación propios. Cada golpe transfiere el peso con un avance corto que respeta las colisiones. Las acciones se registran por la cadera para conservar el giro de hombros. El fuerte alterna un empuje de una palma y una descarga con ambas manos, y lanza una bola de fuego que viaja hasta el objetivo y choca con el escenario. Dos leves conectados preparan una bola explosiva de 70 de daño, con impacto en área y coste de 20 de energía al salir. Cada proyectil impacta una sola vez. Un dash antes del lanzamiento cancela el gasto. Si la energía se agota después de lanzar una bola, esta termina su vuelo mientras Ben vuelve a su forma humana.

| Personaje | Combo leve | Fuerte | Velocidad |
| --- | --- | --- | --- |
| Ben | 8 / 8 / 12 | 20, cuerpo a cuerpo | 247 |
| Cuatro Brazos | 26 / 30 / 38 | 65, cuerpo a cuerpo | 190 |
| Fuego | 14 / 16 / 20 | 32, bola de fuego | 285 |

Ben hace menos daño que antes: los dos primeros leves bajan de 17 a 8; el tercero, de 25 a 12; el fuerte, de 45 a 20. Fuego tiene un dash más rápido y puede atacar a distancia. Cambiar entre aliens conserva la vida, el XP y la energía restante.

![Fuego en la demo](docs/heatblast.png)

![Carrera y variedad de golpes de Fuego](docs/heatblast-motion.png)

[Ver las animaciones en movimiento](docs/heatblast-motion.mp4).

![Bola de fuego en vuelo](docs/heatblast-fire.png)

## HUD y progresión

- El líquido verde del reloj representa la energía del Omnitrix. El propio reloj abre la rueda de selección.
- La barra roja muestra la vida; la naranja muestra el XP necesario para el siguiente nivel.
- Cada objetivo derrotado otorga 40 XP. El primer nivel requiere 100 XP y cada siguiente umbral aumenta en 50. El sobrante se conserva al subir de nivel.

Cada alien consume 1,5 puntos de energía por segundo. Dos leves conectados y un fuerte activan un especial de 20 puntos: impacto sísmico con Cuatro Brazos o bola ígnea explosiva con Fuego. El gasto ocurre al salir el especial, incluso si falla; cancelar la animación con un dash antes del contacto evita el gasto.

Al agotarse la energía, el sistema vuelve a Ben conservando vida, XP y nivel. En forma humana, el reloj comienza a recargarse tras 3 segundos, a 8 puntos por segundo. La rueda pausa la simulación. El XP y el nivel se mantienen durante la sesión; recargar la página inicia una sesión nueva.

## Desarrollo

```sh
npm ci
npx playwright install chromium
npm test
```

Las 104 comprobaciones verifican los fotogramas, la guardia, los golpes, el dash, el anclaje del reloj, la energía, los especiales, el XP y el HUD en escritorio y móvil. También prueban la transformación real a Cuatro Brazos y a Fuego, sus cuatro direcciones de ataque, las escalas, su colisión, la cámara fija, la estabilidad del torso, la recuperación de los golpes, los combos con pulsaciones rápidas y la vuelta a Ben por teclado, por pantalla táctil y por energía agotada. Las pruebas de fuego verifican el daño reducido de Ben, los ataques cuerpo a cuerpo, el vuelo de los proyectiles, los obstáculos, las explosiones y las colisiones a distintas tasas de actualización. También comprueban la variación real de las siluetas al correr, la cadencia según la distancia, los cinco ataques distintos, la sincronización del contacto y los avances de los golpes a 30, 60 y 120 actualizaciones por segundo. Si Chromium está instalado en `/usr/bin/chromium`, se utiliza ese ejecutable; también puede indicarse otro mediante `CHROMIUM_PATH`.

El diseño fuente y el atlas del reloj están en [assets](assets). Para recompilarlo e incrustarlo en `index.html`:

```sh
npm run build:omnitrix
```

El modelo de vida, energía y XP está en [systems/player-stats.js](systems/player-stats.js). Después de modificarlo, este comando sincroniza su copia incrustada en el HTML:

```sh
npm run build:stats
```

`tests` contiene únicamente las pruebas de esta demo. `docs/preview.png` muestra el HUD actual.

Las fuentes de Cuatro Brazos y su atlas están en [assets/aliens](assets/aliens). Este comando vuelve a registrar los fotogramas con el torso centrado y una línea de suelo común, conserva los brazos completos e incrusta el atlas en el único HTML jugable:

```sh
npm run build:four-arms
```

Las fuentes y el atlas de Fuego están en la misma carpeta. La guardia se registra por el pecho y las acciones nuevas por la cadera, con un suelo común y margen para las llamas, brazos y piernas extendidos:

```sh
npm run build:heatblast
```

La trayectoria y las colisiones de las bolas de fuego se prueban en [systems/fire-projectiles.js](systems/fire-projectiles.js). Para sincronizar su copia incrustada:

```sh
npm run build:fire
```
