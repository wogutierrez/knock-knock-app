// ==========================================
// ADMIN PIN & MASTER LIST MANAGEMENT
// ==========================================
console.log("admin.js script loaded successfully!");

document.addEventListener("DOMContentLoaded", () => {
  const ADMIN_PIN = "1981"; // Organizer PIN
  
  const passInput = document.getElementById("admin-pass-input");
  const unlockBtn = document.getElementById("btn-unlock-admin");
  const lockView = document.getElementById("admin-lock-view");
  const adminPanelView = document.getElementById("admin-panel-view");
  const adminBadge = document.getElementById("admin-status-badge");
  
  const saveAdminBtn = document.getElementById("btn-save-admin");
  const congInput = document.getElementById("admin-congregations");
  const groupInput = document.getElementById("admin-groups");
  const terrInput = document.getElementById("admin-territories");

  // Load saved master lists into admin inputs on boot
  if (congInput) congInput.value = localStorage.getItem("kk_master_congregations") || "Goodhope English, Sandton";
  if (groupInput) groupInput.value = localStorage.getItem("kk_master_groups") || "Haydon, Fairview";
  if (terrInput) terrInput.value = localStorage.getItem("kk_master_territories") || "001, 002, 003";

  // Unlock Admin Panel Action
  if (unlockBtn) {
    unlockBtn.addEventListener("click", () => {
      console.log("Unlock button clicked!");
      if (passInput && passInput.value.trim() === ADMIN_PIN) {
        if (lockView) lockView.classList.add("hidden");
        if (adminPanelView) adminPanelView.classList.remove("hidden");
        if (adminBadge) {
          adminBadge.textContent = "Unlocked";
          adminBadge.className = "text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-1 rounded border border-emerald-700 font-mono";
        }
      } else {
        alert("Incorrect Admin Passcode. (Try: 1981)");
        if (passInput) passInput.value = "";
      }
    });
  } else {
    console.error("Could not find element with id 'btn-unlock-admin'");
  }

  // Save Master Lists Action
  if (saveAdminBtn) {
    saveAdminBtn.addEventListener("click", () => {
      if (congInput) localStorage.setItem("kk_master_congregations", congInput.value.trim());
      if (groupInput) localStorage.setItem("kk_master_groups", groupInput.value.trim());
      if (terrInput) localStorage.setItem("kk_master_territories", terrInput.value.trim());

      // Persist to Cloud/Firestore if cloud sync is active
      if (typeof window.saveMasterConfigToCloud === "function") {
        window.saveMasterConfigToCloud();
      }

      alert("Master lists saved and updated successfully!");
      
      // Force refresh dropdowns across the app
      if (typeof window.populateAllDropdowns === "function") {
        window.populateAllDropdowns();
      }
    });
  }

  // Populate all dynamic dropdowns across the app
  window.populateAllDropdowns = function() {
    const congs = (localStorage.getItem("kk_master_congregations") || "Goodhope English").split(",").map(s => s.trim()).filter(Boolean);
    const groups = (localStorage.getItem("kk_master_groups") || "Haydon").split(",").map(s => s.trim()).filter(Boolean);
    const terrs = (localStorage.getItem("kk_master_territories") || "001").split(",").map(s => s.trim()).filter(Boolean);

    populateSelect("visit-congregation", congs);
    populateSelect("visit-group", groups);
    populateSelect("visit-territory", terrs);

    const filterTerrSelect = document.getElementById("filter-territory");
    if (filterTerrSelect) {
      const currentVal = filterTerrSelect.value;
      filterTerrSelect.innerHTML = '<option value="ALL">All Territories</option>';
      terrs.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = `Territory ${t}`;
        filterTerrSelect.appendChild(opt);
      });
      filterTerrSelect.value = currentVal || "ALL";
    }
  };

  function populateSelect(elementId, items) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const currentVal = el.value;
    el.innerHTML = "";
    items.forEach(item => {
      const opt = document.createElement("option");
      opt.value = item;
      opt.textContent = item;
      el.appendChild(opt);
    });
    if (items.includes(currentVal)) {
      el.value = currentVal;
    }
  }

  window.populateAllDropdowns();
});