// --- 3. ROOF TAP EVENT LISTENER ---
map.on("click", (e) => {
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
