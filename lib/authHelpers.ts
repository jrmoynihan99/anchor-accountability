// lib/authHelpers.ts
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
  sendPasswordResetEmail,
  updatePassword,
} from "firebase/auth";
import { auth } from "./firebase";

/**
 * Resend email verification to the current user
 */
export async function resendVerificationEmail(): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No user is currently signed in");
  }

  if (user.isAnonymous) {
    throw new Error("Anonymous users cannot verify email");
  }

  if (user.emailVerified) {
    throw new Error("Email is already verified");
  }

  try {
    await sendEmailVerification(user);
  } catch (error: any) {
    console.error("Error sending verification email:", error);

    if (error.code === "auth/too-many-requests") {
      throw new Error("Too many requests. Please try again later.");
    }

    throw new Error(
      error.message || "Failed to send verification email. Please try again."
    );
  }
}

/**
 * Send password reset email (for logged out users on login screen)
 */
export async function sendPasswordReset(email: string): Promise<void> {
  if (!email || !email.trim()) {
    throw new Error("Please enter your email address");
  }

  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error("Error sending password reset:", error);

    // Handle specific error codes
    if (error.code === "auth/invalid-email") {
      throw new Error("Invalid email address");
    } else if (error.code === "auth/user-not-found") {
      throw new Error("No account found with this email");
    } else if (error.code === "auth/too-many-requests") {
      throw new Error("Too many requests. Please try again later.");
    } else if (error.code === "auth/missing-email") {
      throw new Error("Please enter your email address");
    }

    // Check if it's an unverified email error
    // Firebase doesn't send reset emails to unverified addresses
    if (
      error.message?.includes("unverified") ||
      error.message?.includes("not verified")
    ) {
      throw new Error("UNVERIFIED_EMAIL");
    }

    throw new Error(
      error.message || "Failed to send password reset email. Please try again."
    );
  }
}

/**
 * Change password for logged-in user (requires re-authentication)
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = auth.currentUser;

  if (!user) {
    throw new Error("No user is currently signed in");
  }

  if (user.isAnonymous) {
    throw new Error("Anonymous users cannot change password");
  }

  if (!user.email) {
    throw new Error("No email associated with this account");
  }

  if (!currentPassword || !currentPassword.trim()) {
    throw new Error("Please enter your current password");
  }

  if (!newPassword || !newPassword.trim()) {
    throw new Error("Please enter a new password");
  }

  if (newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters");
  }

  if (currentPassword === newPassword) {
    throw new Error("New password must be different from current password");
  }

  try {
    // Re-authenticate user first (required for sensitive operations)
    const credential = EmailAuthProvider.credential(
      user.email,
      currentPassword
    );
    await reauthenticateWithCredential(user, credential);

    // Now update the password
    await updatePassword(user, newPassword);
  } catch (error: any) {
    console.error("Error changing password:", error);

    // Handle specific error codes
    if (
      error.code === "auth/wrong-password" ||
      error.code === "auth/invalid-credential"
    ) {
      throw new Error("Current password is incorrect");
    } else if (error.code === "auth/weak-password") {
      throw new Error("New password is too weak. Use at least 6 characters.");
    } else if (error.code === "auth/requires-recent-login") {
      throw new Error(
        "For security, please sign out and sign back in before changing your password"
      );
    } else if (error.code === "auth/too-many-requests") {
      throw new Error("Too many attempts. Please try again later.");
    }

    throw new Error(
      error.message || "Failed to change password. Please try again."
    );
  }
}

/**
 * Check if current user's email is verified
 */
export function isEmailVerified(): boolean {
  const user = auth.currentUser;
  return user ? user.emailVerified : false;
}

/**
 * Check if current user has email/password authentication
 */
export function hasEmailPassword(): boolean {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) return false;
  return user.providerData.some(
    (provider) => provider.providerId === "password"
  );
}
