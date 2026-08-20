const KEYS = {
  PUBLISHER: "kk_default_publisher",
  CONGREGATION: "kk_default_congregation",
  GROUP: "kk_default_group",
  TERRITORY: "kk_default_territory"
};

function getSettings() {
  return {
    publisher: localStorage.getItem(KEYS.PUBLISHER) || "",
    congregation: localStorage.getItem(KEYS.CONGREGATION) || "Goodhope English",
    group: localStorage.getItem(KEYS.GROUP) || "Haydon",
    territory: localStorage.getItem(KEYS.TERRITORY) || "001"
  };
}

function loadSettings() {
  const settings = getSettings();

  const pubInput = document.getElementById("default-publisher-input");
  const congInput = document.getElementById("default-congregation-input");
  const grpInput = document.getElementById("default-group-input");
  const terrInput = document.getElementById("default-territory-input");

  if (pubInput) pubInput.value = settings.publisher;
  if (congInput) congInput.value = settings.congregation;
  if (grpInput) grpInput.value = settings.group;
  if (terrInput) terrInput.value = settings.territory;
}

function prepareVisitModal() {
  const settings = getSettings();

  const pubInput = document.getElementById("publisher-name");
  const congInput = document.getElementById("visit-congregation");
  const grpInput = document.getElementById("visit-group");
  const terrInput = document.getElementById("visit-territory");

  if (pubInput) pubInput.value = settings.publisher;
  if (congInput) congInput.value = settings.congregation;
  if (grpInput) grpInput.value = settings.group;
  if (terrInput) terrInput.value = settings.territory;
}

const settingsForm = document.getElementById("settings-form");
if (settingsForm) {
  settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();

    localStorage.setItem(
      KEYS.PUBLISHER,
      document.getElementById("default-publisher-input")?.value.trim() || ""
    );
    localStorage.setItem(
      KEYS.CONGREGATION,
      document.getElementById("default-congregation-input")?.value.trim() || ""
    );
    localStorage.setItem(
      KEYS.GROUP,
      document.getElementById("default-group-input")?.value.trim() || ""
    );
    localStorage.setItem(
      KEYS.TERRITORY,
      document.getElementById("default-territory-input")?.value.trim() || ""
    );

    const settingsSavedToast = document.getElementById("settings-saved-toast");
    if (settingsSavedToast) {
      settingsSavedToast.classList.remove("hidden");
      setTimeout(() => settingsSavedToast.classList.add("hidden"), 2500);
    }
  });
}

document.addEventListener("DOMContentLoaded", loadSettings);
window.prepareVisitModal = prepareVisitModal;
