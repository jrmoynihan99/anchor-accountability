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

export type CheckInStatusType = "great" | "struggling" | "support";

export interface CheckInRecord {
  date: string; // YYYY-MM-DD format
  status: CheckInStatusType;
  note?: string;
  timestamp: Timestamp;
  createdBy: string;
}

interface MissingCheckIn {
  date: string;
  status: null;
  isMissing: true;
}

export type TimelineItem = CheckInRecord | MissingCheckIn;

interface UseCheckInsResult {
  checkIns: CheckInRecord[];
  timeline: TimelineItem[];
  loading: boolean;
  error: string | null;
  submitCheckIn: (
    date: string,
    status: CheckInStatusType,
    note: string,
    userId: string
  ) => Promise<void>;
}

/**
 * Bidirectional hook for check-ins - READ and WRITE
 */
export function useCheckIns(
  relationshipId: string | null,
  daysCount: number = 7
): UseCheckInsResult {
  const [checkIns, setCheckIns] = useState<CheckInRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ========================================
  // READ: Real-time listener
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
    status: CheckInStatusType,
    note: string,
    userId: string
  ): Promise<void> => {
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

    const checkInData = {
      date,
      status,
      ...(note.trim() && { note: note.trim() }),
      timestamp: serverTimestamp(),
      createdBy: userId,
    };

    // Set the check-in document (will create or overwrite)
    await setDoc(checkInRef, checkInData);

    // Update the parent relationship's lastCheckIn field
    // BUT only if this date is more recent than the current lastCheckIn
    const relationshipRef = doc(
      db,
      "accountabilityRelationships",
      relationshipId
    );
    const relationshipSnap = await getDoc(relationshipRef);
    const currentLastCheckIn = relationshipSnap.data()?.lastCheckIn;

    // Only update if no lastCheckIn exists OR the new date is more recent
    if (!currentLastCheckIn || date > currentLastCheckIn) {
      await updateDoc(relationshipRef, {
        lastCheckIn: date,
      });
    }
  };

  // ========================================
  // Generate timeline with missing days
  // ========================================
  const timeline = generateCheckInTimeline(checkIns, daysCount);

  return {
    checkIns,
    timeline,
    loading,
    error,
    submitCheckIn,
  };
}

// ========================================
// Helper Functions
// ========================================

/**
 * Generate array of last N days with check-in status
 * (including missing days)
 * Returns in chronological order: oldest → newest (left to right)
 */
function generateCheckInTimeline(
  checkIns: CheckInRecord[],
  daysCount: number = 7
): TimelineItem[] {
  const timeline: TimelineItem[] = [];

  // Create a map for quick lookup
  const checkInMap = new Map<string, CheckInRecord>();
  checkIns.forEach((checkIn) => {
    checkInMap.set(checkIn.date, checkIn);
  });

  // Generate last N days (including today)
  const today = new Date();
  for (let i = daysCount - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateString = formatDateToYYYYMMDD(date);

    const checkIn = checkInMap.get(dateString);
    if (checkIn) {
      timeline.push(checkIn);
    } else {
      timeline.push({
        date: dateString,
        status: null,
        isMissing: true,
      });
    }
  }

  return timeline;
}

/**
 * Helper to format date to YYYY-MM-DD
 */
function formatDateToYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Helper to get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  return formatDateToYYYYMMDD(new Date());
}
