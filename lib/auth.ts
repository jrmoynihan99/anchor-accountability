// lib/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";

const isDev = __DEV__;

export async function ensureSignedIn() {
  try {
    // Wait for auth state to be restored
    await new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (isDev) {
          console.log("Auth state restored, user:", user?.uid || "none");
        }
        unsubscribe(); // Stop listening
        resolve();
      });
    });

    if (!auth.currentUser) {
      if (isDev) {
        console.log("No persisted user found, signing in anonymously...");
      }
      await signInAnonymously(auth);
      if (isDev) {
        console.log("Anonymous sign in successful");
      }
    } else {
      if (isDev) {
        console.log("User already signed in:", auth.currentUser.uid);
      }
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
    if (isDev) {
      console.log("Starting sign out process...");
    }

    await auth.signOut();
    await AsyncStorage.removeItem("hasCompletedOnboarding");

    if (isDev) {
      console.log("Sign out process completed successfully");
    }
  } catch (error) {
    console.error("Error during sign out:", error);
    throw error;
  }
}
