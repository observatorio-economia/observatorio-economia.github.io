/* Generado por actualizar.sh: no editar a mano. Web instalable del Observatorio. */
const VERSION = "obs-724484ebe4b7";
const ARCHIVOS = [
"./",
"actualidad/datos.json",
"actualidad/index.html",
"assets/comun/observatorio-common.css",
"assets/comun/observatorio-common.js",
"assets/estado-web.js",
"assets/estilo.css",
"assets/icono/apple-touch-icon.png",
"assets/icono/favicon-32.png",
"assets/icono/icono-192.png",
"assets/icono/icono-512-maskable.png",
"assets/icono/icono-512.png",
"assets/menu.js",
"assets/observatorio.css",
"datos/index.html",
"index.html",
"libro/index.html",
"manifest.webmanifest",
"sa01/herramientas/index.html",
"sa01/index.html",
"sa01/s01.html",
"sa01/s02.html",
"sa01/s03.html",
"sa01/s04.html",
"sa01/s05.html",
"sa01/s06.html",
"sa01/s07.html",
"sa01/s08.html",
"sa01/s09.html",
"sa01/s10.html",
"sa01/s11.html",
"sa01/s12.html",
"sa02/index.html",
"sa03/index.html",
"sa04/index.html",
"sa05/index.html",
"sa06/index.html",
"sa08/index.html",
"sa09/index.html"
];
const FUENTES = "obs-fuentes";

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSION && k !== FUENTES).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Con red: lo último (y se guarda); si la red tarda más de 4 s o no hay, la copia guardada
function redPrimero(req) {
  const red = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(VERSION).then(k => k.put(req, c)); } return r; });
  const espera = new Promise(res => setTimeout(res, 4000));
  return Promise.race([red, espera.then(() => caches.match(req, { ignoreSearch: true }))])
    .then(r => r || red)
    .catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || (req.mode === "navigate" ? caches.match("./index.html") : Response.error())));
}
self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === location.origin) { e.respondWith(redPrimero(req)); return; }
  // Letras de Google: se guardan la primera vez y después se sirven desde el dispositivo
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FUENTES).then(c => c.match(req).then(r => r || fetch(req).then(n => { c.put(req, n.clone()); return n; }))));
  }
});
