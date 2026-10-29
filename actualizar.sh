#!/bin/sh
# Copia las herramientas del vault a la web. El vault es el original: no se toca.
# En cada copia solo se hace esto:
#   1. Se añade el esqueleto de página (doctype, idioma, codificación, viewport),
#      la hoja de estilo común y el menú común.
#   2. El enlace «← Panel del Observatorio» deja de apuntar a Claude y lleva a la portada.
#   3. Solo en la SA 2: se carga assets/almacen-local.js para guardar los códigos en el navegador.
# Uso: sh actualizar.sh   (desde cualquier carpeta)
# Para añadir una herramienta: una línea en HERRAMIENTAS y su entrada en assets/menu.js.

set -e
WEB="$(cd "$(dirname "$0")" && pwd)"
VAULT="${VAULT:-$HOME/Documents/Claude (Obsidian)/Claude/Docencia-Economia/05-SA}"

/usr/bin/env python3 - "$WEB" "$VAULT" <<'PY'
import re, sys
from pathlib import Path

web, vault = Path(sys.argv[1]), Path(sys.argv[2])

# carpeta de la web, archivo en el vault, scripts extra en <head>
HERRAMIENTAS = [
    ("sa01", "SA01-que-es-la-economia/material/observatorio-sa1.html", []),
    ("sa02", "SA02-el-comportamiento-humano/material/SA2-herramientas.html", ["almacen-local.js"]),
    ("sa04", "SA04-el-mercado/material/observatorio-sa4.html", []),
    ("sa05", "SA05-crecimiento-y-desarrollo/material/observatorio-sa5.html", []),
]

PANEL = re.compile(r'href="https://claude\.ai/artifact/TMzyeD3wBN9TAyT8vaKeZs"(?:\s+target="_blank")?(?:\s+rel="noopener")?')

errores = 0
for carpeta, origen, extras in HERRAMIENTAS:
    src = vault / origen
    if not src.is_file():
        print(f"✗ {carpeta}: no encuentro {src}")
        errores += 1
        continue
    html = src.read_text(encoding="utf-8")
    html, n = PANEL.subn('href="../index.html"', html)
    cabecera = "\n".join([
        "<!doctype html>",
        '<html lang="es">',
        "<head>",
        '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
        "<!-- Añadido por actualizar.sh: hoja y menú comunes del Observatorio. El resto es la herramienta tal como está en el vault. -->",
        '<link rel="stylesheet" href="../assets/observatorio.css">',
        '<script src="../assets/menu.js"></script>',
        *[f'<script src="../assets/{js}"></script>' for js in extras],
        "",
    ])
    destino = web / carpeta / "index.html"
    destino.parent.mkdir(exist_ok=True)
    destino.write_text(cabecera + html, encoding="utf-8")
    otros = len(re.findall(r"claude\.ai/artifact/", html))
    aviso = f"  ⚠ quedan {otros} enlaces a claude.ai" if otros else ""
    print(f"✓ {carpeta}/index.html  ← {origen}  (enlace al panel: {n}){aviso}")

sys.exit(1 if errores else 0)
PY
