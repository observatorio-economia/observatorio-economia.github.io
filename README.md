# Observatorio · Economía 1.º de Bachillerato

Web estática del curso: las herramientas digitales, una por situación de aprendizaje (SA), y los apuntes y el libro del alumnado a medida que se escriben. Funciona sin Claude, sin cuentas y sin servidor propio: se puede publicar gratis en GitHub Pages.

## Qué hay aquí

```
index.html               Inicio (portada con las 10 SA, en castellano y valenciano)
assets/observatorio.css  Hoja de estilo de la web: portada, páginas de SA y apuntes, menú, pie e impresión
assets/estilo.css        Línea gráfica de la web (papel, grafito, rojo; Jost, Commissioner, Literata), la última en cargar
assets/menu.js           Menú común, lista de las 10 SA (la única que hay que mantener), autoría y licencia
assets/comun/            Piezas comunes del vault (línea gráfica, idioma, modo proyector), copiadas por actualizar.sh
sa01/                    SA con apuntes: página de la SA, una página por sesión (s01.html…) y herramientas/
sa02/ … sa09/, datos/    Las demás herramientas y la Base de datos
actualidad/              Actualidad: noticias comentadas y titulares de varios medios (página y datos.json)
libro/                   Libro del alumnado: los apuntes de todas las SA seguidos, para leer o imprimir
publicar.sh              Publica: trae los titulares automáticos, reconstruye desde el vault y sube a GitHub Pages
actualizar.sh            Construye todo desde el vault (llama a scripts/actualizar.py)
manifest.webmanifest     Web instalable: nombre, colores e iconos (assets/icono/) de la app
sw.js                    Web instalable: guarda la web en el dispositivo para usarla sin conexión; lo genera actualizar.sh
inventario-web.md        Inventario de lo publicado (herramientas, pestañas, fuentes, estado, sesiones e interruptores); lo genera actualizar.sh: no se edita a mano
LICENSE.md               Licencia CC BY-SA 4.0
.nojekyll                Para que GitHub Pages sirva los archivos tal cual
```

## El vault es el original

Las herramientas se editan **en el vault** (`05-SA/<SA>/material/…html`). Después, para pasar los cambios a la web:

```bash
sh ~/Documents/observatorio-economia/actualizar.sh
```

Todo lo que hay en `sa01/` … `libro/` y `datos/` se genera: no lo edites a mano.

**Protección:** si el archivo del vault de una herramienta parece una versión más antigua que la que ya está en la web (sin las piezas comunes o mucho más corto), el script no lo copia y avisa con ✗. Revisa ese archivo y su artefacto de Claude; si de verdad es el bueno, `FORZAR=1 sh actualizar.sh`. Además, cada versión publicada queda en el historial de git.

El script copia cada herramienta y solo le añade el esqueleto de página, la hoja de estilo y el menú de la web, y cambia el enlace «← Panel del Observatorio» (la constante `PANEL_URL` de las piezas comunes) para que lleve a la portada. También copia `05-SA/_observatorio-comun/observatorio-common.css` y `.js` a `assets/comun/` para la portada. No modifica nada del vault.

La portada de la web no se copia de `05-SA/panel-observatorio.html`: se genera con la lista de `assets/menu.js`.

## Apuntes y libro del alumnado

Los apuntes se escriben **en el vault**, en Markdown, dentro de la carpeta `web/` de cada SA:

```
05-SA/SA01-que-es-la-economia/web/
  _sa.md      presentación de la SA: título, pregunta, caso y qué se practica (cabecera) y, debajo, un texto opcional
  s01.md      una nota por sesión: sesión, fase (1 La pista · 2 Las herramientas · 3 Sobre el terreno · 4 El informe),
  s02.md …    título, estado y herramienta (cabecera) y, debajo, el apunte
```

