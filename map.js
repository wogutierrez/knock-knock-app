// --- 1. SATELLITE MAP INITIALIZATION ---
// Default centered view
const map = L.map("map").setView([17.8252, 31.0335], 16);

// Load Esri World Imagery Satellite Tiles with Offline Caching
const tileLayer = L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution: "Tiles &copy; Esri",
    useCache: true,
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
const recenterBtn = document.getElementById("recenter-btn");

if (recenterBtn) {
  recenterBtn.addEventListener("click", function () {
    recenterBtn.textContent = "⏳ Getting location...";
    recenterBtn.style.opacity = "0.7";

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          map.setView([lat, lng], 18);
          recenterBtn.innerHTML = "📍 My Location";
          recenterBtn.style.opacity = "1";
        },
        function (error) {
          console.error("Geolocation error:", error.message);
          alert("Unable to get location. Please check GPS settings.");
          recenterBtn.innerHTML = "📍 My Location";
          recenterBtn.style.opacity = "1";
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
      recenterBtn.innerHTML = "📍 My Location";
      recenterBtn.style.opacity = "1";
    }
  });
}

// ==========================================
// TILE PRE-FETCH & TOAST NOTIFICATION LOGIC
// ==========================================
const downloadBtn = document.getElementById("download-tiles-btn");
const tileToast = document.getElementById("tile-toast");
const toastTitle = document.getElementById("toast-title");
const toastCounter = document.getElementById("toast-counter");
const progressBar = document.getElementById("toast-progress-bar");

if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const bbox = map.getBounds();
    // Seed zooms 15 to 18 for current map bounding box
    tileLayer.seed(bbox, 15, 18);
  });
}

// Event 1: Seeding Starts
tileLayer.on("seedstart", (e) => {
  if (tileToast) tileToast.classList.remove("hidden");
  if (toastTitle) toastTitle.innerText = "Caching Area Tiles...";
  if (toastCounter) toastCounter.innerText = `0 / ${e.queueLength}`;
  if (progressBar) progressBar.style.width = "0%";
  if (downloadBtn) downloadBtn.disabled = true;
});

// Event 2: Seeding Progress Update
tileLayer.on("seedprogress", (e) => {
  const percent = Math.round((e.processed / e.queueLength) * 100);
  if (toastCounter)
    toastCounter.innerText = `${e.processed} / ${e.queueLength}`;
  if (progressBar) progressBar.style.width = `${percent}%`;
});

// Event 3: Seeding Complete
tileLayer.on("seedend", () => {
  if (toastTitle) toastTitle.innerText = "✓ Area Downloaded!";
  if (progressBar) progressBar.style.width = "100%";
  if (downloadBtn) downloadBtn.disabled = false;

  // Auto-hide toast after 3 seconds
  setTimeout(() => {
    if (tileToast) tileToast.classList.add("hidden");
  }, 3000);
});

// Event 4: Seeding Error Handling
tileLayer.on("seederror", (err) => {
  console.error("Tile seeding error:", err);
  if (toastTitle) toastTitle.innerText = "Error Caching Tiles";
  if (downloadBtn) downloadBtn.disabled = false;
});
