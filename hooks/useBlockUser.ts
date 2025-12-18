// hooks/useBlockUser.ts
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useState } from "react";

/**
 * Hook that lets the current user block another user.
 * Creates a document in /users/{currentUser}/blockList/{targetUser}.
 * Also sets any active accountability relationships to "blocked" status.
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

      // ✅ Set any accountability relationships to "blocked" status
      await updateAccountabilityRelationshipsToBlocked(
        currentUser.uid,
        userIdToBlock
      );

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

      return true;
    } catch (err: any) {
      console.error("Error blocking user:", err);
      setError(err.message || "Failed to block user.");
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Helper function to update accountability relationships to blocked status
  const updateAccountabilityRelationshipsToBlocked = async (
    currentUserId: string,
    blockedUserId: string
  ) => {
    try {
      // Find relationships where current user is the mentor
      const asMentorQuery = query(
        collection(db, "accountabilityRelationships"),
        where("mentorUid", "==", currentUserId),
        where("menteeUid", "==", blockedUserId),
        where("status", "==", "active")
      );

      // Find relationships where current user is the mentee
      const asMenteeQuery = query(
        collection(db, "accountabilityRelationships"),
        where("mentorUid", "==", blockedUserId),
        where("menteeUid", "==", currentUserId),
        where("status", "==", "active")
      );

      const [asMentorSnap, asMenteeSnap] = await Promise.all([
        getDocs(asMentorQuery),
        getDocs(asMenteeQuery),
      ]);

      // Update all found relationships to "blocked" status
      const updatePromises = [
        ...asMentorSnap.docs.map((doc) =>
          updateDoc(doc.ref, {
            status: "blocked",
            updatedAt: serverTimestamp(),
          })
        ),
        ...asMenteeSnap.docs.map((doc) =>
          updateDoc(doc.ref, {
            status: "blocked",
            updatedAt: serverTimestamp(),
          })
        ),
      ];

      await Promise.all(updatePromises);

      if (updatePromises.length > 0) {
        console.log(
          `✅ Set ${updatePromises.length} accountability relationship(s) to blocked status`
        );
      }
    } catch (err) {
      console.error("Error updating accountability relationships:", err);
      // Don't throw - we still want the block to succeed even if this fails
    }
  };

  return {
    blockUser,
    loading,
    error,
  };
}
