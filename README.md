# Ben 10 · Demo v0.8

La demo v0.8 es la única versión jugable de este repositorio. La entrada principal es [index.html](index.html), un archivo autónomo que incluye los sprites de Ben, Cuatro Brazos, Fuego, XLR8, Diamante, Cannonbolt, Fantasmático, Insectoide, Wildvine, Blitzwolfer y Ultra T, el escenario, el Omnitrix clásico y el HUD. Se puede jugar sin conexión.

![Demo v0.8](docs/preview.png)

## Sprites HD

Cuatro Brazos, Fuego, XLR8, Diamante, Cannonbolt, Fantasmático, Insectoide, Wildvine, Blitzwolfer y Ultra T usan atlas de 160 píxeles de altura base por pose. Las nuevas hojas de referencia mantienen el diseño clásico, las proporciones y el anclaje anatómico; la guardia, el movimiento y los ataques se calibran desde la pose neutra de cada vista. El renderizado conserva el tamaño de los personajes y añade un filtrado de mayor calidad para los contornos.

Los fotogramas se dibujan desde una textura compartida para evitar copiar cientos de imágenes HD al iniciar la demo. El reloj de selección utiliza una escala propia para que los retratos sigan dentro de sus ranuras.

![Comparación de los aliens antes y en HD](docs/aliens-hd-comparison.png)

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
| Elegir XLR8          | 3, dentro de la rueda |
| Elegir Diamante      | 4, dentro de la rueda |
| Elegir Cannonbolt    | 5, dentro de la rueda |
| Elegir Fantasmático  | 6, dentro de la rueda |
| Elegir Insectoide    | 7, dentro de la rueda |
| Elegir Wildvine      | 8, dentro de la rueda |
| Elegir Blitzwolfer   | 9, dentro de la rueda |
| Elegir Ultra T       | 0, dentro de la rueda |
| Volver a Ben        | T, o el centro de la rueda |

En pantallas táctiles están disponibles el joystick y los botones. Toca el reloj, elige el retrato del alien y toca el centro de la rueda para volver a Ben. Las otras tres ranuras se reservan para aliens de la serie clásica y están bloqueadas. XLR8 ocupa la ranura 3, Diamante la 4, Cannonbolt la 5, Fantasmático la 6, Insectoide la 7, Wildvine la 8 Blitzwolfer la 9 y Ultra T la 0. La rueda incorpora trece formas clásicas; las tres restantes siguen bloqueadas.

## Primer alien: Cuatro Brazos

Cuatro Brazos utiliza sus propios sprites de guardia, marcha, puñetazos alternados, golpes pesados y carga. Sus cuatro brazos y el emblema del Omnitrix en el hombro siguen el diseño clásico. Ben tiene una escala de niño: se redujo su tamaño un 37,5 % respecto a la demo anterior. Cuatro Brazos mide aproximadamente 1,6 veces la altura de Ben; su escala se redujo un 30 % respecto a la primera entrega del alien. La sombra y la colisión acompañan ese tamaño. Camina a 190 unidades por segundo frente a las 247 de Ben; sus golpes tienen más daño y alcance.

La cámara centra el cuerpo completo con un encuadre más cercano, idéntico para Ben y los diez aliens: transformarse no aleja la vista. Los fotogramas se registran por el centro del torso y el suelo, con margen para los brazos extendidos. Así, las piernas en movimiento no desplazan todo el cuerpo de un lado a otro. Cada ataque incluye preparación, contacto y recuperación hasta la misma guardia; una pulsación rápida queda en espera sin reiniciar el golpe actual. El impacto sísmico conserva la orientación del personaje. Si hace falta espacio para el cuerpo del alien, la transformación busca suelo libre cercano.

El tercer golpe leve dura 0,50 segundos, frente a los 0,38 de los dos primeros. Su smash lateral incluye la pose de puños levantados y sostiene brevemente el impacto para que se lea mejor. El contacto permanece sincronizado con el dibujo y causa daño una sola vez.

![Cuatro Brazos en la demo](docs/four-arms.png)

## Fuego clásico y daño de Ben

Fuego tiene 256 fotogramas propios de guardia, carrera, dash y combate en cuatro direcciones. La carrera usa ocho poses de apoyo, compresión, paso y vuelo, con zancadas amplias, brazos opuestos y la llama siguiendo el movimiento. La cadencia acompaña la distancia recorrida y los pies se levantan en las fases de vuelo. Su ciclo ahora tarda aproximadamente un 26 % más en completarse (un 21 % menos de cadencia), conservando la velocidad de 285 unidades por segundo. Su cuerpo de roca roja, las grietas de lava, la cabeza en llamas y el Omnitrix en el pecho siguen el diseño clásico. Es más alto que Ben y más pequeño que Cuatro Brazos, conservando el mismo encuadre.

