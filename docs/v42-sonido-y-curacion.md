# V42 · Sonidos y curación progresiva

Las cápsulas curan **12 PV en las calles, 16 en el castillo y 20 en el laboratorio**. Mantienen su probabilidad baja del 7% al 18%, según la vida de Ben. Al recogerlas transformado, curan también la reserva que Ben conservará al volver.

## Dirección del sonido

El juego tiene 82 efectos compuestos a partir de 39 grabaciones CC0 de Kenney y síntesis propia. Los materiales se distinguen por su ataque, textura y peso; no hay un único pitido para todas las acciones.

| Forma o acción | Sonido |
| --- | --- |
| Ben | Movimiento de ropa, golpes ligeros y pasos sobre pavimento. |
| Cuatro Brazos | Golpes graves, peso al levantar roca, pasos pesados y aplauso con onda de choque. |
| Fuego | Carga de llama, expulsión al lanzar, impacto al llegar, propulsión sostenida y crepitar tenue en reposo. |
| Diamante | Corte afilado, crecimiento de cristal, resonancia y rotura. |
| XLR8 | Impulso de aire, pasada rápida, frenado y rodadura tenue al desplazarse. |
| Cannonbolt | Plegado corporal, vibración al cargar, rodadura y golpes de masa. |
| Fantasmático | Desvanecimiento, aire filtrado, apertura del vientre y látigos amortiguados. No pisa el suelo al flotar. |
| Insectoide | Cuatro emisiones húmedas, salpicaduras, aguijón y alas solo al volar. Camina con pasos en el suelo. |
| Wildvine | Látigos vegetales, crujidos, raíces, semillas y crecimiento orgánico. |
| Blitzwolfer | Garras, mordida y aullido con armónicos y resonancia; las ondas de un mismo aullido comparten su sonido. |
| Ultra T | Moldeado líquido, estiramiento, pistón, pulso electrónico y láser ocular. |
| Caballeros y Rey Eterno | Pasos de armadura, armas, disparos, bloqueo, cristal roto, canalización, derribo y caída. |
| Omnitrix e interfaz | Selección, carga y transformación, reversión, reloj agotado/listo, mejora aprendida, curación, nivel, combate y ADN recuperado. |

Los efectos de las 70 técnicas siguen sus contactos dibujados. Los movimientos físicos básicos anticipan el contacto con su barrido; el golpe sobre el enemigo se reproduce solo cuando el daño se aplica. La bola de fuego suena al salir y después al impactar. Los cuatro escupitajos se enlazan a sus emisiones individuales. El daño repetido y las áreas comparten límites de repetición para evitar que una explosión genere muchas copias del mismo ruido.

Las habilidades que cargan, ruedan, vuelan o propulsan pueden mantener un sonido durante ese estado. Los sonidos sostenidos se detienen al cancelar, volver a Ben, abrir un panel, pausar, cambiar de fase o salir. Las vistas previas de habilidades muestran sus animaciones sin reproducir continuamente el combate.

## Controles y mezcla

En el inicio, pulsa **Sonido**. Durante la partida, abre **P → Sonido**. El volumen de efectos y la opción de silenciar se conservan en el navegador, independientemente de los tres archivos de partida. **M** silencia o activa el audio.

El sonido empieza tras una interacción del jugador, como elegir la partida. Se silencian las pestañas ocultas. La mezcla limita las voces simultáneas, da prioridad al daño y los avisos frente a los pasos, sitúa las fuentes a izquierda y derecha y atenúa lo lejano. Castillo y laboratorio tienen una reverberación corta. Compresión y limitación suave mantienen margen para los combates concurridos.

Las grabaciones están incrustadas en el HTML: el audio funciona sin internet y sin peticiones de archivos de sonido al jugar. Sus créditos y licencias se incluyen en `assets/audio`. Los originales seleccionados, las versiones preparadas y el manifiesto quedan en el repositorio. `scripts/build-audio-bank.py` vuelve a preparar el banco.

## Comprobaciones

- `npm run test:audio`: 39 grabaciones decodificadas, 70 técnicas con sus contactos, golpe fallado/acertado, daño recibido, transformación, lanzamiento e impacto de fuego, compra real, pausa, silencio, volumen persistente y mezcla renderizada.
- El render de prueba reproduce efectos y doce capas de combate simultáneas, comprueba el pico de salida y exige silencio al terminar. La muestra se guarda en `artifacts/v42/muestra-sonidos.wav`.
- `npm run test:recovery`: verifica las curaciones de 12/16/20 en sus fases, además de vida de Ben, caídas y recogidas.
- `npm test` mantiene los recorridos y las regresiones del juego completo. `npm run test:package` abre la versión extraída con controles reales y comprueba que el audio se active y decodifique.
