# V35 · El asedio de los Eternos

El recorrido integra los 17 modelos y sus animaciones de reposo, desplazamiento, dos acciones, golpe y derrota. **La dificultad inicial es Difícil**. Las mejoras aprendidas siguen siendo necesarias: un alien sin entrenamiento conserva sus estadísticas de inicio.

## Recorrido y oleadas

| Fase | Composición | Combates cerrados | Oleadas | Enemigos, incluido el minijefe |
| --- | --- | ---: | ---: | ---: |
| Calles y parques | Mayoría de reclutas; algunos veteranos | 6 | 9 | 53 |
| Castillo | Veteranos y algunas armaduras cristalinas | 6 | 11 | 69 |
| Laboratorio | Mezcla de veteranos y cristalinos, con predominio cristalino | 4 | 8 | 53 |

Cada combate cierra los dos extremos del espacio transitable. Los refuerzos entran escalonados; eliminar solo a los primeros no abre el paso. La siguiente oleada comienza después de una pausa corta. Los límites también se aplican al dash, a los recorridos de XLR8, a Cannonbolt, a las técnicas de desplazamiento y a la intangibilidad. Los enemigos no reaparecen después de morir.

Hay **un solo campeón por fase**, acompañado de soldados: normal en las calles y el castillo, cristalino en el laboratorio. El jefe final no forma parte de esta versión. El espacio del puzzle se conserva.

## Roles y estadísticas

Vida base antes del aumento por avance y fase:

| Rol | Recluta | Veterano | Cristalino | Ataque base del recluta | Comportamiento |
| --- | ---: | ---: | ---: | ---: | --- |
| Físico | 78 | 121 | 160 | 7 | Busca espacio alrededor del jugador; alterna tajo y estocada. |
| A distancia | 58 | 90 | 119 | 8 | Mantiene distancia, apunta y dispara una bala real; si queda acorralado, puede disparar cerca. |
| Soporte | 64 | 99 | 131 | 5 | Se coloca detrás del grupo; cura y potencia a sus aliados. Solo, utiliza el emisor para defenderse. |
| Ágil | 52 | 81 | 107 | 5 | Flanquea y se lanza con las dagas; la embestida tiene trayectoria y puede fallar. |
| Defensivo | 108 | 167 | 221 | 9 | Protege el frente con el escudo, cubre a tiradores y apoyos y empuja con el escudo. |

La armadura reduce el daño un 2%, 13% o 24% según el rango. El ataque de un veterano aumenta alrededor del 22% y el de un cristalino alrededor del 48%; la fase añade un incremento menor. La defensa comprada del alien modifica el daño que recibe. El escudo reduce mucho más los golpes leves frontales; atacarlo desde atrás evita esa protección y un fuerte rompe su guardia.

El minijefe de la calle tiene unos **628 PV**, el del castillo **681 PV** y el cristalino **1077 PV**. Sus ataques base son 18, 19 y 29, antes de aplicar la defensa del jugador. Preparan el hachazo durante algo más de un segundo, se comprometen con una dirección y dejan una recuperación aprovechable. Resisten mejor los intentos de aturdirlos continuamente.

El apoyo busca aliados vivos, dentro de alcance y sin obstáculos. Para curar prioriza un aliado herido de mayor rango; para potenciar elige al más fuerte disponible. No consume su mejora en un recluta mientras tiene un oficial disponible para esa mejora. Su canalización dura 1,2 s y aplica el efecto a los 0,8 s: golpearlo a tiempo la interrumpe y retrasa su siguiente intento. La cura restaura hasta 34 PV; la potenciación dura 6 s y aumenta el ataque un 22%, con pequeños aumentos de resistencia y velocidad.

## Dificultad y recuperación

- Las señales del suelo y las líneas de tiro anuncian los ataques. El objetivo se fija pronto: apartarse puede hacer que fallen.
- Dos enemigos pueden comprometer ataques simultáneos al principio; en el laboratorio el límite aumenta a tres. El campeón consume más espacio en ese límite.
- Tras recibir un golpe hay 0,75 s de protección para evitar que varios impactos superpuestos vacíen toda la vida de inmediato. El dash tiene una ventana de evasión; la intangibilidad y las defensas aprendidas se respetan.
- Despejar un combate devuelve 6 PV y 10 de energía; completar una fase devuelve 12 PV y 18 de energía. No se reinicia la vida entre fases.
- Al caer, se puede reintentar el combate actual con vida y energía completas. Se conservan nivel, experiencia y mejoras; los combates anteriores de esa fase siguen despejados.

El balance se centraliza en `systems/eternal-enemies.js`; [v35-balance.json](v35-balance.json) recoge las cifras derivadas de ese código.

## Fondos y objetos

Los tres panoramas conservan el mismo recorrido y suelo. Sus 29 tramos se restauraron a 2048 × 768 px, con zonas de solapamiento para recorrerlos sin cortes de cámara. El motor muestra esos originales de mayor detalle y conserva la escala de los personajes. Las texturas de ejecución usan WebP sin pérdida; los PNG de procedencia quedan en el repositorio.

La fuente pequeña superpuesta se retiró. La fuente grande del fondo recibe una animación de agua de seis fotogramas, sin añadir otra estructura. Bancos, papeleras y farolas forman grupos junto a las aceras; el tamaño de cada objeto toma a Ben como referencia. Cajas, barriles, aparatos y jardineras tienen colisión por sus pies y dejan libre el centro de la ruta.

## Validación

`npm test` conserva las pruebas de las 70 técnicas y añade las del combate. `npm run test:combat` comprueba rangos, prioridades del apoyo, interrupciones, guardia, proyectiles, ataques de área, muerte, oleadas, límites, tres campeones y reintentos. El recorrido de navegador prueba además los ataques básicos de los diez aliens contra caballeros reales, la bola de Fuego, la continuidad de vida/XP entre fases y la fuente única.

Después de empaquetar, `npm run test:package` abre la copia distribuible y usa teclado y ratón reales para transformarse y entrar en una emboscada, sin introducir controles de prueba en el juego.
