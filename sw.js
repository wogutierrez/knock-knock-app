const APP_SHELL_CACHE = "knock-knock-v3";
const TILE_CACHE = "esri-satellite-cache-v1";

const APP_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./map.js",
  "./records.js",
  "./settings.js",
  "./app.js",
  "./manifest.json"
];

// 1. Install Event: Pre-cache App Shell
self.addEventListener("install", (e) => {
  self.skipWaiting();
  e.waitUntil(
    caches.open(APP_SHELL_CACHE).then((cache) => {
      return cache.addAll(APP_ASSETS);
    })
  );
});

// 2. Activate Event: Clean up old cache versions
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== APP_SHELL_CACHE && cache !== TILE_CACHE) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. Fetch Event: Intercept app requests & auto-cache satellite tiles
self.addEventListener("fetch", (e) => {
  const url = e.request.url;

  // Intercept Esri Tile Requests for Auto-Caching
  if (
    url.includes(
      "server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile"
    )
  ) {
    e.respondWith(
      caches.open(TILE_CACHE).then((cache) => {
        return cache.match(e.request).then((cachedResponse) => {
          if (cachedResponse) {
            // Serve cached tile immediately, refresh in background when online
            fetch(e.request)
              .then((networkResponse) => {
                if (networkResponse && networkResponse.status === 200) {
                  cache.put(e.request, networkResponse.clone());
                }
              })
              .catch(() => {
                /* Silence network errors when offline */
              });

            return cachedResponse;
          }

          // Fetch from network, cache, and return
          return fetch(e.request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                cache.put(e.request, networkResponse.clone());
              }
              return networkResponse;
            })
            .catch((err) => console.error("Offline tile missing:", err));
        });
      })
    );
    return;
  }

  // General App Assets (Cache First with Network Fallback)
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request);
    })
  );
});
