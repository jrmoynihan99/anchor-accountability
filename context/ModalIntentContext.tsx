import React, { createContext, useCallback, useContext, useState } from "react";

type ModalIntentType = "guidedPrayer" | "verse" | null;

interface ModalIntentContextValue {
  modalIntent: ModalIntentType;
  setModalIntent: (intent: ModalIntentType) => void;
}

const ModalIntentContext = createContext<ModalIntentContextValue | undefined>(
  undefined
);

export const ModalIntentProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [modalIntent, setModalIntent] = useState<ModalIntentType>(null);

  // Always use a stable function
  const setIntent = useCallback((intent: ModalIntentType) => {
    setModalIntent(intent);
  }, []);

  return (
    <ModalIntentContext.Provider
      value={{ modalIntent, setModalIntent: setIntent }}
    >
      {children}
    </ModalIntentContext.Provider>
  );
};

export const useModalIntent = (): ModalIntentContextValue => {
  const ctx = useContext(ModalIntentContext);
  if (!ctx)
    throw new Error("useModalIntent must be used within a ModalIntentProvider");
  return ctx;
};