- Mientras una sesión tenga `estado: en elaboración`, la web solo muestra su título y el aviso. Cuando el apunte esté listo, cambia a `estado: publicado`.
- El apunte admite lo básico de Markdown: `## apartados`, párrafos, `**negrita**`, `*cursiva*`, listas, `> citas`, `[enlaces](https://…)` e imágenes. Los apartados de la plantilla que se queden vacíos no aparecen.
- Las referencias van siempre al final, en «## Referencias», con autor, año, título y página.
- Con `titulo_va`, `pregunta_va` y `caso_va` en la cabecera, esos textos salen también en valenciano; si no, se muestran en castellano.
- Una SA con carpeta `web/` tiene su página en `saNN/` y su herramienta pasa a `saNN/herramientas/`.

Para empezar los apuntes de otra SA, copia la carpeta `web/` de la SA 1 a la carpeta de esa SA y cambia las cabeceras.

**El libro en el menú y la portada (oculto por ahora).** La página `libro/` se genera siempre y se puede abrir por su dirección, pero la entrada «Libro» del menú y la fila de la portada solo aparecen cuando hay al menos un apunte con `estado: publicado` (encargo del 30/10/2026). Lo cuenta `actualizar.sh` y lo escribe en `assets/estado-web.js`. El interruptor es `MOSTRAR_LIBRO` al principio de `assets/menu.js`: `"auto"` (así), `true` (mostrarlo siempre) o `false` (no mostrarlo nunca).

## Línea gráfica

`assets/estilo.css` da a toda la web el aire de familia de la otra web de Jordi (decisión W-33: tipografía y colores, sin logotipo, cuña ni nombre): fondo papel `#F4F3EF` y tarjetas blancas, grafito `#1F2224`, un único rojo `#C8412F`, títulos en **Jost** y en minúscula, rótulos en **Commissioner** y lectura en **Literata**. Se carga la última en todas las páginas y `actualizar.sh` la añade al final de cada herramienta, así que no cambia ningún archivo del vault (las herramientas publicadas en Claude conservan su estilo). Para volver al estilo anterior: `ESTILO_WEB = False` en `scripts/actualizar.py` y quitar las dos líneas marcadas en `index.html`.

## Web instalable (app)

La web se puede instalar como una app desde el navegador (en el móvil: «Añadir a la pantalla de inicio»; en Chrome o Edge: el icono de instalar de la barra de direcciones). Una vez abierta, funciona sin conexión, salvo los titulares de Actualidad. Con red, siempre muestra lo último; si la red no responde en 4 segundos, tira de la copia guardada. `actualizar.sh` regenera `sw.js` con la lista de archivos y una versión que cambia sola cuando cambia algo, así que no hay que tocar nada a mano. Solo funciona en https (GitHub Pages) o en `localhost`.

## Navegación

En todas las páginas, el menú de arriba (Inicio, Situaciones, Actualidad, Datos) y, debajo, las migas de pan («Inicio › SA 1 · … › Herramienta»), que genera `assets/menu.js` según la dirección. Los enlaces «← Panel del Observatorio» y «← SA n» que traen las herramientas y las sesiones se esconden en la web (`assets/estilo.css`); siguen en el vault y en los artefactos de Claude, donde no hay menú.

## Portada

La rellena `assets/menu.js`: arriba, **«Esta semana en clase»**, la SA que toca según las fechas del calendario (campos `ini` y `fin` de cada SA en `menu.js`, sacados de `02-curriculo/03-calendario-2026-27.md`); en vacaciones, la siguiente. Debajo, **la línea del curso** (un tramo por SA con el ancho de su duración: pasadas en grafito, la actual en rojo con la marca de hoy), **las crisis del Observatorio** (una línea de 1929 a hoy con la crisis hilo de cada SA y el enlace a su herramienta, o «próximamente» si aún no la tiene; en el móvil la línea es vertical; los datos están en `CRISIS`, en `menu.js`), la noticia comentada más reciente (solo si hay alguna), las situaciones por trimestre (con la pregunta guía cuando está decidida, campo `q`) y las páginas comunes. El menú tiene «Situaciones» como desplegable con los títulos, «Actualidad», «Datos» y el botón del tema. Si cambia el calendario, hay que cambiar esas fechas en `menu.js`.

## Actualidad

Se ve en el menú («Actualidad»), en la portada (solo la noticia comentada en clase más reciente; si no hay, la sección no sale) y en `actualidad/` (comentadas y titulares por medio). Desde el 25/11/2026 no hay carrusel ni imágenes de los medios: la portada no muestra titulares automáticos y ninguna página carga fotos de servidores ajenos.

