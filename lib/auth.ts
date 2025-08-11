// lib/auth.ts
import { signInAnonymously } from "firebase/auth";
import { auth } from "./firebase";

export async function ensureSignedIn() {
  try {
    if (!auth.currentUser) {
      console.log("Signing in anonymously...");
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