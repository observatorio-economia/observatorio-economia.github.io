"""Construye la web del Observatorio a partir del vault. El vault es el original: no se toca.

1. Herramientas: copia cada herramienta del vault y solo le añade el esqueleto de página, la hoja de estilo
   y el menú de la web, y cambia el enlace «← Panel del Observatorio» (la constante PANEL_URL de las piezas
   comunes) para que lleve a la portada.
2. Páginas de las SA: si una SA tiene la carpeta web/ en el vault (_sa.md y s01.md, s02.md…), genera la página
   de la SA (saNN/), una página por sesión (saNN/sNN.html) y el libro del alumnado (libro/). La herramienta
   pasa entonces a saNN/herramientas/.
3. Copia las piezas comunes (05-SA/_observatorio-comun/) a assets/comun/.

Uso: sh actualizar.sh (que llama a este archivo). Sin dependencias: solo Python 3.
"""
import html, json, os, re, shutil, sys
from pathlib import Path

web, vault = Path(sys.argv[1]), Path(sys.argv[2])

# carpeta de la web, archivo en el vault
HERRAMIENTAS = [
    ("sa01", "SA01-que-es-la-economia/material/observatorio-sa1.html"),
    ("sa02", "SA02-el-comportamiento-humano/material/SA2-herramientas.html"),
    ("sa03", "SA03-la-produccion/material/observatorio-sa3.html"),
    ("sa04", "SA04-el-mercado/material/observatorio-sa4.html"),
    ("sa05", "SA05-crecimiento-y-desarrollo/material/observatorio-sa5.html"),
    ("sa06", "SA06-el-mercado-laboral/material/observatorio-sa6.html"),
    ("sa08", "SA08-el-dinero/material/observatorio-sa8.html"),
    ("sa09", "SA09-comercio-internacional/material/observatorio-sa9.html"),
    ("datos", "_base-de-datos/observatorio-datos.html"),
]

FASES = {
    1: ("La pista", "La pista"),
    2: ("Las herramientas", "Les ferramentes"),
    3: ("Sobre el terreno", "Sobre el terreny"),
    4: ("El informe", "L'informe"),
}

PANEL = "https://claude.ai/artifact/TMzyeD3wBN9TAyT8vaKeZs"
PANEL_HTML = re.compile(r'href="' + re.escape(PANEL) + r'"(?:\s+target="_blank")?(?:\s+rel="noopener")?')
PANEL_JS = '"' + PANEL + '"'
NUEVA_PESTANA = 'href: opts.panelUrl || PANEL_URL, target: "_blank", rel: "noopener"'

FUENTES = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
           '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
           '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@500;600;700'
           '&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">')

esc = html.escape
errores = 0


def aviso(ok, texto):
    global errores
    print(("✓ " if ok else "✗ ") + texto)
    if not ok:
        errores += 1


# ---------------------------------------------------------------- Markdown (lo justo para apuntes)
def leer_md(p):
    """Devuelve (cabecera, cuerpo). La cabecera es el bloque --- clave: valor --- del principio."""
    s = p.read_text(encoding="utf-8")
    meta = {}
    if s.startswith("---"):
        fin = s.find("\n---", 3)
        if fin > 0:
            for linea in s[3:fin].splitlines():
                if ":" in linea:
                    k, v = linea.split(":", 1)
                    meta[k.strip()] = v.strip()
            s = s[fin + 4:]
    return meta, re.sub(r"<!--.*?-->", "", s, flags=re.S)


def en_linea(t):
    t = esc(t, quote=False)
    t = re.sub(r"`([^`]+)`", r"<code>\1</code>", t)
    t = re.sub(r"!\[([^\]]*)\]\(([^)\s]+)\)", r'<img src="\2" alt="\1">', t)
    t = re.sub(r"\[([^\]]+)\]\(([^)\s]+)\)", r'<a href="\2">\1</a>', t)
    t = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", t)
    t = re.sub(r"(?<![\w*])\*(?!\s)(.+?)(?<!\s)\*(?![\w*])", r"<em>\1</em>", t)
    return t


