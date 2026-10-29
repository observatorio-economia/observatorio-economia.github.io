#!/bin/sh
# Copia las herramientas del vault a la web. El vault es el original: no se toca.
# En cada copia solo se hace esto:
#   1. Se añade el esqueleto de página (doctype, idioma, codificación, viewport),
#      la hoja de estilo común de la web y el menú común.
#   2. El enlace «← Panel del Observatorio» (la constante PANEL_URL de las piezas comunes)
#      deja de apuntar a Claude y lleva a la portada, en la misma pestaña.
# Además copia las piezas comunes (05-SA/_observatorio-comun/) a assets/comun/ para la portada.
# Uso: sh actualizar.sh   (desde cualquier carpeta)
# Para añadir una herramienta: una línea en HERRAMIENTAS y su ruta en assets/menu.js.

set -e
WEB="$(cd "$(dirname "$0")" && pwd)"
VAULT="${VAULT:-$HOME/Documents/Claude (Obsidian)/Claude/Docencia-Economia/05-SA}"

/usr/bin/env python3 - "$WEB" "$VAULT" <<'PY'
import re, shutil, sys
from pathlib import Path

web, vault = Path(sys.argv[1]), Path(sys.argv[2])

# carpeta de la web, archivo en el vault
HERRAMIENTAS = [
    ("sa01", "SA01-que-es-la-economia/material/observatorio-sa1.html"),
    ("sa02", "SA02-el-comportamiento-humano/material/SA2-herramientas.html"),
    ("sa04", "SA04-el-mercado/material/observatorio-sa4.html"),
    ("sa05", "SA05-crecimiento-y-desarrollo/material/observatorio-sa5.html"),
    ("sa06", "SA06-el-mercado-laboral/material/observatorio-sa6.html"),
]

PANEL = "https://claude.ai/artifact/TMzyeD3wBN9TAyT8vaKeZs"
# Enlace al panel escrito en HTML (versiones antiguas) o como constante de las piezas comunes
PANEL_HTML = re.compile(r'href="' + re.escape(PANEL) + r'"(?:\s+target="_blank")?(?:\s+rel="noopener")?')
PANEL_JS = '"' + PANEL + '"'
NUEVA_PESTANA = 'href: opts.panelUrl || PANEL_URL, target: "_blank", rel: "noopener"'

CABECERA = "\n".join([
    "<!doctype html>",
    '<html lang="es">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
    "<!-- Añadido por actualizar.sh: hoja y menú comunes de la web. El resto es la herramienta tal como está en el vault. -->",
    '<link rel="stylesheet" href="../assets/observatorio.css">',
    '<script src="../assets/menu.js"></script>',
    "",
])

errores = 0

comun = vault / "_observatorio-comun"
destino_comun = web / "assets" / "comun"
destino_comun.mkdir(parents=True, exist_ok=True)
for nombre in ("observatorio-common.css", "observatorio-common.js"):
    if (comun / nombre).is_file():
        shutil.copyfile(comun / nombre, destino_comun / nombre)
        print(f"✓ assets/comun/{nombre}")
    else:
        print(f"✗ no encuentro {comun / nombre}")
        errores += 1

for carpeta, origen in HERRAMIENTAS:
    src = vault / origen
    if not src.is_file():
        print(f"✗ {carpeta}: no encuentro {src}")
        errores += 1
        continue
    html = src.read_text(encoding="utf-8")
    html, n = PANEL_HTML.subn('href="../index.html"', html)
    n += html.count(PANEL_JS)
    html = html.replace(PANEL_JS, '"../index.html"').replace(NUEVA_PESTANA, "href: opts.panelUrl || PANEL_URL")
    destino = web / carpeta / "index.html"
    destino.parent.mkdir(exist_ok=True)
    destino.write_text(CABECERA + html, encoding="utf-8")
    otros = len(re.findall(r"claude\.ai/artifact/", html))
    aviso = f"  ⚠ quedan {otros} enlaces a claude.ai" if otros else ""
    aviso += "" if n else "  ⚠ no he encontrado el enlace al panel"
    print(f"✓ {carpeta}/index.html  ← {origen}{aviso}")

sys.exit(1 if errores else 0)
PY
