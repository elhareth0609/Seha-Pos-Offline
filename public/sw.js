// Service Worker

const CACHE_NAME = 'midgram-cache-v1';
const urlsToCache = [
  '/',
  '/login',
  '/sales',
  '/inventory',
  '/purchases',
  '/suppliers',
  '/reports',
  '/expenses',
  '/tasks',
  '/item-movement',
  '/patients',
  '/expiring-soon',
  '/trash',
  '/guide',
  '/settings',
  '/hr',
  '/exchange',
  '/offers',
  '/clinical-training',
  '/globals.css',
  '/icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  // We only want to handle GET requests for caching.
  // POST, PUT, DELETE requests will be handled by the background sync.
  if (event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('sync', function(event) {
  if (event.tag === 'sync-requests') {
    event.waitUntil(syncOfflineRequests());
  }
});

function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('offline-requests-db', 1);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('requests')) {
                db.createObjectStore('requests', { autoIncrement: true, keyPath: 'id' });
            }
        };
        request.onsuccess = event => resolve(event.target.result);
        request.onerror = event => reject(event.target.error);
    });
}

async function syncOfflineRequests() {
  const db = await openDB();
  const tx = db.transaction('requests', 'readwrite');
  const store = tx.objectStore('requests');
  const requests = await new Promise((resolve, reject) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
  });
  
  if (requests && requests.length > 0) {
    for(const req of requests) {
        try {
            const response = await fetch(req.url, req.options);
            if(response.ok) {
                 await new Promise((resolve, reject) => {
                    const deleteRequest = store.delete(req.id);
                    deleteRequest.onsuccess = resolve;
                    deleteRequest.onerror = reject;
                });
            }
        } catch(e) {
            console.error('Failed to sync request:', req, e);
        }
    }
  }
}
