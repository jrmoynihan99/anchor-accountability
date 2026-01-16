// hooks/block/useUnblockUser.ts
import { useOrganization } from "@/context/OrganizationContext";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  deleteDoc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { useState } from "react";

export function useUnblockUser() {
  const { organizationId } = useOrganization();
  const [loading, setLoading] = useState(false);

  const unblockUser = async (userId: string): Promise<boolean> => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      console.error("No user logged in");
      return false;
    }

    if (!organizationId) {
      console.error("No organization ID available");
      return false;
    }

    setLoading(true);

    try {
      // Step 1: Find and delete the block document
      const blockListRef = collection(
        db,
        "organizations",
        organizationId,
        "users",
        currentUser.uid,
        "blockList"
      );
      const blockQuery = query(blockListRef, where("uid", "==", userId));
      const blockSnapshot = await getDocs(blockQuery);

      if (!blockSnapshot.empty) {
        await deleteDoc(blockSnapshot.docs[0].ref);
      }

      // Step 2: Restore any "blocked" accountability relationships back to "active"
      await restoreAccountabilityRelationships(
        organizationId,
        currentUser.uid,
        userId
      );

      setLoading(false);
      return true;
    } catch (error) {
      console.error("Error unblocking user:", error);
      setLoading(false);
      return false;
    }
  };

  return { unblockUser, loading };
}

// Helper function to restore accountability relationships
async function restoreAccountabilityRelationships(
  organizationId: string,
  currentUserId: string,
  unblockedUserId: string
): Promise<void> {
  try {
    // Find relationships where current user is the mentor
    const asMentorQuery = query(
      collection(
        db,
        "organizations",
        organizationId,
        "accountabilityRelationships"
      ),
      where("mentorUid", "==", currentUserId),
      where("menteeUid", "==", unblockedUserId),
      where("status", "==", "blocked")
    );

    // Find relationships where current user is the mentee
    const asMenteeQuery = query(
      collection(
        db,
        "organizations",
        organizationId,
        "accountabilityRelationships"
      ),
      where("mentorUid", "==", unblockedUserId),
      where("menteeUid", "==", currentUserId),
      where("status", "==", "blocked")
    );

    const [asMentorSnap, asMenteeSnap] = await Promise.all([
      getDocs(asMentorQuery),
      getDocs(asMenteeQuery),
    ]);

    // Update all found relationships back to "active"
    const updatePromises = [
      ...asMentorSnap.docs.map((doc) =>
        updateDoc(doc.ref, {
          status: "active",
          updatedAt: serverTimestamp(),
        })
      ),
      ...asMenteeSnap.docs.map((doc) =>
        updateDoc(doc.ref, {
          status: "active",
          updatedAt: serverTimestamp(),
        })
      ),
    ];

    await Promise.all(updatePromises);

    if (updatePromises.length > 0) {
      console.log(
        `✅ Restored ${updatePromises.length} accountability relationship(s) to active status`
      );
    }
  } catch (err) {
    console.error("Error restoring accountability relationships:", err);
    // Don't throw - we still want to complete the unblock even if this fails
  }
}
