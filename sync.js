// ==========================================
// FIREBASE CLOUD SYNC & PASSPHRASE BACKUP
// ==========================================

// TODO: Replace these placeholders with your free Firebase project configuration
const firebaseConfig = {
  apiKey: "YOUR_FIREBASE_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
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
 * Backup local visit records to Firebase using passphrase
 */
window.backupToCloud = async function(passphrase) {
  if (!passphrase || passphrase.trim().length < 4) {
    alert("Please enter a valid passphrase (at least 4 characters).");
    return false;
  }

  try {
    const hashKey = await hashPassphrase(passphrase);
    const records = JSON.parse(localStorage.getItem("knock-knock-visits") || "[]");
    
    // Save to Firestore collection under hashed key
    await db.collection("territory_backups").doc(hashKey).set({
      records: records,
      updatedAt: new Date().toISOString()
    });

    console.log("☁️ Successfully backed up records to Firebase!");
    return true;
  } catch (error) {
    console.error("Firebase Backup Error:", error);
    alert("Backup failed. Check your internet connection or Firebase configuration.");
    return false;
  }
};

/**
 * Restore records from Firebase using passphrase
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
    if (data && data.records) {
      // Save to local storage
      localStorage.setItem("knock-knock-visits", JSON.stringify(data.records));
      
      // Refresh memory, lists, and map markers
      if (typeof window.loadRecords === "function") window.loadRecords();
      if (typeof window.renderRecordsList === "function") window.renderRecordsList();
      if (typeof window.recreatePins === "function") window.recreatePins();

      console.log("☁️ Successfully restored records from Firebase!");
      return true;
    }
    return false;
  } catch (error) {
    console.error("Firebase Restore Error:", error);
    alert("Restore failed. Check your internet connection or Firebase configuration.");
    return false;
  }
};