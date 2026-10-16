
/* =========================================================
   ECS - Firebase Configuration
   Classroom Energy Management System
   ========================================================= */

const ecsFirebaseConfig = {
  apiKey: "AIzaSyDVk_ysewJCTd3p7aNxbsx8JrQT0JsJDCE",
  authDomain: "classroom-energy-management.firebaseapp.com",
  databaseURL:
    "https://classroom-energy-management-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "classroom-energy-management",
  storageBucket: "classroom-energy-management.firebasestorage.app",
  messagingSenderId: "365927412005",
  appId: "1:365927412005:web:06d4ed387eb496f5c6aacc",
  measurementId: "G-97VD2B01C1"
};

window.ecsFirebaseConfig = ecsFirebaseConfig;

let ecsAuthInstance = null;
let ecsDatabaseInstance = null;

function ecsInitFirebase() {
  try {
    if (
      typeof firebase === "undefined" ||
      typeof firebase.initializeApp !== "function"
    ) {
      console.error(
        "[ECS Firebase] Firebase SDK is missing. Check index.html script order."
      );
      return null;
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(ecsFirebaseConfig);
    }

    ecsAuthInstance = firebase.auth();
    ecsDatabaseInstance = firebase.database();

    console.log("[ECS Firebase] Initialized successfully.");

    return ecsAuthInstance;
  } catch (error) {
    console.error("[ECS Firebase] Initialization failed:", error);
    return null;
  }
}

function ecsGetAuth() {
  if (!ecsAuthInstance) {
    ecsInitFirebase();
  }

  return ecsAuthInstance;
}

function ecsGetDatabase() {
  if (!ecsDatabaseInstance) {
    ecsInitFirebase();
  }

  return ecsDatabaseInstance;
}

function ecsGetFriendlyAuthError(error) {
  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }

  const code = String(error.code || "").toLowerCase();
  const message = error.message || "";

  console.error("[ECS Auth Error]", code, message);

  if (code.includes("email-already-in-use")) {
    return "This email is already registered. Please sign in instead.";
  }

  if (
    code.includes("invalid-credential") ||
    code.includes("wrong-password") ||
    code.includes("user-not-found") ||
    code.includes("invalid-login-credentials")
  ) {
    return "Invalid email or password.";
  }

  if (code.includes("weak-password")) {
    return "Password must be at least 6 characters.";
  }

  if (code.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }

  if (code.includes("unauthorized-domain")) {
    return "This website domain is not authorized in Firebase.";
  }

  if (code.includes("operation-not-allowed")) {
    return "Enable Email/Password sign-in in Firebase Console.";
  }

  if (code.includes("network")) {
    return "Network error. Check your internet connection.";
  }

  return message || "Authentication failed. Please try again.";
}

window.ecsInitFirebase = ecsInitFirebase;
window.ecsGetAuth = ecsGetAuth;
window.ecsGetDatabase = ecsGetDatabase;
window.ecsGetFriendlyAuthError = ecsGetFriendlyAuthError;
window.ecsIsPlaceholderConfig = function () {
  return false;
};

// Initialize when this script loads.
ecsInitFirebase();
