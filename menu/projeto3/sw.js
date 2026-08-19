/* ===========================================================
   SERVICE WORKER — cache do app shell para instalação/uso offline
   Precisa ficar na raiz do site (não em js/) para o escopo cobrir
   a origem inteira; roda num contexto isolado (não é um dos
   "scripts clássicos" descritos no CLAUDE.md).
   =========================================================== */
const CACHE_NAME = 'genshas-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './styles/main.css',
  './manifest.webmanifest',
  './js/state.js',
  './js/rules-engine.js',
  './js/theme.js',
  './js/api.js',
  './js/item-helpers.js',
  './js/autocomplete.js',
  './js/characters.js',
  './js/render-list.js',
  './js/planner.js',
  './js/manual-modal.js',
  './js/pity-modal.js',
  './js/rules-modal.js',
  './js/share-card.js',
  './js/export.js',
  './js/device.js',
  './js/validation.js',
  './js/search-scope.js',
  './js/main.js',
  './js/analytics.js',
  './js/sw-register.js',
  './assets/favicon.svg',
  './assets/favicon.png',
  './assets/apple-touch-icon.png',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-512-maskable.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Só intercepta pedidos de mesma origem (o app shell). CDNs (Tailwind, Lucide,
// SortableJS, html2canvas, fontes) e a API de personagens/armas seguem direto
// para a rede — não faz sentido cachear/servir versões antigas delas.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