- **Noticias comentadas:** en el vault, `05-SA/_actualidad/AAAA-MM-DD-palabra-clave.md`, copiando `_plantilla.md`: titular, medio, enlace, SA, concepto y una pregunta para la clase en la cabecera, y dos o tres líneas propias debajo. Solo salen las que tienen `estado: publicado`. No se copia el texto de la noticia: se resume y se enlaza.
- **Titulares:** los recoge `actualizar.sh` de los canales RSS de `scripts/fuentes-actualidad.json` (medios de líneas editoriales distintas; se pueden quitar o añadir). Solo título, medio, fecha y enlace. Si un canal falla, se conservan sus titulares anteriores y se avisa con ⚠, sin parar la web.
- **Sin carrusel ni imágenes (25/11/2026):** las fuentes marcadas con `"salmon": true` (prensa económica) siguen en la lista de titulares, pero ya no se guardan ni se enlazan sus imágenes. La función del carrusel (`OBS_CARRUSEL` en `menu.js`) se conserva sin uso por si se quiere recuperar. elEconomista no se puede usar: bloquea los lectores automáticos.
- **Cada día, solos:** cuando la web esté en GitHub, `.github/workflows/titulares.yml` los renueva cada mañana (`--solo-titulares`, sin el vault). En local, se renuevan al ejecutar `actualizar.sh`.
- Sin comentarios ni foros: la web es solo de lectura.
- Los titulares automáticos no se revisan uno a uno: pueden colarse noticias poco adecuadas para el aula. Si pasa, se quita ese medio de la lista.

## Herramientas abiertas: «Antes de ver», escenarios, ficha imprimible y marcas de fecha

Piezas comunes en `05-SA/_observatorio-comun/observatorio-common.js` y `.css` (vault), que `sync.py` copia en cada herramienta. Una herramienta las activa con `OBS.mountBar(..., { apertura: true })`.

- **«Antes de ver»:** en modo proyector (o siempre, según el panel del profesor, «Abrir la herramienta»), los resultados de cada bloque (`data-obs-scope`) salen tapados hasta pulsar «Ver», para que la clase prediga primero. Se marcan con `data-obs-result`; la barra va donde haya un `data-obs-prompt` o antes del primer resultado. Se vuelven a tapar al cargar un escenario, al pulsar un botón de choque o con «Tapar otra vez»; mover un deslizador no los tapa.
- **Escenarios propios** (`OBS.escenarios`): guardar hasta 7 configuraciones con nombre en el navegador, cargar ejemplos, comparar los resultados en una tabla y pasar un escenario con un código corto (`SA4-…-X`, con letra de control). Nada sale del navegador. Hoy en SA 4 (pestaña de la guerra de precios, con sus parámetros a la vista) y SA 6.
- **Ficha imprimible** (`OBS.imprimir`): «Imprimir ficha» saca la pestaña activa en A4 con Nombre/Equipo, el escenario y huecos para la predicción en lugar de los resultados (en los gráficos quedan los ejes); el profesor puede imprimir con resultados desde su panel.
- **Marcas de fecha** (`OBS.marcas`): líneas o bandas con texto sobre un gráfico de años. En SA 8, sobre el IPC: 1973, 1977, 1999 y 2021-2023 (casilla «Fechas históricas en los gráficos»).

## Accesibilidad y comprensión (auditoría de Fable, 25/11/2026)

Informe en el vault: `03-metodologia/auditoria-fable-funcionalidad-2026-11-25.md`. Lo aplicado:

