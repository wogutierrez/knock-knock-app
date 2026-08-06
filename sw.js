const CACHE_NAME = "knock-knock-v1";

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        "./",
        "./index.html",
        "./style.css",
        "./map.js",
        "./records.js",
        "./settings.js",
        "./app.js",
        "./manifest.json"
      ]);
    })
  );
});
