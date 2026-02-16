import { useOrganization } from "@/context/OrganizationContext";
import { auth, db } from "@/lib/firebase";
import * as Notifications from "expo-notifications";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

// --- Helper: Get total unread count from centralized user doc field ---
async function fetchTotalUnreadCount(organizationId: string): Promise<number> {
  const uid = auth.currentUser?.uid;
  if (!uid) return 0;

  const userDoc = await getDoc(
    doc(db, "organizations", organizationId, "users", uid)
  );
  return Math.max(0, userDoc.data()?.unreadTotal || 0);
}

// --- Hook: useUnreadCount ---
export function useUnreadCount() {
  const { organizationId, loading: orgLoading } = useOrganization();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUnreadCount = useCallback(async () => {
    if (!organizationId) {
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const count = await fetchTotalUnreadCount(organizationId);
      setUnreadCount(count);
      // Update iOS badge
      await Notifications.setBadgeCountAsync(count);
    } finally {
      setLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    if (!orgLoading) {
      refreshUnreadCount();
    }
  }, [refreshUnreadCount, orgLoading]);

  return {
    unreadCount,
    loading: loading || orgLoading,
    refreshUnreadCount, // <-- Call this after you mark things as read!
  };
}
