# Observatorio · Economía 1.º de Bachillerato

Web estática del curso: las herramientas digitales, una por situación de aprendizaje (SA), y los apuntes y el libro del alumnado a medida que se escriben. Funciona sin Claude, sin cuentas y sin servidor propio: se puede publicar gratis en GitHub Pages.

## Qué hay aquí

```
index.html               Panel del Observatorio (portada con las 10 SA, en castellano y valenciano)
assets/observatorio.css  Hoja de estilo de la web: portada, páginas de SA y apuntes, menú, pie e impresión
assets/menu.js           Menú común, lista de las 10 SA (la única que hay que mantener), autoría y licencia
assets/comun/            Piezas comunes del vault (línea gráfica, idioma, modo proyector), copiadas por actualizar.sh
sa01/                    SA con apuntes: página de la SA, una página por sesión (s01.html…) y herramientas/
sa02/ … sa09/, datos/    Las demás herramientas y la Base de datos
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
