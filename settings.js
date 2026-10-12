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

document.addEventListener("DOMContentLoaded", () => {
  // ... existing loadSettings() and settingsForm logic ...

  // --- CLOUD SYNC EVENT HANDLERS ---
  const btnBackup = document.getElementById("btn-cloud-backup");
  const btnRestore = document.getElementById("btn-cloud-restore");
  const passInput = document.getElementById("sync-passphrase-input");
  const syncToast = document.getElementById("sync-toast");

  const showSyncToast = (msg, isError = false) => {
    if (!syncToast) return;
    syncToast.textContent = msg;
    syncToast.className = isError 
      ? "p-3 bg-red-900/50 border border-red-500/50 text-red-300 rounded-lg text-xs text-center font-medium"
      : "p-3 bg-emerald-900/50 border border-emerald-500/50 text-emerald-300 rounded-lg text-xs text-center font-medium";
    syncToast.classList.remove("hidden");
    setTimeout(() => syncToast.classList.add("hidden"), 3000);
  };

  if (btnBackup) {
    btnBackup.addEventListener("click", async () => {
      const passphrase = passInput?.value || "";
      if (!passphrase) {
        alert("Please enter a sync passphrase.");
        return;
      }
      btnBackup.textContent = "Backing up...";
      const success = await window.backupToCloud(passphrase);
      btnBackup.textContent = "⬆️ Backup to Cloud";
      if (success) showSyncToast("✓ Successfully backed up pins to cloud!");
    });
  }

  if (btnRestore) {
    btnRestore.addEventListener("click", async () => {
      const passphrase = passInput?.value || "";
      if (!passphrase) {
        alert("Please enter a sync passphrase.");
        return;
      }
      btnRestore.textContent = "Restoring...";
      const success = await window.restoreFromCloud(passphrase);
      btnRestore.textContent = "⬇️ Restore from Cloud";
      if (success) showSyncToast("✓ Successfully restored pins from cloud!");
    });
  }
});
