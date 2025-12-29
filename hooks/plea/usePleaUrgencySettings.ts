import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function usePleaUrgencySettings() {
  const [settings, setSettings] = useState({
    urgentHoursLimit: 1,
    urgentEncouragementThreshold: 3,
  });

  useEffect(() => {
    const ref = doc(db, "config", "pleaUrgencySettings");
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
  }, []);

  return settings;
}
