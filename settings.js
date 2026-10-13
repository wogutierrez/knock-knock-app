// Helper to populate a select element with options
function populateSelectOptions(selectEl, optionsArray, selectedValue) {
  if (!selectEl) return;
  selectEl.innerHTML = "";
  optionsArray.forEach(optVal => {
    const opt = document.createElement("option");
    opt.value = optVal;
    opt.textContent = optVal;
    selectEl.appendChild(opt);
  });
  if (optionsArray.includes(selectedValue)) {
    selectEl.value = selectedValue;
  } else if (optionsArray.length > 0) {
    selectEl.value = optionsArray[0];
  }
}

// Dynamically update Settings Territory dropdown based on selected Group
window.updateSettingsTerritoryDropdown = function() {
  const grpInput = document.getElementById("default-group-input");
  const terrInput = document.getElementById("default-territory-input");
  if (!grpInput || !terrInput) return;

  const selectedGroup = grpInput.value;
  const mapping = typeof window.getGroupTerritoryMap === "function" ? window.getGroupTerritoryMap() : {};
  const groupTerrs = mapping[selectedGroup] || ["001", "002"];
  const currentTerr = localStorage.getItem(window.KK_KEYS?.TERRITORY || "kk_default_territory") || "";

  populateSelectOptions(terrInput, groupTerrs, currentTerr);
};

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

  // 1. Populate Congregation dropdown from Admin Master List
  const congs = (localStorage.getItem("kk_master_congregations") || "Goodhope English").split(",").map(s => s.trim()).filter(Boolean);
  const savedCong = localStorage.getItem(KEYS.CONGREGATION) || congs[0] || "";
  populateSelectOptions(congInput, congs, savedCong);

  // 2. Populate Group dropdown from Admin Master List
  const groups = (localStorage.getItem("kk_master_groups") || "Haydon, Fairview").split(",").map(s => s.trim()).filter(Boolean);
  const savedGrp = localStorage.getItem(KEYS.GROUP) || groups[0] || "";
  populateSelectOptions(grpInput, groups, savedGrp);

  // 3. Populate Territory dropdown based on selected Group
  window.updateSettingsTerritoryDropdown();

  // FIX: Restore last passphrase for convenience (was missing)
  const passInput = document.getElementById("sync-passphrase-input");
  if (passInput) {
    passInput.value = localStorage.getItem("kk_last_passphrase") || "";
  }
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
      // FIX: Save passphrase for admin auto-sync
      localStorage.setItem("kk_last_passphrase", passphrase);
      btnBackup.textContent = "Backing up...";
      btnBackup.disabled = true;
      const success = await window.backupToCloud(passphrase);
      btnBackup.textContent = "⬆️ Backup to Cloud";
      btnBackup.disabled = false;
      if (success) showSyncToast("✓ Successfully backed up pins to cloud!");
      else showSyncToast("❌ Backup failed!", true);
    });
  }

  if (btnRestore) {
    btnRestore.addEventListener("click", async () => {
      const passphrase = passInput?.value || "";
      if (!passphrase) {
        alert("Please enter a sync passphrase.");
        return;
      }
      localStorage.setItem("kk_last_passphrase", passphrase);
      if (!confirm("Restore will overwrite local pins. Continue?")) return;
      btnRestore.textContent = "Restoring...";
      btnRestore.disabled = true;
      const success = await window.restoreFromCloud(passphrase);
      btnRestore.textContent = "⬇️ Restore from Cloud";
      btnRestore.disabled = false;
      if (success) showSyncToast("✓ Successfully restored pins from cloud!");
      else showSyncToast("❌ Restore failed!", true);
    });
  }
});