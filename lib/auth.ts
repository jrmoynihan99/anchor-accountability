// lib/auth.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  deleteUser,
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "./firebase";

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

export async function deleteAccount() {
  try {
    const user = auth.currentUser;

    if (!user) {
      throw new Error("No user is currently signed in");
    }

    if (isDev) {
      console.log("Starting account deletion for user:", user.uid);
    }

    // Delete user document from Firestore users collection
    try {
      const userDocRef = doc(db, "users", user.uid);
      await deleteDoc(userDocRef);

      if (isDev) {
        console.log("User document deleted from Firestore");
      }
    } catch (firestoreError) {
      console.error(
        "Error deleting user document from Firestore:",
        firestoreError
      );
      // Continue with auth deletion even if Firestore deletion fails
    }

    // Delete the user account from Firebase Auth
    await deleteUser(user);

    // Clear onboarding flag
    await AsyncStorage.removeItem("hasCompletedOnboarding");

    if (isDev) {
      console.log("Account deletion completed successfully");
    }
  } catch (error: any) {
    console.error("Error during account deletion:", error);

    // Handle re-authentication requirement
    if (error.code === "auth/requires-recent-login") {
      throw new Error(
        "For security reasons, please sign out and sign back in before deleting your account."
      );
    }

    throw error;
  }
}
