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
    { n: 3, t: { es: "La producción", va: "La producció" } },
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
    { n: 8, t: { es: "El dinero", va: "Els diners" } },
    { n: 9, t: { es: "Comercio internacional", va: "Comerç internacional" } },
    { n: 10, t: { es: "Las finanzas", va: "Les finances" } },
  ];

  const TXT = {
    es: { home: "Observatorio", sub: "Economía · 1.º Bach.", nav: "Situaciones de aprendizaje", soon: "próximamente",
      open: "abrir", proto: "prototipo", tema: "Tema", auto: "automático", light: "claro", dark: "oscuro", cambiar: "Cambiar el tema; ahora {v}" },
    va: { home: "Observatori", sub: "Economia · 1r Batx.", nav: "Situacions d'aprenentatge", soon: "pròximament",
      open: "obrir", proto: "prototip", tema: "Tema", auto: "automàtic", light: "clar", dark: "fosc", cambiar: "Canviar el tema; ara {v}" },
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
            "aria-current": normaliza(enlace(s.ruta)) === aqui() ? "page" : null })
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
    return el("nav", { class: "obs-menu", "aria-label": tx("home") }, el("div", { class: "obs-menu__in" }, home, lista, boton));
  }
  function pintarMenu() {
    const nueva = menu();
    if (barra && barra.isConnected) barra.replaceWith(nueva); else document.body.prepend(nueva);
    barra = nueva;
  }

  function panel() {
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
    if (window.OBS && OBS.onLang) OBS.onLang(() => { pintarMenu(); panel(); });
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
