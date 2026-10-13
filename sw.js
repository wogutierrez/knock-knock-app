const CACHE_NAME = "knock-knock-app-v2"; // FIX: Bumped v1 -> v2 to force cache purge
const TILE_CACHE = "esri-satellite-cache-v2"; // FIX: Also bump tile cache

// ==========================================
// FIX: OLD APP_ASSETS INCLUDED CDN URLS - BROKE INSTALL
// OLD (BUGGY):
// const APP_ASSETS = [
//   "./",
//   "./index.html",
//   "./style.css", // file didn't exist, caused 404 fail
//   "./records.js",
//   "./settings.js",
//   "./app.js",
//   "./map.js",
//   "./manifest.json",
//   "https://cdn.tailwindcss.com", // CORS fails addAll, aborts whole install
//   "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css",
//   "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
// ];
// WHY BAD: cache.addAll fails entirely if ONE URL 404s or CORS-blocked.
// Tailwind CDN has no CORS headers for cache, so install event threw.
// ==========================================

// NEW: Only precache LOCAL assets that are guaranteed to exist and be same-origin
const APP_ASSETS = [
  "./",
  "./index.html",
  "./records.js",
  "./admin.js",
  "./sync.js",
  "./map.js",
  "./settings.js",
  "./app.js",
  "./manifest.json"
  // style.css is optional, will be cached via network-first fetch handler if exists
];

// 1. Install & Activate immediately with pre-cached assets
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use individual add with catch so one failure doesn't kill all
      return Promise.allSettled(
        APP_ASSETS.map(url => cache.add(url).catch(err => console.warn(`Failed to precache ${url}:`, err)))
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          // FIX: Delete old v1 caches when v2 activates
          if (key !== CACHE_NAME && key !== TILE_CACHE) {
            console.log("Deleting old cache:", key);
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
          }).catch(() => cached); // FIX: Fallback to cached even if fetch fails after cache miss
        })
      )
    );
    return;
  }

  // App Shell (HTML/JS/CSS): Network-First to guarantee latest code when online
  // FIX: Skip non-GET and chrome-extension requests
  if (e.request.method !== "GET" || url.startsWith("chrome-extension://")) return;

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
      .catch(() => caches.match(e.request).then(cached => {
        // If no cache, try return index.html for navigation requests (SPA fallback)
        if (cached) return cached;
        if (e.request.mode === 'navigate') {
          return caches.match("./index.html");
        }
        return null;
      }))
  );
});

// Listen for version request from index.html
self.addEventListener("message", (event) => {
  if (event.data && event.data.action === "GET_VERSION") {
    event.ports[0].postMessage({ version: CACHE_NAME });
  }
  // FIX: Allow skipWaiting via message for immediate update
  if (event.data && event.data.action === "SKIP_WAITING") {
    self.skipWaiting();
  }
});