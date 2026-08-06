const STORAGE_KEY_PUBLISHER = "kk_default_publisher";

const defaultPublisherInput = document.getElementById(
  "default-publisher-input"
);
const settingsForm = document.getElementById("settings-form");
const settingsSavedToast = document.getElementById("settings-saved-toast");
const publisherNameInput = document.getElementById("publisher-name");

function loadSettings() {
  const savedPublisher = localStorage.getItem(STORAGE_KEY_PUBLISHER);
  if (savedPublisher) {
    if (defaultPublisherInput) defaultPublisherInput.value = savedPublisher;
    if (publisherNameInput) publisherNameInput.value = savedPublisher;
  }
}

function prepareVisitModal() {
  const savedPublisher = localStorage.getItem(STORAGE_KEY_PUBLISHER);
  if (savedPublisher && publisherNameInput) {
    publisherNameInput.value = savedPublisher;
  }
}

if (settingsForm) {
  settingsForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = defaultPublisherInput
      ? defaultPublisherInput.value.trim()
      : "";
    localStorage.setItem(STORAGE_KEY_PUBLISHER, name);

    if (publisherNameInput) publisherNameInput.value = name;

    if (settingsSavedToast) {
      settingsSavedToast.classList.remove("hidden");
      setTimeout(() => settingsSavedToast.classList.add("hidden"), 2500);
    }
  });
}

document.addEventListener("DOMContentLoaded", loadSettings);
