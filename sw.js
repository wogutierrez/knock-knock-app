const CACHE_NAME = "knock-knock-app-v1";
const TILE_CACHE = "esri-satellite-cache-v1";

const APP_ASSETS = [
  "./",
  "./index.html",
  "./style.css",
  "./records.js",
  "./settings.js",
  "./app.js",
  "./map.js",
  "./manifest.json",
  "https://cdn.tailwindcss.com",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
];

// 1. Install & Activate immediately with pre-cached assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== TILE_CACHE) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// 2. Fetch Strategy: Network-First for HTML/JS (Fresh code), Cache-First for Satellite Maps
self.addEventListener("fetch", (e) => {
  const url = e.request.url;

  // Esri Map Satellite Tiles (Cache First for offline map performance)
  if (
    url.includes(
      "server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile"
    )
  ) {
    e.respondWith(
      caches.open(TILE_CACHE).then((cache) =>
        cache.match(e.request).then((cached) => {
          if (cached) return cached;
          return fetch(e.request).then((networkRes) => {
            if (networkRes && networkRes.status === 200) {
              cache.put(e.request, networkRes.clone());
            }
            return networkRes;
          });
        })
      )
    );
    return;
  }

  // App Shell (HTML/JS/CSS): Network-First to guarantee latest code when online
  e.respondWith(
    fetch(e.request)
      .then((networkRes) => {
        if (
          networkRes &&
          networkRes.status === 200 &&
          e.request.method === "GET"
        ) {
          const resClone = networkRes.clone();
          caches
            .open(CACHE_NAME)
            .then((cache) => cache.put(e.request, resClone));
        }
        return networkRes;
      })
      .catch(() => caches.match(e.request)) // Fallback to cached version if offline
  );
});

// Listen for version request from index.html
self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
});
