import { Timestamp } from "firebase/firestore";

export interface AccountabilityRelationship {
  mentorUid: string;
  menteeUid: string;
  status: "pending" | "active";
  streak: number;
  lastCheckIn: string | null; // ISO date string (YYYY-MM-DD) or null
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
