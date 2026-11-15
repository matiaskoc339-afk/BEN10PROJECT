# Zombozo · El último espectáculo

Biblioteca de arte para el jefe del circo: **30 animaciones, 180 poses dibujadas y 72 dibujos nuevos de objetos y efectos**. Los sprites tienen transparencia y pivotes registrados. Esta entrega prepara el arte y los eventos del combate; todavía no añade al jefe a la demo V43.

Abre `index.html` en Chrome, Edge o Firefox de PC. Mantén todas las carpetas juntas. El visor funciona con archivos locales y no necesita internet. También puedes ejecutar `python3 -m http.server 8000` desde esta carpeta.

Pulsa **Ver las tres fases** para ver la secuencia completa. Puedes seleccionar cualquier acción, detenerla, revisar sus seis fotogramas, cambiar de dirección y comparar su altura con Ben. «Ver dibujo sin desvanecer» permite revisar las poses que normalmente quedan ocultas al desaparecer. La pestaña **Caja, trucos y ADN** contiene los objetos separados.

## Las tres fases

| Fase | Animaciones |
| --- | --- |
| I · El dueño del espectáculo | Reposo sentado, ordenar secuaces, dormirse, burlarse, despertar serio y levantarse preparando el cristal. |
| II · El truco de Fantasmático | Reposo, caminar, bomba, cuchillos, golpe recibido, enfado, hundirse, emerger lanzando una bomba, subir al triciclo, pedalear, desaparecer y reaparecer. |
| III · El último número | Reposo furioso, correr, tres bombas alternando manos, abanico de cuchillos, burla agresiva, golpe recibido, grieta lateral, aparición desde arriba, lanzar caja, hostigar intangible, esquiva espectral y caída final. |

La primera fase permanece sentada hasta que caen sus secuaces. El sombrero de las fases II y III lleva un cristal con el ojo de Fantasmático y dos tiras de cinta cruzadas. La fase III conserva también los poderes y ataques de la fase II; no necesita duplicar sus láminas para utilizarlos con tiempos más agresivos.

## Caja sorpresa y recompensa

El visor incluye dos secuencias: romper la caja a tiempo y dejarla explotar. La caja tiene reposo, activación, reacción al golpe, rotura y explosión. Su salud, daño, cuenta atrás y enfriamiento se configurarán al integrar el combate. Mientras existe, Zombozo es intangible y lanza bombas; romperla termina esa protección. La caja no libera el ADN.

La caída termina con Zombozo tendido en el suelo y su sombrero separado. El evento `ghostfreakDNA` aparece únicamente en el último fotograma de la derrota; el cristal flotante se dibuja como objeto independiente para que luego pueda recogerse. La invisibilidad completa oculta el dibujo, mientras la intangibilidad conserva una silueta espectral visible.

## Recursos y tiempos

- `assets/source`: siete láminas originales de seis filas y seis columnas.
- `assets/atlases`: poses registradas con margen transparente y datos JSON por lámina.
- `data/manifest.json` y `data/catalog.js`: catálogo, duraciones por fotograma, contactos, visibilidad y eventos. Los índices empiezan en cero.
- `assets/reference`: modelo, retrato, escenario y Ben para comparar escala.
- `assets/shared`: bomba roja y explosión ya usadas por los payasos del circo. Las bombas negras de la fase furiosa están en la lámina nueva de objetos.
- `data/art-jobs.json` y `generated-log.json`: instrucciones y procedencia de las imágenes originales.

Cada animación tiene seis dibujos distintos. Se usa una escala constante por lámina del personaje: altura de referencia 176 píxeles en el atlas y 128 unidades en el mundo, frente a las 70 de Ben. Los pivotes permanecen fijos por lámina; el sombreado de intangibilidad se aplica aparte. El visor mueve al personaje durante los desplazamientos y usa los dibujos nuevos para las posturas, sin estirar su cuerpo.

Los proyectiles y la caja se crean al soltar el objeto, no al iniciar el ataque. En la ráfaga furiosa las bombas salen en los fotogramas 1, 3 y 5; al hostigar protegido por la caja, en el 3. El impulso, las apariciones, los contactos y la recompensa tienen eventos separados para sincronizar la futura lógica del jefe.

## Comprobaciones desde el repositorio

`npm run build:zombozo` registra las láminas originales. `npm run test:zombozo` revisa transparencia, recortes, poses, tiempos, la caída, desapariciones, ambas secuencias de la caja y el visor en Chromium. `npm run package:zombozo` crea el ZIP autónomo con sus originales. `npm run preview:zombozo` graba las animaciones en vídeo.
