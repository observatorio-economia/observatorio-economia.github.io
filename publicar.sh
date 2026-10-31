#!/bin/sh
# Publica la web en GitHub Pages (https://observatorio-economia.github.io/).
# 1) trae los titulares que GitHub actualiza cada mañana; 2) reconstruye desde el vault; 3) guarda y sube.
# Los archivos generados (actualidad, estado-web.js, inventario, sw.js) se rehacen en el paso 2, así que en un
# choque con los titulares automáticos vale cualquiera de las dos versiones: se queda la local.
cd "$(dirname "$0")" || exit 1
git pull --rebase --autostash -X theirs -q || { echo "✗ No se ha podido traer lo de GitHub: revisa con git status"; exit 1; }
sh actualizar.sh || { echo "✗ actualizar.sh ha avisado de algún problema: no se publica"; exit 1; }
git add -A
git diff --cached --quiet || git commit -q -m "${1:-Actualización de la web}" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
git push -q && echo "✓ Publicado en https://observatorio-economia.github.io/ (tarda un minuto en verse)"