El combo leve alterna un recto, un gancho con giro de torso y una patada frontal, con tiempos de preparación y recuperación propios. Cada golpe transfiere el peso con un avance corto que respeta las colisiones. Las acciones se registran por la cadera para conservar el giro de hombros. El fuerte alterna un empuje de una palma y una descarga con ambas manos, y lanza una bola de fuego que viaja hasta el objetivo y choca con el escenario. Dos leves conectados preparan una bola explosiva de 70 de daño, con impacto en área y coste de 20 de energía al salir. Cada proyectil impacta una sola vez. Un dash antes del lanzamiento cancela el gasto. Si la energía se agota después de lanzar una bola, esta termina su vuelo mientras Ben vuelve a su forma humana.

La preparación lateral de la descarga utiliza una pose corregida con dos brazos unidos a los hombros. La corrección sustituye únicamente ese fotograma del atlas y conserva su altura y registro.

![Corrección de la anatomía de Fuego](docs/heatblast-anatomy.png)

[Ver la descarga corregida y el tercer golpe de Cuatro Brazos](docs/alien-attack-fixes.mp4).

| Personaje | Combo leve | Fuerte | Velocidad |
| --- | --- | --- | --- |
| Ben | 8 / 8 / 12 | 20, cuerpo a cuerpo | 247 |
| Cuatro Brazos | 26 / 30 / 38 | 65, cuerpo a cuerpo | 190 |
| Fuego | 14 / 16 / 20 | 32, bola de fuego | 285 |
| XLR8 | 10 / 12 / 16 | 34, pasada de velocidad | 380 |
| Diamante | 18 / 22 / 28 | 28, lanza de cristal | 230 |
| Cannonbolt | 18 / 22 / 32 | 40–72, embestida cargada | 270, rodando |
| Fantasmático | 14 / 18 / 26 | 44, tentáculos | 260, flotando; 299 intangible |
| Insectoide | 4 × 5 por ráfaga | 42, aguijonazo | 250, sobre sus patas |
| Wildvine | 18 / 22 / 28 | 56, giro de brazos | 240, sobre sus raíces |
| Blitzwolfer | 20 / 24 / 32 | 52, embestida con garras | 280, sobre cuatro patas |
| Ultra T | 18 / 22 / 36 | 34, láser ocular | 245 |

Ben hace menos daño que antes: los dos primeros leves bajan de 17 a 8; el tercero, de 25 a 12; el fuerte, de 45 a 20. Fuego tiene un dash más rápido y puede atacar a distancia. Cambiar entre los diez aliens conserva la vida, el XP y la energía restante.

![Fuego en la demo](docs/heatblast.png)

![Carrera y variedad de golpes de Fuego](docs/heatblast-motion.png)

[Ver las animaciones en movimiento](docs/heatblast-motion.mp4).

![Bola de fuego en vuelo](docs/heatblast-fire.png)

## Diamante clásico

Diamante sigue la referencia de la serie clásica: cuerpo de cristal verde menta con facetas, cabeza angular, ojos amarillos, dos brazos, uniforme blanco y negro y emblema en el pecho izquierdo. Tiene 256 fotogramas originales de guardia, carrera, dash y cinco ataques en cuatro direcciones. Su altura es de 102 unidades, entre Fuego (94) y Cuatro Brazos (112), con el mismo encuadre de cámara.

El combo leve alterna recto, golpe con el otro antebrazo y corte con una cuchilla formada en el brazo. Sus tiempos son de 0,36, 0,40 y 0,62 segundos. La formación de la cuchilla y el impacto se mantienen más de 100 ms cada uno, con una recuperación visible; el daño se aplica una sola vez al contactar. Las animaciones de lanzamiento duran 0,80 segundos. La velocidad de desplazamiento, el vuelo de los proyectiles y el daño se conservan. Cada golpe desplaza el peso 4, 6 o 9 unidades, respeta los obstáculos y tiene una pausa de impacto de 25 ms. Los siguientes golpes pueden ponerse en espera durante la recuperación completa, incluso en la cuchilla y los lanzamientos más largos. La carrera recorre 174 unidades por ciclo completo de ocho poses.

El fuerte alterna dos animaciones de lanzamiento. La lanza de cristal viaja a 600 unidades por segundo e inflige 28 de daño una vez al chocar. Dos leves conectados preparan un estallido de cristales de 72 de daño en un radio de 95 unidades. Cuesta 20 de energía al emitirse, puede cancelarse con dash antes de salir y conserva su daño si Ben revierte durante el vuelo. Los cristales chocan con objetivos, obstáculos y los límites del mapa. Sus destellos y fragmentos se dibujan con facetas verdes propias.

![Diamante en la demo](docs/diamondhead.png)

![Lanza de cristal](docs/diamondhead-shard.png)

![Estallido de cristales](docs/diamondhead-burst.png)

[Ver a Diamante en movimiento](docs/diamondhead.mp4).

## XLR8 clásico y recorrido de velocidad

