// hooks/useThreads.ts
import { useOrganization } from "@/context/OrganizationContext";
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
import { useBlockedByUsers } from "../block/useBlockedByUsers";
import { useBlockedUsers } from "../block/useBlockedUsers";

export interface ThreadData {
  id: string;
  userA: string;
  userB: string;
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
  const uid = auth.currentUser?.uid ?? null;
  const { organizationId, loading: orgLoading } = useOrganization();

  const [threads, setThreads] = useState<ThreadWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 2-way block state
  const { blockedUserIds, loading: blockedLoading } = useBlockedUsers(); // who I blocked
  const { blockedByUserIds, loading: blockedByLoading } = useBlockedByUsers(); // who blocked me

  // Keep track of unsubscribe functions
  const unsubscribesRef = useRef<Unsubscribe[]>([]);

  // Helper: hide thread if the other user is blocked either direction
  const shouldHide = (otherUid: string) =>
    blockedUserIds.has(otherUid) || blockedByUserIds.has(otherUid);

  useEffect(() => {
    if (!uid || !organizationId || orgLoading) {
      setThreads([]);
      setLoading(false);
      return;
    }

    // Wait for both block lists
    if (blockedLoading || blockedByLoading) return;

    // Clean up any existing listeners
    unsubscribesRef.current.forEach((unsub) => unsub());
    unsubscribesRef.current = [];

    const threadsRef = collection(
      db,
      "organizations",
      organizationId,
      "threads"
    );

    // Query for threads where user is either userA or userB
    const userAQuery = query(threadsRef, where("userA", "==", uid));
    const userBQuery = query(threadsRef, where("userB", "==", uid));

    let userAThreads: ThreadWithMessages[] = [];
    let userBThreads: ThreadWithMessages[] = [];

    const updateThreads = () => {
      const all = [...userAThreads, ...userBThreads];

      // Dedupe by thread id
      const unique = all.filter(
        (t, i, self) => i === self.findIndex((x) => x.id === t.id)
      );

      // 2-way block filter
      const filtered = unique.filter((t) => !shouldHide(t.otherUserId));

      // Sort by latest activity, using lastMessage.timestamp first, fallback to lastActivity
      filtered.sort((a, b) => {
        const aMsg = a.lastMessage?.timestamp?.toMillis
          ? a.lastMessage.timestamp.toMillis()
          : 0;
        const bMsg = b.lastMessage?.timestamp?.toMillis
          ? b.lastMessage.timestamp.toMillis()
          : 0;

        if (aMsg !== bMsg) return bMsg - aMsg;

        const aAct = a.lastActivity?.toMillis ? a.lastActivity.toMillis() : 0;
        const bAct = b.lastActivity?.toMillis ? b.lastActivity.toMillis() : 0;
        return bAct - aAct;
      });

      setThreads(filtered);
    };

    // Listen to threads where I'm userA
    const unsubA = onSnapshot(
      userAQuery,
      (snapshot) => {
        userAThreads = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          const otherId = data.userB as string;
          return {
            id: doc.id,
            userA: data.userA || "",
            userB: data.userB || "",
            startedFromPleaId: data.startedFromPleaId,
            createdAt: data.createdAt,
            lastMessage: data.lastMessage,
            lastActivity: data.lastActivity || data.createdAt,
            userA_unreadCount: data.userA_unreadCount || 0,
            userB_unreadCount: data.userB_unreadCount || 0,
            otherUserId: otherId,
            otherUserName: `user-${otherId?.substring(0, 5) || "unk"}`,
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

    // Listen to threads where I'm userB
    const unsubB = onSnapshot(
      userBQuery,
      (snapshot) => {
        userBThreads = snapshot.docs.map((doc) => {
          const data = doc.data() as any;
          const otherId = data.userA as string;
          return {
            id: doc.id,
            userA: data.userA || "",
            userB: data.userB || "",
            startedFromPleaId: data.startedFromPleaId,
            createdAt: data.createdAt,
            lastMessage: data.lastMessage,
            lastActivity: data.lastActivity || data.createdAt,
            userA_unreadCount: data.userA_unreadCount || 0,
            userB_unreadCount: data.userB_unreadCount || 0,
            otherUserId: otherId,
            otherUserName: `user-${otherId?.substring(0, 5) || "unk"}`,
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
  }, [
    uid,
    organizationId,
    orgLoading,
    blockedLoading,
    blockedByLoading,
    blockedUserIds,
    blockedByUserIds,
  ]);

  return {
    threads,
    loading: loading || blockedLoading || blockedByLoading,
    error,
  };
}