- **La barra del alumnado** solo tiene idioma y «Para el docente». Dentro del panel del docente, «Para el aula» (modo proyector, imprimir ficha, imprimir con resultados y «Antes de ver»), los escenarios propios, los parámetros (SA 4), la pestaña «Introducir códigos» (SA 2), la pestaña del modelo 2 de la SA 9, los borrados de la SA 1 y el selector de grupo y las descargas de la SA 2. Un elemento con `data-obs-docente` solo se ve con el panel abierto.
- **Una pregunta por pantalla:** subpestañas «a / b» (`OBS.subpestanas`) en la SA 4 (pestañas 1 y 2), la SA 3 (frontera) y la SA 9 (pestaña 1). Fuera la parte 3a y la pestaña 4 vacía de la SA 4.
- **Palabras nuevas** (`OBS.palabras`): un desplegable por bloque con los términos y su explicación de una línea. **Qué mirar** (`OBS.mirar`): una frase encima de cada gráfico principal. Textos reescritos en lenguaje llano (SA 3, 4, 6, 9 y portada); los nombres de autores y escuelas van detrás de la idea.
- **Fuentes y notas** del pie, plegadas.
- **Teclado y lector de pantalla:** «Saltar al contenido», flechas entre pestañas, unidad en los deslizadores (`aria-valuetext`), zonas desplazables alcanzables con el tabulador, tabla de datos junto al gráfico en la SA 6 y la calculadora de la SA 8, y la pizarra (SA 5) se puede usar sin arrastrar («Sin arrastrar»: unir y quitar elementos con selectores; `Pizarra.bindUnir`).
- **Móvil:** menú no fijo, pestañas en una fila, gráficos que se desplazan de lado para que la letra no baje de unos 11 px, controles de 44 px.
- **Proyector:** todo el ancho y letra de 22 px.
- **Portada:** fuera la línea del curso; cada situación con su crisis en una línea; la cronología, plegada en el móvil. **Actualidad:** solo las comentadas; los titulares automáticos, plegados «para el docente». **Datos:** cada ficha con lo esencial; el resto, al abrirla. **Sesiones sin apunte:** sin enlace.

Comprobado con axe-core (WCAG 2.1 AA): ninguna infracción en las 13 páginas y sus pestañas, en el ordenador y en el móvil.

## Autoría, licencia y cómo citar

Todo el material está bajo **CC BY-SA 4.0**: se puede copiar, adaptar y compartir citando la fuente y con la misma licencia. Al pie de cada página aparecen la autoría, la licencia y cómo citar esa página. Para cambiar el nombre o la licencia, edita `AUTOR`, `ANYO` y `LICENCIA` al principio de `assets/menu.js` (y `LICENSE.md`).

## Añadir la herramienta de una SA nueva

1. En `scripts/actualizar.py`, añade una línea a `HERRAMIENTAS`, por ejemplo:
   `("sa03", "SA03-la-produccion/material/observatorio-sa3.html"),`
2. En `assets/menu.js`, en la entrada de esa SA, pon `ruta: "sa03/"`, el `estado` (`"open"` = abrir o `"proto"` = prototipo) y una descripción corta `d` en castellano y valenciano.
3. Ejecuta `actualizar.sh`.

La portada y el menú se actualizan solos a partir de `menu.js`.

## SA 2: dónde se guardan los códigos

Fuera de Claude, la propia herramienta guarda los grupos **en el navegador del ordenador donde se introducen** (localStorage). No se envían a ningún sitio.

- Se pierden si se borran los datos del navegador o si se cambia de ordenador o de navegador.
- Para pasarlos a otro ordenador o guardar una copia: *Exportar el grupo* en «Resultados» e *Importar un grupo exportado* en «Introducir códigos».
- Dentro de Claude, la herramienta sigue usando el almacén de Claude.

## Probar en local

Abre `index.html` con doble clic, o, para que se comporte igual que en Internet:

```bash
python3 -m http.server 8765 --directory ~/Documents/observatorio-economia
```

y entra en <http://localhost:8765/>.

## Publicar en GitHub Pages

La web está en **https://observatorio-economia.github.io/** (organización `observatorio-economia` de GitHub, repositorio `observatorio-economia.github.io`, rama `main`). Para publicar los cambios del vault:

```
sh publicar.sh "Mensaje del cambio"
```

Trae antes los titulares que GitHub actualiza solo cada mañana (`.github/workflows/titulares.yml`), reconstruye con `actualizar.sh` y sube. Este Mac sube con la herramienta oficial de GitHub (`gh`), autorizada con la cuenta Econplebs; está en `~/Documents/Observatorio-herramientas/gh/` y git la usa para identificarse, así que esa carpeta no se borra.