XLR8 sigue la referencia clásica: cuerpo delgado azul y negro, casco aerodinámico, ojos amarillos, pecho blanco con Omnitrix, cola con franjas y pies con esferas. Sus 256 poses HD cubren guardia, desplazamiento, carrera veloz, tres golpes rápidos, toma de impulso y frenado en cuatro direcciones. Mide 88 unidades y se desplaza a 380 unidades por segundo; la cámara conserva el encuadre y sigue más de cerca la carrera veloz, también en móvil.

- **Clic derecho breve:** sale hasta 180 unidades hacia donde mira y vuelve al punto de partida.
- **Mantener clic derecho:** se agacha para tomar impulso; al superar 0,18 segundos se abre una ventana de 1,6 segundos para dibujar el camino con el ratón. La cámara permanece fija mientras se traza y una línea muestra el recorrido válido. Al terminar la cuenta atrás lo ejecuta automáticamente; soltar antes también lo ejecuta.
- **En móvil:** un toque en `RUTA` hace la ida y vuelta; mantenerlo y arrastrar el dedo dibuja un recorrido.
- **Golpes normales:** alterna un recto, un ataque de garras y una patada rápida de 0,18, 0,20 y 0,26 segundos.

La carrera sigue los puntos dibujados a 1900 unidades por segundo, con un máximo de 1800 unidades de recorrido. Inflige 34 de daño cada vez que cruza a un enemigo. Si sale de su zona de contacto y vuelve a cruzarlo, vuelve a golpear; esto también permite acertar en la ida y en la vuelta del clic breve. La colisión se comprueba a lo largo de cada tramo, así que no se salta objetivos ni atraviesa obstáculos entre fotogramas. Al frenar busca suelo libre si termina sobre un enemigo vivo. El impulso se recupera durante 1,05 segundos después del frenado.

Dos leves conectados y clic derecho activan el combo relámpago: cada pasada de la carrera potenciada hace 58 de daño y, al terminar el recorrido, XLR8 ejecuta una patada de 28 de daño adicionales. Termina la ruta cerca de un enemigo para conectar el remate. La patada dura 0,30 segundos, aplica su daño en el contacto y respeta los obstáculos; el combo completo cuesta 20 de energía. La reserva sobrevive al tiempo de trazado y los 20 puntos de energía se gastan al arrancar. Cancelar con `T`, el reloj, Espacio, un cambio de tamaño de pantalla o pérdida del foco cierra el trazado. Si la energía se agota o Ben revierte durante la carrera, esta se detiene. La reserva no puede reutilizarse después de cancelar o cambiar de forma.

![XLR8 en la demo](docs/xlr8.png)

![Dibujar un recorrido con cuenta atrás](docs/xlr8-route.png)

![Carrera e impacto al cruzar un objetivo](docs/xlr8-rush.png)

![Varios impactos sobre el mismo enemigo](docs/xlr8-multi-hit.png)

![Remate del combo relámpago](docs/xlr8-finisher.png)

[Ver a XLR8 en movimiento](docs/xlr8.mp4).

## Cannonbolt clásico

Cannonbolt conserva el diseño blanco, negro y amarillo de la referencia, con garras y el Omnitrix en la frente. Tiene 256 poses HD registradas para reposo, cierre, giro de la bola, ambas garras, carga, impacto y apertura en cuatro direcciones. De pie mide 105 unidades; la bola cerrada mide aproximadamente 77, manteniendo el mismo encuadre de cámara. Los extremos del plegado y la apertura comparten la misma esfera para conservar el tamaño.

- **Reposo:** permanece de pie con una animación de guardia.
- **Movimiento:** se cierra en bola y rueda a 270 unidades por segundo; sus paneles giran con la distancia recorrida. Al parar se abre para volver al reposo.
- **Combo leve:** garra izquierda, garra derecha y una embestida corta en bola, con 18, 22 y 32 de daño. Si estaba rodando, se abre antes de usar las garras.
- **Clic derecho:** mantener carga la embestida; soltar la lanza. Un toque breve conserva una preparación mínima de 0,35 segundos. Al llegar a 1,15 segundos sale automáticamente con la fuerza máxima. La carga aumenta de 40 a 72 de daño y de 230 a 460 unidades de alcance.
- **Especial:** dos leves conectados y clic derecho reservan una embestida de ida y vuelta. Hace entre 58 y 90 de daño por pasada, según la carga, y consume 20 de energía al arrancar. Regresa al punto de partida y se abre al detenerse.
- **Espacio:** se cierra y realiza una esquiva rodante sin daño de ataque.

Los impactos se comprueban a lo largo del desplazamiento y respetan los obstáculos con el ancho de su cuerpo. Si termina sobre un enemigo vivo, la recuperación lo deja en suelo libre. Cancelar la carga con `T`, el reloj, Espacio, cambio de tamaño de pantalla o pérdida de foco evita un lanzamiento posterior. Cambiar de forma o quedarse sin energía detiene la embestida. El botón táctil `CARGA` admite mantener y soltar.