def md_a_html(texto):
    """Encabezados (##, ###, ####), párrafos, listas, citas (>) y líneas separadoras (---)."""
    salida, parrafo, lista, cita = [], [], None, []

    def cerrar():
        nonlocal parrafo, lista, cita
        if parrafo:
            salida.append("<p>" + en_linea(" ".join(parrafo)) + "</p>"); parrafo = []
        if lista:
            tipo, items = lista
            salida.append(f"<{tipo}>" + "".join(f"<li>{en_linea(i)}</li>" for i in items) + f"</{tipo}>"); lista = None
        if cita:
            salida.append("<blockquote>" + md_a_html("\n".join(cita)) + "</blockquote>"); cita = []

    for linea in texto.splitlines():
        l = linea.rstrip()
        if l.startswith(">"):
            if parrafo or lista:
                c = cita; cita = []; cerrar(); cita = c
            cita.append(l[1:].lstrip()); continue
        elif cita:
            cerrar()
        m = re.match(r"^(#{1,4})\s+(.*)", l)
        if m:
            cerrar(); n = max(2, len(m.group(1)))
            salida.append(f"<h{n}>{en_linea(m.group(2))}</h{n}>"); continue
        m = re.match(r"^\s*[-*]\s+(.*)", l) or re.match(r"^\s*\d+[.)]\s+(.*)", l)
        if m:
            tipo = "ol" if re.match(r"^\s*\d", l) else "ul"
            if parrafo: cerrar()
            if lista and lista[0] != tipo: cerrar()
            if not lista: lista = (tipo, [])
            lista[1].append(m.group(1)); continue
        if re.match(r"^\s*(---|\*\*\*)\s*$", l):
            cerrar(); salida.append("<hr>"); continue
        if not l.strip():
            cerrar(); continue
        if lista: cerrar()
        parrafo.append(l.strip())
    cerrar()
    # fuera los apartados de la plantilla que se han quedado vacíos (un encabezado seguido de otro igual o mayor)
    nivel = lambda x: int(x[2]) if re.match(r"^<h[2-4]>", x) else 9
    salida = [x for i, x in enumerate(salida) if not (nivel(x) < 9 and (i + 1 == len(salida) or nivel(salida[i + 1]) <= nivel(x)))]
    return "\n".join(salida)


def tiene_texto(cuerpo):
    """¿Hay algo más que los encabezados vacíos de la plantilla?"""
    return any(l.strip() and not l.lstrip().startswith("#") for l in cuerpo.splitlines())


# ---------------------------------------------------------------- Plantilla de página
def pagina(prefijo, titulo, cuerpo, textos):
    """Página propia de la web con la línea gráfica común, el menú y los textos en castellano y valenciano."""
    reg = json.dumps({"es": {k: v[0] for k, v in textos.items()}, "va": {k: v[1] or v[0] for k, v in textos.items()}},
                     ensure_ascii=False).replace("</", "<\\/")
    return f"""<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<!-- Generada por actualizar.sh a partir del vault: no editar a mano -->
<title data-i18n="pg.title">{esc(titulo)}</title>
{FUENTES}
<link rel="stylesheet" href="{prefijo}assets/observatorio.css">
<link rel="stylesheet" href="{prefijo}assets/comun/observatorio-common.css">
<script src="{prefijo}assets/comun/observatorio-common.js"></script>
<script src="{prefijo}assets/estado-web.js"></script>
<script src="{prefijo}assets/menu.js"></script>
</head>
<body class="obs-page">
<div class="wrap">
  <div id="obs-bar" style="padding-top:16px"></div>
{cuerpo}
</div>
<script>
OBS.register({reg});
OBS.mountBar(document.getElementById("obs-bar"), {{ panelUrl: "{prefijo}index.html" }});
OBS.apply();
</script>
</body>
</html>
"""


