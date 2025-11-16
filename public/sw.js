
const CACHE_NAME = 'midgram-pos-cache-v2'; // Bumped version to ensure new SW is installed
const urlsToCache = [
  '/',
  '/login',
  '/dashboard',
  '/manifest.json',
  '/favicon.png',
  '/landing/f695b7c1-a4db-4a2c-9044-9a3530dc8159.png',
  // Add other important assets for offline access
];

// On install, cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache and caching files');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('Failed to cache files:', err);
      })
  );
});

// On activate, clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(name => name !== CACHE_NAME)
                 .map(name => caches.delete(name))
      );
    })
  );
});

// On fetch, serve from cache first, then network
self.addEventListener('fetch', event => {
  const { request } = event;

  // For navigation requests, use a network-first strategy to ensure users get the latest pages.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => {
        // If the network fails, serve the root path from the cache as a fallback.
        return caches.match('/');
      })
    );
    return;
  }

  // For other requests (assets like images, CSS, JS), use a cache-first strategy.
  event.respondWith(
    caches.match(request).then(response => {
      // If we have a cached response, return it.
      if (response) {
        return response;
      }

      // Otherwise, fetch from the network.
      return fetch(request).then(networkResponse => {
        // And cache the new response for future use.
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(request, networkResponse.clone());
          return networkResponse;
        });
      });
    })
  );
});

// Background Sync for offline requests
function openDB() {
    return new Promise((resolve, reject) => {
        const request = self.indexedDB.open('offline-requests-db', 1);
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

async function syncRequests() {
    const db = await openDB();
    const tx = db.transaction('requests', 'readwrite');
    const store = tx.objectStore('requests');
    const requests = await new Promise((resolve, reject) => {
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });

    if (requests && requests.length > 0) {
        for (const req of requests) {
            try {
                const response = await fetch(req.url, req.options);
                if (response.ok) {
                   await new Promise((resolve, reject) => {
                        const deleteReq = store.delete(req.id);
                        deleteReq.onsuccess = resolve;
                        deleteReq.onerror = reject;
                   });
                }
            } catch (error) {
                console.error('Sync failed for request:', req.url, error);
            }
        }
    }
}

self.addEventListener('sync', event => {
    if (event.tag === 'sync-requests') {
        event.waitUntil(syncRequests());
    }
});