![Cannonbolt de pie](docs/cannonbolt.png)

![Desplazamiento en bola](docs/cannonbolt-roll.png)

![Carga de la embestida](docs/cannonbolt-charge.png)

![Combo de ida y vuelta](docs/cannonbolt-combo.png)

[Ver a Cannonbolt en movimiento](docs/cannonbolt.mp4).

## Fantasmático clásico

Fantasmático sigue las referencias: cubierta blanca y gris, cabeza puntiaguda con un ojo morado, garras negras, cola flotante, costuras oscuras y Omnitrix en el pecho izquierdo. Sus 256 poses HD cubren reposo, desplazamiento, intangibilidad, las tres garras y la apertura del torso en cuatro direcciones. Mide 100 unidades y mantiene el encuadre de cámara. El cuerpo sube y baja suavemente sobre la sombra; la cola y los brazos se mueven tanto parado como al avanzar, sin pasos ni piernas.

- **Clic izquierdo:** garra izquierda, derecha y ataque con ambas manos, de 14, 18 y 26 de daño. Cada golpe tiene preparación, contacto y recuperación propios.
- **Clic derecho breve:** abre la cubierta del torso y ataca directamente con los tentáculos. Hace 44 de daño una sola vez, con la apertura y la retirada visibles.
- **Mantener clic derecho:** tras 0,16 segundos se vuelve translúcido, inmune al daño y capaz de atravesar objetivos y obstáculos. Se mueve un 15 % más rápido. Una cuenta atrás muestra el tiempo restante; el proceso completo admite un máximo de 1,8 segundos.
- **Soltar:** vuelve a ser sólido en su posición actual y ejecuta la misma apertura y el mismo daño que un clic breve. Mantener más tiempo no carga ni potencia el ataque. Si está dentro de un obstáculo, reaparece en suelo libre cercano.
- **Combo: dos leves conectados + un fuerte.** Reproduce una animación propia de captura: abre la cubierta, engancha al objetivo más cercano que tenga delante, lo atrae parcialmente al abdomen descubierto, lo sujeta y lo expulsa. Dura 1,4 segundos, con una pausa visible para apreciar al enemigo dentro. Consume 20 de energía al enganchar, causa 72 de daño una sola vez al expulsar y deja libre al objetivo al terminar. El tiempo previo de intangibilidad no aumenta este daño. El fuerte puede dejarse en espera durante la recuperación de la segunda garra, tanto con un clic breve como manteniendo el botón.
- **Móvil:** mantener y soltar el botón `FASE` reproduce estos controles.

El torso se abre con las dos manos y deja ver una cavidad oscura de la que salen los tentáculos con franjas claras y azul oscuro. Los tentáculos no golpean a través de obstáculos sólidos. La fase termina automáticamente al llegar al límite y no puede atravesar los bordes del mapa. `T`, el reloj, Espacio, perder el foco o cambiar el tamaño de la pantalla cancelan la habilidad y restauran la vulnerabilidad. Si el reloj se agota dentro de un obstáculo, Ben reaparece en suelo libre. Cancelar antes de que los tentáculos enganchen evita gastar los 20 puntos reservados. Después del enganche, cancelar suelta al objetivo y conserva el gasto, sin aplicar daño tardío. Volver a Ben, agotar el reloj o perder el foco también libera cualquier objetivo capturado. El ataque deja un enfriamiento de 1,05 segundos después de cerrar la cubierta.

![Fantasmático flotando en reposo](docs/ghostfreak.png)

![Intangibilidad durante el desplazamiento](docs/ghostfreak-phase.png)

![Apertura del torso y tentáculos](docs/ghostfreak-tentacles.png)

[Ver a Fantasmático en movimiento](docs/ghostfreak.mp4).

![Combo: objetivo parcialmente dentro del abdomen](docs/ghostfreak-grab.png)

[Ver el nuevo combo de captura y expulsión](docs/ghostfreak-grab.mp4).

## Insectoide clásico

El diseño sigue la nueva referencia de la serie que aportó el usuario: cabeza negra con cuatro pedúnculos de ojos naranjas, cuerpo blanco y negro delgado, dos brazos con garras, cuatro patas largas, alas amarillas angulares y cola blanca rematada por un aguijón negro. Sus 256 poses HD cubren reposo, caminata, vuelo del dash, tres ráfagas distintas, aguijonazo y escupitajo al suelo en cuatro direcciones. La altura de reposo es de 95 unidades y la cámara mantiene el mismo encuadre.

