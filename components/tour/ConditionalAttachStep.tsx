// components/tour/ConditionalAttachStep.tsx
import React, { createContext, useContext } from "react";
import { AttachStep } from "react-native-spotlight-tour";

// Context to track if tour infrastructure should be active (separate from TourProvider)
const TourActiveContext = createContext(false);

export function TourActiveProvider({
  children,
  isActive,
}: {
  children: React.ReactNode;
  isActive: boolean;
}) {
  return (
    <TourActiveContext.Provider value={isActive}>
      {children}
    </TourActiveContext.Provider>
  );
}

interface ConditionalAttachStepProps {
  index: number;
  fill?: boolean;
  children: React.ReactNode;
}

/**
 * Wrapper around AttachStep that only renders the actual AttachStep when tour is active.
 * When tour is not active or completed, just returns children directly with zero overhead.
 */
export function ConditionalAttachStep({
  index,
  fill,
  children,
}: ConditionalAttachStepProps) {
  const isTourActive = useContext(TourActiveContext);

  // If tour is not active, just return children directly (zero overhead)
  if (!isTourActive) {
    return <>{children}</>;
  }

  // Tour is active, render actual AttachStep
  return (
    <AttachStep index={index} fill={fill}>
      {children}
    </AttachStep>
  );
}
