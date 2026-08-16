// --- PERSISTENT STORAGE REQUEST ---
// Prevents mobile and desktop browsers from purging app data under memory pressure
if (navigator.storage && navigator.storage.persist) {
  navigator.storage.persist().then((granted) => {
    if (granted) {
      console.log("Storage persistence granted.");
    } else {
      console.warn(
        "Storage persistence not granted; browser may manage storage under pressure."
      );
    }
  });
}

// --- NAVIGATION TAB SWITCHER LOGIC ---
document.addEventListener("DOMContentLoaded", () => {
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
      // Hide all views & reset button styles
      tabs.forEach((t) => {
        const viewEl = document.getElementById(t.view);
        const buttonEl = document.getElementById(t.btn);

        if (viewEl) viewEl.classList.add("hidden");
        if (buttonEl) {
          buttonEl.classList.remove("bg-emerald-600", "text-white");
          buttonEl.classList.add("text-slate-400");
        }
      });

      // Show targeted view & set active button style
      const targetView = document.getElementById(tab.view);
      if (targetView) targetView.classList.remove("hidden");

      btnEl.classList.remove("text-slate-400");
      btnEl.classList.add("bg-emerald-600", "text-white");

      // Invalidate Leaflet map size when navigating back to the Map tab
      if (tab.view === "tab-map" && typeof map !== "undefined") {
        setTimeout(() => map.invalidateSize(), 100);
      }
    });
  });
});
