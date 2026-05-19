/* NextRep Service Worker — network-first pour l'app shell, cache = fallback offline */
const CACHE_NAME = 'nextrep-v6';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './auth.js',
  './ranks.js',
  './firebase-config.js',
  './manifest.webmanifest',
  './logo_app.png',
  './fonts/Gloock-Regular.ttf',
  './fonts/BricolageGrotesque-Regular.ttf',
  './fonts/BricolageGrotesque-Bold.ttf',
  './fonts/GeistMono-Regular.ttf',
  './rank-logos/rank-bronze.png',
  './rank-logos/rank-argent.png',
  './rank-logos/rank-or.png',
  './rank-logos/rank-platine.png',
  './rank-logos/rank-diamant.png',
  './rank-logos/rank-emeraude.png',
  './rank-logos/rank-maitre.png',
  './rank-logos/rank-grand-maitre.png',
  './rank-logos/rank-virtuose.png',
  './rank-logos/rank-dieu-grec.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.all(ASSETS.map(url =>
        cache.add(url).catch(err => console.warn('SW: skip', url, err.message))
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Permet à la page de demander au SW de skipWaiting (utilisé pour l'auto-update)
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Ne pas intercepter les requêtes Firestore/Auth temps réel
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('firebaseio.com')) {
    return;
  }

  // SDK Firebase (gstatic) : network-first avec fallback cache
  if (url.hostname === 'www.gstatic.com' && url.pathname.includes('/firebasejs/')) {
    event.respondWith(networkFirst(req));
    return;
  }

  // App shell same-origin : network-first → fallback cache (offline)
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req));
    return;
  }
});

function networkFirst(req) {
  return fetch(req).then(resp => {
    if (resp && resp.ok) {
      const clone = resp.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
    }
    return resp;
  }).catch(() => caches.match(req).then(cached => {
    if (cached) return cached;
    if (req.mode === 'navigate') return caches.match('./index.html');
    return new Response('', { status: 504, statusText: 'Offline' });
  }));
}