def t(textos, clave, es, va=""):
    """Registra un texto y devuelve el elemento con data-i18n."""
    textos[clave] = (es, va)
    return clave


# ---------------------------------------------------------------- 1 · Piezas comunes
comun, destino_comun = vault / "_observatorio-comun", web / "assets" / "comun"
destino_comun.mkdir(parents=True, exist_ok=True)
for nombre in ("observatorio-common.css", "observatorio-common.js"):
    if (comun / nombre).is_file():
        shutil.copyfile(comun / nombre, destino_comun / nombre); aviso(True, f"assets/comun/{nombre}")
    else:
        aviso(False, f"no encuentro {comun / nombre}")

# ---------------------------------------------------------------- 2 · SA con carpeta web/
SAS = {}   # "sa01" → {meta, cuerpo, sesiones: [(meta, cuerpo)], dir}
for d in sorted(vault.glob("SA[0-9][0-9]-*/web")):
    if not (d / "_sa.md").is_file():
        continue
    meta, cuerpo = leer_md(d / "_sa.md")
    clave = "sa%02d" % int(meta.get("sa", d.parent.name[2:4]))
    ses = sorted((leer_md(p) for p in d.glob("s[0-9][0-9].md")), key=lambda x: int(x[0].get("sesion", 0)))
    SAS[clave] = {"meta": meta, "cuerpo": cuerpo, "sesiones": ses}

# ---------------------------------------------------------------- 3 · Herramientas
for carpeta, origen in HERRAMIENTAS:
    src = vault / origen
    if not src.is_file():
        aviso(False, f"{carpeta}: no encuentro {src}"); continue
    dentro = carpeta in SAS                       # con página de SA, la herramienta baja un nivel
    prefijo = "../../" if dentro else "../"
    destino = web / carpeta / ("herramientas" if dentro else "") / "index.html"
    s = src.read_text(encoding="utf-8")
    # Protección: si el vault trae una versión que parece más antigua que la que ya está en la web
    # (sin las piezas comunes, o mucho más corta), no se copia y se avisa. Con FORZAR=1 se copia igualmente.
    antes = destino.read_text(encoding="utf-8") if destino.is_file() else ""
    retrocede = ("OBS-COMMON-JS:BEGIN" in antes and "OBS-COMMON-JS:BEGIN" not in s) or (antes and len(s) < 0.7 * (len(antes) - 600))
    if retrocede and os.environ.get("FORZAR") != "1":
        aviso(False, f"{carpeta}: NO copiado. El archivo del vault ({len(s) // 1024} KB) parece una versión más antigua que la de la web "
                     f"({len(antes) // 1024} KB){', sin las piezas comunes' if 'OBS-COMMON-JS:BEGIN' not in s else ''}. "
                     f"Revisa {src} (y su artefacto); si de verdad es la buena: FORZAR=1 sh actualizar.sh")
        continue
    s, n = PANEL_HTML.subn(f'href="{prefijo}index.html"', s)
    n += s.count(PANEL_JS)
    s = s.replace(PANEL_JS, f'"{prefijo}index.html"').replace(NUEVA_PESTANA, "href: opts.panelUrl || PANEL_URL")
    cabecera = "\n".join([
        "<!doctype html>", '<html lang="es">', "<head>", '<meta charset="utf-8">',
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">',
        "<!-- Añadido por actualizar.sh: hoja y menú comunes de la web. El resto es la herramienta tal como está en el vault. -->",
        f'<link rel="stylesheet" href="{prefijo}assets/observatorio.css">',
        f'<script src="{prefijo}assets/estado-web.js"></script>',
        f'<script src="{prefijo}assets/menu.js"></script>', ""])
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_text(cabecera + s, encoding="utf-8")
    otros = len(re.findall(r"claude\.ai/artifact/", s))
    extra = (f"  ⚠ quedan {otros} enlaces a claude.ai" if otros else "") + ("" if n else "  ⚠ no he encontrado el enlace al panel")
    aviso(True, f"{destino.relative_to(web)}  ← {origen}{extra}")

