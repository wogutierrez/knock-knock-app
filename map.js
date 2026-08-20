// ==========================================================
// MAP INITIALIZATION & TILE SETUP
// ==========================================================
// Initialize Leaflet instance on #map
const map = L.map("map").setView([0, 0], 2);
window.map = map;

// Load OpenStreetMap Tiles
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: "© OpenStreetMap contributors"
}).addTo(map);

// ==========================================================
// GPS AUTO-CENTER & RE-CENTER LOGIC
// ==========================================================
const recenterBtn = document.getElementById("recenter-btn");

function recenterToUserLocation() {
  if ("geolocation" in navigator) {
    if (recenterBtn) recenterBtn.classList.add("opacity-50");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;

        if (window.map) {
          // Re-calculate map container bounds
          window.map.invalidateSize();

          // Fly map smoothly to GPS location
          window.map.flyTo([latitude, longitude], 18, {
            animate: true,
            duration: 1.5
          });
        }

        // Create or reposition custom blue marker
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

// Bind button event
if (recenterBtn) {
  recenterBtn.addEventListener("click", recenterToUserLocation);
}

// Auto-run location request as soon as DOM content finishes loading
document.addEventListener("DOMContentLoaded", () => {
  setTimeout(() => {
    recenterToUserLocation();
  }, 300);
});
