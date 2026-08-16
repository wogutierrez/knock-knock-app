document.addEventListener("DOMContentLoaded", () => {
  // ==========================================
  // 1. NAVIGATION TAB SWITCHER
  // ==========================================
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

      if (tab.view === "tab-map" && typeof map !== "undefined") {
        setTimeout(() => map.invalidateSize(), 100);
      }
    });
  });

  // ==========================================
  // 2. MODAL FORM SUBMIT & SAVING HANDLER
  // ==========================================
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
      e.preventDefault(); // Stop default form submit page reload

      if (!window.activeTempCoords) {
        alert("Please tap a house location on the map first.");
        return;
      }

      const publisherInput = document.getElementById("publisher-name");
      const personInput = document.getElementById("person-name");
      const phoneInput = document.getElementById("phone-number");
      const statusInput = document.getElementById("visit-status");

      const newRecord = {
        id: Date.now(),
        lat: window.activeTempCoords.lat,
        lng: window.activeTempCoords.lng,
        publisher: publisherInput ? publisherInput.value : "Anonymous",
        person:
          personInput && personInput.value ? personInput.value : "House Visit",
        phone: phoneInput ? phoneInput.value : "",
        status: statusInput ? statusInput.value : "Not at Home",
        date: new Date().toLocaleDateString()
      };

      // Call global save method from records.js
      if (typeof window.addNewVisit === "function") {
        window.addNewVisit(newRecord);
      } else {
        console.error("window.addNewVisit function is missing!");
      }

      hideModal();
      window.activeTempCoords = null;
    });
  }
});
