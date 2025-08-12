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

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});