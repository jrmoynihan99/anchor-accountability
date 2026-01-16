// hooks/useAccountabilityBanners.ts
import { useAccountability } from "@/context/AccountabilityContext";
import { useOrganization } from "@/context/OrganizationContext";
import { auth, db } from "@/lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

type BannerType =
  | "accepted"
  | "ended-mentor"
  | "ended-mentee"
  | "declined"
  | "received"
  | "deleted";

interface BannerEvent {
  key: string;
  type: BannerType;
  personName: string;
  threadId?: string;
}

const ACK_STORAGE_PREFIX = "accountability_banner_ack_v1";

export function useAccountabilityBanners() {
  const currentUid = auth.currentUser?.uid;
  const { organizationId, loading: orgLoading } = useOrganization();
  const {
    mentor,
    mentees,
    recentlyEndedMentor,
    recentlyEndedMentees,
    recentlyDeletedMentor,
    recentlyDeletedMentees,
    declinedInvites,
    receivedInvites,
    loading,
  } = useAccountability();

  const [queue, setQueue] = useState<BannerEvent[]>([]);
  const [activeEvent, setActiveEvent] = useState<BannerEvent | null>(null);

  // Track previous relationship doc IDs to detect transitions
  const prevMentorDocId = useRef<string | null>(null);
  const prevDeclinedIds = useRef<Set<string>>(new Set());
  const prevReceivedIds = useRef<Set<string>>(new Set());
  const prevEndedMentorId = useRef<string | null>(null);
  const prevEndedMenteeIds = useRef<Set<string>>(new Set());
  const prevDeletedMentorId = useRef<string | null>(null);
  const prevDeletedMenteeIds = useRef<Set<string>>(new Set());

  const ackKey = currentUid
    ? `${ACK_STORAGE_PREFIX}_${currentUid}`
    : `${ACK_STORAGE_PREFIX}_anonymous`;

  // Helper: find threadId for declined invite
  const findThreadId = async (
    otherUserId: string
  ): Promise<string | undefined> => {
    if (!currentUid || !organizationId) return undefined;

    try {
      const threadsAsA = await getDocs(
        query(
          collection(db, "organizations", organizationId, "threads"),
          where("userA", "==", currentUid),
          where("userB", "==", otherUserId)
        )
      );
      if (!threadsAsA.empty) return threadsAsA.docs[0].id;

      const threadsAsB = await getDocs(
        query(
          collection(db, "organizations", organizationId, "threads"),
          where("userA", "==", otherUserId),
          where("userB", "==", currentUid)
        )
      );
      if (!threadsAsB.empty) return threadsAsB.docs[0].id;
    } catch (err) {
      console.error("Error finding thread:", err);
    }

    return undefined;
  };

  // Derive banner events from lifecycle transitions
  useEffect(() => {
    if (loading || !currentUid || activeEvent || orgLoading || !organizationId)
      return;

    const run = async () => {
      const stored = await AsyncStorage.getItem(ackKey);
      const acknowledged = new Set<string>(JSON.parse(stored || "[]"));

      const events: BannerEvent[] = [];

      // 1. Accepted (mentor doc appears or changes)
      if (mentor && mentor.relationshipId !== prevMentorDocId.current) {
        const key = `${mentor.relationshipId}:accepted`;
        if (!acknowledged.has(key)) {
          events.push({
            key,
            type: "accepted",
            personName: `user-${mentor.mentorUid.slice(0, 5)}`,
          });
        }
        prevMentorDocId.current = mentor.relationshipId;
      }

      // 2. Ended mentor
      if (
        recentlyEndedMentor &&
        recentlyEndedMentor.relationshipId !== prevEndedMentorId.current
      ) {
        const key = `${recentlyEndedMentor.relationshipId}:ended-mentor`;
        if (!acknowledged.has(key)) {
          events.push({
            key,
            type: "ended-mentor",
            personName: `user-${recentlyEndedMentor.mentorUid.slice(0, 5)}`,
          });
        }
        prevEndedMentorId.current = recentlyEndedMentor.relationshipId;
      }

      // 3. Ended mentees
      for (const ended of recentlyEndedMentees) {
        if (!prevEndedMenteeIds.current.has(ended.relationshipId)) {
          const key = `${ended.relationshipId}:ended-mentee`;
          if (!acknowledged.has(key)) {
            events.push({
              key,
              type: "ended-mentee",
              personName: `user-${ended.menteeUid.slice(0, 5)}`,
            });
          }
          prevEndedMenteeIds.current.add(ended.relationshipId);
        }
      }

      // 4. Declined invites
      for (const declined of declinedInvites) {
        if (!prevDeclinedIds.current.has(declined.relationshipId)) {
          const key = `${declined.relationshipId}:declined`;
          if (!acknowledged.has(key)) {
            const threadId = await findThreadId(declined.mentorUid);
            events.push({
              key,
              type: "declined",
              personName: `user-${declined.mentorUid.slice(0, 5)}`,
              threadId,
            });
          }
          prevDeclinedIds.current.add(declined.relationshipId);
        }
      }

      // 5. Received invites
      for (const received of receivedInvites) {
        if (!prevReceivedIds.current.has(received.relationshipId)) {
          const key = `${received.relationshipId}:received`;
          if (!acknowledged.has(key)) {
            events.push({
              key,
              type: "received",
              personName: `user-${received.menteeUid.slice(0, 5)}`,
            });
          }
          prevReceivedIds.current.add(received.relationshipId);
        }
      }

      // 6. ✅ NEW: Deleted mentor
      if (
        recentlyDeletedMentor &&
        recentlyDeletedMentor.relationshipId !== prevDeletedMentorId.current
      ) {
        const key = `${recentlyDeletedMentor.relationshipId}:deleted`;
        if (!acknowledged.has(key)) {
          events.push({
            key,
            type: "deleted",
            personName: `user-${recentlyDeletedMentor.mentorUid.slice(0, 5)}`,
          });
        }
        prevDeletedMentorId.current = recentlyDeletedMentor.relationshipId;
      }

      // 7. ✅ NEW: Deleted mentees
      for (const deleted of recentlyDeletedMentees) {
        if (!prevDeletedMenteeIds.current.has(deleted.relationshipId)) {
          const key = `${deleted.relationshipId}:deleted`;
          if (!acknowledged.has(key)) {
            events.push({
              key,
              type: "deleted",
              personName: `user-${deleted.menteeUid.slice(0, 5)}`,
            });
          }
          prevDeletedMenteeIds.current.add(deleted.relationshipId);
        }
      }

      if (events.length > 0) {
        setQueue(events);
        setActiveEvent(events[0]);
      }
    };

    run();
  }, [
    mentor,
    recentlyEndedMentor,
    recentlyEndedMentees,
    recentlyDeletedMentor,
    recentlyDeletedMentees,
    declinedInvites,
    receivedInvites,
    loading,
    currentUid,
    activeEvent,
    orgLoading,
    organizationId,
  ]);

  // Acknowledge immediately when shown
  useEffect(() => {
    if (!activeEvent) return;

    const acknowledge = async () => {
      const stored = await AsyncStorage.getItem(ackKey);
      const acknowledged = new Set<string>(JSON.parse(stored || "[]"));

      if (acknowledged.has(activeEvent.key)) return;

      acknowledged.add(activeEvent.key);

      await AsyncStorage.setItem(
        ackKey,
        JSON.stringify(Array.from(acknowledged))
      );
    };

    acknowledge();
  }, [activeEvent, ackKey]);

  const dismissBanner = () => {
    setQueue((prev) => prev.slice(1));
    setActiveEvent(null);
  };

  // Advance queue
  useEffect(() => {
    if (!activeEvent && queue.length > 0) {
      setActiveEvent(queue[0]);
    }
  }, [activeEvent, queue]);

  if (!activeEvent) {
    return {
      showBanner: false as const,
      dismissBanner,
    };
  }

  return {
    showBanner: true as const,
    bannerType: activeEvent.type,
    personName: activeEvent.personName,
    threadId: activeEvent.threadId,
    dismissBanner,
  };
}