# ---------------------------------------------------------------- 4 · Páginas de SA y de sesión
def nombre_sesion(m):
    return f"s{int(m.get('sesion', 0)):02d}.html"


def publicada(m, cuerpo):
    return m.get("estado", "").lower() == "publicado" and tiene_texto(cuerpo)


for clave, sa in SAS.items():
    m, n = sa["meta"], int(sa["meta"].get("sa", 0))
    textos = {}
    t(textos, "pg.title", f"Observatorio · SA {n}", f"Observatori · SA {n}")
    t(textos, "sa.eyebrow", f"Observatorio · SA {n}", f"Observatori · SA {n}")
    t(textos, "sa.title", m.get("titulo", ""), m.get("titulo_va", ""))
    t(textos, "sa.q", "La pregunta", "La pregunta")
    t(textos, "sa.qt", m.get("pregunta", ""), m.get("pregunta_va", ""))
    t(textos, "sa.case", "El caso", "El cas")
    t(textos, "sa.caset", m.get("caso", ""), m.get("caso_va", ""))
    t(textos, "sa.prac", "Practicar", "Practicar")
    t(textos, "sa.pract", "Herramienta interactiva de la SA", "Ferramenta interactiva de la SA")
    t(textos, "sa.pracd", m.get("practicar", ""), m.get("practicar_va", ""))
    t(textos, "st.soon", "en elaboración", "en elaboració")
    t(textos, "st.read", "leer", "llegir")
    t(textos, "st.open", "abrir", "obrir")
    filas = []
    for f, (fes, fva) in FASES.items():
        ses = [(sm, sc) for sm, sc in sa["sesiones"] if int(sm.get("fase", 0)) == f]
        if not ses:
            continue
        lis = []
        for sm, sc in ses:
            k = int(sm.get("sesion", 0))
            t(textos, f"s{k}.t", sm.get("titulo", ""), sm.get("titulo_va", ""))
            ok = publicada(sm, sc)
            lis.append(f'    <li><a class="row" href="{nombre_sesion(sm)}"><span class="num">S{k}</span>'
                       f'<span><span class="t" data-i18n="s{k}.t">{esc(sm.get("titulo", ""))}</span></span>'
                       f'<span class="state" data-i18n="{"st.read" if ok else "st.soon"}">{"leer" if ok else "en elaboración"}</span></a></li>')
        t(textos, f"f{f}", f"{f} · {fes}", f"{f} · {fva}")
        filas.append(f'  <section class="obs-fase">\n    <h2 data-i18n="f{f}">{f} · {esc(fes)}</h2>\n    <ol class="sa">\n' + "\n".join(lis) + "\n    </ol>\n  </section>")
    intro = md_a_html(sa["cuerpo"]) if tiene_texto(sa["cuerpo"]) else ""
    cuerpo = f"""  <header class="top">
    <span class="eyebrow" data-i18n="sa.eyebrow">Observatorio · SA {n}</span>
    <h1 data-i18n="sa.title">{esc(m.get("titulo", ""))}</h1>
    <p class="lede"><strong data-i18n="sa.q">La pregunta</strong>: <span data-i18n="sa.qt">{esc(m.get("pregunta", ""))}</span></p>
    {f'<p class="obs-caso"><strong data-i18n="sa.case">El caso</strong>: <span data-i18n="sa.caset">{esc(m.get("caso", ""))}</span></p>' if m.get("caso") else ""}
  </header>
  {f'<div class="obs-texto">{intro}</div>' if intro else ""}
{chr(10).join(filas)}
  <section class="obs-fase">
    <h2 data-i18n="sa.prac">Practicar</h2>
    <ol class="sa"><li><a class="row" href="herramientas/"><span class="num">▸</span><span><span class="t" data-i18n="sa.pract">Herramienta interactiva de la SA</span><br><span class="d" data-i18n="sa.pracd">{esc(m.get("practicar", ""))}</span></span><span class="state" data-i18n="st.open">abrir</span></a></li></ol>
  </section>"""
    (web / clave).mkdir(exist_ok=True)
    (web / clave / "index.html").write_text(pagina("../", f"Observatorio · SA {n}", cuerpo, textos), encoding="utf-8")
    aviso(True, f"{clave}/index.html  (página de la SA {n}, {len(sa['sesiones'])} sesiones)")

    # Una página por sesión
    lista = sa["sesiones"]
    for i, (sm, sc) in enumerate(lista):
        k, f = int(sm.get("sesion", 0)), int(sm.get("fase", 0))
        tx = {}
        t(tx, "pg.title", f"SA {n} · Sesión {k} · {sm.get('titulo', '')}", f"SA {n} · Sessió {k} · {sm.get('titulo_va') or sm.get('titulo', '')}")
        t(tx, "s.eyebrow", f"SA {n} · {FASES.get(f, ('', ''))[0]} · Sesión {k}", f"SA {n} · {FASES.get(f, ('', ''))[1]} · Sessió {k}")
        t(tx, "s.title", sm.get("titulo", ""), sm.get("titulo_va", ""))
        t(tx, "s.back", f"← SA {n} · {m.get('titulo', '')}", f"← SA {n} · {m.get('titulo_va') or m.get('titulo', '')}")
        t(tx, "s.soon", "Este apunte está en elaboración.", "Aquest apunt està en elaboració.")
        t(tx, "s.tool", "Herramienta de esta sesión", "Ferramenta d'aquesta sessió")
        t(tx, "s.toolo", "Abrir la herramienta", "Obrir la ferramenta")
        t(tx, "s.prev", "← Sesión anterior", "← Sessió anterior")
        t(tx, "s.next", "Sesión siguiente →", "Sessió següent →")
        if publicada(sm, sc):
            contenido = f'<article class="obs-texto">\n{md_a_html(sc)}\n</article>'
        else:
            contenido = '<div class="obs-aviso" data-i18n="s.soon">Este apunte está en elaboración.</div>'
        herr = sm.get("herramienta", "").strip()
        caja = (f'<a class="obs-herr" href="herramientas/#{esc(herr)}"><span data-i18n="s.tool">Herramienta de esta sesión</span>'
                f'<b data-i18n="s.toolo">Abrir la herramienta</b></a>') if herr else ""
        prev = f'<a href="{nombre_sesion(lista[i - 1][0])}" data-i18n="s.prev">← Sesión anterior</a>' if i > 0 else "<span></span>"
        nxt = f'<a href="{nombre_sesion(lista[i + 1][0])}" data-i18n="s.next">Sesión siguiente →</a>' if i + 1 < len(lista) else "<span></span>"
        cuerpo = f"""  <a class="back obs-volver" href="./" data-i18n="s.back">← SA {n}</a>
  <header class="top">
    <span class="eyebrow" data-i18n="s.eyebrow">SA {n} · Sesión {k}</span>
    <h1 data-i18n="s.title">{esc(sm.get("titulo", ""))}</h1>
  </header>
  {caja}
  {contenido}
  <nav class="obs-pasos">{prev}{nxt}</nav>"""
        (web / clave / nombre_sesion(sm)).write_text(pagina("../", f"SA {n} · Sesión {k}", cuerpo, tx), encoding="utf-8")
    aviso(True, f"{clave}/s01.html … {nombre_sesion(lista[-1][0]) if lista else ''}  (sesiones)")

