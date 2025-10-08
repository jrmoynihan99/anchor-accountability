// hooks/useBlockUser.ts
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { useState } from "react";

/**
 * Hook that lets the current user block another user.
 * Creates a document in /users/{currentUser}/blockList/{targetUser}.
 */
export function useBlockUser() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blockUser = async (userIdToBlock: string): Promise<boolean> => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      setError("You must be signed in to block users.");
      return false;
    }

    if (!userIdToBlock) {
      setError("Invalid user ID.");
      return false;
    }

    if (currentUser.uid === userIdToBlock) {
      setError("You cannot block yourself.");
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      // ✅ Verify target user exists (prevents bogus IDs like "user-abc")
      const targetRef = doc(db, "users", userIdToBlock);
      const targetSnap = await getDoc(targetRef);

      if (!targetSnap.exists()) {
        setError("User does not exist.");
        setLoading(false);
        return false;
      }

      // ✅ Create blockList entry under current user's document
      const blockDocRef = doc(
        db,
        "users",
        currentUser.uid,
        "blockList",
        userIdToBlock
      );
      await setDoc(blockDocRef, {
        uid: userIdToBlock,
        createdAt: serverTimestamp(),
      });

      console.log(`✅ Successfully blocked user: ${userIdToBlock}`);
      return true;
    } catch (err: any) {
      console.error("Error blocking user:", err);
      setError(err.message || "Failed to block user.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    blockUser,
    loading,
    error,
  };
}
