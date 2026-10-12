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
    saveAdminBtn.addEventListener("click", () => {
      const congsVal = congInput ? congInput.value.trim() : "";
      const groupsVal = groupInput ? groupInput.value.trim() : "";
      const groupTerrVal = groupTerrInput ? groupTerrInput.value.trim() : "";

      localStorage.setItem("kk_master_congregations", congsVal);
      localStorage.setItem("kk_master_groups", groupsVal);
      localStorage.setItem("kk_master_group_territories", groupTerrVal);

      // Package configuration object for Firestore cloud sync
      const masterConfig = {
        congregations: congsVal,
        groups: groupsVal,
        groupTerritories: groupTerrVal,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem("kk_master_config_json", JSON.stringify(masterConfig));

      alert("Master settings saved successfully! Dropdowns updated.");
      
      if (typeof window.populateAllDropdowns === "function") {
        window.populateAllDropdowns();
      }
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

  // Populate Dropdowns & Handle Hierarchical Dependent Changes
  window.populateAllDropdowns = function() {
    const congs = (localStorage.getItem("kk_master_congregations") || "Goodhope English").split(",").map(s => s.trim()).filter(Boolean);
    const groups = (localStorage.getItem("kk_master_groups") || "Haydon").split(",").map(s => s.trim()).filter(Boolean);
    
    // 1. Populate Congregation Dropdown
    populateSelect("visit-congregation", congs);

    // 2. Populate Group Dropdown
    const groupSelect = document.getElementById("visit-group");
    populateSelect("visit-group", groups);

    // 3. Setup Dependent Territory Filtering based on selected Group
    if (groupSelect) {
      // Remove old listeners to prevent duplicate triggers
      groupSelect.onchange = updateTerritoryDropdownForGroup;
    }

    // Initial population of territories for the currently selected group
    updateTerritoryDropdownForGroup();

    // 4. Populate Records Filter Territory Dropdown (shows all unique territories across groups)
    const filterTerrSelect = document.getElementById("filter-territory");
    if (filterTerrSelect) {
      const currentVal = filterTerrSelect.value;
      const mapping = window.getGroupTerritoryMap();
      let allTerrs = [];
      Object.values(mapping.forEach || []).forEach(arr => allTerrs = allTerrs.concat(arr));
      // Fallback if empty
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
    }
  }

  // Populate Group Filter in Records Tab & handle cascading territory options
  window.populateRecordsGroupFilter = function() {
    const groupFilterEl = document.getElementById("filter-group");
    if (!groupFilterEl) return;

    const groups = (localStorage.getItem("kk_master_groups") || "Haydon, Fairview").split(",").map(s => s.trim()).filter(Boolean);
    const currentVal = groupFilterEl.value;

    groupFilterEl.innerHTML = '<option value="ALL">All Groups</option>';
    groups.forEach(g => {
      const opt = document.createElement("option");
      opt.value = g;
      opt.textContent = `Group: ${g}`;
      groupFilterEl.appendChild(opt);
    });
    groupFilterEl.value = currentVal || "ALL";
  };

  // When Group filter changes in Records view, update the Territory filter options for that group
  window.onGroupFilterChanged = function() {
    const groupFilterEl = document.getElementById("filter-group");
    const terrFilterEl = document.getElementById("filter-territory");
    if (!groupFilterEl || !terrFilterEl) return;

    const selectedGroup = groupFilterEl.value;
    const mapping = window.getGroupTerritoryMap();

    terrFilterEl.innerHTML = '<option value="ALL">All Territories</option>';

    if (selectedGroup === "ALL") {
      // Show all territories across all groups
      let allTerrs = [];
      Object.values(mapping).forEach(arr => { allTerrs = allTerrs.concat(arr); });
      [...new Set(allTerrs)].forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = `Territory ${t}`;
        terrFilterEl.appendChild(opt);
      });
    } else {
      // Show only territories belonging to the selected group
      const groupTerrs = mapping[selectedGroup] || [];
      groupTerrs.forEach(t => {
        const opt = document.createElement("option");
        opt.value = t;
        opt.textContent = `Territory ${t}`;
        terrFilterEl.appendChild(opt);
      });
    }

    window.filterRecords();
  };



  // Run on load
  window.populateAllDropdowns();
});