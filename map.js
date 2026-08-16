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
// 20 KM TILE PRE-FETCHER (SIMPLIFIED)
// ==========================================

// References to UI elements
const cacheProgress = document.getElementById("cache-progress");
const cacheStatusText = document.getElementById("cache-status-text");
const cacheProgressText = document.getElementById("cache-progress-text");
const cacheProgressBar = document.getElementById("cache-progress-bar");

// Configuration - 5 km radius at zoom 18 only
const PRE_FETCH_RADIUS_KM = 5; // 5 km radius (much more reasonable!)
const MIN_ZOOM = 18; // Only zoom 18 (most detailed)
const MAX_ZOOM = 18; // Only zoom 18

// Track pre-fetch state
let isPreFetching = false;

/**
 * Calculate the bounding box for a given radius around a point
 */
function getBoundingBox(lat, lng, radiusKm) {
  // 1 degree of latitude ≈ 111 km
  const latDelta = radiusKm / 111;
  // 1 degree of longitude ≈ 111 km * cos(latitude)
  const lngDelta = radiusKm / (111 * Math.cos((lat * Math.PI) / 180));

  return {
    minLat: lat - latDelta,
    maxLat: lat + latDelta,
    minLng: lng - lngDelta,
    maxLng: lng + lngDelta
  };
}

/**
 * Generate all tile coordinates within a bounding box (SIMPLIFIED)
 */
function getTilesInBoundingBox(bounds, zoom) {
  const tiles = [];
  const tilesPerSide = Math.pow(2, zoom);

  // Convert lat/lng to tile coordinates
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

  // Get tile coordinates for corners
  const topLeft = latLngToTile(bounds.maxLat, bounds.minLng);
  const bottomRight = latLngToTile(bounds.minLat, bounds.maxLng);

  // Limit the range to avoid huge numbers
  const minX = Math.max(0, topLeft.x);
  const maxX = Math.min(tilesPerSide - 1, bottomRight.x);
  const minY = Math.max(0, topLeft.y);
  const maxY = Math.min(tilesPerSide - 1, bottomRight.y);

  // Generate all tiles in the range
  for (let x = minX; x <= maxX; x++) {
    for (let y = minY; y <= maxY; y++) {
      // Validate tile coordinates are within bounds
      if (x >= 0 && x < tilesPerSide && y >= 0 && y < tilesPerSide) {
        tiles.push({ x, y, z: zoom });
      }
    }
  }

  return tiles;
}

/**
 * Pre-fetch tiles in the background
 */
function preFetchTiles(lat, lng) {
  // Prevent multiple pre-fetch runs
  if (isPreFetching) {
    console.log("⏳ Pre-fetch already in progress");
    return;
  }
  isPreFetching = true;

  // Show the progress toast
  cacheProgress.classList.remove("hidden");
  cacheStatusText.textContent = "Calculating tiles...";
  cacheProgressBar.style.width = "0%";

  // Calculate bounding box
  const bounds = getBoundingBox(lat, lng, PRE_FETCH_RADIUS_KM);

  // Generate all tile coordinates for zooms 16-18 only
  let allTiles = [];
  for (let zoom = MIN_ZOOM; zoom <= MAX_ZOOM; zoom++) {
    const tiles = getTilesInBoundingBox(bounds, zoom);
    allTiles = allTiles.concat(tiles);
    console.log(`Zoom ${zoom}: ${tiles.length} tiles`);
  }

  const totalTiles = allTiles.length;

  // Safety check - if too many tiles, warn and use zoom 17-18 only
  if (totalTiles > 10000) {
    console.warn(`Too many tiles (${totalTiles}), reducing to zoom 17-18 only`);
    // Use only zoom 17-18
    allTiles = [];
    for (let zoom = 17; zoom <= MAX_ZOOM; zoom++) {
      const tiles = getTilesInBoundingBox(bounds, zoom);
      allTiles = allTiles.concat(tiles);
    }
  }

  const finalTotal = allTiles.length;
  cacheStatusText.textContent = `Pre-fetching ${finalTotal} tiles...`;
  cacheProgressText.textContent = `0 / ${finalTotal} tiles`;

  console.log(`📦 Pre-fetching ${finalTotal} tiles for 20 km radius`);
  console.log(`📊 Estimated storage: ~${Math.round(finalTotal * 0.05)} MB`);

  // Pre-fetch tiles one by one
  let fetched = 0;

  function fetchNextTile() {
    if (fetched >= finalTotal) {
      // Done!
      cacheStatusText.textContent = "✅ Cache complete!";
      cacheProgressText.textContent = `${finalTotal} / ${finalTotal} tiles`;
      cacheProgressBar.style.width = "100%";
      isPreFetching = false;

      setTimeout(() => {
        cacheProgress.classList.add("hidden");
      }, 3000);

      console.log("✅ Pre-fetch complete!");
      return;
    }

    const tile = allTiles[fetched];
    const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${tile.z}/${tile.y}/${tile.x}`;

    // Use fetch to pre-load the tile
    fetch(tileUrl, { mode: "cors" })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }
        return response.blob();
      })
      .catch((error) => {
        // Don't stop on errors
        // console.debug(`Tile ${tile.x},${tile.y},${tile.z}: ${error.message}`);
      })
      .finally(() => {
        fetched++;
        const percent = Math.min(100, Math.round((fetched / finalTotal) * 100));
        cacheProgressText.textContent = `${fetched} / ${finalTotal} tiles`;
        cacheProgressBar.style.width = `${percent}%`;

        // Fetch next tile with a small delay
        setTimeout(fetchNextTile, 50);
      });
  }

  // Start fetching
  fetchNextTile();
}

/**
 * Start pre-fetching when location is available
 */
function startPreFetch() {
  if ("geolocation" in navigator) {
    navigator.geolocation.getCurrentPosition(
      function (position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        console.log(`📍 Starting pre-fetch at: ${lat}, ${lng}`);
        // Small delay to let map settle
        setTimeout(() => preFetchTiles(lat, lng), 1000);
      },
      function (error) {
        console.warn("Cannot start pre-fetch:", error.message);
        // Try again in 10 seconds
        setTimeout(startPreFetch, 10000);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );
  }
}

// Start pre-fetch when the page loads (wait 5 seconds)
setTimeout(startPreFetch, 5000);
