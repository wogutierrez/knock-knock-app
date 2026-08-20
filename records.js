// ==========================================
// LOCAL STORAGE PERSISTENCE & RECORDS MANAGEMENT
// ==========================================

const STORAGE_KEY = "knock-knock-visits";
let visitRecords = [];
let activeMarkers = {};

/**
 * 1. Save visit records array to localStorage
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
 * 2. Load visit records array from localStorage
 */
function loadRecords() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      visitRecords = JSON.parse(data);
      console.log(`📂 Loaded ${visitRecords.length} records from localStorage`);
      return true;
    } else {
      visitRecords = [];
      console.log("📂 No saved records found in localStorage");
      return false;
    }
  } catch (error) {
    console.error("Error loading records:", error);
    visitRecords = [];
    return false;
  }
}

/**
 * Populate the Territory Filter Dropdown dynamically based on logged records
 */
function populateTerritoryDropdown() {
  const dropdown = document.getElementById("filter-territory");
  if (!dropdown) return;

  const currentSelection = dropdown.value;
  const territories = [
    ...new Set(visitRecords.map((r) => r.territory || "Unassigned"))
  ];

  dropdown.innerHTML =
    '<option value="ALL">All Territories</option>' +
    territories
      .map((t) => `<option value="${t}">Territory ${t}</option>`)
      .join("");

  if (territories.includes(currentSelection)) {
    dropdown.value = currentSelection;
  }
}

/**
 * Filter records by selected Territory and Visit Status
 */
window.filterRecords = function () {
  const selectedTerritory =
    document.getElementById("filter-territory")?.value || "ALL";
  const selectedStatus =
    document.getElementById("filter-status")?.value || "ALL";

  const filtered = visitRecords.filter((rec) => {
    const matchesTerritory =
      selectedTerritory === "ALL" ||
      (rec.territory || "Unassigned") === selectedTerritory;
    const matchesStatus =
      selectedStatus === "ALL" || rec.status === selectedStatus;
    return matchesTerritory && matchesStatus;
  });

  renderRecordsList(filtered);
};

/**
 * 3. Render the house visit records UI list
 */
function renderRecordsList(recordsToRender = visitRecords) {
  const container = document.getElementById("records-container");
  const counter = document.getElementById("tab-count");

  if (counter) counter.innerText = visitRecords.length;
  if (!container) return;

  populateTerritoryDropdown();

  if (recordsToRender.length === 0) {
    container.innerHTML = `
      <div class="text-slate-400 text-center py-10 text-sm">
        No houses found matching your criteria. Tap any house roof on the map to add a visit!
      </div>
    `;
    return;
  }

  container.innerHTML = recordsToRender
    .map(
      (rec) => `
    <div class="bg-slate-800 border border-slate-700 p-4 rounded-xl flex justify-between items-center shadow-sm">
        <div class="flex-1">
            <div class="flex items-center space-x-2">
                <span class="font-bold text-white text-base">${rec.person || "House Visit"}</span>
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
            
            <div class="flex flex-wrap gap-1.5 mt-2">
                <span class="text-[10px] bg-slate-900 text-emerald-400 border border-slate-700 px-2 py-0.5 rounded font-mono">
                  🏰 ${rec.congregation || "N/A"}
                </span>
                <span class="text-[10px] bg-slate-900 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
                  👥 Grp: ${rec.group || "N/A"}
                </span>
                <span class="text-[10px] bg-slate-900 text-yellow-400 border border-slate-700 px-2 py-0.5 rounded font-mono">
                  📍 Terr: ${rec.territory || "N/A"}
                </span>
            </div>

            <p class="text-xs text-slate-400 mt-2">Publisher: ${rec.publisher || "N/A"}</p>
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
 * 4. Helper function to create custom Leaflet marker
 */
function addPinToMap(rec) {
  if (typeof map === "undefined") return;

  let iconEmoji = "🏠";
  let bgStyle = "background-color: #ef4444; border-color: #ffffff;";

  if (rec.status === "Preached") {
    iconEmoji = "🟢";
    bgStyle = "background-color: #10b981; border-color: #ffffff;";
  } else if (rec.status === "Return Visit") {
    iconEmoji = "🔵";
    bgStyle = "background-color: #3b82f6; border-color: #ffffff;";
  } else if (rec.status === "Bible Study") {
    iconEmoji = "🟡";
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
          <span><b>Householder:</b> ${rec.person || "N/A"}</span><br>
          <small style="color: #475569;">Territory #${rec.territory || "N/A"} (${rec.group || "N/A"})</small><br>
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
 * 5. Recreate pins on Leaflet map from visitRecords
 */
function recreatePins() {
  if (typeof map === "undefined") {
    setTimeout(recreatePins, 300);
    return;
  }

  Object.keys(activeMarkers).forEach((id) => {
    if (activeMarkers[id]) map.removeLayer(activeMarkers[id]);
  });
  activeMarkers = {};

  visitRecords.forEach((rec) => addPinToMap(rec));
}

/**
 * 6. Global function to add a record (Invoked from app.js)
 */
window.addNewVisit = function (visitData) {
  visitRecords.push(visitData);
  saveRecords();
  renderRecordsList();
  addPinToMap(visitData);
};

/**
 * 7. Global function to delete a record
 */
window.deletePin = function (id) {
  if (activeMarkers[id] && typeof map !== "undefined") {
    map.removeLayer(activeMarkers[id]);
    delete activeMarkers[id];
  }

  visitRecords = visitRecords.filter((rec) => rec.id !== id);
  saveRecords();
  renderRecordsList();
};

/**
 * 8. Initialization on startup
 */
document.addEventListener("DOMContentLoaded", () => {
  loadRecords();
  renderRecordsList();
  setTimeout(recreatePins, 400);
});
