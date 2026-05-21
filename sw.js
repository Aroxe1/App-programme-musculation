/* NextRep Service Worker — network-first pour l'app shell, cache = fallback offline
 *
 * IMPORTANT À CHAQUE DÉPLOIEMENT :
 *  1) Bump CACHE_NAME ci-dessous (ex: nextrep-v8 → nextrep-v9)
 *  2) Bump APP_VERSION dans app.js (même valeur)
 *  3) Bump "version" dans version.json (même valeur)
 *  4) firebase deploy --only hosting
 */
const CACHE_NAME = 'nextrep-v15';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/css/styles.css',
  './src/js/app.js',
  './src/js/auth.js',
  './src/js/ranks.js',
  './src/js/body-paths.js',
  './src/js/firebase-config.js',
  './assets/logo_app.png',
  './assets/fonts/Gloock-Regular.ttf',
  './assets/fonts/BricolageGrotesque-Regular.ttf',
  './assets/fonts/BricolageGrotesque-Bold.ttf',
  './assets/fonts/GeistMono-Regular.ttf',
  './assets/rank-logos/rank-bronze.png',
  './assets/rank-logos/rank-argent.png',
  './assets/rank-logos/rank-or.png',
  './assets/rank-logos/rank-platine.png',
  './assets/rank-logos/rank-diamant.png',
  './assets/rank-logos/rank-emeraude.png',
  './assets/rank-logos/rank-maitre.png',
  './assets/rank-logos/rank-grand-maitre.png',
  './assets/rank-logos/rank-virtuose.png',
  './assets/rank-logos/rank-dieu-grec.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      // On force le réseau frais pour peupler le cache du nouveau SW
      // (sinon on risque de capturer des assets stale via le HTTP cache du navigateur)
      Promise.all(ASSETS.map(url =>
        fetch(url, { cache: 'no-store' })
          .then(resp => (resp && resp.ok) ? cache.put(url, resp.clone()) : null)
          .catch(err => console.warn('SW: skip', url, err.message))
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

  // /version.json : JAMAIS mis en cache, toujours réseau frais. Fallback vide hors-ligne.
  if (url.origin === self.location.origin && url.pathname.endsWith('/version.json')) {
    event.respondWith(
      fetch(req.url, { cache: 'no-store' }).catch(() =>
        new Response('{}', { headers: { 'Content-Type': 'application/json' } })
      )
    );
    return;
  }

  // Ne pas intercepter les requêtes Firestore/Auth temps réel
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('firebaseio.com')) {
    return;
  }

  // SDK Firebase (gstatic) : network-first avec fallback cache
  if (url.hostname === 'www.gstatic.com' && url.pathname.includes('/firebasejs/')) {
    event.respondWith(networkFirst(req, false));
    return;
  }

  // App shell same-origin : network-first → fallback cache (offline)
  if (url.origin === self.location.origin) {
    event.respondWith(networkFirst(req, true));
    return;
  }
});

function networkFirst(req, bypassHttpCache) {
  // Pour l'app shell same-origin, on bypass le cache HTTP du navigateur :
  // sinon fetch() peut renvoyer une vieille version cachée par le navigateur.
  const fetchPromise = bypassHttpCache
    ? fetch(req.url, { cache: 'no-store', credentials: 'same-origin' })
    : fetch(req);

  return fetchPromise.then(resp => {
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
