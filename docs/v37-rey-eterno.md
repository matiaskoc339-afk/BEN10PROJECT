# V37 — El combate del Rey Eterno

El jefe aparece en el último tramo del laboratorio principal, una vez despejados los cuatro encuentros de esa fase. Avanzar hasta el tramo final activa la arena; la salida queda bloqueada hasta completar la caída del rey y entregar la recompensa. Se mantienen los 16 encuentros, 28 oleadas y tres campeones anteriores.

El rey tiene **900 PV** compartidos entre sus tres fases. Una marca en su barra señala los umbrales del 68 % y del 30 %. Los golpes que alcanzan esos umbrales se detienen allí: un ataque muy potente no omite una fase ni su transición.

| Fase | Vida | Defensa | Comportamiento |
| --- | --- | --- | --- |
| 1 | 900–612 PV | 120 puntos | Marcha, guardia y tajo de espada. Romper la defensa lo deja descubierto durante seis segundos, además de la animación de ruptura. |
| 2 | 612–270 PV | 72 puntos | Carrera, embestidas, doble tajo y esquivas breves frente a ataques visibles. Sus golpes hacen más daño. La exposición dura cinco segundos, además de la reacción inicial. |
| 3 | 270–0 PV | Sin barra | Armadura normal y espada rota. Se retira, puede atacar si lo acorralas y llama hasta tres ayudantes básicos. |

Mientras queda defensa, los golpes desgastan exclusivamente esa barra. Fuego multiplica ese desgaste por **1,85**; todos los demás ataques también sirven. El golpe que termina de romper la defensa no traspasa daño a la vida. Si acaba la ventana de exposición, la defensa se restaura sin curar al rey. La transición de fase también restaura la nueva defensa, cuando corresponde.

La embestida fija su dirección al prepararse y se desplaza físicamente por el mismo suelo y las mismas colisiones que los demás personajes. El indicador del suelo anticipa la dirección. Una esquiva tiene una ventana corta y una recarga; no es una invulnerabilidad continua. Los contactos de espada usan los tiempos de los fotogramas dibujados.

La retirada de la tercera fase respeta los bordes de la arena. La llamada crea reclutas físicos y un ballestero, con un máximo de tres ayudantes vivos y 7,5 segundos entre llamadas. Al morir el rey, los ayudantes caen y los proyectiles enemigos desaparecen inmediatamente. La caída real se reproduce una vez y conserva su último fotograma. Después aparece la recompensa.

## ADN y guardado

Una partida sin el nuevo guardado empieza con **Cuatro Brazos y Fuego**. El Omnitrix oscurece los ADN bloqueados y muestra un candado. Elegirlos con el ratón o el teclado no inicia una transformación. Los árboles pueden consultarse, pero no permiten comprar mejoras de un ADN bloqueado. Las compras y los puntos anteriores se conservan.

El ADN de **Diamante** se habilita al terminar la caída del jefe y persiste con la clave `ben10.campaign.v37.unlocks`. El resto de aliens continúa bloqueado. Los guardados antiguos de habilidades no desbloquean transformaciones automáticamente. Si el navegador impide guardar, el desbloqueo sigue funcionando durante esa sesión.

La pantalla de recompensa permite continuar o probar a Diamante. Probarlo devuelve primero a Ben y recarga el reloj para realizar esa transformación; conserva la vida restante. Ben y los aliens mantienen los mismos **50 PV máximos**, con sus defensas respectivas.

Morir en la arena ofrece un reintento del jefe desde su primera fase, con 50 PV y 90 de energía. La última oleada sigue despejada; no hay que repetirla. Se conservan nivel, experiencia, puntos y mejoras.

## Verificación

`npm run test:boss` verifica la defensa, el bonus de Fuego, las ventanas de exposición, los umbrales, el bloqueo de daño durante las transiciones, la esquiva, las colisiones, las llamadas y la recompensa única. La prueba en Chromium despeja las oleadas reales del laboratorio, activa el jefe, prueba un proyectil de Fuego, reintenta tras morir, recorre las tres fases y comprueba la transformación en Diamante y el desbloqueo después de recargar la página.

Las pruebas históricas de los diez aliens utilizan una copia aislada del HTML que permite revisar todo el catálogo sin las nuevas restricciones de campaña. La prueba del jefe usa los bloqueos reales. Los cambios de prueba no se incluyen en la demo descargable.
