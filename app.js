// Global namespace for storage key constants to prevent typos across Android & Windows
window.KK_KEYS = {
  PUBLISHER: "kk_default_publisher",
  CONGREGATION: "kk_default_congregation",
  GROUP: "kk_default_group",
  TERRITORY: "kk_default_territory"
};

// Instantly available global function
window.populateModalDefaults = function () {
  const pubInput = document.getElementById("publisher-name");
  const congInput = document.getElementById("visit-congregation");
  const grpInput = document.getElementById("visit-group");
  const terrInput = document.getElementById("visit-territory");

  if (pubInput) {
    pubInput.value = localStorage.getItem(window.KK_KEYS.PUBLISHER) || "";
  }

  // 1. Automatically lock and stamp the official Admin Congregation
  if (congInput) {
    const rawCongs = localStorage.getItem("kk_master_congregations") || "Goodhope English";
    const officialCong = rawCongs.split(",")[0].trim();
    congInput.value = officialCong;
    congInput.setAttribute("readonly", "true");
  }

  // 2. Lock and stamp Group from the publisher's saved settings
  if (grpInput) {
    const savedGroup = localStorage.getItem(window.KK_KEYS.GROUP) || "";
    if (grpInput.tagName === "SELECT") {
      grpInput.value = savedGroup;
    } else {
      grpInput.value = savedGroup;
      grpInput.setAttribute("readonly", "true");
    }
  }

  // 3. Lock and stamp Territory from the publisher's saved settings
  if (terrInput) {
    const savedTerritory = localStorage.getItem(window.KK_KEYS.TERRITORY) || "";
    if (terrInput.tagName === "SELECT") {
      terrInput.value = savedTerritory;
    } else {
      terrInput.value = savedTerritory;
      terrInput.setAttribute("readonly", "true");
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  // --- DIRECT OPEN ON MAP VIEW ---
  const views = ["tab-map", "tab-records", "tab-settings", "tab-about"];
  const buttons = [
    "btn-tab-map",
    "btn-tab-records",
    "btn-tab-settings",
    "btn-tab-about"
  ];

  // Hide all views except the map tab
  views.forEach((v) => {
    const el = document.getElementById(v);
    if (el) {
      if (v === "tab-map") {
        el.classList.remove("hidden");
      } else {
        el.classList.add("hidden");
      }
    }
  });

  // Set the map nav button active styling
  buttons.forEach((b) => {
    const btn = document.getElementById(b);
    if (btn) {
      if (b === "btn-tab-map") {
        btn.classList.remove("text-slate-400");
        btn.classList.add("bg-emerald-600", "text-white");
      } else {
        btn.classList.remove("bg-emerald-600", "text-white");
        btn.classList.add("text-slate-400");
      }
    }
  });

  // Ensure Leaflet container recalculates size on immediate open
  const checkMapInstance = setInterval(() => {
    if (typeof window.map !== "undefined" && window.map !== null) {
      clearInterval(checkMapInstance);
      window.map.invalidateSize();
    }
  }, 100);

  // --- TAB NAVIGATION SETUP ---
  const tabs = [
    { btn: "btn-tab-map", view: "tab-map" },
    { btn: "btn-tab-records", view: "tab-records" },
    { btn: "btn-tab-settings", view: "tab-settings" },
    { btn: "btn-tab-about", view: "tab-about" }
  ];

  tabs.forEach((tab) => {
    const btnEl = document.getElementById(tab.btn);
    if (!btnEl) return;

    btnEl.addEventListener("click", () => {
      tabs.forEach((t) => {
        const viewEl = document.getElementById(t.view);
        const buttonEl = document.getElementById(t.btn);

        if (viewEl) viewEl.classList.add("hidden");
        if (buttonEl) {
          buttonEl.classList.remove("bg-emerald-600", "text-white");
          buttonEl.classList.add("text-slate-400");
        }
      });

      const targetView = document.getElementById(tab.view);
      if (targetView) targetView.classList.remove("hidden");

      btnEl.classList.remove("text-slate-400");
      btnEl.classList.add("bg-emerald-600", "text-white");

      if (tab.view === "tab-map" && typeof window.map !== "undefined") {
        requestAnimationFrame(() => {
          setTimeout(() => window.map.invalidateSize(), 150);
        });
      }

      // FIX: Repopulate filters when entering records tab (was missing)
      if (tab.view === "tab-records") {
        if (typeof window.populateRecordsGroupFilter === "function") window.populateRecordsGroupFilter();
        if (typeof window.filterRecords === "function") window.filterRecords();
      }
    });
  });

  // --- MODAL FORM HANDLING ---
  const visitForm = document.getElementById("visit-form");
  const visitModal = document.getElementById("visit-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const cancelBtn = document.getElementById("cancel-btn");

  const hideModal = () => {
    if (visitModal) visitModal.classList.add("hidden");
    if (visitForm) visitForm.reset();

    // Bring the "My Location button"
    const recenterBtn = document.getElementById("recenter-btn");
    if (recenterBtn) recenterBtn.style.display = "flex";
  };

  if (closeModalBtn) closeModalBtn.addEventListener("click", hideModal);
  if (cancelBtn) cancelBtn.addEventListener("click", hideModal);

  if (visitForm) {
    visitForm.addEventListener("submit", (e) => {
      e.preventDefault();

      if (!window.activeTempCoords) {
        alert("Please tap a house location on the map first.");
        return;
      }

      const publisherInput = document.getElementById("publisher-name");
      const personInput = document.getElementById("person-name");
      const phoneInput = document.getElementById("phone-number");
      const statusInput = document.getElementById("visit-status");
      const congregationInput = document.getElementById("visit-congregation");
      const groupInput = document.getElementById("visit-group");
      const territoryInput = document.getElementById("visit-territory");
      const notesInput = document.getElementById("visit-notes");

      const newRecord = {
        id: Date.now(),
        lat: window.activeTempCoords.lat,
        lng: window.activeTempCoords.lng,
        congregation: congregationInput ? congregationInput.value.trim() : "",
        group: groupInput ? groupInput.value.trim() : "",
        territory: territoryInput ? territoryInput.value.trim() : "",
        publisher: publisherInput ? publisherInput.value.trim() : "",
        person:
          personInput && personInput.value
            ? personInput.value.trim()
            : "House Visit",
        phone: phoneInput ? phoneInput.value.trim() : "",
        status: statusInput ? statusInput.value : "Not at Home",
        notes: notesInput ? notesInput.value.trim() : "",
        // ===========================================
        // FIX: OLD CODE USED toLocaleDateString() - BUGGY
        // OLD: date: new Date().toLocaleDateString()
        // WHY BAD: Locale-dependent string like "10/13/2026" cannot be reliably parsed by new Date() on Android
        // Sorting broke, and Date comparison failed.
        // NEW: Use ISO string for storage, format on display
        // ===========================================
        date: new Date().toISOString(),
        // Keep display helper for UI
        displayDate: new Date().toLocaleDateString()
      };

      if (typeof window.addNewVisit === "function") {
        window.addNewVisit(newRecord);
      }

      hideModal();
      window.activeTempCoords = null;
    });
  }
});