/* Menú común del Observatorio.
   - Lista de las 10 situaciones de aprendizaje: es la única que hay que tocar al añadir una herramienta
     (poner su "ruta" y quitar el estado «próximamente»).
   - Aplica el tema guardado (automático, claro u oscuro) antes de pintar la página.
   - Inserta la barra superior en todas las páginas y, en la portada, la lista de SA (#panel-sa).
   Se carga en <head> con <script src=".../assets/menu.js"></script>, sin defer. */
(function () {
  const SA = [
    { n: 1, t: "¿Qué es la economía?", ruta: "sa01/", estado: "prototipo",
      d: "El juego del arroz: el arroz y las pujas en papel; la herramienta reparte, cobra y proyecta cada ronda." },
    { n: 2, t: "El comportamiento humano en la actividad económica", ruta: "sa02/", estado: "abrir",
      d: "Encuestas a las familias, resultados de la clase y matriz de la estantería." },
    { n: 3, t: "La producción" },
    { n: 4, t: "El mercado", ruta: "sa04/", estado: "prototipo",
      d: "Competencia perfecta, monopolio, el dilema de las dos gasolineras y la guerra de precios de la competencia real." },
    { n: 5, t: "Crecimiento económico y desarrollo", ruta: "sa05/", estado: "prototipo",
      d: "Simulador de un caladero: reservas, flujos y bucles para la economía ecológica." },
    { n: 6, t: "El mercado laboral" },
    { n: 7, t: "El Estado y sus cuentas" },
    { n: 8, t: "El dinero" },
    { n: 9, t: "Comercio internacional" },
    { n: 10, t: "Las finanzas" },
  ];

  // Raíz de la web: la carpeta que contiene assets/ (funciona en GitHub Pages y abriendo los archivos en local)
  const raiz = new URL("..", document.currentScript.src);
  const enlace = ruta => new URL(ruta + "index.html", raiz).href;

  // ---------- Tema ----------
  const CLAVE = "observatorio-tema";
  const TEMAS = ["auto", "light", "dark"];
  const NOMBRE = { auto: "automático", light: "claro", dark: "oscuro" };
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
      if (k === "text") n.textContent = v; else n.setAttribute(k, v);
    }
    n.append(...hijos);
    return n;
  }
  const normaliza = u => u.replace(/index\.html$/, "");

  function menu() {
    const aqui = normaliza(location.href.split("#")[0].split("?")[0]);
    const lista = el("ol", { class: "obs-menu__sa" }, ...SA.map(s => el("li", {},
      s.ruta
        ? el("a", Object.assign({ href: enlace(s.ruta), title: "SA " + s.n + " · " + s.t, "aria-label": "SA " + s.n + ": " + s.t, text: s.n },
            normaliza(enlace(s.ruta)) === aqui ? { "aria-current": "page" } : {}))
        : el("span", { title: "SA " + s.n + " · " + s.t + " (próximamente)", "aria-label": "SA " + s.n + ": " + s.t + ", próximamente", "aria-disabled": "true", text: s.n })
    )));
    const boton = el("button", { type: "button", class: "obs-menu__tema" });
    const rotular = () => {
      boton.textContent = "Tema: " + NOMBRE[tema];
      boton.setAttribute("aria-label", "Cambiar el tema; ahora " + NOMBRE[tema]);
    };
    rotular();
    boton.addEventListener("click", () => {
      tema = TEMAS[(TEMAS.indexOf(tema) + 1) % TEMAS.length];
      guardar(tema); aplicarTema(); rotular();
    });
    const home = el("a", Object.assign({ class: "obs-menu__home", href: enlace("") },
        normaliza(enlace("")) === aqui ? { "aria-current": "page" } : {}),
      el("b", { text: "Observatorio" }), el("span", { text: "Economía · 1.º Bach." }));
    document.body.prepend(el("nav", { class: "obs-menu", "aria-label": "Observatorio" },
      el("div", { class: "obs-menu__in" }, home, lista, boton)));
  }

  function panel() {
    const ol = document.getElementById("panel-sa");
    if (!ol) return;
    ol.replaceChildren(...SA.map(s => {
      const texto = el("span", {}, el("span", { class: "t", text: s.t }));
      if (s.d) texto.append(el("br"), el("span", { class: "d", text: s.d }));
      const fila = s.ruta
        ? el("a", { class: "row", href: enlace(s.ruta) })
        : el("div", { class: "row" });
      fila.append(el("span", { class: "num", text: s.n }), texto,
        el("span", { class: "state", text: s.ruta ? (s.estado || "abrir") : "próximamente" }));
      return el("li", {}, fila);
    }));
  }

  function arrancar() { menu(); panel(); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", arrancar);
  else arrancar();

  // Mantiene el tema igual en todas las pestañas abiertas
  window.addEventListener("storage", e => {
    if (e.key !== CLAVE) return;
    tema = TEMAS.includes(e.newValue) ? e.newValue : "auto";
    aplicarTema();
    const b = document.querySelector(".obs-menu__tema");
    if (b) b.textContent = "Tema: " + NOMBRE[tema];
  });
})();
