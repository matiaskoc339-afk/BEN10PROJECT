# V36 — Vida compartida y tácticas progresivas

Ben y los diez aliens comparten **50 PV máximos**. Si Ben se transforma con 31 PV, el alien conserva 31 PV; volver a Ben también conserva 31 PV. La transformación y el agotamiento del reloj no curan ni cambian la vida máxima. Las defensas de cada forma y las mejoras de defensa de sus árboles siguen reduciendo el daño recibido.

El reloj pasa de 100 a **90 de energía**. El consumo pasivo conserva sus 1,5 puntos por segundo: una transformación sin ataques dura 60 segundos en vez de unos 67. Se mantienen los costes de las técnicas, el aviso rojo del HUD, la vuelta a Ben al agotarse y el bloqueo hasta completar la recarga.

| Ataque de Ben | V35 | V36 |
| --- | ---: | ---: |
| Primer leve | 8 | 4 |
| Segundo leve | 8 | 5 |
| Tercer leve | 12 | 6 |
| Fuerte | 20 | 9 |
| Especial humano de reserva | 75 | 18 |

Los combos especiales desbloqueables continúan siendo de los aliens. El remate fuerte normal de Ben usa los 9 puntos indicados. Los valores de daño y defensa de los aliens se conservan.

## Caballeros que se coordinan al avanzar

La coordinación aumenta con la fase, el progreso dentro de ella y el rango de la armadura. La vida, el daño y la composición de las oleadas de V35 se mantienen.

- En las calles predominan los comportamientos propios de cada rol. Los oficiales que aparecen más adelante empiezan a coordinarse.
- En el castillo, un atacante rodea al jugador mientras otro presiona de frente. Los escudos cubren a los apoyos y tiradores; los tiradores buscan líneas de tiro separadas. Los apoyos evitan duplicar curas y potenciadores que otro ya esté preparando.
- En el laboratorio puede haber dos flanqueadores. Los soldados muy heridos buscan a un sanador durante un máximo de 1,6 segundos antes de volver a luchar; si el sanador cae, dejan de retirarse. Un apoyo amenazado puede interrumpir su propia canalización.

Los tiradores avanzados anticipan un poco el movimiento que han observado. Fijan la dirección durante la preparación del disparo: cambiar de dirección o esquivar todavía permite evitarlo. Los atacantes avanzados espacian el inicio de sus ataques para mantener la presión sin empezar todos a la vez. Los recorridos de flanqueo usan el suelo y las colisiones existentes.

## Validación

`npm run test:combat` comprueba la vida compartida en las diez transformaciones, las defensas distintas, el agotamiento y la recarga del reloj, el daño humano y las tácticas de grupo. También recorre los 16 encuentros de las tres fases y verifica los tres campeones. `npm test` añade las pruebas de progresión, las 70 técnicas y sus sprites, la selección de objetivos y las colisiones del recorrido.

`npm run package:campaign` prepara el ZIP completo para PC. `npm run test:package` abre esa copia y comprueba el comienzo de una oleada usando teclado y ratón.
