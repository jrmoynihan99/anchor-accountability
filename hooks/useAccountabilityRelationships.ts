// hooks/useAccountabilityRelationships.ts

import { auth, db } from "@/lib/firebase";
import { AccountabilityRelationship } from "@/types/AccountabilityRelationship";
import {
  addDoc,
  collection,
  doc,
  getDoc,
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

// For declined invites, same structure as pending
interface DeclinedInvite extends AccountabilityRelationship {
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

  // ✅ NEW: Declined invites (sent by me that were declined)
  const [declinedInvites, setDeclinedInvites] = useState<DeclinedInvite[]>([]);

  // ✅ NEW: Recently ended relationships (for banner detection)
  const [recentlyEndedMentor, setRecentlyEndedMentor] = useState<{
    mentorUid: string;
    endedByUid: string;
  } | null>(null);
  const [recentlyEndedMentees, setRecentlyEndedMentees] = useState<
    Array<{ menteeUid: string; endedByUid: string }>
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get blocked users
  const { blockedUserIds, loading: blockedLoading } = useBlockedUsers();
  const { blockedByUserIds, loading: blockedByLoading } = useBlockedByUsers();

  const mentorUnsubRef = useRef<Unsubscribe | null>(null);
  const menteesUnsubRef = useRef<Unsubscribe | null>(null);
  const sentInvitesUnsubRef = useRef<Unsubscribe | null>(null);
  const receivedInvitesUnsubRef = useRef<Unsubscribe | null>(null);
  const declinedInvitesUnsubRef = useRef<Unsubscribe | null>(null); // ✅ NEW
  const endedMentorUnsubRef = useRef<Unsubscribe | null>(null); // ✅ NEW
  const endedMenteesUnsubRef = useRef<Unsubscribe | null>(null); // ✅ NEW

  // Cache to avoid refetching user docs repeatedly
  const timezoneCache = useRef<Record<string, string | undefined>>({}).current;

  // Helper to check if user should be hidden
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
      setDeclinedInvites([]); // ✅ NEW
      setLoading(false);
      return;
    }

    // Wait for block lists to load
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

          // Filter out if blocked
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

          // Filter out if blocked
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
          ) as PendingInvite[];
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
          ) as PendingInvite[];
        setReceivedInvites(invites);
      },
      (err) => {
        console.error("received invites listener error:", err);
      }
    );

    // ===============================
    // ❌ NEW: LISTEN FOR DECLINED INVITES (I sent, they declined)
    // ===============================
    const declinedInvitesQuery = query(
      collection(db, "accountabilityRelationships"),
      where("menteeUid", "==", uid),
      where("status", "==", "declined")
    );

    declinedInvitesUnsubRef.current = onSnapshot(
      declinedInvitesQuery,
      (snapshot) => {
        const invites = snapshot.docs
          .map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(
            (invite: any) =>
              !shouldHide(invite.mentorUid) && // Filter blocked users
              invite.isAcknowledged !== true // ✅ Only show unacknowledged declined invites
          ) as DeclinedInvite[];
        setDeclinedInvites(invites);
      },
      (err) => {
        console.error("declined invites listener error:", err);
      }
    );

    // ===============================
    // 💔 NEW: LISTEN FOR ENDED MENTOR RELATIONSHIP (just to check endedByUid)
    // ===============================
    const endedMentorQuery = query(
      collection(db, "accountabilityRelationships"),
      where("menteeUid", "==", uid),
      where("status", "==", "ended")
    );

    endedMentorUnsubRef.current = onSnapshot(
      endedMentorQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const docSnap = snapshot.docs[0];
          const data = docSnap.data();

          // Only set if OTHER person ended it
          if (data.endedByUid && data.endedByUid !== uid) {
            setRecentlyEndedMentor({
              mentorUid: data.mentorUid,
              endedByUid: data.endedByUid,
            });
          } else {
            // I ended it, don't show banner
            setRecentlyEndedMentor(null);
          }
        } else {
          // No ended relationship
          setRecentlyEndedMentor(null);
        }
      },
      (err) => {
        console.error("ended mentor listener error:", err);
      }
    );

    // ===============================
    // 💔 NEW: LISTEN FOR ENDED MENTEE RELATIONSHIPS (just to check endedByUid)
    // ===============================
    const endedMenteesQuery = query(
      collection(db, "accountabilityRelationships"),
      where("mentorUid", "==", uid),
      where("status", "==", "ended")
    );

    endedMenteesUnsubRef.current = onSnapshot(
      endedMenteesQuery,
      (snapshot) => {
        const ended = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            // Only include if OTHER person ended it
            if (data.endedByUid && data.endedByUid !== uid) {
              return {
                menteeUid: data.menteeUid,
                endedByUid: data.endedByUid,
              };
            }
            return null;
          })
          .filter(
            (item): item is { menteeUid: string; endedByUid: string } =>
              item !== null
          );

        setRecentlyEndedMentees(ended);
      },
      (err) => {
        console.error("ended mentees listener error:", err);
      }
    );

    setLoading(false);

    return () => {
      mentorUnsubRef.current?.();
      menteesUnsubRef.current?.();
      sentInvitesUnsubRef.current?.();
      receivedInvitesUnsubRef.current?.();
      declinedInvitesUnsubRef.current?.(); // ✅ NEW
      endedMentorUnsubRef.current?.(); // ✅ NEW
      endedMenteesUnsubRef.current?.(); // ✅ NEW
    };
  }, [uid, blockedLoading, blockedByLoading, blockedUserIds, blockedByUserIds]);

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
      // Update invite status to active
      await updateDoc(doc(db, "accountabilityRelationships", inviteId), {
        status: "active",
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error accepting invite:", err);
      throw new Error("Failed to accept invite");
    }
  };

  // End a relationship (delete it)
  const endRelationship = async (relationshipId: string): Promise<void> => {
    const uid = auth.currentUser?.uid;

    if (!uid) {
      throw new Error("User not authenticated");
    }

    const relationshipRef = doc(
      db,
      "accountabilityRelationships",
      relationshipId
    );

    await updateDoc(relationshipRef, {
      status: "ended",
      endedByUid: uid,
      endedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  // Decline an invite (update status to declined)
  const declineInvite = async (inviteId: string): Promise<void> => {
    try {
      // Update invite status to declined
      await updateDoc(doc(db, "accountabilityRelationships", inviteId), {
        status: "declined",
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error declining invite:", err);
      throw new Error("Failed to decline invite");
    }
  };

  // Cancel an invite (update status to cancelled)
  const cancelInvite = async (inviteId: string): Promise<void> => {
    try {
      // Update invite status
      await updateDoc(doc(db, "accountabilityRelationships", inviteId), {
        status: "cancelled",
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error cancelling invite:", err);
      throw new Error("Failed to cancel invite");
    }
  };

  // ✅ NEW: Acknowledge a declined invite (mark it as seen)
  const acknowledgeDeclinedInvite = async (inviteId: string): Promise<void> => {
    try {
      await updateDoc(doc(db, "accountabilityRelationships", inviteId), {
        isAcknowledged: true,
        acknowledgedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      console.error("Error acknowledging declined invite:", err);
      throw new Error("Failed to acknowledge declined invite");
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

  // ✅ NEW: Get declined invite with a specific user (if exists)
  const getDeclinedInviteWith = (
    otherUserId: string
  ): DeclinedInvite | null => {
    return declinedInvites.find((inv) => inv.mentorUid === otherUserId) || null;
  };

  return {
    // Active relationships
    mentor,
    mentees,

    // Pending invites
    sentInvites,
    receivedInvites,

    // Declined invites (unacknowledged only)
    declinedInvites,

    // ✅ NEW: Recently ended relationships (for banner detection)
    recentlyEndedMentor,
    recentlyEndedMentees,

    // State
    loading: loading || blockedLoading || blockedByLoading,
    error,

    // Functions
    sendInvite,
    acceptInvite,
    declineInvite,
    endRelationship,
    cancelInvite,
    acknowledgeDeclinedInvite, // ✅ NEW
    hasPendingInviteWith,
    getPendingInviteWith,
    getDeclinedInviteWith,
  };
}