- **Movimiento y reposo:** permanece apoyado en sus cuatro patas. Camina a 250 unidades por segundo, alternando apoyos, con alas plegadas. No flota al caminar.
- **Clic izquierdo:** una ráfaga corta de cuatro escupitajos, uno por orificio, de 5 de daño cada uno. Hay tres secuencias de movimiento y órdenes de disparo distintos, con retroceso de los pedúnculos. Los orígenes se registran sobre los extremos naranjas de cada pose. Una ráfaga conectada cuenta como un solo leve para preparar el combo.
- **Clic derecho:** eleva el cuerpo brevemente y golpea hacia delante con la cola como un escorpión. El aguijón causa 42 de daño una sola vez y vuelve a la guardia.
- **Espacio:** abre las alas, hace un dash de vuelo bajo y vuelve a apoyar las patas al aterrizar. Conserva las colisiones y no causa daño por contacto.
- **Dos leves conectados + fuerte:** escupe al suelo para crear un charco venenoso. Consume 20 de energía una sola vez al lanzar. El charco dura 4,2 segundos y causa 6 de daño por contacto cada 0,45 segundos a los enemigos, con un máximo de 60 por estancia completa. Tiene burbujas y se desvanece al expirar. Insectoide puede pisarlo sin recibir daño.

Las gotas tienen un alcance de 130 unidades desde el orificio y chocan con los objetivos, obstáculos y bordes del escenario. El charco respeta la forma de su área visible y las barreras. Los efectos ya lanzados siguen activos al cambiar de forma o volver a Ben; el daño del veneno puede derrotar objetivos y otorgar XP una sola vez. Cancelar el escupitajo especial antes de lanzar evita el gasto, y cancelar una ráfaga detiene los orificios que aún no habían disparado.

En móvil, `BABA` ejecuta el leve, `COLA` el fuerte y el botón cambia a `VENENO` cuando está preparado el combo.

![Insectoide con el diseño corregido](docs/stinkfly.png)

![Escupitajos desde los pedúnculos](docs/stinkfly-spit.png)

![Dash con las alas abiertas](docs/stinkfly-dash.png)

![Charco venenoso](docs/stinkfly-poison.png)

[Ver a Insectoide en movimiento](docs/stinkfly.mp4).

## Wildvine clásico

Wildvine sigue la referencia aportada: un solo ojo turquesa, dos hojas altas con espinas alrededor de la cabeza, hombros con bulbos turquesa, semillas oscuras en la espalda, Omnitrix en el pecho, dos brazos de enredadera y cinco piernas de raíz. Sus 256 poses HD cubren reposo, caminata, dash elástico, tres latigazos, giro y brazos enterrados en cuatro direcciones. Mide 102 unidades y mantiene el mismo encuadre de cámara.

- **Movimiento:** camina a 240 unidades por segundo alternando las cinco raíces. La marcha y el reposo permanecen apoyados en el suelo.
- **Clic izquierdo:** latigazo derecho, izquierdo y dos latigazos simultáneos. Causan 18, 22 y 28 de daño total. Los brazos se enrollan, se extienden desde los hombros y regresan al cuerpo; su alcance de 124 unidades acompaña el dibujo y respeta los obstáculos.
- **Clic derecho:** gira con ambos brazos extendidos e inflige 56 de daño una vez a cada objetivo cercano, incluso detrás. El giro respeta las barreras.
- **Espacio:** comprime y estira las raíces para impulsarse en un dash terrestre. Respeta las colisiones y vuelve a la pose de reposo al terminar.
- **Dos leves conectados + fuerte:** clava ambos brazos en tierra. Tres grupos de espinas vegetales brotan sucesivamente a 58, 113 y 168 unidades hacia donde mira. Cada enemigo recibe 74 de daño una sola vez por oleada. Las espinas tienen animación propia de crecimiento y retirada y no atraviesan obstáculos ni salen del mapa.

El combo consume 20 de energía una sola vez cuando los brazos se entierran. Cancelarlo antes evita el gasto. Las espinas ya emitidas terminan su animación al cambiar de forma o volver a Ben, conservan el daño y conceden XP una sola vez por objetivo derrotado. En móvil, los botones muestran `LÁTIGO`, `GIRO` y `ESPINAS` cuando el combo está listo.

![Wildvine en reposo](docs/wildvine.png)

![Latigazo con el brazo extendido](docs/wildvine-whip.png)

![Espinas brotando frente a Wildvine](docs/wildvine-thorns.png)

[Ver a Wildvine en movimiento](docs/wildvine.mp4).

## Blitzwolfer clásico

Blitzwolfer, también conocido como Benwolf, sigue las referencias del usuario y el diseño clásico de la serie: cuerpo gris, melena y cola negras, ojos verdes, hocico gris, garras y uniforme blanco y negro con Omnitrix en el abdomen. Sus 256 poses HD cubren reposo, carrera, dash, dos zarpazos, mordida, embestida y aullido en cuatro direcciones. Mide 104 unidades y conserva el encuadre de los demás aliens.

