#!/bin/sh
# Construye la web a partir del vault (el vault es el original: no se toca).
# Copia las herramientas, genera las páginas de las SA que tengan carpeta web/ en el vault
# (presentación, una página por sesión y el libro del alumnado) y copia las piezas comunes.
# Todo el trabajo lo hace scripts/actualizar.py, que explica cada paso.
# Uso: sh actualizar.sh   (desde cualquier carpeta)

set -e
WEB="$(cd "$(dirname "$0")" && pwd)"
VAULT="${VAULT:-$HOME/Documents/Claude (Obsidian)/Claude/Docencia-Economia/05-SA}"
/usr/bin/env python3 -I "$WEB/scripts/actualizar.py" "$WEB" "$VAULT"
