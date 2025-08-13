import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApps, initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
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

// Initialize Auth with AsyncStorage persistence using dynamic import
let auth: Auth;
try {
  // Use require() to avoid TypeScript import issues
  const { getReactNativePersistence } = require("firebase/auth");

  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  console.log("✅ Firebase Auth initialized with AsyncStorage persistence");
} catch (error) {
  // If auth is already initialized, get the existing instance
  console.log(
    "⚠️  Auth already initialized, getting existing instance:",
    error
  );
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
