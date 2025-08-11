import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FB_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FB_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FB_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FB_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FB_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FB_APP_ID,
};

// TEMPORARY DEBUG - Add this after firebaseConfig
console.log("=== FIREBASE CONFIG DEBUG ===");
console.log("API Key:", firebaseConfig.apiKey ? "EXISTS" : "MISSING");
console.log("Auth Domain:", firebaseConfig.authDomain);
console.log("Project ID:", firebaseConfig.projectId);
console.log("App ID:", firebaseConfig.appId ? "EXISTS" : "MISSING");
console.log("==============================");

const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
