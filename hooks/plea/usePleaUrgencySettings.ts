import { useOrganization } from "@/context/OrganizationContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function usePleaUrgencySettings() {
  const { organizationId, loading: orgLoading } = useOrganization();
  const [settings, setSettings] = useState({
    urgentHoursLimit: 1,
    urgentEncouragementThreshold: 3,
  });

  useEffect(() => {
    if (!organizationId || orgLoading) return;

    const ref = doc(
      db,
      "organizations",
      organizationId,
      "config",
      "pleaUrgencySettings"
    );
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setSettings({
          urgentHoursLimit: data.urgent_hours_limit ?? 1,
          urgentEncouragementThreshold:
            data.urgent_encouragement_threshold ?? 3,
        });
      }
    });

    return unsub;
  }, [organizationId, orgLoading]);

  return settings;
}
