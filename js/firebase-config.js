/* =========================================================
   ECS — Firebase Configuration & Initialization
   Classroom Energy Management System
   Production Domain: https://classroom-client-site.vercel.app
   ========================================================= */

// Standard Firebase Web Client Configuration
// Replace the values below with your real Firebase Web App configuration:
// Firebase Console > Project Settings > General > Your apps > Web app
// (NO private service-account secrets or admin credentials belong here)
const ecsFirebaseConfig = {
  apiKey: "AIzaSyDVk_ysewJCTd3p7aNxbsx8JrQT0JsJDCE",
  authDomain: "classroom-energy-management.firebaseapp.com",
  projectId: "classroom-energy-management",
  storageBucket: "classroom-energy-management.firebasestorage.app",
  messagingSenderId: "365927412005",
  appId: "1:365927412005:web:06d4ed387eb496f5c6aacc",
  measurementId: "G-97VD2B01C1"
};

// Expose configuration globally
window.ecsFirebaseConfig = ecsFirebaseConfig;

let ecsAuthInstance = null;
let ecsFirebaseInitialized = false;

/**
 * Checks if the current configuration contains placeholder credentials.
 */
function ecsIsPlaceholderConfig(config) {
  if (!config) return true;
  const key = config.apiKey || '';
  return !key || key.includes('YOUR_ACTUAL') || key.includes('PLACEHOLDER');
}

/**
 * Initializes Firebase App and Authentication strictly once.
 * Prevents duplicate initialization across page navigations.
 */
function ecsInitFirebase() {
  if (ecsFirebaseInitialized && ecsAuthInstance) {
    return ecsAuthInstance;
  }

  if (typeof firebase !== 'undefined' && firebase.initializeApp) {
    try {
      if (ecsIsPlaceholderConfig(ecsFirebaseConfig)) {
        console.warn(
          '[ECS Firebase] Placeholder API key detected ("' + ecsFirebaseConfig.apiKey + '"). ' +
          'Please update js/firebase-config.js with your real Firebase Web App credentials from Firebase Console.'
        );
      }

      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(ecsFirebaseConfig);
      }
      ecsAuthInstance = firebase.auth();
      ecsFirebaseInitialized = true;

      // Listen for auth state changes from Firebase
      ecsAuthInstance.onAuthStateChanged((user) => {
        if (user) {
          localStorage.setItem('ecs_auth', 'true');
          if (user.displayName) {
            localStorage.setItem('ecs_user_name', user.displayName);
          }
          if (user.email) {
            localStorage.setItem('ecs_user_email', user.email);
          }
        }
      });

      return ecsAuthInstance;
    } catch (error) {
      console.error('ECS Firebase initialization error:', error);
      return null;
    }
  }

  console.warn('ECS: Firebase SDK is not loaded yet.');
  return null;
}

/**
 * Friendly error messages for user interface
 * Converts raw Firebase error codes into clean, actionable messages.
 * Never hides actionable errors behind generic opaque messages.
 */
function ecsGetFriendlyAuthError(error) {
  if (!error) return 'An unexpected error occurred. Please try again.';
  
  const rawCode = error.code || (typeof error === 'string' ? error : '');
  const code = rawCode.toLowerCase();
  const message = error.message || '';

  // Development console logging to identify the exact cause
  console.warn('[ECS Auth Error Caught]', { rawCode, message, error });

  if (code.includes('api-key') || code.includes('invalid-api-key') || message.toLowerCase().includes('api key') || message.toLowerCase().includes('api-key')) {
    return 'Firebase configuration error: Invalid or placeholder API key. Please update js/firebase-config.js with your real Firebase Web App configuration from Firebase Console.';
  }

  if (code.includes('unauthorized-domain')) {
    const currentHost = (typeof window !== 'undefined' && window.location.hostname) ? window.location.hostname : '127.0.0.1';
    return `Domain not authorized (${currentHost}). Please add 127.0.0.1, localhost, and classroom-client-site.vercel.app to Firebase Console > Authentication > Settings > Authorized domains.`;
  }

  if (code.includes('operation-not-allowed')) {
    return 'Sign-in method is not enabled. Please enable Email/Password (or Google) in Firebase Console > Authentication > Sign-in method.';
  }

  if (code.includes('email-already-in-use')) {
    return 'This email is already registered. Please sign in instead.';
  }

  if (code.includes('invalid-email')) {
    return 'Please enter a valid email address.';
  }

  if (code.includes('user-disabled')) {
    return 'This account has been disabled. Please contact system administrator.';
  }

  if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential') || code.includes('invalid-login-credentials')) {
    return 'Invalid email or password.';
  }

  if (code.includes('weak-password')) {
    return 'Password must be at least 6 characters.';
  }

  if (code.includes('popup-closed-by-user')) {
    return 'Google sign-in was closed before completing.';
  }

  if (code.includes('popup-blocked')) {
    return 'Sign-in popup was blocked by your browser. Please allow popups for this site.';
  }

  if (code.includes('too-many-requests')) {
    return 'Access temporarily disabled due to many failed attempts. Please try again later.';
  }

  if (code.includes('network') || message.toLowerCase().includes('network') || message.toLowerCase().includes('offline')) {
    return 'Network error. Please check your internet connection.';
  }

  if (code.includes('project-not-found')) {
    return 'Firebase project not found. Please verify the projectId in js/firebase-config.js.';
  }

  if (code.includes('configuration-not-found')) {
    return 'Firebase Authentication configuration not found for this project in Firebase Console.';
  }

  // Do not hide the real error behind an opaque generic message
  return message || (rawCode ? `Authentication error: ${rawCode}` : 'Unable to process authentication. Please try again.');
}

// Global exposure
if (typeof window !== 'undefined') {
  window.ecsInitFirebase = ecsInitFirebase;
  window.ecsGetFriendlyAuthError = ecsGetFriendlyAuthError;
  window.ecsIsPlaceholderConfig = ecsIsPlaceholderConfig;
}
