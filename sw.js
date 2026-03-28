const CACHE = 'gym-v7';

// Use a dynamic base so paths work on any hosting (GitHub Pages, localhost, etc.)
const BASE = self.location.pathname.replace('/sw.js', '');

const ASSETS = [
  `${BASE}/`,
  `${BASE}/index.html`,
  `${BASE}/css/style.css`,
  `${BASE}/js/db.js`,
  `${BASE}/js/ai.js`,
  `${BASE}/js/exercises.js`,
  `${BASE}/js/presets.js`,
  `${BASE}/js/app.js`,
  `${BASE}/js/views/today.js`,
  `${BASE}/js/views/workout.js`,
  `${BASE}/js/views/program.js`,
  `${BASE}/js/views/generate.js`,
  `${BASE}/js/views/history.js`,
  `${BASE}/js/views/settings.js`,
  `${BASE}/js/views/builder.js`,
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.url.includes('anthropic.com')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
