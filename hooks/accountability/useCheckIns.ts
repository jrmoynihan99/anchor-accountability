// hooks/useCheckIns.ts
import { db } from "@/lib/firebase";
import {
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export type TriggerType =
  | "social_media"
  | "loneliness"
  | "stress"
  | "boredom"
  | "alcohol"
  | "attraction"
  | "other";

export interface CheckInRecord {
  date: string; // YYYY-MM-DD format
  temptationLevel: number; // 1-10
  triggers?: TriggerType[]; // Optional array of triggers
  note?: string;
  timestamp: Timestamp;
  createdBy: string;
}

interface MissingCheckIn {
  date: string;
  temptationLevel: null;
  isMissing: true;
}

export type TimelineItem = CheckInRecord | MissingCheckIn;

interface UseCheckInsResult {
  checkIns: CheckInRecord[];
  timeline: TimelineItem[];
  loading: boolean;
  error: string | null;
  userTimezone: string | undefined;
  submitCheckIn: (
    date: string,
    temptationLevel: number,
    triggers: TriggerType[] | undefined,
    note: string,
    userId: string
  ) => Promise<void>;
}

/**
 * Hook for reading check-ins, computing timeline, and submitting new check-ins.
 * NOW AUTO-FETCHES TIMEZONE FROM users/{menteeUid}.
 */
export function useCheckIns(
  relationshipId: string | null,
  menteeUid: string | null,
  daysCount: number = 7
): UseCheckInsResult {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [userTimezone, setUserTimezone] = useState<string | undefined>(
    undefined
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // FETCH USER TIMEZONE FROM USERS/{UID}
  // ========================================
  useEffect(() => {
    if (!menteeUid) return;

    const fetchTimezone = async () => {
      try {
        const userRef = doc(db, "users", menteeUid);
        const userSnap = await getDoc(userRef);

        const tz = userSnap.data()?.timezone ?? undefined;
        setUserTimezone(tz);
      } catch (err) {
        console.error("Failed to fetch user timezone:", err);
      }
    };

    fetchTimezone();
  }, [menteeUid]);

  // ========================================
  // READ: Real-time listener for check-ins
  // ========================================
  useEffect(() => {
    if (!relationshipId) {
      setCheckIns([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const checkInsRef = collection(
      db,
      "accountabilityRelationships",
      relationshipId,
      "checkIns"
    );

    const q = query(checkInsRef, orderBy("date", "desc"), limit(daysCount));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const checkInData = snapshot.docs.map(
          (doc) => doc.data() as CheckInRecord
        );
        setCheckIns(checkInData);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching check-ins:", err);
        setError("Failed to load check-ins");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [relationshipId, daysCount]);

  // ========================================
  // WRITE: Submit check-in function
  // ========================================
  const submitCheckIn = async (
    date: string,
    temptationLevel: number,
    triggers: TriggerType[] | undefined,
    note: string,
    userId: string
  ) => {
    if (!relationshipId) {
      throw new Error("No relationship ID provided");
    }

    const checkInRef = doc(
      db,
      "accountabilityRelationships",
      relationshipId,
      "checkIns",
      date
    );

    const checkInData: any = {
      date,
      temptationLevel,
      timestamp: serverTimestamp(),
      createdBy: userId,
    };

    // Only add triggers if they exist
    if (triggers && triggers.length > 0) {
      checkInData.triggers = triggers;
    }

    // Only add note if not empty
    if (note.trim()) {
      checkInData.note = note.trim();
    }

    await setDoc(checkInRef, checkInData);

    // Update lastCheckIn in relationship
    const relationshipRef = doc(
      db,
      "accountabilityRelationships",
      relationshipId
    );
    const relationshipSnap = await getDoc(relationshipRef);
    const currentLastCheckIn = relationshipSnap.data()?.lastCheckIn;

    if (!currentLastCheckIn || date > currentLastCheckIn) {
      await updateDoc(relationshipRef, {
        lastCheckIn: date,
      });
    }
  };

  // ========================================
  // Generate timeline with missing days
  // ========================================
  const timeline = generateCheckInTimeline(checkIns, daysCount, userTimezone);

  return {
    checkIns,
    timeline,
    loading,
    error,
    userTimezone,
    submitCheckIn,
  };
}

// ========================================
// Helper Functions
// ========================================

function generateCheckInTimeline(
  checkIns: CheckInRecord[],
  daysCount: number,
  userTimezone: string | undefined
): TimelineItem[] {
  const timeline: TimelineItem[] = [];

  const checkInMap = new Map<string, CheckInRecord>();
  checkIns.forEach((c) => checkInMap.set(c.date, c));

  const today = userTimezone ? getTodayInTimezone(userTimezone) : new Date();

  for (let i = daysCount - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);

    const dateString = formatDate(date);

    if (checkInMap.has(dateString)) {
      timeline.push(checkInMap.get(dateString)!);
    } else {
      timeline.push({
        date: dateString,
        temptationLevel: null,
        isMissing: true,
      });
    }
  }

  return timeline;
}

function getTodayInTimezone(timezone: string): Date {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const parts = fmt.formatToParts(new Date());
  const y = parseInt(parts.find((p) => p.type === "year")!.value);
  const m = parseInt(parts.find((p) => p.type === "month")!.value) - 1;
  const d = parseInt(parts.find((p) => p.type === "day")!.value);

  return new Date(y, m, d);
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
