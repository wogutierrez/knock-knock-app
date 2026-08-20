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

// --- GPS RE-CENTER LOGIC ---
const recenterBtn = document.getElementById("recenter-btn");

// 1. Standalone function containing the exact location logic
function recenterToUserLocation() {
  if ("geolocation" in navigator) {
    if (recenterBtn) recenterBtn.classList.add("opacity-50");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (window.map) {
          // Smoothly fly map to user's exact coordinates
          window.map.flyTo([latitude, longitude], 18, {
            animate: true,
            duration: 1.5
          });

          // Ensure map recalculates tile layout after flyTo
          window.map.invalidateSize();
        }

        // Create or move user location marker
        if (window.userLocationMarker) {
          window.userLocationMarker.setLatLng([latitude, longitude]);
        } else if (window.map) {
          const userIcon = L.divIcon({
            className: "user-gps-dot",
            html: `<div style="background-color: #3b82f6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59, 130, 246, 0.8);"></div>`,
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          window.userLocationMarker = L.marker([latitude, longitude], {
            icon: userIcon
          }).addTo(window.map);
        }

        if (recenterBtn) recenterBtn.classList.remove("opacity-50");
      },
      (error) => {
        if (recenterBtn) recenterBtn.classList.remove("opacity-50");
        console.error("GPS Error:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  } else {
    alert("Geolocation is not supported by your browser.");
  }
}

// 2. Attach to button click
if (recenterBtn) {
  recenterBtn.addEventListener("click", recenterToUserLocation);
}

// 3. Trigger automatically on page open
document.addEventListener("DOMContentLoaded", () => {
  // Small delay allows Leaflet container to fully render first
  setTimeout(() => {
    recenterToUserLocation();
  }, 300);
});
