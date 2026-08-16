// ==========================================
// LOCAL STORAGE PERSISTENCE & RECORDS MANAGEMENT
// ==========================================

// Key used to store records in localStorage
const STORAGE_KEY = "knock-knock-visits";

// Global visit records array
let visitRecords = [];

// Track active Leaflet markers in memory so we can remove them cleanly
let activeMarkers = {};

/**
 * Save visit records to localStorage
 */
function saveRecords() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visitRecords));
    console.log(`💾 Saved ${visitRecords.length} records to localStorage`);
  } catch (error) {
    console.error("Error saving records:", error);
  }
}

/**
 * Load visit records from localStorage
 */
function loadRecords() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      visitRecords = JSON.parse(data);
      console.log(`📂 Loaded ${visitRecords.length} records from localStorage`);
      return true;
    } else {
      console.log("📂 No saved records found");
      return false;
    }
  } catch (error) {
    console.error("Error loading records:", error);
    visitRecords = [];
    return false;
  }
}

/**
 * Recreate all pins on the map from saved records
 */
function recreatePins() {
  // Only run if Leaflet map instance exists
  if (typeof map === "undefined") {
    console.log("⏳ Map not ready yet, retrying pin creation...");
    setTimeout(recreatePins, 300);
    return;
  }

  // Clear existing rendered markers to avoid duplicate overlays
  Object.keys(activeMarkers).forEach((id) => {
    if (activeMarkers[id]) {
      map.removeLayer(activeMarkers[id]);
    }
  });
  activeMarkers = {};

  console.log(`📍 Recreating ${visitRecords.length} pins on map...`);

  visitRecords.forEach((rec) => {
    addPinToMap(rec);
  });

  console.log(`✅ Pins successfully placed on map.`);
}

/**
 * Helper function to place a single marker on Leaflet map
 */
function addPinToMap(rec) {
  if (typeof map === "undefined") return;

  let iconEmoji = "🏠";
  let bgStyle = "background-color: #ef4444; border-color: #ffffff;";

  if (rec.status === "Preached") {
    iconEmoji = "✅";
    bgStyle = "background-color: #10b981; border-color: #ffffff;";
  } else if (rec.status === "Return Visit") {
    iconEmoji = "⏰";
    bgStyle = "background-color: #3b82f6; border-color: #ffffff;";
  } else if (rec.status === "Bible Study") {
    iconEmoji = "📖";
    bgStyle = "background-color: #eab308; border-color: #ffffff;";
  }

  const customIcon = L.divIcon({
    className: "custom-map-icon",
    html: `<div style="${bgStyle} width: 34px; height: 34px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.5);">${iconEmoji}</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -18]
  });

  const marker = L.marker([rec.lat, rec.lng], { icon: customIcon }).addTo(map)
    .bindPopup(`
      <div style="color: #0f172a; font-family: sans-serif;">
          <b style="font-size: 14px;">${iconEmoji} ${rec.status}</b><br>
          <span>Householder: ${rec.person || "N/A"}</span><br>
          <small style="color: #64748b;">Logged by ${rec.publisher || "Unknown"} on ${rec.date}</small>
          <br><br>
          <button onclick="window.deletePin(${rec.id})" 
                  style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; width: 100%;">
              🗑️ Delete Pin
          </button>
      </div>
    `);

  activeMarkers[rec.id] = marker;
}

/**
 * Render the records list in the UI
 */
function renderRecordsList() {
  const container = document.getElementById("records-container");
  const counter = document.getElementById("tab-count");

  if (counter) counter.innerText = visitRecords.length;

  if (!container) return;

  if (visitRecords.length === 0) {
    container.innerHTML = `
      <div class="text-slate-400 text-center py-10 text-sm">
        No houses logged yet. Tap any house roof on the map to add a visit!
      </div>
    `;
    return;
  }

  container.innerHTML = visitRecords
    .map(
      (rec) => `
    <div class="bg-slate-800 border border-slate-700 p-4 rounded-xl flex justify-between items-center shadow-sm">
        <div class="flex-1">
            <div class="flex items-center space-x-2">
                <span class="font-bold text-white text-base">${rec.person || "Unnamed Location"}</span>
                <span class="text-xs px-2 py-0.5 rounded text-white font-semibold ${
                  rec.status === "Preached"
                    ? "bg-emerald-600"
                    : rec.status === "Return Visit"
                      ? "bg-blue-600"
                      : rec.status === "Bible Study"
                        ? "bg-yellow-600"
                        : "bg-red-600"
                }">${rec.status}</span>
            </div>
            <p class="text-xs text-slate-400 mt-1">Publisher: ${rec.publisher || "N/A"}</p>
            <p class="text-[10px] text-slate-500 mt-0.5">📅 ${rec.date}</p>
        </div>
        <div class="flex items-center space-x-2 flex-shrink-0">
          ${
            rec.phone
              ? `<a href="tel:${rec.phone}" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg flex items-center justify-center font-bold text-xs active:scale-95 transition">📞</a>`
              : ""
          }
          <button onclick="window.deletePin(${rec.id})" 
                  class="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg flex items-center justify-center font-bold text-xs active:scale-95 transition">
              🗑️
          </button>
        </div>
    </div>
`
    )
    .join("");
}

/**
 * Delete a record by ID (Exposed globally on window)
 */
window.deletePin = function (id) {
  // 1. Remove marker from map
  if (activeMarkers[id] && typeof map !== "undefined") {
    map.removeLayer(activeMarkers[id]);
    delete activeMarkers[id];
  }

  // 2. Filter array
  visitRecords = visitRecords.filter((rec) => rec.id !== id);

  // 3. Save updated list
  saveRecords();

  // 4. Update UI
  renderRecordsList();
};

/**
 * Global function to add a new visit (Call this from your Modal Form Submit listener)
 */
window.addNewVisit = function (visitData) {
  visitRecords.push(visitData);
  saveRecords();
  addPinToMap(visitData);
  renderRecordsList();
};

// ==========================================
// INITIALIZATION ON PAGE LOAD
// ==========================================
document.addEventListener("DOMContentLoaded", () => {
  loadRecords();
  renderRecordsList();
  setTimeout(recreatePins, 500);
});
