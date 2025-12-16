// hooks/useAccountabilityRelationships.ts

import { auth, db } from "@/lib/firebase";
import { AccountabilityRelationship } from "@/types/AccountabilityRelationship";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  Unsubscribe,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  calculateCheckInStatus,
  CheckInStatus,
} from "../components/morphing/accountability/accountabilityUtils";
import { useBlockedByUsers } from "./useBlockedByUsers";
import { useBlockedUsers } from "./useBlockedUsers";

interface AccountabilityWithId extends AccountabilityRelationship {
  id: string;
  checkInStatus: CheckInStatus;
  menteeTimezone?: string;
  mentorTimezone?: string;
}

// For pending invites, we don't need check-in status
interface PendingInvite extends AccountabilityRelationship {
  id: string;
}

export function useAccountabilityRelationships() {
  const uid = auth.currentUser?.uid ?? null;

  // Active relationships
  const [mentor, setMentor] = useState<AccountabilityWithId | null>(null);
  const [mentees, setMentees] = useState<AccountabilityWithId[]>([]);

  // Pending invites
  const [sentInvites, setSentInvites] = useState<PendingInvite[]>([]);
  const [receivedInvites, setReceivedInvites] = useState<PendingInvite[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ NEW: Get blocked users
  const { blockedUserIds, loading: blockedLoading } = useBlockedUsers();
  const { blockedByUserIds, loading: blockedByLoading } = useBlockedByUsers();

  const mentorUnsubRef = useRef<Unsubscribe | null>(null);
  const menteesUnsubRef = useRef<Unsubscribe | null>(null);
  const sentInvitesUnsubRef = useRef<Unsubscribe | null>(null);
  const receivedInvitesUnsubRef = useRef<Unsubscribe | null>(null);

  // Cache to avoid refetching user docs repeatedly
  const timezoneCache = useRef<Record<string, string | undefined>>({}).current;

  // ✅ NEW: Helper to check if user should be hidden
  const shouldHide = (otherUserId: string) => {
    if (!uid) return true;
    return blockedUserIds.has(otherUserId) || blockedByUserIds.has(otherUserId);
  };

  // Fetch user timezone from Firestore (with caching)
  const getTimezoneForUser = async (
    userId: string
  ): Promise<string | undefined> => {
    if (timezoneCache[userId]) return timezoneCache[userId];

    const snap = await getDoc(doc(db, "users", userId));
    const tz = snap.data()?.timezone;
    timezoneCache[userId] = tz;
    return tz;
  };

  useEffect(() => {
    if (!uid) {
      setMentor(null);
      setMentees([]);
      setSentInvites([]);
      setReceivedInvites([]);
      setLoading(false);
      return;
    }

    // ✅ NEW: Wait for block lists to load
    if (blockedLoading || blockedByLoading) return;

    setLoading(true);

    // ===============================
    // 🔵 LISTEN FOR MY MENTOR (I am the mentee) - ACTIVE ONLY
    // ===============================
    const mentorQuery = query(
      collection(db, "accountabilityRelationships"),
      where("menteeUid", "==", uid),
      where("status", "==", "active")
    );

    mentorUnsubRef.current = onSnapshot(
      mentorQuery,
      async (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data() as AccountabilityRelationship;

          // ✅ NEW: Filter out if blocked
          if (shouldHide(data.mentorUid)) {
            setMentor(null);
            return;
          }

          // Fetch MY timezone
          const myTimezone = await getTimezoneForUser(uid);

          setMentor({
            ...data,
            id: docSnap.id,
            mentorTimezone: myTimezone,
            checkInStatus: calculateCheckInStatus(
              data.lastCheckIn || null,
              myTimezone
            ),
          });
        } else {
          setMentor(null);
        }
      },
      (err) => {
        console.error("mentor listener error:", err);
        setError("Failed to load mentor");
      }
    );

    // ===============================
    // 🟢 LISTEN FOR MY MENTEES (I am the mentor) - ACTIVE ONLY
    // ===============================
    const menteesQuery = query(
      collection(db, "accountabilityRelationships"),
      where("mentorUid", "==", uid),
      where("status", "==", "active")
    );

    menteesUnsubRef.current = onSnapshot(
      menteesQuery,
      async (snapshot) => {
        const results: AccountabilityWithId[] = [];

        for (const docSnap of snapshot.docs) {
          const data = docSnap.data() as AccountabilityRelationship;

          // ✅ NEW: Filter out if blocked
          if (shouldHide(data.menteeUid)) continue;

          // Fetch each mentee's timezone
          const menteeTimezone = await getTimezoneForUser(data.menteeUid);

          results.push({
            ...data,
            id: docSnap.id,
            menteeTimezone,
            checkInStatus: calculateCheckInStatus(
              data.lastCheckIn || null,
              menteeTimezone
            ),
          });
        }

        // Sort by newest relationship first
        results.sort((a, b) => {
          const aTime = a.createdAt?.toMillis?.() ?? 0;
          const bTime = b.createdAt?.toMillis?.() ?? 0;
          return bTime - aTime;
        });

        setMentees(results);
      },
      (err) => {
        console.error("mentees listener error:", err);
        setError("Failed to load mentees");
      }
    );

    // ===============================
    // 📤 LISTEN FOR SENT INVITES (I am the mentee sending invites) - PENDING ONLY
    // ===============================
    const sentInvitesQuery = query(
      collection(db, "accountabilityRelationships"),
      where("menteeUid", "==", uid),
      where("status", "==", "pending")
    );

    sentInvitesUnsubRef.current = onSnapshot(
      sentInvitesQuery,
      (snapshot) => {
        const invites = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (invite: any) => !shouldHide(invite.mentorUid)
          ) as PendingInvite[]; // ✅ NEW: Filter blocked
        setSentInvites(invites);
      },
      (err) => {
        console.error("sent invites listener error:", err);
      }
    );

    // ===============================
    // 📥 LISTEN FOR RECEIVED INVITES (I am being asked to be the MENTOR) - PENDING ONLY
    // ===============================
    const receivedInvitesQuery = query(
      collection(db, "accountabilityRelationships"),
      where("mentorUid", "==", uid),
      where("status", "==", "pending")
    );

    receivedInvitesUnsubRef.current = onSnapshot(
      receivedInvitesQuery,
      (snapshot) => {
        const invites = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (invite: any) => !shouldHide(invite.menteeUid)
          ) as PendingInvite[]; // ✅ NEW: Filter blocked
        setReceivedInvites(invites);
      },
      (err) => {
        console.error("received invites listener error:", err);
      }
    );

    setLoading(false);

    return () => {
      mentorUnsubRef.current?.();
      menteesUnsubRef.current?.();
      sentInvitesUnsubRef.current?.();
      receivedInvitesUnsubRef.current?.();
    };
  }, [uid, blockedLoading, blockedByLoading, blockedUserIds, blockedByUserIds]); // ✅ NEW: Add dependencies

  // ===============================
  // 📨 INVITE FUNCTIONS
  // ===============================

  // Send an invite to become someone's mentor
  const sendInvite = async (menteeUid: string): Promise<string> => {
    if (!uid) throw new Error("Not authenticated");

    try {
      // Create the invite
      const docRef = await addDoc(
        collection(db, "accountabilityRelationships"),
        {
          mentorUid: menteeUid, // THEY will be MY mentor
          menteeUid: uid, // I am the mentee
          status: "pending",
          streak: 0,
          lastCheckIn: null,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        }
      );

      // Find the thread between these two users and increment unread count
      const threadsAsA = await getDocs(
        query(
          collection(db, "threads"),
          where("userA", "==", uid),
          where("userB", "==", menteeUid)
        )
      );

      const threadsAsB = await getDocs(
        query(
          collection(db, "threads"),
          where("userA", "==", menteeUid),
          where("userB", "==", uid)
        )
      );

      const allThreads = [...threadsAsA.docs, ...threadsAsB.docs];

      if (allThreads.length > 0) {
        const threadDoc = allThreads[0];
        const threadData = threadDoc.data();
        const threadRef = doc(db, "threads", threadDoc.id);

        // Increment unread count for the person receiving the invite (menteeUid)
        if (threadData.userA === menteeUid) {
          await updateDoc(threadRef, {
            userA_unreadCount: (threadData.userA_unreadCount || 0) + 1,
          });
        } else if (threadData.userB === menteeUid) {
          await updateDoc(threadRef, {
            userB_unreadCount: (threadData.userB_unreadCount || 0) + 1,
          });
        }
      }

      return docRef.id;
    } catch (err) {
      console.error("Error sending invite:", err);
      throw new Error("Failed to send invite");
    }
  };

  // Accept an invite (just update status to active)
  const acceptInvite = async (inviteId: string): Promise<void> => {
    if (!uid) throw new Error("Not authenticated");

    try {
      // Get the invite to find out who sent it
      const inviteDoc = await getDoc(
        doc(db, "accountabilityRelationships", inviteId)
      );
      if (!inviteDoc.exists()) return;

      const inviteData = inviteDoc.data();
      const menteeUid = inviteData.menteeUid;
      const mentorUid = inviteData.mentorUid;

      // Update invite status to active
      await updateDoc(doc(db, "accountabilityRelationships", inviteId), {
        status: "active",
        updatedAt: serverTimestamp(),
      });

      // Decrement the thread's unread count (removing the +1 from the invite)
      const threadsAsA = await getDocs(
        query(
          collection(db, "threads"),
          where("userA", "==", menteeUid),
          where("userB", "==", mentorUid)
        )
      );

      const threadsAsB = await getDocs(
        query(
          collection(db, "threads"),
          where("userA", "==", mentorUid),
          where("userB", "==", menteeUid)
        )
      );

      const allThreads = [...threadsAsA.docs, ...threadsAsB.docs];

      if (allThreads.length > 0) {
        const threadDoc = allThreads[0];
        const threadData = threadDoc.data();
        const threadRef = doc(db, "threads", threadDoc.id);

        // Decrement unread count for the person who accepted (mentorUid = uid)
        if (threadData.userA === mentorUid) {
          await updateDoc(threadRef, {
            userA_unreadCount: Math.max(
              0,
              (threadData.userA_unreadCount || 0) - 1
            ),
          });
        } else if (threadData.userB === mentorUid) {
          await updateDoc(threadRef, {
            userB_unreadCount: Math.max(
              0,
              (threadData.userB_unreadCount || 0) - 1
            ),
          });
        }
      }
    } catch (err) {
      console.error("Error accepting invite:", err);
      throw new Error("Failed to accept invite");
    }
  };

  // End a relationship (delete it)
  const endRelationship = async (relationshipId: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, "accountabilityRelationships", relationshipId));
    } catch (err) {
      console.error("Error ending relationship:", err);
      throw new Error("Failed to end relationship");
    }
  };

  // Decline an invite (update status to declined)
  const declineInvite = async (inviteId: string): Promise<void> => {
    try {
      // Get the invite to find out who sent it
      const inviteDoc = await getDoc(
        doc(db, "accountabilityRelationships", inviteId)
      );
      if (!inviteDoc.exists()) return;

      const inviteData = inviteDoc.data();
      const menteeUid = inviteData.menteeUid;
      const mentorUid = inviteData.mentorUid;

      // Update invite status to declined
      await updateDoc(doc(db, "accountabilityRelationships", inviteId), {
        status: "declined",
        updatedAt: serverTimestamp(),
      });

      // Decrement the thread's unread count
      const threadsAsA = await getDocs(
        query(
          collection(db, "threads"),
          where("userA", "==", menteeUid),
          where("userB", "==", mentorUid)
        )
      );

      const threadsAsB = await getDocs(
        query(
          collection(db, "threads"),
          where("userA", "==", mentorUid),
          where("userB", "==", menteeUid)
        )
      );

      const allThreads = [...threadsAsA.docs, ...threadsAsB.docs];

      if (allThreads.length > 0) {
        const threadDoc = allThreads[0];
        const threadData = threadDoc.data();
        const threadRef = doc(db, "threads", threadDoc.id);

        // Decrement unread count for the person who declined (mentorUid)
        if (threadData.userA === mentorUid) {
          await updateDoc(threadRef, {
            userA_unreadCount: Math.max(
              0,
              (threadData.userA_unreadCount || 0) - 1
            ),
          });
        } else if (threadData.userB === mentorUid) {
          await updateDoc(threadRef, {
            userB_unreadCount: Math.max(
              0,
              (threadData.userB_unreadCount || 0) - 1
            ),
          });
        }
      }
    } catch (err) {
      console.error("Error declining invite:", err);
      throw new Error("Failed to decline invite");
    }
  };

  // Cancel an invite (update status to cancelled)
  const cancelInvite = async (inviteId: string): Promise<void> => {
    try {
      // Get the invite to find out who it was sent to
      const inviteDoc = await getDoc(
        doc(db, "accountabilityRelationships", inviteId)
      );
      if (!inviteDoc.exists()) return;

      const inviteData = inviteDoc.data();
      const menteeUid = inviteData.menteeUid;
      const mentorUid = inviteData.mentorUid;

      // Update invite status
      await updateDoc(doc(db, "accountabilityRelationships", inviteId), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });

      // Decrement the thread's unread count for the person who received the invite
      const threadsAsA = await getDocs(
        query(
          collection(db, "threads"),
          where("userA", "==", menteeUid),
          where("userB", "==", mentorUid)
        )
      );

      const threadsAsB = await getDocs(
        query(
          collection(db, "threads"),
          where("userA", "==", mentorUid),
          where("userB", "==", menteeUid)
        )
      );

      const allThreads = [...threadsAsA.docs, ...threadsAsB.docs];

      if (allThreads.length > 0) {
        const threadDoc = allThreads[0];
        const threadData = threadDoc.data();
        const threadRef = doc(db, "threads", threadDoc.id);

        // Decrement unread count for the person who received the invite (mentorUid)
        if (threadData.userA === mentorUid) {
          await updateDoc(threadRef, {
            userA_unreadCount: Math.max(
              0,
              (threadData.userA_unreadCount || 0) - 1
            ),
          });
        } else if (threadData.userB === mentorUid) {
          await updateDoc(threadRef, {
            userB_unreadCount: Math.max(
              0,
              (threadData.userB_unreadCount || 0) - 1
            ),
          });
        }
      }
    } catch (err) {
      console.error("Error cancelling invite:", err);
      throw new Error("Failed to cancel invite");
    }
  };

  // Check if there's a pending invite for a specific user
  const hasPendingInviteWith = (otherUserId: string): boolean => {
    return (
      sentInvites.some((inv) => inv.mentorUid === otherUserId) ||
      receivedInvites.some((inv) => inv.menteeUid === otherUserId)
    );
  };

  // Get pending invite with a specific user (if exists)
  const getPendingInviteWith = (otherUserId: string): PendingInvite | null => {
    return (
      sentInvites.find((inv) => inv.mentorUid === otherUserId) ||
      receivedInvites.find((inv) => inv.menteeUid === otherUserId) ||
      null
    );
  };

  return {
    // Active relationships
    mentor,
    mentees,

    // Pending invites
    sentInvites,
    receivedInvites,

    // State
    loading: loading || blockedLoading || blockedByLoading, // ✅ NEW: Include block loading
    error,

    // Functions
    sendInvite,
    acceptInvite,
    declineInvite,
    endRelationship,
    cancelInvite,
    hasPendingInviteWith,
    getPendingInviteWith,
  };
}