- **Reposo y movimiento:** espera erguido sobre dos patas, con respiración y movimiento de cola. Al avanzar baja el cuerpo y corre sobre manos y patas traseras, alternando apoyos. La postura agachada mantiene su escala anatómica: el cuerpo no se amplía para igualar la altura de reposo. Al detenerse vuelve a dos patas.
- **Clic izquierdo:** garra derecha, garra izquierda con un arco distinto y mordida. Causan 20, 24 y 32 de daño, con preparación, contacto y recuperación propios. Los ataques conservan la orientación elegida y respetan los obstáculos.
- **Clic derecho:** toma impulso y se abalanza hasta 185 unidades con las garras extendidas. Causa 52 de daño una vez por objetivo, frena antes del contacto corporal y no atraviesa enemigos vivos, obstáculos ni los límites del mapa.
- **Espacio:** dash en cuatro patas con compresión, salto, extensión y aterrizaje. No causa daño por contacto.
- **Dos leves conectados + fuerte:** abre el hocico en cuatro mandíbulas dentadas alrededor de la garganta verde y emite un aullido sónico. La onda avanza a 640 unidades por segundo, se abre en cono y alcanza hasta 390 unidades. Causa 78 de daño una vez a cada objetivo dentro del cono; las barreras bloquean el sonido y los enemigos detrás de Blitzwolfer no reciben daño.

El especial consume 20 de energía al emitirse. Cancelarlo antes evita el gasto; una onda ya emitida sigue viajando al volver a Ben. Si el consumo gradual del reloj invalida la reserva antes de abrir la boca, el fuerte se convierte en la embestida normal. El daño y los KO conservan la vida del jugador y otorgan XP una sola vez. En móvil aparecen los botones `GARRAS`, `EMBESTIDA` y `AULLIDO` cuando el combo está preparado.

![Blitzwolfer en reposo](docs/blitzwolfer.png)

![Carrera sobre cuatro patas](docs/blitzwolfer-walk.png)

![Mordida](docs/blitzwolfer-bite.png)

![Apertura del hocico y aullido sónico](docs/blitzwolfer-howl.png)

[Ver las animaciones de Blitzwolfer](docs/blitzwolfer.mp4).

## Ultra T clásico

Ultra T (Upgrade) sigue la referencia clásica: cuerpo blanco y negro, líneas verdes de circuito, un único ojo circular verde en la cabeza y Omnitrix en el pecho. La superficie y los miembros se deforman como una masa moldeable. Sus 256 poses HD cubren reposo, caminata, dash, dos puñetazos, golpe con brazos fusionados, láser y transformación completa en cuchilla, en cuatro direcciones. Mide 102 unidades y conserva el encuadre de los demás personajes.

- **Movimiento y dash:** camina sobre dos piernas con apoyos alternados y oscilación de los brazos. El dash comprime y alarga el cuerpo antes de recuperar la postura normal, conservando el contacto con el suelo y las colisiones.
- **Clic izquierdo:** puñetazo izquierdo, derecho y golpe con ambos brazos fusionados en una sola masa. Causan 18, 22 y 36 de daño. Los puños se ensanchan al impactar; el tercer golpe combina, comprime y vuelve a separar los brazos. Cada contacto causa daño una sola vez.
- **Clic derecho:** prepara la cabeza y dispara un láser desde el ojo. El rayo alcanza hasta 480 unidades, causa 34 de daño al primer enemigo de su trayectoria y termina al tocarlo o chocar con el escenario. El origen visual se registra sobre el ojo de cada pose, separado del emblema del pecho.
- **Dos leves conectados + fuerte:** absorbe sus extremidades y transforma todo el cuerpo en una cuchilla blanca, negra y verde. Embiste 320 unidades hacia delante a 1120 unidades por segundo. Causa 82 de daño una vez por enemigo atravesado, respeta obstáculos y límites y vuelve a formar su cuerpo al frenar.

La embestida especial consume 20 de energía al terminar la transformación en cuchilla. Cancelar antes evita el gasto. Cancelarla durante el recorrido detiene el ataque y coloca al personaje sobre suelo libre; terminar encima de un enemigo vivo también busca espacio para recuperar el cuerpo. Si la reserva pierde la energía necesaria antes de salir, el fuerte utiliza el láser normal. Los KO conceden XP una sola vez y las estadísticas se conservan al cambiar de forma.

Ultra T ocupa la tecla `0`, después de Blitzwolfer. La rueda mantiene las diez formas jugables y tres ranuras futuras bloqueadas. Sus instrucciones se ajustan al ancho de la pantalla. En móvil, los botones muestran `PUÑO`, `LÁSER` y `CUCHILLA` cuando el combo está listo.

![Ultra T en reposo](docs/upgrade.png)

![Golpe con los brazos fusionados](docs/upgrade-mass.png)

![Láser desde el ojo](docs/upgrade-laser.png)

![Cuerpo convertido en cuchilla](docs/upgrade-blade.png)

[Ver las animaciones de Ultra T](docs/upgrade.mp4).

## HUD y progresión

- El líquido verde del reloj representa la energía del Omnitrix. El propio reloj abre la rueda de selección.
- La barra roja muestra la vida; la naranja muestra el XP necesario para el siguiente nivel.
- Cada objetivo derrotado otorga 40 XP. El primer nivel requiere 100 XP y cada siguiente umbral aumenta en 50. El sobrante se conserva al subir de nivel.