# ---------------------------------------------------------------- 5 · Libro del alumnado
tx = {}
t(tx, "pg.title", "Libro del alumnado · Observatorio", "Llibre de l'alumnat · Observatori")
t(tx, "lb.eyebrow", "Economía · 1.º de Bachillerato", "Economia · 1r de Batxillerat")
t(tx, "lb.title", "Libro del alumnado", "Llibre de l'alumnat")
t(tx, "lb.lede", "Los apuntes de todas las situaciones de aprendizaje, seguidos. Para leer aquí o imprimir y guardar en PDF.",
  "Els apunts de totes les situacions d'aprenentatge, seguits. Per a llegir ací o imprimir i guardar en PDF.")
t(tx, "lb.print", "Imprimir o guardar en PDF", "Imprimir o guardar en PDF")
t(tx, "lb.soon", "En elaboración.", "En elaboració.")
t(tx, "lb.none", "Todavía no hay apuntes publicados.", "Encara no hi ha apunts publicats.")
partes, indice = [], []
for clave, sa in SAS.items():
    m, n = sa["meta"], int(sa["meta"].get("sa", 0))
    t(tx, f"{clave}.t", f"SA {n} · {m.get('titulo', '')}", f"SA {n} · {m.get('titulo_va') or m.get('titulo', '')}")
    indice.append(f'<li><a href="#{clave}" data-i18n="{clave}.t">SA {n} · {esc(m.get("titulo", ""))}</a></li>')
    bloques = []
    for sm, sc in sa["sesiones"]:
        k = int(sm.get("sesion", 0))
        t(tx, f"{clave}.s{k}", f"Sesión {k} · {sm.get('titulo', '')}", f"Sessió {k} · {sm.get('titulo_va') or sm.get('titulo', '')}")
        txt = md_a_html(sc) if publicada(sm, sc) else '<p class="small" data-i18n="lb.soon">En elaboración.</p>'
        bloques.append(f'<section class="lb-sesion"><h3 data-i18n="{clave}.s{k}">Sesión {k} · {esc(sm.get("titulo", ""))}</h3>\n<div class="obs-texto">{txt}</div></section>')
    partes.append(f'<section class="lb-sa" id="{clave}"><h2 data-i18n="{clave}.t">SA {n} · {esc(m.get("titulo", ""))}</h2>\n' + "\n".join(bloques) + "</section>")
