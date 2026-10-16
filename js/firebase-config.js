
/* =========================================================
   ECS — Firebase Configuration & Initialization
   Classroom Energy Management System
   ========================================================= */

// Firebase Web App configuration
const ecsFirebaseConfig = {
  apiKey: "AIzaSyDVk_ysewJCTd3p7aNxbsx8JrQT0JsJDCE",
  authDomain: "classroom-energy-management.firebaseapp.com",
  databaseURL: "https://classroom-energy-management-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "classroom-energy-management",
  storageBucket: "classroom-energy-management.firebasestorage.app",
  messagingSenderId: "365927412005",
  appId: "1:365927412005:web:06d4ed387eb496f5c6aacc",
  measurementId: "G-97VD2B01C1"
};

window.ecsFirebaseConfig = ecsFirebaseConfig;

let ecsAuthInstance = null;
let ecsDatabaseInstance = null;
let ecsFirebaseInitialized = false;

// Check for placeholder configuration
function ecsIsPlaceholderConfig(config) {
  if (!config) return true;
  const key = config.apiKey || "";
  return !key || key.includes("YOUR_ACTUAL") ||
    key.includes("PLACEHOLDER");
}

// Initialize Firebase once
function ecsInitFirebase() {
  if (
    ecsFirebaseInitialized &&
    ecsAuthInstance &&
    ecsDatabaseInstance
  ) {
    return ecsAuthInstance;
  }

  if (
    typeof firebase === "undefined" ||
    !firebase.initializeApp
  ) {
    console.error(
      "[ECS Firebase] Firebase SDK is not loaded. Check index.html."
    );
    return null;
  }

  if (ecsIsPlaceholderConfig(ecsFirebaseConfig)) {
    console.error("[ECS Firebase] Invalid placeholder API key.");
    return null;
  }

  try {
    if (!firebase.apps || firebase.apps.length === 0) {
      firebase.initializeApp(ecsFirebaseConfig);
    }

    ecsAuthInstance = firebase.auth();
    ecsDatabaseInstance = firebase.database();
    ecsFirebaseInitialized = true;

    ecsAuthInstance.onAuthStateChanged((user) => {
      if (user) {
        localStorage.setItem("ecs_auth", "true");

        if (user.displayName) {
          localStorage.setItem("ecs_user_name", user.displayName);
        }

        if (user.email) {
          localStorage.setItem("ecs_user_email", user.email);
        }
      }
    });

    console.log("[ECS Firebase] Authentication connected.");
    console.log("[ECS Firebase] Realtime Database initialized.");

    return ecsAuthInstance;
  } catch (error) {
    console.error("[ECS Firebase] Initialization failed:", error);
    return null;
  }
}

// Get Authentication instance
function ecsGetAuth() {
  if (!ecsAuthInstance) ecsInitFirebase();
  return ecsAuthInstance;
}

// Get Realtime Database instance
function ecsGetDatabase() {
  if (!ecsDatabaseInstance) ecsInitFirebase();
  return ecsDatabaseInstance;
}

// Friendly Authentication error messages
function ecsGetFriendlyAuthError(error) {
  if (!error) {
    return "An unexpected error occurred. Please try again.";
  }

  const code = (
    error.code || (typeof error === "string" ? error : "")
  ).toLowerCase();

  const message = error.message || "";

  console.warn("[ECS Auth Error]", error);

  if (code.includes("api-key") || code.includes("invalid-api-key")) {
    return "Invalid Firebase API key. Check your Firebase configuration.";
  }

  if (code.includes("unauthorized-domain")) {
    return "This domain is not authorized in Firebase Authentication settings.";
  }

  if (code.includes("operation-not-allowed")) {
    return "Enable Email/Password sign-in in Firebase Authentication settings.";
  }

  if (code.includes("email-already-in-use")) {
    return "This email is already registered. Please sign in.";
  }

  if (code.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }

  if (
    code.includes("user-not-found") ||
    code.includes("wrong-password") ||
    code.includes("invalid-credential") ||
    code.includes("invalid-login-credentials")
  ) {
    return "Invalid email or password.";
  }

  if (code.includes("weak-password")) {
    return "Password must be at least 6 characters.";
  }

  if (code.includes("too-many-requests")) {
    return "Too many attempts. Please try again later.";
  }

  if (code.includes("network")) {
    return "Network error. Check your internet connection.";
  }

  return message || "Authentication failed. Please try again.";
}

// Expose functions globally for existing ECS scripts
window.ecsInitFirebase = ecsInitFirebase;
window.ecsGetAuth = ecsGetAuth;
window.ecsGetDatabase = ecsGetDatabase;
window.ecsGetFriendlyAuthError = ecsGetFriendlyAuthError;
window.ecsIsPlaceholderConfig = ecsIsPlaceholderConfig;
