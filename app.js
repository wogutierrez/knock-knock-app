// Tab Switching
const tabs = {
  map: document.getElementById("tab-map"),
  records: document.getElementById("tab-records"),
  settings: document.getElementById("tab-settings"),
  about: document.getElementById("tab-about")
};

const buttons = {
  map: document.getElementById("btn-tab-map"),
  records: document.getElementById("btn-tab-records"),
  settings: document.getElementById("btn-tab-settings"),
  about: document.getElementById("btn-tab-about")
};

function switchTab(activeTabKey) {
  Object.keys(tabs).forEach((key) => {
    if (tabs[key] && buttons[key]) {
      tabs[key].classList.add("hidden");
      buttons[key].className =
        "px-3 py-1.5 text-xs font-bold rounded text-slate-400 hover:text-white transition";
    }
  });

  if (tabs[activeTabKey] && buttons[activeTabKey]) {
    tabs[activeTabKey].classList.remove("hidden");
    buttons[activeTabKey].className =
      "px-3 py-1.5 text-xs font-bold rounded bg-emerald-600 text-white transition";
  }

  if (activeTabKey === "map" && typeof map !== "undefined") {
    setTimeout(() => map.invalidateSize(), 100);
  }
}

if (buttons.map) buttons.map.addEventListener("click", () => switchTab("map"));
if (buttons.records)
  buttons.records.addEventListener("click", () => switchTab("records"));
if (buttons.settings)
  buttons.settings.addEventListener("click", () => switchTab("settings"));
if (buttons.about)
  buttons.about.addEventListener("click", () => switchTab("about"));

// Modal Logic
const modal = document.getElementById("visit-modal");
const closeModalBtn = document.getElementById("close-modal");
const cancelBtn = document.getElementById("cancel-btn");

if (closeModalBtn)
  closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));
if (cancelBtn)
  cancelBtn.addEventListener("click", () => modal.classList.add("hidden"));

const visitForm = document.getElementById("visit-form");
if (visitForm) {
  visitForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const publisher = document.getElementById("publisher-name").value;
    const person =
      document.getElementById("person-name").value || "Not Specified";
    const phone = document.getElementById("phone-number").value || "";
    const status = document.getElementById("visit-status").value;

    const now = new Date();
    const dateLogged =
      now.toLocaleDateString() +
      " " +
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    const newRecord = {
      id: Date.now(),
      lat: activeTempCoords.lat,
      lng: activeTempCoords.lng,
      publisher: publisher,
      person: person,
      phone: phone,
      status: status,
      date: dateLogged
    };

    visitRecords.push(newRecord);
    saveRecords(); // <-- ADDED: Save after adding

    let iconEmoji = "🏠";
    let bgStyle = "background-color: #ef4444; border-color: #ffffff;";

    if (status === "Preached") {
      iconEmoji = "✅";
      bgStyle = "background-color: #10b981; border-color: #ffffff;";
    } else if (status === "Return Visit") {
      iconEmoji = "⏰";
      bgStyle = "background-color: #3b82f6; border-color: #ffffff;";
    } else if (status === "Bible Study") {
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

    L.marker([newRecord.lat, newRecord.lng], { icon: customIcon }).addTo(map)
      .bindPopup(`
    <div style="color: #0f172a; font-family: sans-serif;">
        <b style="font-size: 14px;">${iconEmoji} ${status}</b><br>
        <span>Householder: ${person}</span><br>
        <small style="color: #64748b;">Logged by ${publisher} on ${dateLogged}</small>
        <br><br>
        <button onclick="deletePin(${newRecord.id})" 
                style="background-color: #ef4444; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; cursor: pointer; width: 100%;">
            🗑️ Delete Pin
        </button>
    </div>
  `);

    renderRecordsList();
    visitForm.reset();
    prepareVisitModal();
    modal.classList.add("hidden");
  });
}

// ==========================================
// DELETE PIN FUNCTION
// ==========================================
function deletePin(recordId) {
  // 1. Find the record in our array
  const recordIndex = visitRecords.findIndex((rec) => rec.id === recordId);

  if (recordIndex === -1) {
    console.log("Record not found!");
    return;
  }

  // 2. Get the record we want to delete
  const recordToDelete = visitRecords[recordIndex];

  // 3. Remove the pin from the map
  // We need to find and remove the marker
  map.eachLayer(function (layer) {
    // Check if this layer is a marker
    if (layer instanceof L.Marker) {
      // Get the marker's position
      const latLng = layer.getLatLng();
      // Check if it matches our record's coordinates
      if (
        latLng.lat === recordToDelete.lat &&
        latLng.lng === recordToDelete.lng
      ) {
        map.removeLayer(layer);
      }
    }
  });

  // 4. Remove the record from the array
  visitRecords.splice(recordIndex, 1);
  saveRecords(); // <-- ADDED: Save after deleting

  // 5. Update the records list display
  renderRecordsList();

  // 6. Close any open popup
  map.closePopup();

  console.log(`✅ Deleted record with ID: ${recordId}`);
}
