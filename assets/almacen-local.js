/* Almacén local de la SA 2 fuera de Claude.
   La herramienta de la SA 2 guarda los códigos con window.claude (db, user, downloads), que solo existe dentro de Claude.
   Aquí se imita lo poco que usa para que funcione igual, pero guardando en este navegador (localStorage):
   - db: doc(...).set, collection(...).doc(...).set y collection(...).onSnapshot
   - user.can(): siempre puede escribir (es el ordenador del docente)
   - downloads.save(): descarga el CSV de verdad
   Además añade en «Introducir códigos» un bloque para exportar e importar una copia de seguridad.
   Si la página se abre dentro de Claude (window.claude ya existe), este archivo no hace nada. */
(function () {
  if (window.claude) return;

  const CLAVE = "observatorio-sa2-almacen";
  const disponible = (() => {
    try { localStorage.setItem(CLAVE + "-prueba", "1"); localStorage.removeItem(CLAVE + "-prueba"); return true; }
    catch { return false; }
  })();
  // Sin almacenamiento (ventana privada estricta, datos bloqueados): la herramienta sigue en su modo «sin guardar»
  if (!disponible) return;

  // datos = { "ruta/de/coleccion": { idDocumento: {campos} } }
  const leer = () => { try { return JSON.parse(localStorage.getItem(CLAVE)) || {}; } catch { return {}; } };
  let datos = leer();
  const oyentes = new Map();

  function foto(ruta) {
    const col = datos[ruta] || {};
    return { docs: Object.keys(col).map(id => ({ id, data: () => col[id] })) };
  }
  function avisar(ruta) {
    (oyentes.get(ruta) || new Set()).forEach(fn => { try { fn(foto(ruta)); } catch {} });
  }
  function avisarTodo() { oyentes.forEach((_, ruta) => avisar(ruta)); pintarResumen(); }
  function persistir() {
    try { localStorage.setItem(CLAVE, JSON.stringify(datos)); }
    catch { datos = leer(); const e = new Error("Almacén lleno"); e.code = "quota_exceeded"; throw e; }
  }
  function escribir(ruta, id, campos) {
    (datos[ruta] = datos[ruta] || {})[id] = campos;
    persistir();
    avisar(ruta);
    pintarResumen();
  }

  const db = {
    doc(path) {
      const i = path.lastIndexOf("/");
      return { set: async campos => escribir(path.slice(0, i), path.slice(i + 1), campos) };
    },
    collection(ruta) {
      return {
        doc: id => ({ set: async campos => escribir(ruta, id, campos) }),
        onSnapshot(fn) {
          if (!oyentes.has(ruta)) oyentes.set(ruta, new Set());
          oyentes.get(ruta).add(fn);
          setTimeout(() => { if (oyentes.get(ruta).has(fn)) fn(foto(ruta)); }, 0);
          return () => oyentes.get(ruta).delete(fn);
        },
      };
    },
  };

  function descargar(nombre, texto, tipo) {
    const url = URL.createObjectURL(new Blob([texto], { type: tipo }));
    const a = document.createElement("a");
    a.href = url; a.download = nombre; a.hidden = true;
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  const servicios = {
    db,
    user: { can: async () => true },
    downloads: { save: async ({ filename, data }) => descargar(filename, data, "text/csv;charset=utf-8") },
  };
  window.claude = { use: async nombre => servicios[nombre] || null };

  // Cambios hechos en otra pestaña de este navegador
  window.addEventListener("storage", e => { if (e.key === CLAVE) { datos = leer(); avisarTodo(); } });

  // ---------- Copia de seguridad ----------
  let resumen = null;
  function pintarResumen() {
    if (!resumen) return;
    const grupos = Object.keys(datos.clases || {}).length;
    const respuestas = Object.keys(datos).filter(r => /^clases\/[^/]+\/respuestas$/.test(r))
      .reduce((n, r) => n + Object.keys(datos[r]).length, 0);
    resumen.textContent = grupos
      ? "Guardado en este navegador: " + grupos + (grupos === 1 ? " grupo" : " grupos") + " y " + respuestas + (respuestas === 1 ? " respuesta." : " respuestas.")
      : "Todavía no hay códigos guardados en este navegador.";
  }

  function bloqueCopia() {
    const vista = document.getElementById("view-introducir");
    if (!vista) return;
    const estado = document.createElement("span");
    estado.className = "status"; estado.setAttribute("aria-live", "polite");
    const aviso = (texto, ok) => { estado.textContent = texto; estado.className = "status " + (ok ? "ok" : "bad"); };

    const exportar = document.createElement("button");
    exportar.type = "button"; exportar.className = "btn ghost small"; exportar.textContent = "Exportar copia";
    exportar.addEventListener("click", () => {
      const hoy = new Date().toISOString().slice(0, 10);
      const copia = { app: "observatorio-sa2", version: 1, exportado: new Date().toISOString(), datos };
      descargar("observatorio-sa2-copia-" + hoy + ".json", JSON.stringify(copia, null, 2), "application/json");
      aviso("Copia descargada. Guárdala en un lugar seguro.", true);
    });

    const archivo = document.createElement("input");
    archivo.type = "file"; archivo.accept = ".json,application/json"; archivo.hidden = true;
    const importar = document.createElement("button");
    importar.type = "button"; importar.className = "btn ghost small"; importar.textContent = "Importar copia";
    importar.addEventListener("click", () => archivo.click());
    archivo.addEventListener("change", async () => {
      const f = archivo.files && archivo.files[0];
      archivo.value = "";
      if (!f) return;
      let copia;
      try { copia = JSON.parse(await f.text()); } catch { aviso("Ese archivo no es una copia del Observatorio.", false); return; }
      if (!copia || copia.app !== "observatorio-sa2" || typeof copia.datos !== "object") { aviso("Ese archivo no es una copia de la SA 2.", false); return; }
      const antes = JSON.stringify(datos);
      // Se suma a lo que ya hay: no se borra nada; un mismo código solo cuenta una vez
      for (const [ruta, docs] of Object.entries(copia.datos)) {
        if (!docs || typeof docs !== "object") continue;
        datos[ruta] = Object.assign(datos[ruta] || {}, docs);
      }
      try { persistir(); } catch { datos = JSON.parse(antes); aviso("No cabe en el almacén del navegador.", false); return; }
      avisarTodo();
      aviso("Copia importada y sumada a lo que ya había.", true);
    });

    resumen = document.createElement("p");
    resumen.className = "small";
    pintarResumen();

    const titulo = document.createElement("h3");
    titulo.textContent = "Copia de seguridad";
    const texto = document.createElement("p");
    texto.className = "small";
    texto.textContent = "Los códigos guardados se quedan solo en este navegador y en este ordenador. Exporta una copia de vez en cuando, y siempre antes de cambiar de ordenador o de borrar los datos del navegador. Para recuperarla, impórtala aquí: se suma a lo que ya haya.";
    const acciones = document.createElement("div");
    acciones.className = "actions";
    acciones.append(exportar, importar, archivo, estado);

    const bloque = document.createElement("div");
    bloque.id = "copia-local";
    bloque.style.cssText = "display:flex;flex-direction:column;gap:10px;border-top:1px solid var(--rule);padding-top:20px";
    bloque.append(titulo, texto, resumen, acciones);
    vista.append(bloque);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bloqueCopia);
  else bloqueCopia();
})();
