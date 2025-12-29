// context/AccountabilityContext.tsx
import { useAccountabilityRelationships } from "@/hooks/accountability/useAccountabilityRelationships";
import { auth } from "@/lib/firebase";
import React, { createContext, ReactNode, useContext } from "react";

// Define the context type based on what the hook returns
interface AccountabilityContextType {
  // Active relationships
  mentor: any | null;
  mentees: any[];

  // Pending invites
  sentInvites: any[];
  receivedInvites: any[];

  // Declined invites
  declinedInvites: any[];

  // Recently ended relationships (for banner detection)
  recentlyEndedMentor: {
    relationshipId: string;
    mentorUid: string;
    endedByUid: string;
  } | null;

  recentlyEndedMentees: Array<{
    relationshipId: string;
    menteeUid: string;
    endedByUid: string;
  }>;

  // ✅ NEW: Recently deleted relationships (for banner detection)
  recentlyDeletedMentor: {
    relationshipId: string;
    mentorUid: string;
  } | null;

  recentlyDeletedMentees: Array<{
    relationshipId: string;
    menteeUid: string;
  }>;

  // State
  loading: boolean;
  error: string | null;
  currentUserMentorCount: number;
  currentUserMenteeCount: number;

  // Functions
  sendInvite: (menteeUid: string) => Promise<string>;
  acceptInvite: (inviteId: string) => Promise<void>;
  declineInvite: (inviteId: string) => Promise<void>;
  endRelationship: (relationshipId: string) => Promise<void>;
  cancelInvite: (inviteId: string) => Promise<void>;
  acknowledgeDeclinedInvite: (inviteId: string) => Promise<void>;
  hasPendingInviteWith: (otherUserId: string) => boolean;
  getPendingInviteWith: (otherUserId: string) => any | null;
  getDeclinedInviteWith: (otherUserId: string) => any | null;
}

// Create context with undefined default (will error if used without provider)
const AccountabilityContext = createContext<
  AccountabilityContextType | undefined
>(undefined);

// Provider component
export function AccountabilityProvider({ children }: { children: ReactNode }) {
  const [authReady, setAuthReady] = React.useState(false);

  // Wait for auth to initialize
  React.useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(() => {
      setAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  const accountabilityData = useAccountabilityRelationships();

  // Compute counts from existing data (no need to fetch separately!)
  const currentUserMentorCount = accountabilityData.mentor ? 1 : 0;
  const currentUserMenteeCount = accountabilityData.mentees.length;

  // If auth not ready, provide loading state
  const value = authReady
    ? {
        ...accountabilityData,
        currentUserMentorCount,
        currentUserMenteeCount,
      }
    : {
        // Active relationships
        mentor: null,
        mentees: [],

        // Pending invites
        sentInvites: [],
        receivedInvites: [],

        // Declined invites
        declinedInvites: [],

        // Recently ended relationships
        recentlyEndedMentor: null,
        recentlyEndedMentees: [],

        // ✅ NEW: Recently deleted relationships
        recentlyDeletedMentor: null,
        recentlyDeletedMentees: [],

        // State
        loading: true, // Keep loading until auth is ready
        error: null,
        currentUserMentorCount: 0,
        currentUserMenteeCount: 0,

        // Functions (dummy functions that throw)
        sendInvite: async () => {
          throw new Error("Not ready");
        },
        acceptInvite: async () => {
          throw new Error("Not ready");
        },
        declineInvite: async () => {
          throw new Error("Not ready");
        },
        endRelationship: async () => {
          throw new Error("Not ready");
        },
        cancelInvite: async () => {
          throw new Error("Not ready");
        },
        acknowledgeDeclinedInvite: async () => {
          throw new Error("Not ready");
        },
        hasPendingInviteWith: () => false,
        getPendingInviteWith: () => null,
        getDeclinedInviteWith: () => null,
      };

  return (
    <AccountabilityContext.Provider value={value}>
      {children}
    </AccountabilityContext.Provider>
  );
}

// Custom hook to use the context
export function useAccountability() {
  const context = useContext(AccountabilityContext);

  if (context === undefined) {
    throw new Error(
      "useAccountability must be used within an AccountabilityProvider"
    );
  }

  return context;
}
