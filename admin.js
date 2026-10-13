// ==========================================
// ADMIN PIN & HIERARCHICAL TERRITORY MANAGEMENT
// ==========================================
console.log("admin.js hierarchical module loaded successfully!");

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
  const groupTerrInput = document.getElementById("admin-group-territories");

  // Load saved settings or smart defaults
  if (congInput) congInput.value = localStorage.getItem("kk_master_congregations") || "Goodhope English, Sandton";
  if (groupInput) groupInput.value = localStorage.getItem("kk_master_groups") || "Haydon, Fairview";
  if (groupTerrInput) {
    groupTerrInput.value = localStorage.getItem("kk_master_group_territories") || 
      "Haydon: 001, 002\nFairview: 003, 004";
  }

  // Inject a dedicated admin sync passphrase input right into the admin panel if not already present
  if (adminPanelView && !document.getElementById("admin-sync-passphrase")) {
    const syncPassDiv = document.createElement("div");
    syncPassDiv.className = "mt-4 pt-4 border-t border-slate-800";
    syncPassDiv.innerHTML = `
      <label class="block text-xs font-medium text-slate-400 mb-1">CLOUD SYNC PASSPHRASE (FOR PUSHING TO ALL BROTHERS)</label>
      <input type="password" id="admin-sync-passphrase" placeholder="Enter shared passphrase..." 
        value="${localStorage.getItem("kk_last_passphrase") || ""}"
        class="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-sm text-white focus:outline-none focus:border-emerald-500 font-mono" />
      <p class="text-[10px] text-slate-500 mt-1">When you save master settings, this passphrase is used to sync updates to the cloud automatically.</p>
    `;
    // Insert right before the save button container
    const saveParent = saveAdminBtn ? saveAdminBtn.parentNode : adminPanelView;
    saveParent.insertBefore(syncPassDiv, saveAdminBtn);
  }

  // Unlock Admin Panel
  if (unlockBtn) {
    unlockBtn.addEventListener("click", () => {
      if (passInput && passInput.value.trim() === ADMIN_PIN) {
        if (lockView) lockView.classList.add("hidden");
        if (adminPanelView) adminPanelView.classList.remove("hidden");
        if (adminBadge) {
          adminBadge.textContent = "Unlocked";
          adminBadge.className = "text-[10px] bg-emerald-900/60 text-emerald-300 px-2 py-1 rounded border border-emerald-700 font-mono";
        }
      } else {
        alert("Incorrect Admin Passcode. (Hint: 1981)");
        if (passInput) passInput.value = "";
      }
    });
  }

  // Save Master Settings & Sync to Firestore
  if (saveAdminBtn) {
    saveAdminBtn.addEventListener("click", async () => {
      const congsVal = congInput ? congInput.value.trim() : "";
      const groupsVal = groupInput ? groupInput.value.trim() : "";
      const groupTerrVal = groupTerrInput ? groupTerrInput.value.trim() : "";

      localStorage.setItem("kk_master_congregations", congsVal);
      localStorage.setItem("kk_master_groups", groupsVal);
      localStorage.setItem("kk_master_group_territories", groupTerrVal);

      // Get passphrase from the dedicated admin input or fallbacks
      const adminPassInput = document.getElementById("admin-sync-passphrase");
      const globalPassInput = document.getElementById("sync-passphrase-input");
      let passphrase = adminPassInput ? adminPassInput.value.trim() : "";
      if (!passphrase && globalPassInput) passphrase = globalPassInput.value.trim();
      if (!passphrase) passphrase = localStorage.getItem("kk_last_passphrase") || "";

      if (passphrase) {
        localStorage.setItem("kk_last_passphrase", passphrase);
      }

      // FIX: Add visual feedback during save
      saveAdminBtn.textContent = "Saving...";
      saveAdminBtn.disabled = true;

      // Update UI immediately before cloud sync
      if (typeof window.populateAllDropdowns === "function") {
        window.populateAllDropdowns();
      }

      if (passphrase && typeof window.backupToCloud === "function") {
        try {
          const success = await window.backupToCloud(passphrase);
          if (success) {
            alert("✓ Master settings successfully synced to the cloud for all publishers!");
          } else {
            alert("Master settings saved locally, but cloud sync failed. Check your network or passphrase.");
          }
        } catch(e) {
          alert("Saved locally. Cloud sync error: " + e.message);
        }
      } else {
        const entered = prompt("Master settings saved locally!\n\nEnter your shared cloud sync passphrase to push these updates to all publishers:");
        if (entered && entered.trim().length >= 4) {
          const cleanPass = entered.trim();
          localStorage.setItem("kk_last_passphrase", cleanPass);
          const success = await window.backupToCloud(cleanPass);
          if (success) {
            alert("✓ Master settings successfully synced to the cloud!");
          }
        } else {
          alert("Saved locally. (Cloud sync skipped - no passphrase provided).");
        }
      }
      
      saveAdminBtn.textContent = "💾 Save Master Settings & Sync Cloud";
      saveAdminBtn.disabled = false;
    });
  }

  // Helper to parse group-to-territory text lines into a map object
  window.getGroupTerritoryMap = function() {
    const rawText = localStorage.getItem("kk_master_group_territories") || "Haydon: 001, 002\nFairview: 003, 004";
    const mapping = {};
    rawText.split("\n").forEach(line => {
      const parts = line.split(":");
      if (parts.length === 2) {
        const groupName = parts[0].trim();
        const terrs = parts[1].split(",").map(t => t.trim()).filter(Boolean);
        mapping[groupName] = terrs;
      }
    });
    return mapping;
  };

  // Populate all dynamic dropdowns across the app
  window.populateAllDropdowns = function() {
    const congs = (localStorage.getItem("kk_master_congregations") || "Goodhope English").split(",").map(s => s.trim()).filter(Boolean);
    const rawGroups = (localStorage.getItem("kk_master_groups") || "Haydon, Fairview").split(",").map(s => s.trim()).filter(Boolean);
    
    // Auto-include any extra groups defined in the mapping block
    const mapping = window.getGroupTerritoryMap();
    let groups = [...rawGroups];
    Object.keys(mapping).forEach(g => {
      if (g && !groups.includes(g)) groups.push(g);
    });

    // 1. Lock/Set the Congregation in settings form automatically to the first official admin congregation
    const defaultCongInput = document.getElementById("default-congregation-input");
    if (defaultCongInput && congs.length > 0) {
      // FIX: Preserve user selection if exists, otherwise use first cong
      const savedCong = localStorage.getItem(window.KK_KEYS?.CONGREGATION || "kk_default_congregation") || congs[0];
      defaultCongInput.innerHTML = "";
      congs.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        defaultCongInput.appendChild(opt);
      });
      defaultCongInput.value = savedCong;
      // Don't make readonly if multiple congregations exist - let organizer choose
      if (congs.length === 1) {
        defaultCongInput.setAttribute("readonly", true);
        defaultCongInput.classList.add("bg-slate-950", "text-slate-400", "cursor-not-allowed");
      } else {
        defaultCongInput.removeAttribute("readonly");
        defaultCongInput.classList.remove("bg-slate-950", "text-slate-400", "cursor-not-allowed");
      }
    }

    // 2. Populate Visit Modal Congregation (Locked to official congregation)
    populateSelect("visit-congregation", congs);

    // 3. Populate Visit Modal Group (Strictly from approved admin list)
    populateSelect("visit-group", groups);

    // 4. Populate Records Tab Group Filter
    if (typeof window.populateRecordsGroupFilter === "function") {
      window.populateRecordsGroupFilter();
    }

    // 5. Update territory dropdowns based on group selection
    updateTerritoryDropdownForGroup();
    // FIX: Also update settings territory dropdown
    if (typeof window.updateSettingsTerritoryDropdown === "function") {
      window.updateSettingsTerritoryDropdown();
    }

    // 6. Populate Records Filter Territory Dropdown
    const filterTerrSelect = document.getElementById("filter-territory");
    if (filterTerrSelect) {
      const currentVal = filterTerrSelect.value;
      let allTerrs = [];
      Object.values(mapping).forEach(arr => { allTerrs = allTerrs.concat(arr); });
      if (allTerrs.length === 0) allTerrs = ["001", "002", "003", "004"];

      filterTerrSelect.innerHTML = '<option value="ALL">All Territories</option>';
      [...new Set(allTerrs)].forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = `Territory ${t}`;
        filterTerrSelect.appendChild(opt);
      });
      filterTerrSelect.value = currentVal || "ALL";
    }
  };

  function updateTerritoryDropdownForGroup() {
    const groupSelect = document.getElementById("visit-group");
    const terrSelect = document.getElementById("visit-territory");
    if (!groupSelect || !terrSelect) return;

    const selectedGroup = groupSelect.value;
    const mapping = window.getGroupTerritoryMap();
    const allowedTerritories = mapping[selectedGroup] || ["001", "002"];

    const currentTerrVal = terrSelect.value;
    terrSelect.innerHTML = "";
    allowedTerritories.forEach(t => {
      const opt = document.createElement("option");
      opt.value = t;
      opt.textContent = t;
      terrSelect.appendChild(opt);
    });

    if (allowedTerritories.includes(currentTerrVal)) {
      terrSelect.value = currentTerrVal;
    }
  }

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
    } else if (items.length > 0 && !currentVal) {
      // FIX: Auto-select first if no current value
      el.value = items[0];
    }
  }

  // Run on load
  window.populateAllDropdowns();
});