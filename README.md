# Ben 10 · Demo v0.8

La demo v0.8 es la única versión jugable de este repositorio. La entrada principal es [index.html](index.html), un archivo autónomo que incluye los sprites, el escenario y el Omnitrix clásico.

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

En pantallas táctiles están disponibles el joystick y los botones. El Omnitrix conserva diez ranuras pendientes de aliens jugables.

## Desarrollo

```sh
npm ci
npx playwright install chromium
npm test
```

Las 28 comprobaciones verifican los fotogramas, la guardia, los golpes, el dash y el anclaje y las perspectivas del reloj. Si Chromium está instalado en `/usr/bin/chromium`, se utiliza ese ejecutable; también puede indicarse otro mediante `CHROMIUM_PATH`.

El diseño fuente y el atlas del reloj están en [assets](assets). Para recompilarlo e incrustarlo en `index.html`:

```sh
npm run build:omnitrix
```

`tests` contiene únicamente las pruebas de esta demo. `docs/preview.png` muestra la versión actual.
