// lib/auth.ts - UPDATED
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  deleteUser,
  EmailAuthProvider,
  linkWithCredential,
  onAuthStateChanged,
  signInAnonymously,
} from "firebase/auth";
import { NativeModules, Platform } from "react-native";
import { auth } from "./firebase";

const isDev = __DEV__;

export async function ensureSignedIn() {
  try {
    let isNewUser = false;

    // Wait for auth state to be restored
    await new Promise<void>((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (isDev) {
          console.log("Auth state restored, user:", user?.uid || "none");
        }
        unsubscribe();
        resolve();
      });
    });

    if (!auth.currentUser) {
      if (isDev) {
        console.log("No persisted user found, signing in anonymously...");
      }
      await signInAnonymously(auth);
      isNewUser = true;
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

    // Clear widget data from App Group
    if (Platform.OS === "ios") {
      const { AppGroupStorage } = NativeModules;
      await AppGroupStorage?.clearWidgetData?.();
      await AppGroupStorage?.reloadWidgetTimelines?.();
    }

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

    // Clear widget data before deleting the user
    if (Platform.OS === "ios") {
      const { AppGroupStorage } = NativeModules;
      await AppGroupStorage?.clearWidgetData?.();
      await AppGroupStorage?.reloadWidgetTimelines?.();
    }

    // Delete the user account from Firebase Auth
    // This triggers the cloud function (onUserAccountDeleted) which handles all data deletion
    await deleteUser(user);

    // Clear onboarding flag
    await AsyncStorage.removeItem("hasCompletedOnboarding");

    if (isDev) {
      console.log("Account deletion initiated successfully");
      console.log("Cloud function will handle data cleanup in the background");
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

export async function convertAnonymousToEmail(
  email: string,
  password: string
): Promise<void> {
  const currentUser = auth.currentUser;

  if (!currentUser) {
    throw new Error("No user is currently signed in");
  }

  if (!currentUser.isAnonymous) {
    throw new Error("Current user is not anonymous");
  }

  try {
    // Create email/password credential
    const credential = EmailAuthProvider.credential(email, password);

    // Link the credential to the anonymous account
    // This converts the anonymous account to a permanent one
    await linkWithCredential(currentUser, credential);

    console.log("Successfully converted anonymous account to email account");

    // That's it! Firebase handles everything.
    // The UID stays the same, all Firestore data stays intact.
  } catch (error: any) {
    console.error("Error converting account:", error);

    // Handle specific errors
    if (error.code === "auth/email-already-in-use") {
      throw new Error("This email is already in use by another account");
    } else if (error.code === "auth/weak-password") {
      throw new Error("Password should be at least 6 characters");
    } else if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address");
    } else if (error.code === "auth/credential-already-in-use") {
      throw new Error("This email is already linked to another account");
    }

    throw new Error(error.message || "Failed to convert account");
  }
}
