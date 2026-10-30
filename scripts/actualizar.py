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

# Línea gráfica de la web (assets/estilo.css, con Jost, Commissioner y Literata): va la última en todas las páginas,
# también al final de cada herramienta. Con False, la web vuelve al estilo de las piezas comunes (el de Claude).
ESTILO_WEB = True
FUENTES_WEB_URL = "https://fonts.googleapis.com/css2?family=Commissioner:wght@400;500;600&family=Jost:wght@500;600&family=Literata:opsz,wght@7..72,400;7..72,600&display=swap"

FUENTES = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
           '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
           '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo+Narrow:wght@500;600;700'
           '&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">'
           + ('\n<link rel="stylesheet" href="' + FUENTES_WEB_URL + '">' if ESTILO_WEB else ""))


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
    estilo = f'<link rel="stylesheet" href="{prefijo}assets/estilo.css">\n' if ESTILO_WEB else ""
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
{estilo}<script src="{prefijo}assets/comun/observatorio-common.js"></script>
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


# ---------------------------------------------------------------- Actualidad (noticias comentadas y titulares)
# Las comentadas las escribe Jordi en el vault (05-SA/_actualidad/AAAA-MM-DD-….md, con «estado: publicado»).
# Los titulares salen de los canales RSS de scripts/fuentes-actualidad.json: solo título, medio, fecha y enlace.
# Con «--solo-titulares» se renuevan los titulares sin el vault (para una tarea diaria en GitHub), reutilizando
# las comentadas que se guardaron la última vez en actualidad/datos.json.
import urllib.request
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
import xml.etree.ElementTree as ET

SOLO_TITULARES = "--solo-titulares" in sys.argv
NOMBRES_SA = {1: "SA 1", 2: "SA 2", 3: "SA 3", 4: "SA 4", 5: "SA 5", 6: "SA 6", 7: "SA 7", 8: "SA 8", 9: "SA 9", 10: "SA 10"}


def limpio(t):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", " ", t or ""))).strip()


def fecha_de(texto):
    if not texto:
        return None
    try:
        d = parsedate_to_datetime(texto)
    except (TypeError, ValueError):
        try:
            d = datetime.fromisoformat(texto.strip().replace("Z", "+00:00"))
        except ValueError:
            return None
    return d if d.tzinfo else d.replace(tzinfo=timezone.utc)


def leer_canal(url):
    """Devuelve [(título, enlace, fecha, imagen)] de un canal RSS 2.0 o Atom. La imagen es la que el propio medio
    pone en el canal (media:content, enclosure o media:thumbnail); no se descarga ni se guarda: se enlaza."""
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Observatorio; lector de titulares)",
                                               "Accept": "application/rss+xml, application/atom+xml, application/xml, text/xml"})
    with urllib.request.urlopen(req, timeout=10) as r:
        raiz = ET.fromstring(r.read())
    sin_ns = lambda e: e.tag.split("}")[-1]
    items = []
    for e in raiz.iter():
        if sin_ns(e) not in ("item", "entry"):
            continue
        # el primero de cada nombre: así el título de la noticia no lo pisa el de la foto (media:title)
        hijos = {}
        for h in e:
            if h.tag in ("title", "{http://www.w3.org/2005/Atom}title") or sin_ns(h) != "title":
                hijos.setdefault(sin_ns(h), h)
        titulo = limpio(hijos["title"].text if "title" in hijos else "")
        enlace = ""
        if "link" in hijos:
            l = hijos["link"]
            enlace = (l.get("href") or l.text or "").strip()
        fecha = None
        for k in ("pubDate", "published", "updated", "date"):
            if k in hijos and hijos[k].text:
                fecha = fecha_de(hijos[k].text); break
        imagen = ""
        for h in e:
            if sin_ns(h) in ("content", "enclosure", "thumbnail") and h.get("url", "").startswith("https://"):
                tipo = (h.get("type") or h.get("medium") or "image").lower()
                if "image" in tipo or sin_ns(h) == "thumbnail":
                    imagen = h.get("url"); break
        if titulo and enlace.startswith(("http://", "https://")):
            items.append((titulo[:220], enlace, fecha, imagen))
    return items


