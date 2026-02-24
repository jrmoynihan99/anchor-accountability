// hooks/ThreadContext.tsx
import React, { createContext, useContext, useState } from "react";

interface ThreadContextType {
  currentThreadId: string | null;
  setCurrentThreadId: (threadId: string | null) => void;
  currentPleaId: string | null; // Add plea tracking
  setCurrentPleaId: (pleaId: string | null) => void;
}

const ThreadContext = createContext<ThreadContextType | undefined>(undefined);

export function ThreadProvider({ children }: { children: React.ReactNode }) {
  const [currentThreadId, setCurrentThreadId] = useState<string | null>(null);
  const [currentPleaId, setCurrentPleaId] = useState<string | null>(null);

  return (
    <ThreadContext.Provider
      value={{
        currentThreadId,
        setCurrentThreadId,
        currentPleaId,
        setCurrentPleaId,
      }}
    >
      {children}
    </ThreadContext.Provider>
  );
}

export function useThread() {
  const context = useContext(ThreadContext);
  if (context === undefined) {
    throw new Error("useThread must be used within a ThreadProvider");
  }
  return context;
}
