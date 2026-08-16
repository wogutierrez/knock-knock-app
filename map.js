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