def actualidad(vault_dir):
    """Genera actualidad/index.html y actualidad/datos.json; devuelve el resumen para la portada."""
    destino = web / "actualidad"
    destino.mkdir(exist_ok=True)
    previo = {}
    if (destino / "datos.json").is_file():
        try:
            previo = json.loads((destino / "datos.json").read_text(encoding="utf-8"))
        except ValueError:
            previo = {}
    # Noticias comentadas
    if vault_dir is not None:
        comentadas = []
        carpeta = vault_dir / "_actualidad"
        for p in sorted(carpeta.glob("[0-9]*.md")) if carpeta.is_dir() else []:
            m, cuerpo = leer_md(p)
            if m.get("estado", "").lower() != "publicado" or not m.get("titulo"):
                continue
            try:
                sa = int(m.get("sa", "0") or 0)
            except ValueError:
                sa = 0
            comentadas.append({"fecha": m.get("fecha", p.name[:10]), "titulo": m.get("titulo", ""), "fuente": m.get("fuente", ""),
                               "enlace": m.get("enlace", ""), "sa": sa, "concepto": m.get("concepto", ""),
                               "pregunta": m.get("pregunta", ""), "html": md_a_html(cuerpo) if tiene_texto(cuerpo) else ""})
        comentadas.sort(key=lambda c: c["fecha"], reverse=True)
    else:
        comentadas = previo.get("comentadas", [])
    # Titulares
    conf = json.loads((web / "scripts" / "fuentes-actualidad.json").read_text(encoding="utf-8"))
    limite = datetime.now(timezone.utc) - timedelta(days=int(conf.get("dias", 10)))
    previos = {f["nombre"]: f for f in previo.get("titulares", [])}
    titulares = []
    for f in conf.get("fuentes", []):
        try:
            items = [i for i in leer_canal(f["url"]) if not i[2] or i[2] >= limite]
            items.sort(key=lambda i: i[2] or limite, reverse=True)
            lista = [{"titulo": t_, "enlace": e_, "fecha": d_.astimezone(timezone.utc).isoformat() if d_ else "", "imagen": i_}
                     for t_, e_, d_, i_ in items[:max(int(conf.get("por_fuente", 5)), int(conf.get("carrusel", 8)) if f.get("salmon") else 0)]]
            titulares.append({"nombre": f["nombre"], "salmon": bool(f.get("salmon")), "items": lista, "leido": datetime.now(timezone.utc).isoformat()})
        except Exception as ex:  # sin red o canal caído: se conserva lo de la última vez y se avisa, sin parar la web
            viejo = previos.get(f["nombre"])
            titulares.append(viejo or {"nombre": f["nombre"], "salmon": bool(f.get("salmon")), "items": [], "leido": ""})
            print(f"⚠ actualidad: no se ha podido leer «{f['nombre']}» ({type(ex).__name__}); se mantienen los titulares anteriores")
    # Carrusel: noticias con imagen de la prensa salmón, alternando medios y de la más reciente a la más antigua
    colas = [[dict(i, fuente=f["nombre"]) for i in f["items"] if i.get("imagen")] for f in titulares if f.get("salmon")]
    carrusel = []
    while any(colas) and len(carrusel) < int(conf.get("carrusel", 8)):
        for c in colas:
            if c and len(carrusel) < int(conf.get("carrusel", 8)):
                carrusel.append(c.pop(0))
    carrusel.sort(key=lambda i: i["fecha"], reverse=True)
    # en la lista de titulares, cada medio con sus cinco más recientes
    for f in titulares:
        f["items"] = f["items"][:int(conf.get("por_fuente", 5))]
    ahora = datetime.now(timezone.utc).isoformat()
    datos = {"generado": ahora, "comentadas": comentadas, "carrusel": carrusel, "titulares": titulares}
    (destino / "datos.json").write_text(json.dumps(datos, ensure_ascii=False, indent=1), encoding="utf-8")

    # Página
    tx = {}
    t(tx, "pg.title", "Actualidad · Observatorio", "Actualitat · Observatori")
    t(tx, "ac.eyebrow", "Economía · 1.º de Bachillerato", "Economia · 1r de Batxillerat")
    t(tx, "ac.title", "Actualidad", "Actualitat")
    t(tx, "ac.lede", "Noticias de economía para leer con los modelos del curso. Primero, las comentadas en clase; después, los titulares de varios medios, de líneas editoriales distintas: compara cómo cuenta cada uno la misma noticia.",
      "Notícies d'economia per a llegir amb els models del curs. Primer, les comentades a classe; després, els titulars de diversos mitjans, de línies editorials diferents: compara com conta cadascun la mateixa notícia.")
    t(tx, "ac.com", "Comentadas en clase", "Comentades a classe")
    t(tx, "ac.nocom", "Todavía no hay noticias comentadas.", "Encara no hi ha notícies comentades.")
    t(tx, "ac.tit", "Titulares de economía", "Titulars d'economia")
    t(tx, "ac.titd", "Se actualizan solos a partir de los canales públicos de cada medio. Solo se muestran el titular y el enlace: la noticia completa está en la web del medio.",
      "S'actualitzen sols a partir dels canals públics de cada mitjà. Només es mostren el titular i l'enllaç: la notícia completa està en la web del mitjà.")
    t(tx, "ac.pq", "Para pensar", "Per a pensar")
    t(tx, "ac.leer", "Leer la noticia", "Llegir la notícia")
    t(tx, "ac.vacio", "Sin titulares recientes.", "Sense titulars recents.")
    t(tx, "ac.act", "Actualizado: {f}", "Actualitzat: {f}")

    def bloque_comentada(c, destacada):
        sa = f'<span class="act-sa">{esc(NOMBRES_SA.get(c["sa"], ""))}{" · " + esc(c["concepto"]) if c["concepto"] else ""}</span>' if c["sa"] or c["concepto"] else ""
        meta = f'<div class="act-meta"><time datetime="{esc(c["fecha"])}">{esc(c["fecha"])}</time><span>{esc(c["fuente"])}</span>{sa}</div>'
        enlace = esc(c["enlace"]) if c["enlace"].startswith(("http://", "https://")) else ""
        titulo = f'<a href="{enlace}" target="_blank" rel="noopener nofollow">{esc(c["titulo"])}</a>' if enlace else esc(c["titulo"])
        preg = f'<p class="act-pregunta"><strong data-i18n="ac.pq">Para pensar</strong>: {esc(c["pregunta"])}</p>' if c["pregunta"] else ""
        return f'<article class="act-destacada">{meta}<h3>{titulo}</h3>{c["html"]}{preg}</article>'

    coms = "\n".join(bloque_comentada(c, i == 0) for i, c in enumerate(comentadas)) or '<p class="small" data-i18n="ac.nocom">Todavía no hay noticias comentadas.</p>'
    fuentes = []
    for f in titulares:
        lis = "".join(f'<li><a href="{esc(i["enlace"])}" target="_blank" rel="noopener nofollow">{esc(i["titulo"])}</a>'
                      f'{"<time datetime=" + chr(34) + esc(i["fecha"]) + chr(34) + "></time>" if i["fecha"] else ""}</li>' for i in f["items"])
        fuentes.append(f'<section class="act-fuente{" act-salmon" if f.get("salmon") else ""}"><h3>{esc(f["nombre"])}</h3>'
                       + (f'<ul class="act-lista">{lis}</ul>' if lis else '<p class="small" data-i18n="ac.vacio">Sin titulares recientes.</p>') + "</section>")
    carrusel_js = json.dumps(carrusel, ensure_ascii=False).replace("</", "<\\/")
    cuerpo = f"""  <header class="top">
    <span class="eyebrow" data-i18n="ac.eyebrow">Economía · 1.º de Bachillerato</span>
    <h1 data-i18n="ac.title">Actualidad</h1>
    <p class="lede" data-i18n="ac.lede"></p>
  </header>
  <div class="act-carrusel" id="act-carrusel" hidden></div>
  <script>window.addEventListener("DOMContentLoaded", function () {{
    var datos = {carrusel_js}, caja = document.getElementById("act-carrusel");
    if (!window.OBS_CARRUSEL) return;
    OBS_CARRUSEL(caja, datos);
    if (window.OBS) OBS.onLang(function () {{ OBS_CARRUSEL(caja, datos); }});
  }});</script>
  <section class="obs-fase">
    <h2 data-i18n="ac.com">Comentadas en clase</h2>
{coms}
  </section>
  <section class="obs-fase">
    <h2 data-i18n="ac.tit">Titulares de economía</h2>
    <p class="small"><span data-i18n="ac.titd"></span> <span class="act-cuando" data-generado="{esc(ahora)}"></span></p>
    <div class="act-fuentes">
{chr(10).join(fuentes)}
    </div>
  </section>
  <script>
  // Fechas en el formato y el idioma del lector
  (function () {{
    function pintar() {{
      var va = window.OBS && OBS.lang() === "va", loc = va ? "ca-ES" : "es-ES";
      document.querySelectorAll(".act-lista time").forEach(function (t) {{
        var d = new Date(t.getAttribute("datetime")); if (!isNaN(d)) t.textContent = d.toLocaleDateString(loc, {{ day: "numeric", month: "short" }});
      }});
      var c = document.querySelector(".act-cuando"), d = new Date(c.dataset.generado);
      if (!isNaN(d)) c.textContent = OBS.t("ac.act", {{ f: d.toLocaleString(loc, {{ day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" }}) }});
    }}
    document.addEventListener("DOMContentLoaded", function () {{ pintar(); if (window.OBS) OBS.onLang(pintar); }});
  }})();
  </script>"""
    (destino / "index.html").write_text(pagina("../", "Actualidad", cuerpo, tx), encoding="utf-8")
    n_tit = sum(len(f["items"]) for f in titulares)
    aviso(True, f"actualidad/index.html  ({len(comentadas)} comentadas, {len(carrusel)} en el carrusel, {n_tit} titulares de {len(titulares)} medios)")
    # Resumen para la portada: la comentada más reciente y los tres titulares más recientes
    todos = sorted(([i["fecha"], i["titulo"], i["enlace"], f["nombre"]] for f in titulares for i in f["items"] if i["fecha"]), reverse=True)[:3]
    return {"comentada": ({k: comentadas[0][k] for k in ("fecha", "titulo", "fuente", "enlace", "sa", "concepto", "pregunta")} if comentadas else None),
            "titulares": [{"fecha": a, "titulo": b, "enlace": c, "fuente": d} for a, b, c, d in todos],
            "carrusel": carrusel}