Cada alien consume 1,5 puntos de energía por segundo. Dos leves conectados y un fuerte activan un especial de 20 puntos: impacto sísmico con Cuatro Brazos, bola ígnea explosiva con Fuego, estallido de cristales con Diamante, carrera potenciada con XLR8, embestida de ida y vuelta con Cannonbolt, captura con tentáculos y expulsión con Fantasmático charco venenoso con Insectoide espinas desde la tierra con Wildvine aullido sónico con Blitzwolfer o embestida en forma de cuchilla con Ultra T. El gasto ocurre al salir el especial, incluso si falla; cancelar la animación con un dash antes del contacto evita el gasto.

Al agotarse la energía, el sistema vuelve a Ben conservando vida, XP y nivel. En forma humana, el reloj comienza a recargarse tras 3 segundos, a 8 puntos por segundo. La rueda pausa la simulación. El XP y el nivel se mantienen durante la sesión; recargar la página inicia una sesión nueva.

## Desarrollo

```sh
npm ci
npx playwright install chromium
npm test
```

Las 443 comprobaciones verifican los fotogramas, la guardia, los golpes, el dash, el anclaje del reloj, la energía, los especiales, el XP y el HUD en escritorio y móvil. También prueban la transformación real a Cuatro Brazos y a Fuego, sus cuatro direcciones de ataque, las escalas, su colisión, la cámara fija, la estabilidad del torso, la recuperación de los golpes, los combos con pulsaciones rápidas y la vuelta a Ben por teclado, por pantalla táctil y por energía agotada. Las pruebas de fuego verifican el daño reducido de Ben, los ataques cuerpo a cuerpo, el vuelo de los proyectiles, los obstáculos, las explosiones y las colisiones a distintas tasas de actualización. También comprueban la variación real de las siluetas al correr, la cadencia según la distancia, los cinco ataques distintos, la sincronización del contacto y los avances de los golpes a 30, 60 y 120 actualizaciones por segundo. Las comprobaciones HD verifican la resolución de los atlas, el tamaño físico de ambos aliens, la representación en pantallas normales y retina y la cadencia reducida de Fuego sin alterar su desplazamiento. Las pruebas de Diamante comprueban la selección de la ranura 4 por teclado y pantalla táctil, sus 256 poses, el movimiento y los golpes en cuatro direcciones, los avances de peso, las pulsaciones en espera, los proyectiles y su estallido, el gasto de energía, la conservación de estadísticas y la vuelta a Ben. Las pruebas de XLR8 verifican sus poses, golpes rápidos, clic breve, trazo por ratón y dedo, temporizador automático, cámara en móvil, coordenadas retina, colisiones continuas, cancelaciones, enfriamiento, reserva del especial y retorno a Ben. El movimiento y el daño del recorrido se comprueban a 30, 60 y 120 actualizaciones por segundo. Las pruebas de Cannonbolt verifican la rueda ampliada, las transiciones de cuerpo a esfera, el diámetro estable, los ataques de garra y la tercera embestida en cuatro direcciones, la carga por ratón y pantalla táctil, el combo de ida y vuelta, el gasto único de energía, las cancelaciones y las colisiones de la esfera. Las pruebas de Fantasmático verifican sus 256 poses completas, flotación, garras en cuatro direcciones, clic breve, inmunidad temporal real, desplazamiento un 15 % más rápido, límites del mapa, atravesar obstáculos y reaparecer en suelo libre, daño idéntico entre pulsaciones cortas y largas, reserva del combo, cancelaciones, vuelta a Ben y controles táctiles. El remate de captura comprueba el objetivo elegido, la atracción y expulsión en cuatro direcciones, el daño único, el gasto de energía, las entradas de fuerte en espera, la liberación al cancelar, el agotamiento del reloj, las barreras, los objetivos cercanos y el KO con XP sin duplicados. El movimiento y el ataque se comprueban también a 30, 60 y 120 actualizaciones por segundo. Las pruebas de Insectoide comprueban las poses, los cuatro anclajes de disparo, tres ráfagas distintas, una sola acreditación de combo por ráfaga, caminata sobre patas, aguijonazo, vuelo y aterrizaje del dash, veneno por contacto, inmunidad del dueño, obstáculos, cancelaciones, XP, cambios de forma y controles táctiles. Los proyectiles y el veneno se verifican a 30, 60 y 120 actualizaciones por segundo. Las pruebas de Wildvine comprueban las 256 poses completas, caminata y dash terrestres, tres latigazos orientados, giro de 360 grados, espinas en secuencia, límites y obstáculos, daño único, reserva y gasto de energía, cancelaciones, pulsaciones en espera, XP, cambio de forma y controles táctiles. El daño y la duración de las espinas se comprueban a 30, 60 y 120 actualizaciones por segundo. Las pruebas de Blitzwolfer comprueban las poses completas, escala de la marcha cuadrúpeda, dos garras y mordida, contacto de la embestida, boca dividida en cuatro partes, origen de la onda sobre la garganta, cono viajero, daño único, obstáculos, cancelaciones, gasto de energía, entradas en espera, retorno a Ben, XP y controles táctiles. La embestida y el aullido se verifican a 30, 60 y 120 actualizaciones por segundo. Las pruebas de Ultra T comprueban las 256 poses completas, el cambio de silueta, caminata y dash terrestres, puñetazos alternados y brazos fusionados, anclaje del láser sobre el ojo, primer impacto, obstáculos, embestida con colisiones continuas, un solo golpe por enemigo, reconstrucción sobre suelo libre, cancelaciones, gasto de energía, XP, entradas en espera y controles táctiles. La embestida y el daño se verifican a 30, 60 y 120 actualizaciones por segundo. El tercer golpe de Cuatro Brazos se comprueba con sus nuevos tiempos, su daño único y la siguiente pulsación en espera a 30, 60 y 120 actualizaciones por segundo. Si Chromium está instalado en `/usr/bin/chromium`, se utiliza ese ejecutable; también puede indicarse otro mediante `CHROMIUM_PATH`.

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

