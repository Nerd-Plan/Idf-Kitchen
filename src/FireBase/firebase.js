import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, signInWithCustomToken } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? "AIzaSyD_Bo46cN43UVCbjwd3fWHWEjJIgUun0FA",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? "idf-kitchen.firebaseapp.com",
  databaseURL:
    import.meta.env.VITE_FIREBASE_DATABASE_URL ??
    "https://idf-kitchen-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? "idf-kitchen",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? "idf-kitchen.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? "384834623627",
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? "1:384834623627:web:3419d4aa635abfacfd5c8e",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID ?? "G-LXX8F9Q6ES",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const ALLOW_ANONYMOUS_AUTH = String(import.meta.env.VITE_ALLOW_ANON_AUTH ?? "true").toLowerCase() !== "false";
const CUSTOM_AUTH_TOKEN = import.meta.env.VITE_FIREBASE_CUSTOM_TOKEN;

let authReadyPromise = null;
let authFailure = null;

function isAuthConfigError(error) {
  return error?.code === "auth/configuration-not-found" || error?.code === "auth/operation-not-allowed";
}

export function ensureFirebaseAuth() {
  if (auth.currentUser) return Promise.resolve(auth.currentUser);
  if (authReadyPromise) return authReadyPromise;
  if (authFailure) return Promise.reject(authFailure);

  authReadyPromise = (async () => {
    const existingUser = await new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        unsubscribe();
        resolve(user);
      });
    });
    if (existingUser) return existingUser;

    if (CUSTOM_AUTH_TOKEN) {
      try {
        const credential = await signInWithCustomToken(auth, CUSTOM_AUTH_TOKEN);
        authFailure = null;
        return credential.user;
      } catch (error) {
        if (!ALLOW_ANONYMOUS_AUTH) throw error;
      }
    }

    if (!ALLOW_ANONYMOUS_AUTH) {
      throw new Error("anonymous-auth-disabled");
    }

    try {
      const credential = await signInAnonymously(auth);
      authFailure = null;
      return credential.user;
    } catch (error) {
      if (isAuthConfigError(error)) {
        const configuredError = new Error("firebase-auth-provider-not-configured");
        configuredError.code = error?.code;
        authFailure = configuredError;
        throw configuredError;
      }
      authFailure = error;
      throw error;
    }
  })()
    .catch((error) => {
      authFailure = error;
      throw error;
    })
    .finally(() => {
      authReadyPromise = null;
    });

  return authReadyPromise;
}