def escribir_estado(publicados, resumen_actualidad):
    """assets/estado-web.js: lo lee assets/menu.js (libro visible o no; portada con la actualidad)."""
    estado = {"apuntesPublicados": publicados, "actualidad": resumen_actualidad}
    (web / "assets" / "estado-web.js").write_text(
        "/* Generado por actualizar.sh: no editar a mano. */\n"
        "window.OBS_ESTADO = " + json.dumps(estado, ensure_ascii=False).replace("</", "<\\/") + ";\n", encoding="utf-8")
    aviso(True, f"assets/estado-web.js  ({publicados} apuntes publicados)")


if SOLO_TITULARES:
    anterior = (web / "assets" / "estado-web.js").read_text(encoding="utf-8") if (web / "assets" / "estado-web.js").is_file() else ""
    m_pub = re.search(r'"?apuntesPublicados"?\s*:\s*(\d+)', anterior)
    escribir_estado(int(m_pub.group(1)) if m_pub else 0, actualidad(None))
    sys.exit(0)

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
    pie_estilo = ("\n<!-- Añadido por actualizar.sh: línea gráfica de la web, la última para que mande -->\n"
                  f'<link rel="stylesheet" href="{FUENTES_WEB_URL}">\n<link rel="stylesheet" href="{prefijo}assets/estilo.css">\n') if ESTILO_WEB else ""
    destino.write_text(cabecera + s + pie_estilo, encoding="utf-8")
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

# ---------------------------------------------------------------- 6 · Actualidad y estado de la publicación
# El libro del alumnado solo se enseña en el menú y en la portada cuando hay al menos un apunte publicado
# (interruptor MOSTRAR_LIBRO en menu.js); la portada enseña la actualidad.
publicados = sum(publicada(sm, sc) for sa in SAS.values() for sm, sc in sa["sesiones"])
escribir_estado(publicados, actualidad(vault))

sys.exit(1 if errores else 0)
