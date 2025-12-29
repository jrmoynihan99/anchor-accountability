import { auth, db } from "@/lib/firebase";
import * as Notifications from "expo-notifications";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";

// --- Helper: Get total unread count for current user ---
async function fetchTotalUnreadCount(): Promise<number> {
  const uid = auth.currentUser?.uid;
  if (!uid) return 0;

  let totalUnread = 0;

  // --- Threads: userA ---
  let threadsSnap = await getDocs(
    query(collection(db, "threads"), where("userA", "==", uid))
  );
  threadsSnap.forEach((doc) => {
    totalUnread += doc.data().userA_unreadCount || 0;
  });

  // --- Threads: userB ---
  threadsSnap = await getDocs(
    query(collection(db, "threads"), where("userB", "==", uid))
  );
  threadsSnap.forEach((doc) => {
    totalUnread += doc.data().userB_unreadCount || 0;
  });

  // --- Pleas: unread encouragements ---
  const pleasSnap = await getDocs(
    query(collection(db, "pleas"), where("uid", "==", uid))
  );
  pleasSnap.forEach((doc) => {
    totalUnread += doc.data().unreadEncouragementCount || 0;
  });

  return totalUnread;
}

// --- Hook: useUnreadCount ---
export function useUnreadCount() {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUnreadCount = useCallback(async () => {
    setLoading(true);
    try {
      const count = await fetchTotalUnreadCount();
      setUnreadCount(count);
      // Update iOS badge
      await Notifications.setBadgeCountAsync(count);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  return {
    unreadCount,
    loading,
    refreshUnreadCount, // <-- Call this after you mark things as read!
  };
}
