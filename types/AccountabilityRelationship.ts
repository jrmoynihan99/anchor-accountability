import { Timestamp } from "firebase/firestore";

export type AccountabilityRelationshipStatus =
  | "pending"
  | "active"
  | "declined"
  | "cancelled"
  | "ended";

export interface AccountabilityRelationship {
  mentorUid: string;
  menteeUid: string;

  // ✅ You already use these statuses in code + Firestore
  status: AccountabilityRelationshipStatus;

  streak: number;

  // ISO date string (YYYY-MM-DD) or null
  lastCheckIn: string | null;

  createdAt: Timestamp;
  updatedAt: Timestamp;

  // ✅ Optional fields that exist depending on lifecycle
  endedByUid?: string;
  endedAt?: Timestamp;

  // ✅ Declined invite acknowledgment fields
  isAcknowledged?: boolean;
  acknowledgedAt?: Timestamp;
}