Las fuentes y el atlas de Diamante se compilan e incrustan con:

```sh
npm run build:diamondhead
```

La trayectoria y las colisiones de las bolas de fuego y las lanzas de cristal se prueban en [systems/fire-projectiles.js](systems/fire-projectiles.js). Para sincronizar su copia incrustada:

```sh
npm run build:fire
```

Las fuentes y el atlas de XLR8 se registran por la cadera, conservando margen para la cola, con:

```sh
npm run build:xlr8
```

La física de los recorridos está en [systems/speed-route.js](systems/speed-route.js) y los controles y efectos en [systems/xlr8-game.js](systems/xlr8-game.js). Para sincronizar ambas copias en el HTML:

```sh
npm run build:speed
```

Las fuentes de Cannonbolt se compilan e incrustan con:

```sh
npm run build:cannonbolt
```

La carga y las embestidas se prueban en [systems/cannonbolt-physics.js](systems/cannonbolt-physics.js), y sus controles y transiciones están en [systems/cannonbolt-game.js](systems/cannonbolt-game.js). Para sincronizarlos con el HTML:

```sh
npm run build:cannon
```

Los compiladores comprimen los atlas PNG sin modificar sus píxeles para reducir el tamaño del archivo autónomo.

Las fuentes de Fantasmático y su atlas están en [assets/aliens](assets/aliens). La compilación registra el cuerpo por la cabeza y conserva el movimiento libre de la cola y los tentáculos:

```sh
npm run build:ghostfreak
```

La duración de la fase y la búsqueda de suelo libre están en [systems/ghostfreak-ability.js](systems/ghostfreak-ability.js); los controles y el ataque están en [systems/ghostfreak-game.js](systems/ghostfreak-game.js). La inmunidad temporal se aplica en el modelo compartido de estadísticas. Para sincronizar las copias incrustadas:

```sh
npm run build:ghost
npm run build:stats
```

Las fuentes y los cuatro orificios por pose de Insectoide se compilan e incrustan con:

```sh
npm run build:stinkfly
```

Los proyectiles y el veneno están en [systems/stinkfly-field.js](systems/stinkfly-field.js), y los controles, ataques y efectos en [systems/stinkfly-game.js](systems/stinkfly-game.js). Para sincronizar el archivo autónomo:

```sh
npm run build:stink
```

Las fuentes de Wildvine y la secuencia original de crecimiento de espinas se registran e incrustan con:

```sh
npm run build:wildvine
```

La secuencia y las colisiones de las raíces están en [systems/wildvine-roots.js](systems/wildvine-roots.js), y los controles y ataques en [systems/wildvine-game.js](systems/wildvine-game.js). Para sincronizar sus copias incrustadas:

```sh
npm run build:wild
```

Las fuentes de Blitzwolfer, su atlas y los anclajes de la garganta se compilan e incrustan con:

```sh
npm run build:blitzwolfer
```

La embestida y la onda sónica están en [systems/blitzwolfer-abilities.js](systems/blitzwolfer-abilities.js); los controles, poses y efectos están en [systems/blitzwolfer-game.js](systems/blitzwolfer-game.js). Para sincronizar las copias incrustadas:

```sh
npm run build:wolf
```

Las fuentes y el atlas de Ultra T se compilan con:

```sh
npm run build:upgrade
```

El compilador conserva una escala común dentro de cada acción, registra la cintura y el suelo y localiza el ojo del láser. La lógica del rayo y la cuchilla está en [systems/upgrade-abilities.js](systems/upgrade-abilities.js); los controles, poses y efectos están en [systems/upgrade-game.js](systems/upgrade-game.js). Para sincronizarlos con el HTML autónomo:

```sh
npm run build:ultrat
```
