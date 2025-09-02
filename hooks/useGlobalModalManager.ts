// hooks/useGlobalModalManager.ts
import { useEffect, useRef } from "react";

type CloseFunction = (velocity?: number) => void;

class GlobalModalManager {
  private openModals = new Set<CloseFunction>();

  registerModal(closeFn: CloseFunction) {
    this.openModals.add(closeFn);
  }

  unregisterModal(closeFn: CloseFunction) {
    this.openModals.delete(closeFn);
  }

  closeAllModals() {
    // Close all open modals
    this.openModals.forEach((closeFn) => {
      try {
        closeFn();
      } catch (error) {
        console.warn("Error closing modal:", error);
      }
    });

    // Clear the registry
    this.openModals.clear();
  }

  hasOpenModals() {
    return this.openModals.size > 0;
  }
}

export const globalModalManager = new GlobalModalManager();

// Hook to automatically register/unregister modals
export function useModalRegistration(
  isModalVisible: boolean,
  closeFn: CloseFunction
) {
  const closeFnRef = useRef(closeFn);
  closeFnRef.current = closeFn;

  useEffect(() => {
    if (isModalVisible) {
      globalModalManager.registerModal(closeFnRef.current);
      return () => {
        globalModalManager.unregisterModal(closeFnRef.current);
      };
    }
  }, [isModalVisible]);
}
