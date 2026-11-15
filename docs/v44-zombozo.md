# V44 · Zombozo, el último espectáculo

Zombozo aparece **al final de la tercera ruta del circo**, al entrar en el escenario después de despejar su último combate. La arena cierra sus extremos y muestra la vida del jefe. No se puede volver al selector hasta derrotarlo y recoger el ADN.

## El combate

1. **El dueño del espectáculo.** Zombozo espera sentado, ordena dos grupos de secuaces, se duerme y hace burlas. Es invulnerable durante esta fase. Cuando cae el último ayudante se despierta, se levanta y activa el cristal pegado a su sombrero.
2. **El truco de Fantasmático.** Lanza bombas y cuchillos, se hunde en el suelo, reaparece, desaparece por completo y embiste en triciclo. Las bombas apuntan a una posición fija: moverse a tiempo permite esquivarlas. Los lanzamientos coinciden con los fotogramas en los que suelta los objetos. Sus poderes espectrales tienen ventanas concretas de intangibilidad; entre ataques puede recibir daño.
3. **El último número.** Al llegar al 42 % de vida, reproduce su animación de enfado y se vuelve más rápido. Añade apariciones laterales y desde arriba, ráfagas de bombas, esquivas espectrales y una caja sorpresa. Sus ataques conservan señales de aviso y momentos vulnerables.

El jefe tiene 1.100 PV. Sus bombas causan 10/13 de daño en las fases II/III; los cuchillos 7/9 y el triciclo 15/18, antes de aplicar la defensa del alien. Se respetan el dash, los poderes intangibles, la protección breve tras recibir daño y la vida reservada de Ben.

## Caja sorpresa

La caja tiene **85 PV y 8 segundos** una vez aterriza. Aparece como un objetivo real: recibe golpes, proyectiles y técnicas; no puede arrastrarse. Su barra y el contador aparecen junto a la caja y en el HUD del jefe. Mientras permanece entera, Zombozo es intangible y sigue lanzando bombas hacia Ben.

Romperla elimina su protección, reproduce la rotura y deja una apertura para atacarlo. Si se agota el contador, explota una vez y causa **30 de daño** dentro de la zona señalada. Tanto la rotura como la explosión inician un enfriamiento de 12 segundos antes de otra caja.

## ADN y guardado

Al derrotarlo se limpian los ataques pendientes, caen los ayudantes restantes y Zombozo termina tendido en el suelo. El ADN aparece después de completar la caída. **Acércate al cristal para recogerlo**: entonces se revela Fantasmático en el reloj y en «Tus aliens», junto con su árbol. Se puede probar con **R → 6** o regresar al selector de villanos.

El guardado distingue combate en curso, ADN pendiente de recoger y victoria. Reintentar o cargar durante la pelea reinicia al jefe y sus secuaces, conservando las mejoras y los combates previos superados. Si se guardó después de su caída, se restaura el cristal y el cuerpo sin repetir la pelea. El desbloqueo queda limitado al espacio de guardado correspondiente.

Las partidas V43 que ya habían alcanzado el escenario pueden elegir a Zombozo en el selector y acceder directamente a su encuentro. Las partidas anteriores conservan sus datos; Fantasmático sigue siendo secreto hasta recuperar su ADN.

## Verificación

`npm run test:zombozo-boss` comprueba la secuencia de las tres fases, las dos oleadas de ayudantes, los ocho ataques de la fase II, intangibilidad, proyectiles, caja rompible y explosiva, caída, recogida física del ADN y los tres estados de guardado. La prueba de Chromium recorre los tres combates del último acto antes de activar al jefe, realiza ataques con clics reales, prueba la derrota y el reintento, carga el ADN pendiente, se transforma en Fantasmático y comprueba el aislamiento entre espacios.

La biblioteca original de 180 poses de Zombozo y 72 dibujos de objetos se conserva en `zombozo/`. El juego utiliza sus atlas, duraciones y eventos de contacto; no deforma una pose de reposo para simular los ataques.
