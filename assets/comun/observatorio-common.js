/* Piezas comunes del Observatorio (se copian dentro de cada página entre las marcas OBS-COMMON).
   OBS.t(clave, vars)  · traducción castellano/valenciano con {variables}
   OBS.register({es:{...}, va:{...}})  · añade textos de la página
   OBS.apply()  · aplica data-i18n, data-i18n-html y data-i18n-attr="atributo:clave;..."
   OBS.onLang(fn)  · vuelve a dibujar lo que se genera con JavaScript al cambiar de idioma
   OBS.mountBar(el, {ficha})  · pinta «← Panel», idioma, modo proyector y la ficha docente
   OBS.download(nombre, texto, tipo, {downloads})  · descarga un archivo; si no se puede, lo copia
   OBS.csv(filas)  · convierte una tabla en texto CSV con punto y coma (Excel en español) */
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
  }
  register({
    es: { "obs.back": "← Panel del Observatorio", "obs.lang": "Idioma", "obs.proj": "Modo proyector", "obs.ficha": "Ficha docente",
      "obs.sessions": "Sesiones", "obs.saberes": "Saberes básicos", "obs.criterios": "Criterios de evaluación", "obs.uso": "Cómo se usa",
      "obs.copied": "No se puede descargar aquí: los datos se han copiado. Pégalos en una hoja de cálculo.",
      "obs.copyfail": "No se ha podido descargar ni copiar. Abre la herramienta desde el archivo para descargar.",
      "obs.saved": "Archivo descargado." },
    va: { "obs.back": "← Tauler de l'Observatori", "obs.lang": "Idioma", "obs.proj": "Mode projector", "obs.ficha": "Fitxa docent",
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
      h("summary", { text: t("obs.ficha") }),
      h("dl", {},
        ficha.sesiones ? [h("dt", { text: t("obs.sessions") }), h("dd", { text: L(ficha.sesiones) })] : null,
        ficha.saberes ? [h("dt", { text: t("obs.saberes") }), h("dd", {}, list(ficha.saberes))] : null,
        ficha.criterios ? [h("dt", { text: t("obs.criterios") }), h("dd", {}, list(ficha.criterios))] : null,
        ficha.uso ? [h("dt", { text: t("obs.uso") }), h("dd", { text: L(ficha.uso) })] : null));
  }
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
    container.replaceChildren(h("div", { class: "obs-bar" }, opts.noBack ? h("span") : back, h("div", { class: "obs-tools" }, seg, pj), h("div", { class: "obs-tools keep obs-proj-only" }, pjKeep)));
    // en modo normal solo se ve el primer grupo; en modo proyector, solo el botón para salir
    const style = document.createElement("style");
    style.textContent = "body:not(.obs-proj) .obs-proj-only{display:none!important}";
    document.head.append(style);
    if (opts.ficha) {
      const box = h("details", { class: "obs-ficha" });
      (opts.fichaContainer || container).after(box);
      renderFicha(box, opts.ficha);
      onLang(() => renderFicha(box, opts.ficha));
    }
    setProj(proj);
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
  document.addEventListener("DOMContentLoaded", () => apply());
  return { t, register, apply, setLang, onLang, lang: () => lang, mountBar, download, csv, store, h };
})();
