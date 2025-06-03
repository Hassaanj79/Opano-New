
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Directly get the API key
const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Log the raw value read from process.env
console.log("[Firebase Setup] Raw NEXT_PUBLIC_FIREBASE_API_KEY from process.env:", firebaseApiKey);

const firebaseConfig = {
  apiKey: firebaseApiKey, // Use the retrieved key
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Log the constructed config object
console.log("[Firebase Setup] firebaseConfig object to be used for initialization:", JSON.stringify(firebaseConfig, null, 2));

let app: FirebaseApp | undefined;
let authModule: Auth | undefined; // Renamed to avoid conflict with auth variable from getAuth
let db: Firestore | undefined;

if (typeof window !== "undefined") {
  const isApiKeyPlaceholder = 
    !firebaseApiKey || 
    firebaseApiKey === "YOUR_API_KEY" || 
    firebaseApiKey === "YOUR_FIREBASE_API_KEY_HERE" || // Common placeholder from previous prompt
    firebaseApiKey.includes("AIzaSyYOUR_REAL_API_KEY") || // Common placeholder format
    firebaseApiKey.startsWith("AIzaSy") === false; // Basic check for typical Firebase API key start

  if (isApiKeyPlaceholder) {
    console.error(
      "[Firebase Setup] CRITICAL ERROR: Firebase API Key appears to be invalid, a placeholder, or missing. " +
      "Actual value seen: '" + firebaseApiKey + "'. " +
      "Firebase will NOT be initialized. Please check your .env.local file for NEXT_PUBLIC_FIREBASE_API_KEY, " +
      "ensure it's correctly set with your *actual* key, and restart the server."
    );
  } else if (
      !firebaseConfig.authDomain ||
      !firebaseConfig.projectId ||
      !firebaseConfig.appId
  ) {
    console.error(
      "[Firebase Setup] CRITICAL ERROR: One or more essential Firebase config values (authDomain, projectId, appId) are missing. " +
      "Firebase will NOT be initialized. Please check your .env.local file and restart the server."
    );
  } else {
    if (!getApps().length) {
      try {
        console.log("[Firebase Setup] Attempting to initialize Firebase app with valid-looking config.");
        app = initializeApp(firebaseConfig);
        authModule = getAuth(app);
        db = getFirestore(app);
        console.log("[Firebase Setup] Firebase app initialized successfully on the client.");
      } catch (error) {
        console.error("[Firebase Setup] Error initializing Firebase app on the client even with seemingly valid config:", error);
      }
    } else {
      app = getApps()[0];
      authModule = getAuth(app);
      db = getFirestore(app);
      console.log("[Firebase Setup] Firebase app already initialized on the client.");
    }
  }
} else {
  console.log("[Firebase Setup] Firebase client SDK initialization deferred (server-side or pre-client execution).");
}

// Export auth module as 'auth' for consistency with its usage in other files
export { app, authModule as auth, db };
