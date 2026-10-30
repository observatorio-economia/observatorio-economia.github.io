# Observatorio · Economía 1.º de Bachillerato

Web estática del curso: las herramientas digitales, una por situación de aprendizaje (SA), y los apuntes y el libro del alumnado a medida que se escriben. Funciona sin Claude, sin cuentas y sin servidor propio: se puede publicar gratis en GitHub Pages.

## Qué hay aquí

```
index.html               Panel del Observatorio (portada con las 10 SA, en castellano y valenciano)
assets/observatorio.css  Hoja de estilo de la web: portada, páginas de SA y apuntes, menú, pie e impresión
assets/estilo.css        Línea gráfica de la web (papel, grafito, rojo; Jost, Commissioner, Literata), la última en cargar
assets/menu.js           Menú común, lista de las 10 SA (la única que hay que mantener), autoría y licencia
assets/comun/            Piezas comunes del vault (línea gráfica, idioma, modo proyector), copiadas por actualizar.sh
sa01/                    SA con apuntes: página de la SA, una página por sesión (s01.html…) y herramientas/
sa02/ … sa09/, datos/    Las demás herramientas y la Base de datos
actualidad/              Actualidad: noticias comentadas y titulares de varios medios (página y datos.json)
libro/                   Libro del alumnado: los apuntes de todas las SA seguidos, para leer o imprimir
actualizar.sh            Construye todo desde el vault (llama a scripts/actualizar.py)
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

## Actualidad

Se ve en el menú («Actualidad»), en la portada (la noticia comentada más reciente y los tres últimos titulares) y en `actualidad/`.

- **Noticias comentadas:** en el vault, `05-SA/_actualidad/AAAA-MM-DD-palabra-clave.md`, copiando `_plantilla.md`: titular, medio, enlace, SA, concepto y una pregunta para la clase en la cabecera, y dos o tres líneas propias debajo. Solo salen las que tienen `estado: publicado`. No se copia el texto de la noticia: se resume y se enlaza.
- **Titulares:** los recoge `actualizar.sh` de los canales RSS de `scripts/fuentes-actualidad.json` (medios de líneas editoriales distintas; se pueden quitar o añadir). Solo título, medio, fecha y enlace. Si un canal falla, se conservan sus titulares anteriores y se avisa con ⚠, sin parar la web.
- **Cada día, solos:** cuando la web esté en GitHub, `.github/workflows/titulares.yml` los renueva cada mañana (`--solo-titulares`, sin el vault). En local, se renuevan al ejecutar `actualizar.sh`.
- Sin comentarios ni foros: la web es solo de lectura.
- Los titulares automáticos no se revisan uno a uno: pueden colarse noticias poco adecuadas para el aula. Si pasa, se quita ese medio de la lista.

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

1. Crea en GitHub un repositorio nuevo y **público** (por ejemplo, `observatorio-economia`), vacío.
2. En esta carpeta:
   ```bash
   cd ~/Documents/observatorio-economia
   git init -b main
   git add .
   git commit -m "Primera versión del Observatorio"
   git remote add origin https://github.com/<tu-usuario>/observatorio-economia.git
   git push -u origin main
   ```
3. En GitHub: *Settings → Pages → Build and deployment → Source: Deploy from a branch*, rama `main`, carpeta `/ (root)`. Guarda.
4. Al cabo de un par de minutos, la web estará en `https://<tu-usuario>.github.io/observatorio-economia/`.

Para publicar cambios más adelante: `sh actualizar.sh`, y después `git add . && git commit -m "…" && git push`.
