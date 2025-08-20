// hooks/useThreads.ts
import { auth, db } from "@/lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  Timestamp,
  Unsubscribe,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

export interface ThreadData {
  id: string;
  userA: string; // reachOutUser
  userB: string; // helperUser
  startedFromPleaId?: string;
  createdAt: Timestamp;
  lastMessage?: {
    text: string;
    timestamp: Timestamp;
    senderUid: string;
  };
  lastActivity: Timestamp;
  userA_unreadCount: number;
  userB_unreadCount: number;
}

export interface ThreadWithMessages extends ThreadData {
  otherUserName: string;
  otherUserId: string;
  unreadCount: number;
}

export function useThreads() {
  const [threads, setThreads] = useState<ThreadWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Keep track of unsubscribe functions
  const unsubscribesRef = useRef<Unsubscribe[]>([]);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      setThreads([]);
      return;
    }

    const currentUserId = auth.currentUser.uid;

    // Clean up any existing listeners
    unsubscribesRef.current.forEach((unsub) => unsub());
    unsubscribesRef.current = [];

    const threadsRef = collection(db, "threads");

    // Query for threads where user is either userA or userB
    const userAQuery = query(threadsRef, where("userA", "==", currentUserId));

    const userBQuery = query(threadsRef, where("userB", "==", currentUserId));

    let userAThreads: ThreadWithMessages[] = [];
    let userBThreads: ThreadWithMessages[] = [];

    const updateThreads = () => {
      const allThreads = [...userAThreads, ...userBThreads];

      // Remove duplicates based on thread ID (for cases where userA === userB)
      const uniqueThreads = allThreads.filter(
        (thread, index, self) =>
          index === self.findIndex((t) => t.id === thread.id)
      );

      // Improved sorting - prioritize lastMessage timestamp over lastActivity
      uniqueThreads.sort((a, b) => {
        // First try to use lastMessage timestamp as it's most accurate
        const aMessageTime = a.lastMessage?.timestamp?.toMillis
          ? a.lastMessage.timestamp.toMillis()
          : 0;
        const bMessageTime = b.lastMessage?.timestamp?.toMillis
          ? b.lastMessage.timestamp.toMillis()
          : 0;

        // If both have lastMessage timestamps, use those
        if (aMessageTime && bMessageTime) {
          return bMessageTime - aMessageTime; // Most recent first
        }

        // Fall back to lastActivity if one or both don't have lastMessage
        const aActivityTime = a.lastActivity?.toMillis
          ? a.lastActivity.toMillis()
          : 0;
        const bActivityTime = b.lastActivity?.toMillis
          ? b.lastActivity.toMillis()
          : 0;

        // Use whichever timestamp is more recent
        const aTime = Math.max(aMessageTime, aActivityTime);
        const bTime = Math.max(bMessageTime, bActivityTime);

        return bTime - aTime; // Most recent first
      });

      setThreads(uniqueThreads);
    };

    // Listen to userA threads
    const unsubA = onSnapshot(
      userAQuery,
      (snapshot) => {
        userAThreads = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userA: data.userA || "",
            userB: data.userB || "",
            startedFromPleaId: data.startedFromPleaId,
            createdAt: data.createdAt,
            lastMessage: data.lastMessage,
            // Use createdAt as fallback if lastActivity is missing
            lastActivity: data.lastActivity || data.createdAt,
            // Provide defaults for unread counts
            userA_unreadCount: data.userA_unreadCount || 0,
            userB_unreadCount: data.userB_unreadCount || 0,
            otherUserId: data.userB,
            otherUserName: `user-${data.userB?.substring(0, 5) || "unknown"}`,
            unreadCount: data.userA_unreadCount || 0,
          };
        });
        updateThreads();
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to userA threads:", err);
        setError("Failed to load threads");
        setLoading(false);
      }
    );

    // Listen to userB threads
    const unsubB = onSnapshot(
      userBQuery,
      (snapshot) => {
        userBThreads = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userA: data.userA || "",
            userB: data.userB || "",
            startedFromPleaId: data.startedFromPleaId,
            createdAt: data.createdAt,
            lastMessage: data.lastMessage,
            // Use createdAt as fallback if lastActivity is missing
            lastActivity: data.lastActivity || data.createdAt,
            // Provide defaults for unread counts
            userA_unreadCount: data.userA_unreadCount || 0,
            userB_unreadCount: data.userB_unreadCount || 0,
            otherUserId: data.userA,
            otherUserName: `user-${data.userA?.substring(0, 5) || "unknown"}`,
            unreadCount: data.userB_unreadCount || 0,
          };
        });
        updateThreads();
        setError(null);
        setLoading(false);
      },
      (err) => {
        console.error("Error listening to userB threads:", err);
        setError("Failed to load threads");
        setLoading(false);
      }
    );

    unsubscribesRef.current = [unsubA, unsubB];

    return () => {
      unsubscribesRef.current.forEach((unsub) => unsub());
      unsubscribesRef.current = [];
    };
  }, [auth.currentUser]);

  return { threads, loading, error };
}
