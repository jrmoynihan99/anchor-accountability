// lib/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";

export async function ensureSignedIn() {
  try {
    // Wait for auth state to be restored
    await new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        console.log("Auth state restored, user:", user?.uid || "none");
        unsubscribe(); // Stop listening
        resolve();
      });
    });

    if (!auth.currentUser) {
      console.log("No persisted user found, signing in anonymously...");
      const result = await signInAnonymously(auth);
      console.log("Anonymous sign in successful:", result.user.uid);
    } else {
      console.log("User already signed in:", auth.currentUser.uid);
    }
  } catch (error) {
    console.error("Error with anonymous sign in:", error);
    throw error;
  }
}

export function isAnonymousUser(): boolean {
  return auth.currentUser?.isAnonymous ?? false;
}

export async function signOut() {
  try {
    console.log("🔄 Starting sign out process...");
    console.log("Current user before signOut:", auth.currentUser?.uid);

    await auth.signOut();
    console.log("✅ Firebase auth.signOut() completed");
    console.log("Current user after signOut:", auth.currentUser?.uid);

    await AsyncStorage.removeItem("hasCompletedOnboarding");
    console.log("✅ AsyncStorage onboarding flag cleared");

    console.log("🎉 Sign out process completed successfully");
  } catch (error) {
    console.error("❌ Error during sign out:", error);
    throw error;
  }
}
