// hooks/useAccountabilityRelationships.ts

import { auth, db } from "@/lib/firebase";
import { AccountabilityRelationship } from "@/types/AccountabilityRelationship";
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  Unsubscribe,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import {
  calculateCheckInStatus,
  CheckInStatus,
} from "../components/morphing/accountability/accountabilityUtils";

interface AccountabilityWithId extends AccountabilityRelationship {
  id: string;
  checkInStatus: CheckInStatus;
  menteeTimezone?: string;
  mentorTimezone?: string;
}

export function useAccountabilityRelationships() {
  const uid = auth.currentUser?.uid ?? null;

  const [mentor, setMentor] = useState<AccountabilityWithId | null>(null);
  const [mentees, setMentees] = useState<AccountabilityWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mentorUnsubRef = useRef<Unsubscribe | null>(null);
  const menteesUnsubRef = useRef<Unsubscribe | null>(null);

  // Cache to avoid refetching user docs repeatedly
  const timezoneCache = useRef<Record<string, string | undefined>>({}).current;

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
      setLoading(false);
      return;
    }

    setLoading(true);

    // ===============================
    // 🔵 LISTEN FOR MY MENTOR (I am the mentee)
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
    // 🟢 LISTEN FOR MY MENTEES (I am the mentor)
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

    setLoading(false);

    return () => {
      mentorUnsubRef.current?.();
      menteesUnsubRef.current?.();
    };
  }, [uid]);

  return {
    mentor,
    mentees,
    loading,
    error,
  };
}