cuerpo = f"""  <header class="top">
    <span class="eyebrow" data-i18n="lb.eyebrow">Economía · 1.º de Bachillerato</span>
    <h1 data-i18n="lb.title">Libro del alumnado</h1>
    <p class="lede" data-i18n="lb.lede"></p>
    <p><button type="button" class="btn ghost obs-imprimir" onclick="print()" data-i18n="lb.print">Imprimir o guardar en PDF</button></p>
  </header>
  {('<nav class="lb-indice"><ol>' + "".join(indice) + "</ol></nav>") if indice else '<p class="small" data-i18n="lb.none"></p>'}
  {chr(10).join(partes)}"""
(web / "libro").mkdir(exist_ok=True)
(web / "libro" / "index.html").write_text(pagina("../", "Libro del alumnado", cuerpo, tx), encoding="utf-8")
aviso(True, f"libro/index.html  ({len(SAS)} SA con apuntes)")

# ---------------------------------------------------------------- 6 · Estado de la publicación
# Lo lee assets/menu.js: por ejemplo, el libro del alumnado solo se enseña en el menú y en la portada
# cuando hay al menos un apunte publicado (interruptor MOSTRAR_LIBRO en menu.js).
publicados = sum(publicada(sm, sc) for sa in SAS.values() for sm, sc in sa["sesiones"])
(web / "assets" / "estado-web.js").write_text(
    "/* Generado por actualizar.sh a partir del vault: no editar a mano. */\n"
    f"window.OBS_ESTADO = {{ apuntesPublicados: {publicados} }};\n", encoding="utf-8")
aviso(True, f"assets/estado-web.js  ({publicados} apuntes publicados)")

sys.exit(1 if errores else 0)
