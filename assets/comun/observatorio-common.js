/* Piezas comunes del Observatorio (se copian dentro de cada página entre las marcas OBS-COMMON).
   OBS.t(clave, vars)  · traducción castellano/valenciano con {variables}
   OBS.register({es:{...}, va:{...}})  · añade textos de la página
   OBS.apply()  · aplica data-i18n, data-i18n-html y data-i18n-attr="atributo:clave;..."
   OBS.onLang(fn)  · vuelve a dibujar lo que se genera con JavaScript al cambiar de idioma
   OBS.mountBar(el, {ficha})  · pinta «← Panel», idioma, modo proyector y la ficha docente
   OBS.download(nombre, texto, tipo, {downloads})  · descarga un archivo; si no se puede, lo copia
   OBS.csv(filas)  · convierte una tabla en texto CSV con punto y coma (Excel en español)
   Apertura (25/11/2026), con OBS.mountBar(el, { apertura: true }):
   OBS.velo.cubrir(el)  · «Antes de ver»: vuelve a tapar los resultados del bloque de «el»
   OBS.escenarios(cfg)  · «Escenarios propios»: guardar, cargar, comparar y pasar por código
   OBS.imprimir(conResultados)  · «Imprimir ficha» (resultados en blanco) o con resultados
   OBS.marcas(svg, opciones)  · líneas o franjas con fechas históricas sobre una serie temporal */
