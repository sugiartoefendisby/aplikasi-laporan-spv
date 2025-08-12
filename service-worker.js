const CACHE_NAME = 'laporan-spv-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login-style.css',
  '/login.js',
  '/report-form.html',
  '/report-style.css',
  '/report.js',
  '/icon-192.png',
  '/icon-512.png'
];

// Install Service Worker dan simpan file ke cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// Ambil dari cache dulu, kalau tidak ada baru fetch dari jaringan
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
