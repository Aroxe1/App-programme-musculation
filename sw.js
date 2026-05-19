/* MuscuLog Service Worker — cache app shell pour usage offline */
const CACHE_NAME = 'musculog-v10';
const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './auth.js',
  './ranks.js',
  './firebase-config.js',
  './manifest.webmanifest',
  './icon.svg',
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
      // Ignore les erreurs sur les fichiers manquants (ex : icônes PNG si non générées)
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

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Ne pas intercepter les requêtes Firestore/Auth temps réel (long-polling, websockets)
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('firebaseio.com')) {
    return;
  }

  // SDK Firebase (gstatic) : network-first avec fallback cache pour usage hors-ligne
  if (url.hostname === 'www.gstatic.com' && url.pathname.includes('/firebasejs/')) {
    event.respondWith(
      fetch(req).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return resp;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // App shell : cache-first
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(resp => {
        if (resp.ok && url.origin === self.location.origin) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(req, clone));
        }
        return resp;
      }).catch(() => {
        if (req.mode === 'navigate') return caches.match('./index.html');
        return new Response('', { status: 504, statusText: 'Offline' });
      });
    })
  );
});