window.OBS = (() => {
  "use strict";
  const PANEL_URL = "https://claude.ai/artifact/TMzyeD3wBN9TAyT8vaKeZs";
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch {} }
  };
  // Fuente de lectura de la línea Econplebs (Source Serif 4), cargada una vez
  try {
    if (!document.querySelector('link[data-obs-font]')) {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.dataset.obsFont = "1";
      l.href = "https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,600&display=swap";
      document.head.append(l);
    }
  } catch {}
  const dict = { es: {}, va: {} };
  const listeners = [];
  let lang = store.get("obs-lang") === "va" ? "va" : "es";
  const fill = (s, vars) => vars ? String(s).replace(/\{(\w+)\}/g, (m, k) => vars[k] != null ? vars[k] : m) : s;
  function t(key, vars) {
    const s = dict[lang][key] != null ? dict[lang][key] : dict.es[key] != null ? dict.es[key] : key;
    return fill(s, vars);
  }
  function register(d) { for (const l of ["es", "va"]) if (d[l]) Object.assign(dict[l], d[l]); }
  function apply(root) {
    root = root || document;
    root.querySelectorAll("[data-i18n]").forEach(n => { n.textContent = t(n.dataset.i18n); });
    root.querySelectorAll("[data-i18n-html]").forEach(n => { n.innerHTML = t(n.dataset.i18nHtml); });
    root.querySelectorAll("[data-i18n-attr]").forEach(n => n.dataset.i18nAttr.split(";").forEach(pair => {
      const [attr, key] = pair.split(":").map(x => x.trim()); if (attr && key) n.setAttribute(attr, t(key));
    }));
    document.documentElement.lang = lang === "va" ? "ca-ES-valencia" : "es";
    const tt = document.querySelector("title[data-i18n]"); if (tt) document.title = t(tt.dataset.i18n);
  }
  function setLang(l) {
    lang = l === "va" ? "va" : "es"; store.set("obs-lang", lang); apply();
    document.querySelectorAll(".obs-seg button[data-lang]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
    listeners.forEach(fn => { try { fn(lang); } catch (e) { console.error(e); } });
  }
  function onLang(fn) { listeners.push(fn); }
  let proj = store.get("obs-proj") === "1";
  function setProj(on) {
    proj = !!on; store.set("obs-proj", proj ? "1" : "0");
    document.body.classList.toggle("obs-proj", proj);
    document.querySelectorAll(".obs-toggle[data-proj]").forEach(b => b.setAttribute("aria-pressed", String(proj)));
    if (aperturaOn) pintarVelo();
  }
  register({
    es: { "obs.back": "← Panel del Observatorio", "obs.lang": "Idioma", "obs.proj": "Modo proyector", "obs.ficha": "Ficha docente", "obs.docente": "Para el docente", "obs.sobre": "Sobre esta herramienta",
      "obs.sessions": "Sesiones", "obs.saberes": "Saberes básicos", "obs.criterios": "Criterios de evaluación", "obs.uso": "Cómo se usa",
      "obs.copied": "No se puede descargar aquí: los datos se han copiado. Pégalos en una hoja de cálculo.",
      "obs.copyfail": "No se ha podido descargar ni copiar. Abre la herramienta desde el archivo para descargar.",
      "obs.saved": "Archivo descargado." },
    va: { "obs.back": "← Tauler de l'Observatori", "obs.lang": "Idioma", "obs.proj": "Mode projector", "obs.ficha": "Fitxa docent", "obs.docente": "Per al docent", "obs.sobre": "Sobre esta ferramenta",
      "obs.sessions": "Sessions", "obs.saberes": "Sabers bàsics", "obs.criterios": "Criteris d'avaluació", "obs.uso": "Com s'utilitza",
      "obs.copied": "Ací no es pot descarregar: les dades s'han copiat. Apega-les en un full de càlcul.",
      "obs.copyfail": "No s'ha pogut descarregar ni copiar. Obri la ferramenta des de l'arxiu per a descarregar.",
      "obs.saved": "Arxiu descarregat." }
  });
  const h = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (k === "class") n.className = v; else if (k === "text") n.textContent = v; else if (v != null && v !== false) n.setAttribute(k, v === true ? "" : v); }
    for (const k of kids.flat()) if (k != null) n.append(k.nodeType ? k : document.createTextNode(k));
    return n;
  };
  /* ficha = { sesiones: {es, va}, uso: {es, va}, saberes: [{code, es, va}], criterios: [{code, es, va}] } */
  function renderFicha(box, ficha) {
    const L = o => o == null ? "" : typeof o === "string" ? o : (o[lang] || o.es || "");
    const list = arr => h("ul", {}, (arr || []).map(x => h("li", {}, x.code ? h("span", { class: "code", text: x.code }) : null, L(x))));
    box.replaceChildren(
      h("h2", { class: "obs-docente__h", text: t("obs.ficha") }),
      h("dl", {},
        ficha.sesiones ? [h("dt", { text: t("obs.sessions") }), h("dd", { text: L(ficha.sesiones) })] : null,
        ficha.saberes ? [h("dt", { text: t("obs.saberes") }), h("dd", {}, list(ficha.saberes))] : null,
        ficha.criterios ? [h("dt", { text: t("obs.criterios") }), h("dd", {}, list(ficha.criterios))] : null,
        ficha.uso ? [h("dt", { text: t("obs.uso") }), h("dd", { text: L(ficha.uso) })] : null));
  }
  /* Barra de una línea: «← Panel», idioma, modo proyector y «Para el docente».
     El panel «Para el docente» (cerrado al empezar) recoge la entrada de la cabecera (.lede) y la ficha docente,
     para que la herramienta empiece arriba. */
  function mountBar(container, opts = {}) {
    const back = h("a", { class: "back", href: opts.panelUrl || PANEL_URL, target: "_blank", rel: "noopener", "data-i18n": "obs.back", text: t("obs.back") });
    const seg = h("div", { class: "obs-seg", role: "group", "aria-label": t("obs.lang") },
      h("button", { type: "button", "data-lang": "es", "aria-pressed": String(lang === "es"), text: "Castellano" }),
      h("button", { type: "button", "data-lang": "va", "aria-pressed": String(lang === "va"), text: "Valencià" }));
    seg.addEventListener("click", e => { const b = e.target.closest("button[data-lang]"); if (b) setLang(b.dataset.lang); });
    const pj = h("button", { type: "button", class: "obs-toggle", "data-proj": "1", "aria-pressed": String(proj), "data-i18n": "obs.proj", text: t("obs.proj") });
    pj.addEventListener("click", () => setProj(!proj));
    const pjKeep = h("button", { type: "button", class: "obs-toggle", "data-proj": "1", "aria-pressed": String(proj), "data-i18n": "obs.proj", text: t("obs.proj") });
    pjKeep.addEventListener("click", () => setProj(!proj));
    // Panel «Para el docente»
    const cabecera = container.closest("header") || document.querySelector("header.top") || document.querySelector("header");
    const lede = cabecera ? cabecera.querySelector(".lede") : null;
    const panel = h("div", { class: "obs-docente", id: "obs-docente", hidden: true });
    if (lede) panel.append(h("h2", { class: "obs-docente__h", "data-i18n": "obs.sobre", text: t("obs.sobre") }), lede);
    let fichaBox = null;
    if (opts.ficha) { fichaBox = h("div", { class: "obs-ficha" }); panel.append(fichaBox); renderFicha(fichaBox, opts.ficha); onLang(() => renderFicha(fichaBox, opts.ficha)); }
    let impr = null;
    if (opts.apertura) {
      aperturaOn = true;
      const sel = h("select", { "aria-label": t("obs.velo.modo") },
        ["proj", "on", "off"].map(m => h("option", { value: m, selected: m === veloModo ? true : null, text: t("obs.velo." + m) })));
      sel.addEventListener("change", () => setVeloModo(sel.value));
      const conRes = h("button", { type: "button", class: "obs-toggle", text: t("obs.pr.con") });
      conRes.addEventListener("click", () => imprimir(true));
      const caja = h("div", { class: "obs-apertura" }, h("h2", { class: "obs-docente__h", text: t("obs.apertura") }),
        h("label", { class: "obs-apertura__fila" }, h("span", { text: t("obs.velo.modo") }), sel), h("div", {}, conRes));
      panel.append(caja);
      onLang(() => { caja.querySelector("h2").textContent = t("obs.apertura"); caja.querySelector("label > span").textContent = t("obs.velo.modo");
        sel.setAttribute("aria-label", t("obs.velo.modo")); [...sel.options].forEach(o => { o.textContent = t("obs.velo." + o.value); }); conRes.textContent = t("obs.pr.con"); });
      impr = h("button", { type: "button", class: "obs-toggle obs-imprimir", text: t("obs.pr.ficha") });
      impr.addEventListener("click", () => imprimir(false));
      onLang(() => { impr.textContent = t("obs.pr.ficha"); });
    }
    const hayPanel = !!(lede || opts.ficha || opts.apertura);
    const doc = h("button", { type: "button", class: "obs-toggle obs-docente-btn", "aria-expanded": "false", "aria-controls": "obs-docente", "data-i18n": "obs.docente", text: t("obs.docente") });
    doc.addEventListener("click", () => { panel.hidden = !panel.hidden; doc.setAttribute("aria-expanded", String(!panel.hidden)); });
    container.replaceChildren(h("div", { class: "obs-bar" }, opts.noBack ? h("span") : back,
      h("div", { class: "obs-tools" }, seg, pj, impr, hayPanel ? doc : null), h("div", { class: "obs-tools keep obs-proj-only" }, pjKeep)));
    if (hayPanel) (cabecera || container).after(panel);
    // en modo normal solo se ve el primer grupo; en modo proyector, solo el botón para salir
    const style = document.createElement("style");
    style.textContent = "body:not(.obs-proj) .obs-proj-only{display:none!important}";
    document.head.append(style);
    setProj(proj);
    if (opts.apertura) cubrir();
  }
  const csvCell = v => { const s = String(v == null ? "" : v); return /[;"\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  function csv(rows) { return rows.map(r => r.map(csvCell).join(";")).join("\n"); }
  async function download(name, text, type, opts = {}) {
    const data = (type || "").includes("csv") ? "﻿" + text : text;
    if (opts.downloads) { try { await opts.downloads.save({ filename: name, data }); return t("obs.saved"); } catch (e) { if (e && e.code === "declined") return ""; } }
    const inArtifact = /claude\.ai|claudeusercontent/.test(location.hostname);
    if (!inArtifact) {
      try {
        const url = URL.createObjectURL(new Blob([data], { type: type || "text/plain" }));
        const a = h("a", { href: url, download: name }); document.body.append(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000); return t("obs.saved");
      } catch {}
    }
    try { await navigator.clipboard.writeText(text); return t("obs.copied"); } catch { return t("obs.copyfail"); }
  }
  // ================= Apertura (25/11/2026): «Antes de ver», «Escenarios» e «Imprimir ficha» =================
  // La apertura está en la tarea: la clase predice antes de ver, los equipos proponen sus escenarios y todo se lleva al papel.
  // Una herramienta la activa con OBS.mountBar(el, { apertura: true }) y marca:
  //   data-obs-scope  · el bloque (una pestaña o una parte de ella) que se tapa y se destapa junto;
  //   data-obs-result · lo que es resultado (cifras, gráficos, tablas de solución, botones que dan la respuesta);
  //   data-obs-prompt · (opcional) dónde va el aviso del bloque; si no lo hay, va delante del primer resultado.
  register({
    es: { "obs.velo.txt": "¿Qué creéis que pasará? Escribidlo en la ficha antes de verlo.", "obs.velo.ver": "Ver",
      "obs.velo.tapar": "Tapar otra vez", "obs.velo.modo": "Antes de ver: tapar los resultados hasta que la clase haya hecho su predicción",
      "obs.velo.proj": "Solo en modo proyector", "obs.velo.on": "Siempre", "obs.velo.off": "Nunca",
      "obs.pr.ficha": "Imprimir ficha", "obs.pr.con": "Imprimir con resultados", "obs.pr.nombre": "Nombre", "obs.pr.equipo": "Equipo",
      "obs.pr.esc": "Escenario", "obs.pr.pred": "Vuestra predicción",
      "obs.pr.help": "Antes de ver el resultado, escribid vuestra predicción en los recuadros. Después, comprobadla con la herramienta.",
      "obs.apertura": "Abrir la herramienta",
      "obs.esc.h": "Escenarios propios", "obs.esc.help": "Guardad el escenario de cada equipo, cargadlo con un clic y comparad los resultados. Un equipo puede preparar el suyo en casa y pasaros el código.",
      "obs.esc.nombre": "Nombre del escenario", "obs.esc.ph": "Por ejemplo, Equipo 3", "obs.esc.guardar": "Guardar el que está en pantalla",
      "obs.esc.cargar": "Cargar", "obs.esc.borrar": "Borrar", "obs.esc.seguro": "¿Seguro? Pulsa otra vez", "obs.esc.ejemplo": "Ejemplo",
      "obs.esc.actual": "Ahora en pantalla", "obs.esc.codActual": "Código del escenario que está en pantalla", "obs.esc.copiar": "Copiar",
      "obs.esc.copiado": "Código copiado.", "obs.esc.nocopia": "No se ha podido copiar: seleccionad el código y copiadlo a mano.",
      "obs.esc.pegar": "Pegar un código", "obs.esc.cargarCod": "Cargar el código",
      "obs.esc.malo": "Ese código no es válido: revisad que esté copiado entero.", "obs.esc.otro": "Ese código es de otra herramienta ({id}).",
      "obs.esc.lleno": "Ya hay siete escenarios guardados: borrad uno antes.", "obs.esc.sinNombre": "Escribid un nombre para el escenario.",
      "obs.esc.guardado": "Escenario «{n}» guardado.", "obs.esc.cargado": "Escenario cargado: «{n}».", "obs.esc.borrado": "Escenario borrado.",
      "obs.esc.comparar": "Comparar los escenarios", "obs.esc.col": "Escenario", "obs.esc.vacio": "Todavía no hay escenarios guardados.",
      "obs.esc.guardados": "Guardados en este navegador" },
    va: { "obs.velo.txt": "Què creieu que passarà? Escriviu-ho en la fitxa abans de veure-ho.", "obs.velo.ver": "Veure",
      "obs.velo.tapar": "Tapar una altra vegada", "obs.velo.modo": "Abans de veure: tapar els resultats fins que la classe haja fet la seua predicció",
      "obs.velo.proj": "Només en mode projector", "obs.velo.on": "Sempre", "obs.velo.off": "Mai",
      "obs.pr.ficha": "Imprimir fitxa", "obs.pr.con": "Imprimir amb resultats", "obs.pr.nombre": "Nom", "obs.pr.equipo": "Equip",
      "obs.pr.esc": "Escenari", "obs.pr.pred": "La vostra predicció",
      "obs.pr.help": "Abans de veure el resultat, escriviu la vostra predicció en els requadres. Després, comproveu-la amb la ferramenta.",
      "obs.apertura": "Obrir la ferramenta",
      "obs.esc.h": "Escenaris propis", "obs.esc.help": "Guardeu l'escenari de cada equip, carregueu-lo amb un clic i compareu els resultats. Un equip pot preparar el seu a casa i passar-vos el codi.",
      "obs.esc.nombre": "Nom de l'escenari", "obs.esc.ph": "Per exemple, Equip 3", "obs.esc.guardar": "Guardar el que hi ha en pantalla",
      "obs.esc.cargar": "Carregar", "obs.esc.borrar": "Esborrar", "obs.esc.seguro": "Segur? Prem una altra vegada", "obs.esc.ejemplo": "Exemple",
      "obs.esc.actual": "Ara en pantalla", "obs.esc.codActual": "Codi de l'escenari que hi ha en pantalla", "obs.esc.copiar": "Copiar",
      "obs.esc.copiado": "Codi copiat.", "obs.esc.nocopia": "No s'ha pogut copiar: seleccioneu el codi i copieu-lo a mà.",
      "obs.esc.pegar": "Apegar un codi", "obs.esc.cargarCod": "Carregar el codi",
      "obs.esc.malo": "Eixe codi no és vàlid: reviseu que estiga copiat sencer.", "obs.esc.otro": "Eixe codi és d'una altra ferramenta ({id}).",
      "obs.esc.lleno": "Ja hi ha set escenaris guardats: esborreu-ne un abans.", "obs.esc.sinNombre": "Escriviu un nom per a l'escenari.",
      "obs.esc.guardado": "Escenari «{n}» guardat.", "obs.esc.cargado": "Escenari carregat: «{n}».", "obs.esc.borrado": "Escenari esborrat.",
      "obs.esc.comparar": "Comparar els escenaris", "obs.esc.col": "Escenari", "obs.esc.vacio": "Encara no hi ha escenaris guardats.",
      "obs.esc.guardados": "Guardats en este navegador" }
  });

  // ---------- «Antes de ver» ----------
  let veloModo = ["proj", "on", "off"].includes(store.get("obs-velo")) ? store.get("obs-velo") : "proj";
  let aperturaOn = false;
  const veloActivo = () => aperturaOn && (veloModo === "on" || (veloModo === "proj" && proj));
  const scopeDe = n => n.closest("[data-obs-scope]") || document.body;
  function scopes() { const s = new Set(); document.querySelectorAll("[data-obs-result]").forEach(n => s.add(scopeDe(n))); return [...s]; }
  function barDe(s) {
    if (s._obsBar) return s._obsBar;
    const bar = h("div", { class: "obs-velo-bar", "aria-live": "polite" });
    const sitio = [...s.querySelectorAll("[data-obs-prompt]")].find(n => scopeDe(n) === s);
    const primero = [...s.querySelectorAll("[data-obs-result]")].find(n => scopeDe(n) === s);
    if (sitio) sitio.replaceChildren(bar); else if (primero) primero.before(bar); else s.prepend(bar);
    s._obsBar = bar; return bar;
  }
  function pintarVelo() {
    const activo = veloActivo();
    document.body.classList.toggle("obs-velo-on", activo);
    for (const s of scopes()) {
      const bar = barDe(s), tapado = activo && s.classList.contains("obs-velado");
      bar.hidden = !activo;
      bar.classList.toggle("destapado", !tapado);
      if (tapado) {
        const ver = h("button", { type: "button", class: "btn", text: t("obs.velo.ver") });
        ver.addEventListener("click", () => { s.classList.remove("obs-velado"); pintarVelo(); });
        bar.replaceChildren(h("p", { text: t("obs.velo.txt") }), ver);
      } else {
        const tap = h("button", { type: "button", class: "btn quiet small", text: t("obs.velo.tapar") });
        tap.addEventListener("click", () => { s.classList.add("obs-velado"); pintarVelo(); });
        bar.replaceChildren(tap);
      }
      s.querySelectorAll("[data-obs-result]").forEach(r => {
        if (scopeDe(r) !== s) return;
        if (tapado) { r.setAttribute("aria-hidden", "true"); r.inert = true; } else { r.removeAttribute("aria-hidden"); r.inert = false; }
      });
    }
  }
  /* OBS.velo.cubrir(elemento) vuelve a tapar el bloque de ese elemento (sin elemento, todos); por ejemplo, al cargar un escenario */
  function cubrir(n) { (n ? [scopeDe(n)] : scopes()).forEach(s => s.classList.add("obs-velado")); pintarVelo(); }
  function setVeloModo(m) { veloModo = m; store.set("obs-velo", m); pintarVelo(); }
  onLang(() => { if (aperturaOn) pintarVelo(); });

  // ---------- «Escenarios propios» ----------
  /* OBS.escenarios({ id: "SA4", mount, toArray(), fromArray(arr), describe(arr) → texto, resumen() → [[etiqueta, valor]],
       ejemplos: [{ nombre: {es, va}, arr }] })
     El estado es una lista de grupos de números: [[1, 2], [3, 4.5]]. Así el código es corto: «SA4-1_2~3_4.5-K». */
  const MAX_ESC = 7;
  const num = n => String(Math.round(+n * 1000) / 1000);
  const control = s => { let a = 0; for (let i = 0; i < s.length; i++) a = (a + (i + 1) * s.charCodeAt(i)) % 26; return String.fromCharCode(65 + a); };
  function codificar(id, arr) { const cuerpo = id + "-" + arr.map(g => g.map(num).join("_")).join("~"); return cuerpo + "-" + control(cuerpo); }
  function descodificar(id, code) {
    const m = String(code || "").trim().replace(/\s+/g, "").match(/^([A-Za-z0-9]+)-([0-9._~]+)-([A-Za-z])$/);
    if (!m) return { error: t("obs.esc.malo") };
    const cuerpo = m[1].toUpperCase() + "-" + m[2];
    if (control(cuerpo) !== m[3].toUpperCase()) return { error: t("obs.esc.malo") };
    if (m[1].toUpperCase() !== id.toUpperCase()) return { error: t("obs.esc.otro", { id: m[1].toUpperCase() }) };
    const arr = m[2].split("~").map(g => g.split("_").map(Number));
    if (arr.some(g => g.some(x => !isFinite(x)))) return { error: t("obs.esc.malo") };
    return { arr };
  }
  function escenarios(cfg) {
    const KEY = "obs-esc:" + cfg.id;
    const leer = () => { try { const a = JSON.parse(store.get(KEY) || "[]"); return Array.isArray(a) ? a.filter(x => x && x.n && Array.isArray(x.a)) : []; } catch { return []; } };
    const escribir = lista => store.set(KEY, JSON.stringify(lista));
    const L = o => typeof o === "string" ? o : (o[lang] || o.es || "");
    const box = h("details", { class: "obs-esc" });
    const estado = h("p", { class: "obs-esc__estado small", "aria-live": "polite" });
    const avisar = (txt, malo) => { estado.textContent = txt; estado.classList.toggle("malo", !!malo); };
    function cargar(arr, nombre) {
      try { cfg.fromArray(arr); } catch (e) { console.error(e); avisar(t("obs.esc.malo"), true); return; }
      cubrir(cfg.mount); avisar(t("obs.esc.cargado", { n: nombre })); pintar();
    }
    function pintar() {
      const guardados = leer();
      const nombre = h("input", { type: "text", maxlength: "40", placeholder: t("obs.esc.ph"), "aria-label": t("obs.esc.nombre") });
      const guardar = h("button", { type: "button", class: "btn small", text: t("obs.esc.guardar") });
      guardar.addEventListener("click", () => {
        const n = nombre.value.trim(); if (!n) { avisar(t("obs.esc.sinNombre"), true); nombre.focus(); return; }
        const lista = leer(); const i = lista.findIndex(x => x.n === n);
        if (i < 0 && lista.length >= MAX_ESC) { avisar(t("obs.esc.lleno"), true); return; }
        const item = { n, a: cfg.toArray() }; if (i >= 0) lista[i] = item; else lista.push(item);
        escribir(lista); pintar(); avisar(t("obs.esc.guardado", { n }));
      });
      const fila = (nom, arr, ejemplo, idx) => {
        const b = h("button", { type: "button", class: "btn ghost small", text: t("obs.esc.cargar") });
        b.addEventListener("click", () => cargar(arr, nom));
        const cod = h("code", { class: "obs-esc__cod", text: codificar(cfg.id, arr) });
        let del = null;
        if (!ejemplo) {
          del = h("button", { type: "button", class: "btn quiet small", text: t("obs.esc.borrar") });
          let armado = false;
          del.addEventListener("click", () => {
            if (!armado) { armado = true; del.textContent = t("obs.esc.seguro"); setTimeout(() => { armado = false; if (del.isConnected) del.textContent = t("obs.esc.borrar"); }, 4000); return; }
            const lista = leer(); lista.splice(idx, 1); escribir(lista); pintar(); avisar(t("obs.esc.borrado"));
          });
        }
        return h("li", {}, h("div", { class: "obs-esc__nom" }, ejemplo ? h("span", { class: "obs-esc__tag", text: t("obs.esc.ejemplo") }) : null, h("b", { text: nom })),
          h("div", { class: "obs-esc__desc small", text: cfg.describe ? cfg.describe(arr) : "" }), h("div", { class: "obs-esc__acc" }, b, cod, del));
      };
      const lista = h("ul", { class: "obs-esc__lista" },
        (cfg.ejemplos || []).map(e => fila(L(e.nombre), e.arr, true)),
        guardados.map((g, i) => fila(g.n, g.a, false, i)));
      const actual = codificar(cfg.id, cfg.toArray());
      const codBox = h("code", { class: "obs-esc__cod grande", text: actual });
      const copiar = h("button", { type: "button", class: "btn quiet small", text: t("obs.esc.copiar") });
      copiar.addEventListener("click", async () => { try { await navigator.clipboard.writeText(actual); avisar(t("obs.esc.copiado")); } catch { avisar(t("obs.esc.nocopia"), true); } });
      const pega = h("input", { type: "text", placeholder: "SA0-…", "aria-label": t("obs.esc.pegar"), spellcheck: "false", autocapitalize: "characters" });
      const pegaBtn = h("button", { type: "button", class: "btn ghost small", text: t("obs.esc.cargarCod") });
      pegaBtn.addEventListener("click", () => { const r = descodificar(cfg.id, pega.value); if (r.error) { avisar(r.error, true); return; } cargar(r.arr, pega.value.trim()); });
      const cmpBtn = h("button", { type: "button", class: "btn ghost small", text: t("obs.esc.comparar") });
      const cmpBox = h("div", { class: "scroll obs-esc__cmp" });
      cmpBtn.addEventListener("click", () => {
        if (!cfg.resumen) return;
        const ahora = cfg.toArray();
        const filas = [[t("obs.esc.actual"), ahora]].concat((cfg.ejemplos || []).map(e => [L(e.nombre), e.arr]), leer().map(g => [g.n, g.a]));
        const datos = filas.map(([n, a]) => { try { cfg.fromArray(a, { silencioso: true }); return [n, cfg.resumen()]; } catch { return [n, null]; } });
        cfg.fromArray(ahora, { silencioso: true });
        const cab = (datos.find(d => d[1]) || [null, []])[1].map(c => c[0]);
        cmpBox.replaceChildren(h("table", { class: "obs-esc__tabla" },
          h("thead", {}, h("tr", {}, h("th", { text: t("obs.esc.col") }), cab.map(c => h("th", { text: c })))),
          h("tbody", {}, datos.map(([n, r]) => h("tr", {}, h("th", { text: n }), (r || cab.map(() => ["", "—"])).map(c => h("td", { text: c[1] })))))));
      });
      box.replaceChildren(...[h("summary", { text: t("obs.esc.h") }),
        h("p", { class: "small", text: t("obs.esc.help") }),
        h("div", { class: "obs-esc__fila" }, nombre, guardar),
        lista, guardados.length ? null : h("p", { class: "small obs-esc__vacio", text: t("obs.esc.vacio") }),
        h("div", { class: "obs-esc__fila" }, h("span", { class: "small", text: t("obs.esc.codActual") + ": " }), codBox, copiar),
        h("div", { class: "obs-esc__fila" }, pega, pegaBtn),
        cfg.resumen ? h("div", { class: "obs-esc__fila" }, cmpBtn) : null, cmpBox, estado].filter(Boolean));
    }
    const yo = { pintar, describeActual: () => cfg.describe ? cfg.describe(cfg.toArray()) : "", mount: cfg.mount };
    box._obsEsc = yo;
    (cfg.antes ? cfg.mount.before(box) : cfg.mount.append(box));
    pintar();
    onLang(pintar);
    return yo;
  }

  // ---------- «Imprimir ficha» ----------
  function imprimir(conResultados) {
    const wrap = document.querySelector(".wrap") || document.body;
    let head = document.getElementById("obs-print-head");
    if (!head) { head = h("div", { id: "obs-print-head", class: "obs-print-head" }); wrap.prepend(head); }
    const tab = document.querySelector('[role="tab"][aria-selected="true"]');
    const titulo = ((document.querySelector("header h1") || {}).textContent || document.title).trim();
    const eyebrow = ((document.querySelector("header .eyebrow") || {}).textContent || "").trim();
    // el escenario descrito es el del bloque visible (si lo hay)
    const vis = [...document.querySelectorAll(".obs-esc")].find(d => d.offsetParent !== null);
    const esc = vis && vis._obsEsc ? vis._obsEsc.describeActual() : "";
    head.replaceChildren(...[
      h("div", { class: "obs-ph-top" }, h("span", { text: eyebrow }), h("span", { text: new Date().toLocaleDateString(lang === "va" ? "ca-ES" : "es-ES") })),
      h("div", { class: "obs-ph-h", text: titulo + (tab ? " · " + [...tab.childNodes].map(n => n.textContent.trim()).filter(Boolean).join(" ").replace(/\s+/g, " ") : "") }),
      conResultados ? null : h("div", { class: "obs-ph-campos" }, h("span", { text: t("obs.pr.nombre") + ":" }), h("span", { text: t("obs.pr.equipo") + ":" })),
      esc ? h("p", { class: "obs-ph-esc", text: t("obs.pr.esc") + ": " + esc }) : null,
      conResultados ? null : h("p", { class: "obs-ph-ayuda", text: t("obs.pr.help") })].filter(Boolean));
    document.querySelectorAll("[data-obs-result]").forEach(r => r.setAttribute("data-obs-pred", t("obs.pr.pred")));
    document.body.classList.toggle("obs-print-ficha", !conResultados);
    document.body.classList.add("obs-printing");
    const fin = () => { document.body.classList.remove("obs-print-ficha", "obs-printing"); window.removeEventListener("afterprint", fin); };
    window.addEventListener("afterprint", fin);
    window.print();
  }

  // ---------- «Marcas de fechas» (25/11/2026) ----------
  /* OBS.marcas(svg, { sx, yTop, yBot, x0, x1, lista: [{ desde, hasta, txt: {es, va} }] })
     Dibuja una línea vertical (o una franja, si hay «hasta») con un rótulo corto en cada fecha que cae en el tramo. */
  function marcas(svg, o) {
    const NS = "http://www.w3.org/2000/svg";
    const mk = (tag, at, txt) => { const n = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(at)) n.setAttribute(k, v); if (txt != null) n.textContent = txt; return n; };
    const g = mk("g", { class: "obs-marca" });
    for (const m of o.lista || []) {
      const a = Math.max(m.desde, o.x0), b = Math.min(m.hasta != null ? m.hasta : m.desde, o.x1);
      if (a > b) continue;
      const xa = o.sx(a), xb = o.sx(b);
      if (m.hasta != null && xb > xa) g.append(mk("rect", { x: xa, y: o.yTop, width: xb - xa, height: o.yBot - o.yTop }));
      else g.append(mk("line", { x1: xa, x2: xa, y1: o.yTop, y2: o.yBot }));
      const txt = typeof m.txt === "string" ? m.txt : (m.txt[lang] || m.txt.es);
      g.append(mk("text", { x: xa + 4, y: o.yTop + 12, "data-xb": xb }, txt));
    }
    svg.append(g);
    // Si un texto se sale por la derecha del gráfico, se alinea a la izquierda de la marca;
    // cada texto baja a la primera fila libre para no pisar a los anteriores
    const derecha = o.sx(o.x1), filas = [];
    g.querySelectorAll("text").forEach(tx => {
      try {
        const w = tx.getComputedTextLength(); let x = +tx.getAttribute("x"), izq = x;
        if (x + w > derecha) { x = +tx.getAttribute("data-xb") - 4; izq = x - w; tx.setAttribute("text-anchor", "end"); tx.setAttribute("x", x); }
        const der = izq + w; let f = 0;
        while ((filas[f] || []).some(([a, b]) => izq < b + 6 && der > a - 6)) f++;
        (filas[f] = filas[f] || []).push([izq, der]);
        tx.setAttribute("y", o.yTop + 12 + f * 13);
      } catch {}
    });
  }

  document.addEventListener("DOMContentLoaded", () => apply());
  return { t, register, apply, setLang, onLang, lang: () => lang, mountBar, download, csv, store, h,
    velo: { cubrir, modo: setVeloModo }, escenarios, imprimir, marcas };
})();
