function loadSettings() {
  const pubInput = document.getElementById("default-publisher-input");
  const congInput = document.getElementById("default-congregation-input");
  const grpInput = document.getElementById("default-group-input");
  const terrInput = document.getElementById("default-territory-input");

  const KEYS = window.KK_KEYS || {
    PUBLISHER: "kk_default_publisher",
    CONGREGATION: "kk_default_congregation",
    GROUP: "kk_default_group",
    TERRITORY: "kk_default_territory"
  };

  if (pubInput) pubInput.value = localStorage.getItem(KEYS.PUBLISHER) || "";
  if (congInput)
    congInput.value = localStorage.getItem(KEYS.CONGREGATION) || "";
  if (grpInput) grpInput.value = localStorage.getItem(KEYS.GROUP) || "";
  if (terrInput) terrInput.value = localStorage.getItem(KEYS.TERRITORY) || "";
}

document.addEventListener("DOMContentLoaded", () => {
  loadSettings();

  const settingsForm = document.getElementById("settings-form");
  if (settingsForm) {
    settingsForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const KEYS = window.KK_KEYS || {
        PUBLISHER: "kk_default_publisher",
        CONGREGATION: "kk_default_congregation",
        GROUP: "kk_default_group",
        TERRITORY: "kk_default_territory"
      };

      const pubVal =
        document.getElementById("default-publisher-input")?.value.trim() || "";
      const congVal =
        document.getElementById("default-congregation-input")?.value.trim() ||
        "";
      const grpVal =
        document.getElementById("default-group-input")?.value.trim() || "";
      const terrVal =
        document.getElementById("default-territory-input")?.value.trim() || "";

      localStorage.setItem(KEYS.PUBLISHER, pubVal);
      localStorage.setItem(KEYS.CONGREGATION, congVal);
      localStorage.setItem(KEYS.GROUP, grpVal);
      localStorage.setItem(KEYS.TERRITORY, terrVal);

      const settingsSavedToast = document.getElementById(
        "settings-saved-toast"
      );
      if (settingsSavedToast) {
        settingsSavedToast.classList.remove("hidden");
        setTimeout(() => settingsSavedToast.classList.add("hidden"), 2500);
      }
    });
  }
});
