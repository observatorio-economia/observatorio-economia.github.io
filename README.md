# Observatorio · Economía 1.º de Bachillerato

Web estática con las herramientas digitales del curso, una por situación de aprendizaje (SA). Funciona sin Claude, sin cuentas y sin servidor propio: se puede publicar gratis en GitHub Pages.

## Qué hay aquí

```
index.html               Panel del Observatorio (portada con las 10 SA)
assets/observatorio.css  Hoja de estilo común: colores, fuentes, modo oscuro, portada y menú
assets/menu.js           Menú común + lista de las 10 SA (la única lista que hay que mantener)
assets/almacen-local.js  Solo SA 2: guarda los códigos de las encuestas en el navegador
sa01/ sa02/ sa04/ sa05/  Las herramientas (copias generadas desde el vault, no editar a mano)
actualizar.sh            Vuelve a copiar las herramientas desde el vault
.nojekyll                Para que GitHub Pages sirva los archivos tal cual
```

## El vault es el original

Las herramientas se editan **en el vault** (`05-SA/<SA>/material/…html`). Después, para pasar los cambios a la web:

```bash
sh ~/Documents/observatorio-economia/actualizar.sh
```

El script copia cada herramienta y solo le añade el esqueleto de página, la hoja de estilo y el menú comunes, y cambia el enlace «← Panel del Observatorio» para que lleve a la portada. En la SA 2 carga, además, el almacén local. No modifica nada del vault.

## Añadir la herramienta de una SA nueva

1. En `actualizar.sh`, añade una línea a `HERRAMIENTAS`, por ejemplo:
   `("sa03", "SA03-la-produccion/material/observatorio-sa3.html", []),`
2. En `assets/menu.js`, en la entrada de esa SA, pon `ruta: "sa03/"`, el `estado` ("abrir" o "prototipo") y una descripción corta `d`.
3. Ejecuta `actualizar.sh`.

La portada y el menú se actualizan solos a partir de `menu.js`.

## SA 2: dónde se guardan los códigos

Fuera de Claude, los códigos que se guardan en «Introducir códigos» se quedan **en el navegador del ordenador donde se introducen** (localStorage). No se envían a ningún sitio.

- Se pierden si se borran los datos del navegador o si se cambia de ordenador o de navegador.
- Por eso, en «Introducir códigos» hay un bloque **Copia de seguridad**: *Exportar copia* descarga un archivo `.json` e *Importar copia* lo recupera (se suma a lo que ya haya y no borra nada).
- Dentro de Claude, la herramienta sigue usando el almacén de Claude, como antes.

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
