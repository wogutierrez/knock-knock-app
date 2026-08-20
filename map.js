// Initialize map globally on the window object
window.map = L.map("map").setView([-17.8252, 31.0335], 16);

// Satellite Tile Layer (Esri)
L.tileLayer(
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
  {
    maxZoom: 19,
    attribution: "Tiles &copy; Esri"
  }
).addTo(window.map);

// --- ROOF TAP EVENT LISTENER ---
window.map.on("click", (e) => {
  window.activeTempCoords = e.latlng;

  // Execute populator safely across Android Chrome & Desktop Windows
  if (typeof window.populateModalDefaults === "function") {
    window.populateModalDefaults();
  }

  const visitModal = document.getElementById("visit-modal");
  if (visitModal) {
    visitModal.classList.remove("hidden");
  }
});
