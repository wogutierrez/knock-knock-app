// --- 1. SATELLITE MAP INITIALIZATION ---
// Default centered view
const map = L.map("map").setView([17.8252, 31.0335], 16);

// Load Esri World Imagery Satellite Tiles
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution: "Tiles &copy; Esri"
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
