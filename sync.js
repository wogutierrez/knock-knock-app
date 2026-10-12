// ==========================================
// FIREBASE CLOUD SYNC & PASSPHRASE BACKUP
// ==========================================

// TODO: Replace these placeholders with your free Firebase project configuration
const firebaseConfig = {
  apiKey: "AIzaSyDdkNUhrDBzblJqPK4NEB90nUqfnYdbQ7w",
  authDomain: "knock-knock-app-43c71.firebaseapp.com",
  projectId: "knock-knock-app-43c71",
  storageBucket: "knock-knock-app-43c71.firebasestorage.app",
  messagingSenderId: "93064544930",
  appId: "1:93064544930:web:1079ed4dda65dcb0760dfb",
};

// Initialize Firebase if not already initialized
if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}
const db = firebase.firestore();

/**
 * Hash passphrase using browser SHA-256 for clean, secure collection paths
 */
async function hashPassphrase(passphrase) {
  const msgBuffer = new TextEncoder().encode(passphrase.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Backup local visit records and admin master settings to Firebase using passphrase
 */
window.backupToCloud = async function(passphrase) {
  if (!passphrase || passphrase.trim().length < 4) {
    alert("Please enter a valid passphrase (at least 4 characters).");
    return false;
  }

  try {
    const hashKey = await hashPassphrase(passphrase);
    const records = JSON.parse(localStorage.getItem("knock-knock-visits") || "[]");
    
    // Grab organizer's approved master settings from localStorage
    const masterCongregations = localStorage.getItem("kk_master_congregations") || "";
    const masterGroups = localStorage.getItem("kk_master_groups") || "";
    const masterGroupTerritories = localStorage.getItem("kk_master_group_territories") || "";
    
    // Save records and master settings to Firestore collection under hashed key
    await db.collection("territory_backups").doc(hashKey).set({
      records: records,
      masterCongregations: masterCongregations,
      masterGroups: masterGroups,
      masterGroupTerritories: masterGroupTerritories,
      updatedAt: new Date().toISOString()
    });

    console.log("☁️ Successfully backed up records and master settings to Firebase!");
    return true;
  } catch (error) {
    console.error("Firebase Backup Error:", error);
    alert("Backup failed. Check your internet connection or Firebase configuration.");
    return false;
  }
};

/**
 * Restore records and admin master settings from Firebase using passphrase
 */
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
      // 1. Restore house visit pins
      if (data.records) {
        localStorage.setItem("knock-knock-visits", JSON.stringify(data.records));
      }

      // 2. Restore Organizer Master Settings so every publisher gets the exact same approved setup
      if (data.masterCongregations) {
        localStorage.setItem("kk_master_congregations", data.masterCongregations);
      }
      if (data.masterGroups) {
        localStorage.setItem("kk_master_groups", data.masterGroups);
      }
      if (data.masterGroupTerritories) {
        localStorage.setItem("kk_master_group_territories", data.masterGroupTerritories);
      }
      
      // 3. Refresh UI dropdowns, memory, lists, and map markers across the app
      if (typeof window.populateAllDropdowns === "function") window.populateAllDropdowns();
      if (typeof window.loadRecords === "function") window.loadRecords();
      if (typeof window.renderRecordsList === "function") window.renderRecordsList();
      if (typeof window.recreatePins === "function") window.recreatePins();

      console.log("☁️ Successfully restored records and master settings from Firebase!");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Firebase Restore Error:", error);
    alert("Restore failed. Check your internet connection or Firebase configuration.");
    return false;
  }
};