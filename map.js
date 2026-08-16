// --- 1. SATELLITE MAP INITIALIZATION ---
// Default centered view
const map = L.map("map").setView([17.8252, 31.0335], 16);

// Load Esri World Imagery Satellite Tiles with Offline Caching
const tileLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution: "Tiles &copy; Esri",

    // ==== CACHE CONFIGURATION ====
    // This tells the plugin to cache tiles using PouchDB
    useCache: true,

    // How many tiles to keep in cache (1000 tiles is about 50-100 MB)
    cacheMaxAge: 1000,

    // Database name (so multiple apps can have separate caches)
    cacheDbName: "knock-knock-tiles"
  }
).addTo(map);

// --- 2. GEOLOCATION POSITIONING ---
if ("geolocation" in navigator) {
  navigator.geolocation.getCurrentPosition((position) => {
    const lat = position.coords.latitude;
    const lng = position.coords.longitude;
    map.setView([lat, lng], 18);

    // Add Current User Location Pin
    L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: "#3b82f6",
      color: "#ffffff",
      weight: 2,
      opacity: 1,
      fillOpacity: 0.9
    })
      .addTo(map)
      .bindPopup("<b>You are here</b>");
  });
}

// Temporary coordinates cache when user taps a roof
let activeTempCoords = null;

// --- 3. ROOF TAP EVENT LISTENER ---
map.on("click", (e) => {
  activeTempCoords = e.latlng;
  document.getElementById("visit-modal").classList.remove("hidden");
});

// ==========================================
// RE-CENTER GPS LOCATION BUTTON
// ==========================================

// Get the button element
const recenterBtn = document.getElementById("recenter-btn");

// Check if the button exists
if (recenterBtn) {
  // Add click event listener
  recenterBtn.addEventListener("click", function () {
    // Show a loading state (optional)
    recenterBtn.textContent = "⏳ Getting location...";
    recenterBtn.style.opacity = "0.7";

    // Check if geolocation is available
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        // SUCCESS: We got the location
        function (position) {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          // Move the map to user's location with zoom level 18
          map.setView([lat, lng], 18);

          // Reset the button
          recenterBtn.innerHTML = "📍 My Location";
          recenterBtn.style.opacity = "1";

          console.log(`📍 Re-centered to: ${lat}, ${lng}`);
        },
        // ERROR: Could not get location
        function (error) {
          console.error("Geolocation error:", error.message);
          alert("Unable to get your location. Please check your GPS settings.");

          // Reset the button
          recenterBtn.innerHTML = "📍 My Location";
          recenterBtn.style.opacity = "1";
        },
        // OPTIONS: High accuracy
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      // Geolocation not supported
      alert("Geolocation is not supported by your browser.");
      recenterBtn.innerHTML = "📍 My Location";
      recenterBtn.style.opacity = "1";
    }
  });
}

// ==========================================
// UI REFERENCES (Used by both pre-fetch and cache button)
// ==========================================

// References to UI elements
const cacheProgress = document.getElementById("cache-progress");
const cacheStatusText = document.getElementById("cache-status-text");
const cacheProgressText = document.getElementById("cache-progress-text");
const cacheProgressBar = document.getElementById("cache-progress-bar");

// ==========================================
// CACHE 1 KM AREA (MANUAL BUTTON)
// ==========================================

// Get the cache button
const cacheAreaBtn = document.getElementById("cache-area-btn");

// Track if caching is in progress
let isCaching = false;

/**
 * Cache tiles for a 1 km radius around a given center
 */

function cacheArea(lat, lng) {
  if (isCaching) {
    alert("Cache is already in progress. Please wait.");
    return;
  }
  isCaching = true;

  // Show the progress toast
  cacheProgress.classList.remove("hidden");
  cacheStatusText.textContent = "📥 Caching 1 km area...";
  cacheProgressBar.style.width = "0%";

  // Generate tiles for zoom 18 only
  const tiles = [];
  const zoom = 18;
  const tilesPerSide = Math.pow(2, zoom);

  function latLngToTile(lat, lng) {
    const x = Math.floor(((lng + 180) / 360) * tilesPerSide);
    const y = Math.floor(
      ((1 -
        Math.log(
          Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)
        ) /
          Math.PI) /
        2) *
        tilesPerSide
    );
    return { x, y };
  }

  const centerTile = latLngToTile(lat, lng);
  const tileRadius = 2;

  for (let dx = -tileRadius; dx <= tileRadius; dx++) {
    for (let dy = -tileRadius; dy <= tileRadius; dy++) {
      const x = centerTile.x + dx;
      const y = centerTile.y + dy;

      if (x >= 0 && x < tilesPerSide && y >= 0 && y < tilesPerSide) {
        tiles.push({ x, y, z: zoom });
      }
    }
  }

  const totalTiles = tiles.length;
  cacheProgressText.textContent = `0 / ${totalTiles} tiles (1 km)`;

  console.log(`📥 Caching ${totalTiles} tiles for 1 km area`);
  console.log(`📍 Center: ${lat}, ${lng}`);

  let fetched = 0;

  function fetchNextTile() {
    if (fetched >= totalTiles) {
      // Done!
      cacheStatusText.textContent = "✅ 1 km area cached!";
      cacheProgressText.textContent = `${totalTiles} / ${totalTiles} tiles`;
      cacheProgressBar.style.width = "100%";
      isCaching = false;

      // ====== RESET THE BUTTON ======
      const cacheAreaBtn = document.getElementById("cache-area-btn");
      if (cacheAreaBtn) {
        cacheAreaBtn.textContent = "📥 Cache 1 km";
        cacheAreaBtn.style.opacity = "1";
      }

      setTimeout(() => {
        cacheProgress.classList.add("hidden");
      }, 3000);

      console.log("✅ Cache complete!");
      return;
    }

    const tile = tiles[fetched];
    const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${tile.z}/${tile.y}/${tile.x}`;

    fetch(tileUrl, { mode: "cors" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.blob();
      })
      .catch((error) => {
        // Don't stop on errors
      })
      .finally(() => {
        fetched++;
        const percent = Math.min(100, Math.round((fetched / totalTiles) * 100));
        cacheProgressText.textContent = `${fetched} / ${totalTiles} tiles (1 km)`;
        cacheProgressBar.style.width = `${percent}%`;

        setTimeout(fetchNextTile, 80);
      });
  }

  fetchNextTile();
}

// Add click event to the button
if (cacheAreaBtn) {
  // Function to handle the cache action
  function handleCacheAction(e) {
    e.preventDefault(); // Prevent any default behavior

    // Change button text to show it was clicked
    this.textContent = "⏳ Working...";
    this.style.opacity = "0.7";

    // Get the current map center
    const center = map.getCenter();
    const lat = center.lat;
    const lng = center.lng;

    console.log(`📍 Caching area around: ${lat}, ${lng}`);
    cacheArea(lat, lng);
  }

  // Add both events
  cacheAreaBtn.addEventListener("click", handleCacheAction);
  cacheAreaBtn.addEventListener("touchstart", handleCacheAction);

  console.log("✅ Cache button is ready!");
}
