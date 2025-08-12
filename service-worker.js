const CACHE_NAME = 'laporan-spv-cache-v2';
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

// Install & cache files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting();
});

// Activate & clean old cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch handler (offline first)
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});

// IndexedDB helpers
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('laporanDB', 1);
    request.onupgradeneeded = event => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('reports')) {
        db.createObjectStore('reports', { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveReport(data) {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reports', 'readwrite');
      tx.objectStore('reports').add(data);
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  });
}

function getReports() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reports', 'readonly');
      const store = tx.objectStore('reports');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = reject;
    });
  });
}

function clearReports() {
  return openDB().then(db => {
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reports', 'readwrite');
      tx.objectStore('reports').clear();
      tx.oncomplete = resolve;
      tx.onerror = reject;
    });
  });
}

// Background sync handler
self.addEventListener('sync', event => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncReports());
  }
});

async function syncReports() {
  const reports = await getReports();
  for (let report of reports) {
    try {
      await fetch('https://script.google.com/macros/s/AKfycbxcFu98N9gaEU8TEN0OMqDopNbm0xfIfGCoF-R1a6v3JdXA0PbU3m_cfMywU2AVfs9Paw/exec', {
        method: 'POST',
        body: JSON.stringify(report),
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (err) {
      console.error('Gagal sync:', err);
    }
  }
  await clearReports();
}

// Message listener
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SAVE_REPORT') {
    saveReport(event.data.payload).then(() => {
      self.registration.sync.register('sync-reports');
    });
  }
});