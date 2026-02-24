import { useOrganization } from "@/context/OrganizationContext";
import { useUnreadCount } from "@/hooks/messages/useUnreadCount";
import { auth } from "@/lib/firebase";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useEffect, useRef } from "react";
import { AppState } from "react-native";

const DEBOUNCE_MS = 5 * 60 * 1000; // 5 minutes

export function useUnreadReconciliation() {
  const { organizationId } = useOrganization();
  const { refreshUnreadCount } = useUnreadCount();
  const lastReconcileRef = useRef<number>(0);

  useEffect(() => {
    if (!organizationId) return;

    const user = auth.currentUser;
    if (!user || user.isAnonymous) return;

    const reconcile = async () => {
      const now = Date.now();
      if (now - lastReconcileRef.current < DEBOUNCE_MS) return;
      lastReconcileRef.current = now;

      try {
        const functions = getFunctions();
        const reconcileUnreadTotal = httpsCallable(
          functions,
          "reconcileUnreadTotal"
        );
        const result = await reconcileUnreadTotal();
        const data = result.data as {
          corrected: boolean;
          oldValue: number;
          newValue: number;
        };

        if (data.corrected) {
          console.log(
            `[reconcile] Corrected unreadTotal: ${data.oldValue} → ${data.newValue}`
          );
          refreshUnreadCount();
        }
      } catch (error) {
        console.error("[reconcile] Failed:", error);
      }
    };

    // Reconcile on mount
    reconcile();

    // Reconcile on app foreground
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        reconcile();
      }
    });

    return () => subscription.remove();
  }, [organizationId, refreshUnreadCount]);
}
