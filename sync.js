// ==========================================
// FIREBASE CLOUD SYNC & PASSPHRASE BACKUP
// ==========================================
// FIX: REMOVED AUTO-PURGE BLOCK THAT WAS KILLING PWA
// ==========================================
// OLD CODE (DELETED - WHY BAD):
// if ('serviceWorker' in navigator) {
//   navigator.serviceWorker.getRegistrations().then(function(registrations) {
//     for(let registration of registrations) {
//       registration.unregister();
//       console.log("Old service worker unregistered to prevent caching bugs.");
//     }
//   });
// }
// if ('caches' in window) {
//   caches.keys().then(function(names) {
//     for (let name of names) {
//       caches.delete(name);
//     }
//   });
// }
// REASON FOR REMOVAL:
// This code ran on EVERY app load and unregistered the service worker,
// deleting all caches including satellite tiles. This made the app
// never truly offline-capable and caused Cloudflare to serve stale
// code because SW was gone. Cache purging should ONLY happen inside
// sw.js activate event with version bump, not here.
// ==========================================

const firebaseConfig = {
  apiKey: "AIzaSyDdkNUhrDBzblJqPK4NEB90nUqfnYdbQ7w",
  authDomain: "knock-knock-app-43c71.firebaseapp.com",
  projectId: "knock-knock-app-43c71",
  storageBucket: "knock-knock-app-43c71.firebasestorage.app",
  messagingSenderId: "93064544930",
  appId: "1:93064544930:web:1079ed4dda65dcb0760dfb",
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

async function hashPassphrase(passphrase) {
  const msgBuffer = new TextEncoder().encode(passphrase.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

window.backupToCloud = async function(passphrase) {
  if (!passphrase || passphrase.trim().length < 4) {
    alert("Please enter a valid passphrase (at least 4 characters).");
    return false;
  }

  try {
    const hashKey = await hashPassphrase(passphrase);
    const records = JSON.parse(localStorage.getItem("knock-knock-visits") || "[]");
    
    // Grab master configuration settings
    const masterCongregations = localStorage.getItem("kk_master_congregations") || "";
    const masterGroups = localStorage.getItem("kk_master_groups") || "";
    const masterGroupTerritories = localStorage.getItem("kk_master_group_territories") || "";

    // FIX: Check payload size before upload (Firestore 1MB limit)
    const payload = JSON.stringify({records, masterCongregations, masterGroups, masterGroupTerritories});
    const sizeKB = new Blob([payload]).size / 1024;
    if (sizeKB > 900) {
      alert(`Backup too large (${sizeKB.toFixed(0)}KB). Firestore limit is ~1000KB. Please delete old records or split backups.`);
      return false;
    }
    
    // Save records and master settings to Firestore
    await db.collection("territory_backups").doc(hashKey).set({
      records: records,
      masterCongregations: masterCongregations,
      masterGroups: masterGroups,
      masterGroupTerritories: masterGroupTerritories,
      updatedAt: new Date().toISOString(),
      // FIX: Add metadata for debugging
      recordCount: records.length,
      appVersion: "v2-fixed"
    });

    console.log("☁️ Successfully backed up records and master settings to Firebase!");
    // FIX: Save passphrase for next time
    localStorage.setItem("kk_last_passphrase", passphrase.trim());
    return true;
  } catch (error) {
    console.error("Firebase Backup Error:", error);
    alert("Backup failed: " + (error.message || "Check internet / Firebase config"));
    return false;
  }
};

window.restoreFromCloud = async function(passphrase) {
  if (!passphrase || passphrase.trim().length < 4) {
    alert("Please enter a valid passphrase (at least 4 characters).");
    return false;
  }

  try {
    const hashKey = await hashPassphrase(passphrase);
    const docRef = await db.collection("territory_backups").doc(hashKey).get();

    if (!docRef.exists) {
      alert("No cloud backup found for this passphrase.");
      return false;
    }

    const data = docRef.data();
    if (data) {
      if (data.records) {
        localStorage.setItem("knock-knock-visits", JSON.stringify(data.records));
      }
      if (data.masterCongregations) {
        localStorage.setItem("kk_master_congregations", data.masterCongregations);
      }
      if (data.masterGroups) {
        localStorage.setItem("kk_master_groups", data.masterGroups);
      }
      if (data.masterGroupTerritories) {
        localStorage.setItem("kk_master_group_territories", data.masterGroupTerritories);
      }
      
      // FIX: Save passphrase
      localStorage.setItem("kk_last_passphrase", passphrase.trim());

      if (typeof window.populateAllDropdowns === "function") window.populateAllDropdowns();
      if (typeof window.loadRecords === "function") window.loadRecords();
      if (typeof window.renderRecordsList === "function") window.renderRecordsList();
      if (typeof window.recreatePins === "function") window.recreatePins();

      console.log("☁️ Successfully restored records and master settings from Firebase!");

      // Force a clean confirmation and reload so dropdowns reflect new master settings immediately
      alert("✓ Successfully restored from cloud! The page will now refresh to load your new groups and territories.");
      window.location.reload();

      return true;
    }
    return false;
  } catch (error) {
    console.error("Firebase Restore Error:", error);
    alert("Restore failed: " + (error.message || "Check internet / Firebase config"));
    return false;
  }
};

// ==========================================
// FIX: REMOVED IMMEDIATE CALLS THAT CAUSED RACE
// OLD CODE (DELETED - WHY BAD):
// if (typeof window.populateAllDropdowns === "function") window.populateAllDropdowns();
// if (typeof window.loadRecords === "function") window.loadRecords();
// ... etc
// REASON: This file loads BEFORE admin.js (which defines populateAllDropdowns)
// So these calls always failed with undefined. They also ran outside
// DOMContentLoaded, before DOM existed. Now admin.js handles init.
// The functions will be called properly after DOM ready via admin.js
// ==========================================