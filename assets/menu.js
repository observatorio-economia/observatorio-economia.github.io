/* Menú común del Observatorio.
   - Lista de las 10 situaciones de aprendizaje, en castellano y valenciano: es la única que hay que tocar
     al añadir una herramienta (poner su "ruta" y su "estado").
   - Aplica el tema guardado (automático, claro u oscuro) antes de pintar la página.
   - Inserta la barra superior en todas las páginas y, en la portada, la lista de SA (#panel-sa).
   - Si la página trae las piezas comunes del Observatorio (window.OBS), sigue su idioma.
   Se carga en <head> con <script src=".../assets/menu.js"></script>, sin defer. */
(function () {
  const SA = [
    { n: 1, ruta: "sa01/", estado: "proto",
      t: { es: "¿Qué es la economía?", va: "Què és l'economia?" },
      d: { es: "El juego del arroz y el flujo de la renta.", va: "El joc de l'arròs i el flux de la renda." } },
    { n: 2, ruta: "sa02/", estado: "open",
      t: { es: "El comportamiento humano en la actividad económica", va: "El comportament humà en l'activitat econòmica" },
      d: { es: "Encuestas a las familias, resultados de la clase y matriz de la estantería.", va: "Enquestes a les famílies, resultats de la classe i matriu del prestatge." } },
    { n: 3, ruta: "sa03/", estado: "proto",
      t: { es: "La producción", va: "La producció" },
      d: { es: "Calculadora de costes con el caso de General Motors (2009) y frontera de posibilidades de producción.", va: "Calculadora de costos amb el cas de General Motors (2009) i frontera de possibilitats de producció." } },
    { n: 4, ruta: "sa04/", estado: "proto",
      t: { es: "El mercado", va: "El mercat" },
      d: { es: "Competencia perfecta, monopolio, el dilema de las dos gasolineras y la guerra de precios de la competencia real.", va: "Competència perfecta, monopoli, el dilema de les dues gasolineres i la guerra de preus de la competència real." } },
    { n: 5, ruta: "sa05/", estado: "proto",
      t: { es: "Crecimiento económico y desarrollo", va: "Creixement econòmic i desenvolupament" },
      d: { es: "Emisiones, clima y producción: pizarra de sistemas y simulador.", va: "Emissions, clima i producció: pissarra de sistemes i simulador." } },
    { n: 6, ruta: "sa06/", estado: "proto",
      t: { es: "El mercado laboral", va: "El mercat laboral" },
      d: { es: "El salario como precio frente al ciclo de Goodwin: el mismo cambio, dos respuestas.", va: "El salari com a preu enfront del cicle de Goodwin: el mateix canvi, dues respostes." } },
    { n: 7, t: { es: "El Estado y sus cuentas", va: "L'Estat i els seus comptes" } },
    { n: 8, ruta: "sa08/", estado: "proto",
      t: { es: "El dinero", va: "Els diners" },
      d: { es: "La inflación en tu bolsillo: calculadora del IPC desde 1961 y «Mi cesta de la compra».", va: "La inflació a la butxaca: calculadora de l'IPC des de 1961 i «La meua cistella de la compra»." } },
    { n: 9, ruta: "sa09/", estado: "proto",
      t: { es: "Comercio internacional", va: "Comerç internacional" },
      d: { es: "Ricardo frente a Shaikh: ventaja comparativa o ventaja absoluta, con déficit y deuda.", va: "Ricardo enfront de Shaikh: avantatge comparatiu o avantatge absolut, amb dèficit i deute." } },
    { n: 10, t: { es: "Las finanzas", va: "Les finances" } },
  ];
  // Interruptor del libro del alumnado en el menú y la portada (la página libro/ se genera siempre):
  // "auto" = solo cuando hay algún apunte con «estado: publicado» (lo cuenta actualizar.sh en assets/estado-web.js);
  // true = siempre; false = nunca. Encargo del 30/10/2026: mientras no haya apuntes publicados, no se enseña.
  const MOSTRAR_LIBRO = "auto";
  const hayApuntes = !!(window.OBS_ESTADO && window.OBS_ESTADO.apuntesPublicados > 0);
  const libroVisible = MOSTRAR_LIBRO === true || (MOSTRAR_LIBRO === "auto" && hayApuntes);

  // Páginas comunes a todo el curso (fuera de la lista de SA)
  const TODAS_EXTRA = [
    { ruta: "actualidad/", num: "◆", t: { es: "Actualidad", va: "Actualitat" }, corto: { es: "Actualidad", va: "Actualitat" },
      d: { es: "Noticias de economía comentadas en clase y titulares de varios medios.", va: "Notícies d'economia comentades a classe i titulars de diversos mitjans." } },
    { ruta: "libro/", num: "¶", t: { es: "Libro del alumnado", va: "Llibre de l'alumnat" }, corto: { es: "Libro", va: "Llibre" },
      d: { es: "Los apuntes de todas las situaciones de aprendizaje, seguidos, para leer o imprimir.", va: "Els apunts de totes les situacions d'aprenentatge, seguits, per a llegir o imprimir." } },
    { ruta: "datos/", num: "∑", t: { es: "Base de datos", va: "Base de dades" }, corto: { es: "Datos", va: "Dades" },
      d: { es: "Series oficiales ya limpias para trabajar en Excel, con su fuente, lo que miden y sus unidades.", va: "Sèries oficials ja netes per a treballar en Excel, amb la seua font, el que mesuren i les seues unitats." } },
  ];
  const EXTRA = TODAS_EXTRA.filter(x => x.ruta !== "libro/" || libroVisible);

  // Autoría y licencia: aparecen al pie de todas las páginas, con la forma de citarlas
  const AUTOR = { nombre: "Jordi Vila Garrido", cita: "Vila Garrido, J." }, ANYO = 2026;
  const LICENCIA = { nombre: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/deed.es" };

  const TXT = {
    es: { home: "Observatorio", sub: "Economía · 1.º Bach.", nav: "Situaciones de aprendizaje", soon: "próximamente",
      open: "abrir", proto: "prototipo", tema: "Tema", auto: "automático", light: "claro", dark: "oscuro", cambiar: "Cambiar el tema; ahora {v}",
      act: "Actualidad", pq: "Para pensar", actmas: "Más noticias y titulares",
      carr: "carrusel", carrl: "Noticias de la prensa económica", diapo: "noticia", leeren: "Leer en {m}", img: "Imagen: {m}",
      ant: "Noticia anterior", sig: "Noticia siguiente", pausa: "Pausar", seguir: "Reanudar", ir: "Ir a la noticia {n}", comclase: "Comentada en clase",
      lic: "Licencia", licd: "Puedes copiar, adaptar y compartir este material citando la fuente y con la misma licencia.",
      cita: "Cómo citar esta página", sitio: "Observatorio · Economía 1.º de Bachillerato", consulta: "consultado el" },
    va: { home: "Observatori", sub: "Economia · 1r Batx.", nav: "Situacions d'aprenentatge", soon: "pròximament",
      open: "obrir", proto: "prototip", tema: "Tema", auto: "automàtic", light: "clar", dark: "fosc", cambiar: "Canviar el tema; ara {v}",
      act: "Actualitat", pq: "Per a pensar", actmas: "Més notícies i titulars",
      carr: "carrusel", carrl: "Notícies de la premsa econòmica", diapo: "notícia", leeren: "Llegir en {m}", img: "Imatge: {m}",
      ant: "Notícia anterior", sig: "Notícia següent", pausa: "Pausar", seguir: "Reprendre", ir: "Anar a la notícia {n}", comclase: "Comentada a classe",
      lic: "Llicència", licd: "Pots copiar, adaptar i compartir aquest material citant la font i amb la mateixa llicència.",
      cita: "Com citar aquesta pàgina", sitio: "Observatori · Economia 1r de Batxillerat", consulta: "consultat el" },
  };
  const idioma = () => (window.OBS && OBS.lang && OBS.lang() === "va") ? "va" : "es";
  const tx = k => TXT[idioma()][k];
  const L = o => o ? (o[idioma()] || o.es) : "";

  // Raíz de la web: la carpeta que contiene assets/ (funciona en GitHub Pages y abriendo los archivos en local)
  const raiz = new URL("..", document.currentScript.src);
  const enlace = ruta => new URL(ruta + "index.html", raiz).href;

  // ---------- Tema ----------
  const CLAVE = "observatorio-tema";
  const TEMAS = ["auto", "light", "dark"];
  const leer = () => { try { return localStorage.getItem(CLAVE); } catch { return null; } };
  const guardar = v => { try { v === "auto" ? localStorage.removeItem(CLAVE) : localStorage.setItem(CLAVE, v); } catch {} };
  let tema = TEMAS.includes(leer()) ? leer() : "auto";
  function aplicarTema() {
    if (tema === "auto") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = tema;
  }
  aplicarTema();

  // ---------- Barra superior y portada ----------
  function el(tag, attrs, ...hijos) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "text") n.textContent = v; else if (v != null) n.setAttribute(k, v);
    }
    n.append(...hijos);
    return n;
  }
  const normaliza = u => u.split("#")[0].split("?")[0].replace(/index\.html$/, "");
  const aqui = () => normaliza(location.href);

  let barra = null;
  function menu() {
    const lista = el("ol", { class: "obs-menu__sa", "aria-label": tx("nav") }, ...SA.map(s => el("li", {},
      s.ruta
        ? el("a", { href: enlace(s.ruta), title: "SA " + s.n + " · " + L(s.t), "aria-label": "SA " + s.n + ": " + L(s.t), text: s.n,
            "aria-current": aqui().startsWith(normaliza(enlace(s.ruta))) ? "page" : null })
        : el("span", { title: "SA " + s.n + " · " + L(s.t) + " (" + tx("soon") + ")", "aria-label": "SA " + s.n + ": " + L(s.t) + ", " + tx("soon"), "aria-disabled": "true", text: s.n })
    )));
    const boton = el("button", { type: "button", class: "obs-menu__tema", text: tx("tema") + ": " + tx(tema), "aria-label": tx("cambiar").replace("{v}", tx(tema)) });
    boton.addEventListener("click", () => {
      tema = TEMAS[(TEMAS.indexOf(tema) + 1) % TEMAS.length];
      guardar(tema); aplicarTema(); pintarMenu();
      document.querySelector(".obs-menu__tema")?.focus();
    });
    const home = el("a", { class: "obs-menu__home", href: enlace(""), "aria-current": normaliza(enlace("")) === aqui() ? "page" : null },
      el("b", { text: tx("home") }), el("span", { text: tx("sub") }));
    const extra = EXTRA.map(x => el("a", { class: "obs-menu__datos", href: enlace(x.ruta), title: L(x.t), text: L(x.corto),
      "aria-current": aqui().startsWith(normaliza(enlace(x.ruta))) ? "page" : null }));
    return el("nav", { class: "obs-menu", "aria-label": tx("home") }, el("div", { class: "obs-menu__in" }, home, lista, ...extra, boton));
  }

  // Pie: autoría, licencia y cómo citar la página que se está viendo
  let pieEl = null;
  function pie() {
    const titulo = document.title, hoy = new Date().toLocaleDateString(idioma() === "va" ? "ca-ES" : "es-ES");
    const nuevo = el("footer", { class: "obs-pie" },
      el("span", {}, "© " + ANYO + " " + AUTOR.nombre + " · " + tx("lic") + " ",
        el("a", { href: LICENCIA.url, rel: "license", target: "_blank" }, LICENCIA.nombre), ". " + tx("licd")),
      el("span", {}, el("b", { text: tx("cita") + ": " }),
        AUTOR.cita + " (" + ANYO + "). " + titulo + (/[.?!]$/.test(titulo) ? " " : ". ") + tx("sitio") + ". " + normaliza(location.href) + " (" + tx("consulta") + " " + hoy + ")."));
    if (pieEl && pieEl.isConnected) pieEl.replaceWith(nuevo); else document.body.append(nuevo);
    pieEl = nuevo;
  }
  function pintarMenu() {
    const nueva = menu();
    if (barra && barra.isConnected) barra.replaceWith(nueva); else document.body.prepend(nueva);
    barra = nueva;
  }

  const fechaCorta = f => { const d = new Date(f); return isNaN(d) ? (f || "") : d.toLocaleDateString(idioma() === "va" ? "ca-ES" : "es-ES", { day: "numeric", month: "short" }); };
  const EXT = { target: "_blank", rel: "noopener nofollow" };

  // Carrusel de noticias (prensa salmón con imagen). Accesible: botones, contador, puntos, pausa y deslizar con el dedo.
  // Avanza solo cada 7 segundos, salvo con «reducir movimiento», al pasar el ratón o con el foco dentro.
  // Las imágenes son las que cada medio pone en su canal: se enlazan (no se copian) y llevan su crédito.
  function carrusel(caja, items) {
    if (!caja) return;
    if (caja._parar) caja._parar();
    if (!items || !items.length) { caja.hidden = true; return; }
    const reducir = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let i = 0, reloj = null, pausaUsuario = reducir, encima = false;
    const slides = items.map((n, k) => {
      const img = el("img", { src: n.imagen, alt: "", loading: k ? "lazy" : "eager", decoding: "async", referrerpolicy: "no-referrer" });
      const foto = el("a", Object.assign({ class: "carr-foto", href: n.enlace, tabindex: "-1", "aria-hidden": "true" }, EXT), img);
      img.addEventListener("error", () => foto.classList.add("sin-foto"));
      return el("article", { class: "carr-slide", role: "group", "aria-roledescription": tx("diapo"), "aria-label": (k + 1) + " / " + items.length, hidden: k ? "" : null },
        foto,
        el("div", { class: "carr-texto" },
          el("div", { class: "act-meta" }, el("span", { class: "act-sa", text: n.fuente }), el("time", { text: fechaCorta(n.fecha) })),
          el("h3", {}, el("a", Object.assign({ href: n.enlace, text: n.titulo }, EXT))),
          el("a", Object.assign({ class: "act-mas", href: n.enlace, text: tx("leeren").replace("{m}", n.fuente) + " ↗" }, EXT)),
          el("span", { class: "carr-credito", text: tx("img").replace("{m}", n.fuente) })));
    });
    const contador = el("span", { class: "carr-num", "aria-hidden": "true" });
    const puntos = items.map((_, k) => { const b = el("button", { type: "button", class: "carr-punto", "aria-label": tx("ir").replace("{n}", k + 1) }); b.addEventListener("click", () => { ir(k); }); return b; });
    const ant = el("button", { type: "button", class: "carr-btn", "aria-label": tx("ant"), text: "←" });
    const sig = el("button", { type: "button", class: "carr-btn", "aria-label": tx("sig"), text: "→" });
    const pausa = el("button", { type: "button", class: "carr-btn carr-pausa" });
    ant.addEventListener("click", () => ir(i - 1));
    sig.addEventListener("click", () => ir(i + 1));
    pausa.addEventListener("click", () => { pausaUsuario = !pausaUsuario; programar(); rotular(); });
    const rotular = () => { pausa.textContent = tx(pausaUsuario ? "seguir" : "pausa"); };
    function ir(k) {
      i = (k + items.length) % items.length;
      slides.forEach((s, n) => { s.hidden = n !== i; });
      puntos.forEach((b, n) => b.setAttribute("aria-current", n === i ? "true" : "false"));
      contador.textContent = String(i + 1).padStart(2, "0") + " / " + String(items.length).padStart(2, "0");
      programar();
    }
    function programar() {
      clearTimeout(reloj); reloj = null;
      if (!pausaUsuario && !encima && items.length > 1) reloj = setTimeout(() => ir(i + 1), 7000);
    }
    caja.onmouseenter = () => { encima = true; programar(); };
    caja.onmouseleave = () => { encima = false; programar(); };
    caja.onfocusin = () => { encima = true; programar(); };
    caja.onfocusout = () => { encima = false; programar(); };
    let x0 = null;
    caja.ontouchstart = e => { x0 = e.touches[0].clientX; };
    caja.ontouchend = e => { if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; if (Math.abs(dx) > 40) ir(i + (dx < 0 ? 1 : -1)); x0 = null; };
    caja.setAttribute("role", "region");
    caja.setAttribute("aria-roledescription", tx("carr"));
    caja.setAttribute("aria-label", tx("carrl"));
    caja.replaceChildren(el("div", { class: "carr-pista" }, ...slides),
      el("div", { class: "carr-mandos" }, contador, ant, el("div", { class: "carr-puntos" }, ...puntos), sig, pausa));
    caja.hidden = false;
    caja._parar = () => { clearTimeout(reloj); };
    rotular(); ir(0);
  }
  window.OBS_CARRUSEL = carrusel;

  // Portada: el carrusel de la prensa salmón y la noticia comentada más reciente (los deja actualizar.sh en estado-web.js)
  function portadaActualidad() {
    const caja = document.getElementById("panel-actualidad");
    const a = window.OBS_ESTADO && window.OBS_ESTADO.actualidad;
    if (!caja) return;
    const enCarrusel = (a && a.carrusel) || [];
    if (!a || (!a.comentada && !enCarrusel.length && !(a.titulares || []).length)) { caja.hidden = true; return; }
    const hijos = [el("h2", { text: tx("act") })];
    if (enCarrusel.length) {
      const c = el("div", { class: "act-carrusel" });
      hijos.push(c);
      setTimeout(() => carrusel(c, enCarrusel), 0);
    } else if ((a.titulares || []).length) {
      hijos.push(el("ul", { class: "act-lista" }, ...a.titulares.map(i => el("li", {},
        el("a", Object.assign({ href: i.enlace }, EXT), i.titulo), el("time", { text: fechaCorta(i.fecha) + " · " + i.fuente })))));
    }
    const c = a.comentada;
    if (c) {
      const meta = el("div", { class: "act-meta" }, el("span", { text: tx("comclase") }), el("time", { text: c.fecha }), el("span", { text: c.fuente || "" }),
        (c.sa || c.concepto) ? el("span", { class: "act-sa", text: (c.sa ? "SA " + c.sa : "") + (c.sa && c.concepto ? " · " : "") + (c.concepto || "") }) : "");
      const tit = /^https?:\/\//.test(c.enlace || "") ? el("a", Object.assign({ href: c.enlace }, EXT), c.titulo) : document.createTextNode(c.titulo);
      const art = el("article", { class: "act-destacada" }, meta, el("h3", {}, tit));
      if (c.pregunta) art.append(el("p", { class: "act-pregunta" }, el("strong", { text: tx("pq") + ": " }), c.pregunta));
      hijos.push(art);
    }
    hijos.push(el("a", { class: "act-mas", href: enlace("actualidad/"), text: tx("actmas") }));
    const anterior = caja.querySelector(".act-carrusel");
    if (anterior && anterior._parar) anterior._parar();
    caja.replaceChildren(...hijos);
    caja.hidden = false;
  }

  function panel() {
    portadaActualidad();
    const extra = document.getElementById("panel-datos");
    if (extra) extra.replaceChildren(...EXTRA.map(x => el("li", {}, el("a", { class: "row", href: enlace(x.ruta) },
      el("span", { class: "num", "aria-hidden": "true", text: x.num }),
      el("span", {}, el("span", { class: "t", text: L(x.t) }), el("br"), el("span", { class: "d", text: L(x.d) })),
      el("span", { class: "state", text: tx("open") })))));
    const ol = document.getElementById("panel-sa");
    if (!ol) return;
    ol.replaceChildren(...SA.map(s => {
      const texto = el("span", {}, el("span", { class: "t", text: L(s.t) }));
      if (s.d) texto.append(el("br"), el("span", { class: "d", text: L(s.d) }));
      const fila = s.ruta ? el("a", { class: "row", href: enlace(s.ruta) }) : el("div", { class: "row" });
      fila.append(el("span", { class: "num", text: s.n }), texto,
        el("span", { class: "state", text: s.ruta ? tx(s.estado || "open") : tx("soon") }));
      return el("li", {}, fila);
    }));
  }

  function arrancar() {
    pintarMenu(); panel();
    // el pie espera a que la página ponga su título definitivo (las piezas comunes lo traducen al cargar)
    setTimeout(pie, 0);
    if (window.OBS && OBS.onLang) OBS.onLang(() => { pintarMenu(); panel(); pie(); });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();

  // Mantiene el tema igual en todas las pestañas abiertas
  window.addEventListener("storage", e => {
    if (e.key !== CLAVE) return;
    tema = TEMAS.includes(e.newValue) ? e.newValue : "auto";
    aplicarTema();
    if (barra) pintarMenu();
  });
})();
