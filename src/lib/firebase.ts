
// src/lib/firebase.ts
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Log the API key to help debug (REMOVE THIS IN PRODUCTION)
console.log("[Firebase Setup] NEXT_PUBLIC_FIREBASE_API_KEY being used:", firebaseApiKey);
if (!firebaseApiKey || firebaseApiKey === "YOUR_API_KEY") {
  console.error("[Firebase Setup] ERROR: Firebase API Key is missing or still a placeholder in .env.local. Please check your .env.local file and restart the server.");
}

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApps()[0];
}

auth = getAuth(app);
db = getFirestore(app);

export { app, auth, db };
