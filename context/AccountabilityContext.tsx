// context/AccountabilityContext.tsx
import { useAccountabilityRelationships } from "@/hooks/useAccountabilityRelationships";
import { auth } from "@/lib/firebase";
import React, { createContext, ReactNode, useContext } from "react";

// Define the context type based on what the hook returns
interface AccountabilityContextType {
  mentor: any | null;
  mentees: any[];
  loading: boolean;
  error: string | null;
  currentUserMentorCount: number;
  currentUserMenteeCount: number;
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
        mentor: null,
        mentees: [],
        loading: true, // Keep loading until auth is ready
        error: null,
        currentUserMentorCount: 0,
        currentUserMenteeCount: 0,
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
