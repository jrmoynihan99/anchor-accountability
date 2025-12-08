// hooks/useAccountabilityRelationships.ts
import { auth, db } from "@/lib/firebase";
import { AccountabilityRelationship } from "@/types/AccountabilityRelationship";
import {
  collection,
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
}

export function useAccountabilityRelationships() {
  const uid = auth.currentUser?.uid ?? null;

  const [mentor, setMentor] = useState<AccountabilityWithId | null>(null);
  const [mentees, setMentees] = useState<AccountabilityWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mentorUnsubRef = useRef<Unsubscribe | null>(null);
  const menteesUnsubRef = useRef<Unsubscribe | null>(null);

  useEffect(() => {
    if (!uid) {
      setMentor(null);
      setMentees([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    //
    // 🔵 LISTEN FOR MY MENTOR (relationship where I am the mentee)
    //
    const mentorQuery = query(
      collection(db, "accountabilityRelationships"),
      where("menteeUid", "==", uid),
      where("status", "==", "active")
    );

    mentorUnsubRef.current = onSnapshot(
      mentorQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data() as AccountabilityRelationship;

          setMentor({
            ...data,
            id: doc.id,
            checkInStatus: calculateCheckInStatus(data.lastCheckIn || null),
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

    //
    // 🟢 LISTEN FOR MY MENTEES (relationships where I am the mentor)
    //
    const menteesQuery = query(
      collection(db, "accountabilityRelationships"),
      where("mentorUid", "==", uid),
      where("status", "==", "active")
    );

    menteesUnsubRef.current = onSnapshot(
      menteesQuery,
      (snapshot) => {
        const results: AccountabilityWithId[] = snapshot.docs.map((doc) => {
          const data = doc.data() as AccountabilityRelationship;
          return {
            ...data,
            id: doc.id,
            checkInStatus: calculateCheckInStatus(data.lastCheckIn || null),
          };
        });

        // Sort by createdAt descending (newest first)
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

    //
    // 🧹 CLEANUP
    //
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
