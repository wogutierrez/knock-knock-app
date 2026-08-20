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

  if (pubInput)
    pubInput.value = localStorage.getItem(window.KK_KEYS.PUBLISHER) || "";
  if (congInput)
    congInput.value = localStorage.getItem(window.KK_KEYS.CONGREGATION) || "";
  if (grpInput)
    grpInput.value = localStorage.getItem(window.KK_KEYS.GROUP) || "";
  if (terrInput)
    terrInput.value = localStorage.getItem(window.KK_KEYS.TERRITORY) || "";
};

document.addEventListener("DOMContentLoaded", () => {
  // Tab navigation setup
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
    });
  });

  // Modal Form Handling
  const visitForm = document.getElementById("visit-form");
  const visitModal = document.getElementById("visit-modal");
  const closeModalBtn = document.getElementById("close-modal");
  const cancelBtn = document.getElementById("cancel-btn");

  const hideModal = () => {
    if (visitModal) visitModal.classList.add("hidden");
    if (visitForm) visitForm.reset();
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
        date: new Date().toLocaleDateString()
      };

      if (typeof window.addNewVisit === "function") {
        window.addNewVisit(newRecord);
      }

      hideModal();
      window.activeTempCoords = null;
    });
  }
});
