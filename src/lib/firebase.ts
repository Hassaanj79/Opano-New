
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

// Directly get the environment variables
const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
const firebaseAuthDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const firebaseProjectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const firebaseStorageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
const firebaseMessagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const firebaseAppId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId,
};

console.log("[Firebase Setup] Raw NEXT_PUBLIC_FIREBASE_API_KEY:", firebaseApiKey);
console.log("[Firebase Setup] Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", firebaseAuthDomain);
console.log("[Firebase Setup] Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID:", firebaseProjectId);
console.log("[Firebase Setup] Full firebaseConfig object for initialization:", JSON.stringify(firebaseConfig, null, 2));

let app: FirebaseApp | undefined;
let authModule: Auth | undefined;
let db: Firestore | undefined;

if (typeof window !== "undefined") {
  let configError = false;
  const checkPlaceholder = (value: string | undefined, name: string): boolean => {
    if (!value || value.startsWith("YOUR_") || value.includes("AIzaSyYOUR_REAL_API_KEY") || (name === "NEXT_PUBLIC_FIREBASE_API_KEY" && !value.startsWith("AIzaSy"))) {
      console.error(`[Firebase Setup] CRITICAL ERROR: ${name} appears to be a placeholder or invalid. Value: '${value}'.`);
      configError = true;
      return true;
    }
    if (value.length < 5) { // Arbitrary short length check
        console.error(`[Firebase Setup] CRITICAL ERROR: ${name} appears to be too short to be valid. Value: '${value}'.`);
        configError = true;
        return true;
    }
    return false;
  };

  checkPlaceholder(firebaseApiKey, "NEXT_PUBLIC_FIREBASE_API_KEY");
  checkPlaceholder(firebaseAuthDomain, "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN");
  checkPlaceholder(firebaseProjectId, "NEXT_PUBLIC_FIREBASE_PROJECT_ID");
  checkPlaceholder(firebaseAppId, "NEXT_PUBLIC_FIREBASE_APP_ID");
  // StorageBucket and MessagingSenderId are often optional for basic auth/firestore but good to check
  // checkPlaceholder(firebaseStorageBucket, "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET");
  // checkPlaceholder(firebaseMessagingSenderId, "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID");


  if (configError) {
    console.error(
      "[Firebase Setup] Firebase will NOT be initialized due to configuration errors. " +
      "Please check your .env.local file for all NEXT_PUBLIC_FIREBASE_... variables, " +
      "ensure they are correctly set with your *actual* project credentials, and restart the server."
    );
  } else {
    if (!getApps().length) {
      try {
        console.log("[Firebase Setup] Attempting to initialize Firebase app with provided config.");
        app = initializeApp(firebaseConfig);
        authModule = getAuth(app);
        db = getFirestore(app);
        console.log("[Firebase Setup] Firebase app initialized successfully on the client.");
      } catch (error) {
        console.error("[Firebase Setup] Error initializing Firebase app on the client:", error);
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

export { app, authModule as auth, db };
