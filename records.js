// ==========================================
// LOCAL STORAGE PERSISTENCE
// ==========================================

// Key used to store records in localStorage
const STORAGE_KEY = "knock-knock-visits";

// Visit records array
let visitRecords = [];

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
    return false;
  }
}

/**
 * Recreate all pins on the map from saved records
 */
function recreatePins() {
  // Only run if map exists
  if (typeof map === "undefined") {
    console.log("⏳ Map not ready yet, will retry...");
    setTimeout(recreatePins, 500);
    return;
  }

  console.log(`📍 Recreating ${visitRecords.length} pins on the map...`);

  visitRecords.forEach((rec) => {
    // Determine the icon based on status
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

    L.marker([rec.lat, rec.lng], { icon: customIcon }).addTo(map).bindPopup(`
        <div style="color: #0f172a; font-family: sans-serif;">
            <b style="font-size: 14px;">${iconEmoji} ${rec.status}</b><br>
            <span>Householder: ${rec.person}</span><br>
            <small style="color: #64748b;">Logged by ${rec.publisher} on ${rec.date}</small>
            <br><br>
            <button onclick="deletePin(${rec.id})" 
                    style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; width: 100%;">
                🗑️ Delete Pin
            </button>
        </div>
      `);
  });

  console.log(`✅ Recreated ${visitRecords.length} pins`);
}

/**
 * Render the records list
 */
function renderRecordsList() {
  const container = document.getElementById("records-container");
  const counter = document.getElementById("tab-count");

  if (counter) counter.innerText = visitRecords.length;

  if (visitRecords.length === 0 || !container) {
    // Show empty message
    if (container) {
      container.innerHTML = `
        <div class="text-slate-400 text-center py-10 text-sm">
          No houses logged yet. Tap any house roof on the map to add a visit!
        </div>
      `;
    }
    return;
  }

  container.innerHTML = visitRecords
    .map(
      (rec) => `
    <div class="bg-slate-800 border border-slate-700 p-4 rounded-xl flex justify-between items-center shadow-sm">
        <div class="flex-1">
            <div class="flex items-center space-x-2">
                <span class="font-bold text-white text-base">${rec.person}</span>
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
            <p class="text-xs text-slate-400 mt-1">Publisher: ${rec.publisher}</p>
            <p class="text-[10px] text-slate-500 mt-0.5">📅 ${rec.date}</p>
        </div>
        <div class="flex items-center space-x-2 flex-shrink-0">
          ${
            rec.phone
              ? `<a href="tel:${rec.phone}" class="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg flex items-center justify-center font-bold text-xs active:scale-95 transition">📞</a>`
              : ""
          }
          <button onclick="deletePin(${rec.id})" 
                  class="bg-red-600 hover:bg-red-500 text-white px-3 py-2 rounded-lg flex items-center justify-center font-bold text-xs active:scale-95 transition">
              🗑️
          </button>
        </div>
    </div>
`
    )
    .join("");

  // Save records after rendering
  saveRecords();
}

// ==========================================
// LOAD RECORDS ON PAGE START
// ==========================================

// Load records from localStorage when the page loads
const recordsLoaded = loadRecords();

// Re-render the records list
renderRecordsList();

// Recreate pins on the map if records exist
if (recordsLoaded && visitRecords.length > 0) {
  // Small delay to ensure map is ready
  setTimeout(recreatePins, 500);
}

console.log("📂 Records persistence ready!");
