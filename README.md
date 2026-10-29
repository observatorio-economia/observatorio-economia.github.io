# Observatorio · Economía 1.º de Bachillerato

Web estática con las herramientas digitales del curso, una por situación de aprendizaje (SA). Funciona sin Claude, sin cuentas y sin servidor propio: se puede publicar gratis en GitHub Pages.

## Qué hay aquí

```
index.html               Panel del Observatorio (portada con las 10 SA, en castellano y valenciano)
assets/observatorio.css  Hoja de estilo de la web: portada y menú común
assets/menu.js           Menú común + lista de las 10 SA (la única lista que hay que mantener)
assets/comun/            Piezas comunes del vault (línea gráfica, idioma, modo proyector), copiadas por actualizar.sh
sa01/ … sa09/, datos/   Las herramientas y la Base de datos (copias generadas desde el vault, no editar a mano)
actualizar.sh            Vuelve a copiar las herramientas y las piezas comunes desde el vault
.nojekyll                Para que GitHub Pages sirva los archivos tal cual
```

## El vault es el original

Las herramientas se editan **en el vault** (`05-SA/<SA>/material/…html`). Después, para pasar los cambios a la web:

```bash
sh ~/Documents/observatorio-economia/actualizar.sh
```

El script copia cada herramienta y solo le añade el esqueleto de página, la hoja de estilo y el menú de la web, y cambia el enlace «← Panel del Observatorio» (la constante `PANEL_URL` de las piezas comunes) para que lleve a la portada. También copia `05-SA/_observatorio-comun/observatorio-common.css` y `.js` a `assets/comun/` para la portada. No modifica nada del vault.

La portada de la web no se copia de `05-SA/panel-observatorio.html`: se genera con la lista de `assets/menu.js`.

## Añadir la herramienta de una SA nueva

1. En `actualizar.sh`, añade una línea a `HERRAMIENTAS`, por ejemplo:
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
