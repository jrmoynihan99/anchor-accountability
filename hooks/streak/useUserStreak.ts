import { useOrganization } from "@/context/OrganizationContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useUserStreak(userId: string) {
  const { organizationId, loading: orgLoading } = useOrganization();
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !organizationId || orgLoading) {
      setLoading(false);
      return;
    }

    const ref = doc(db, "organizations", organizationId, "users", userId);

    const unsub = onSnapshot(ref, (docSnap) => {
      if (!docSnap.exists()) {
        setStreak(0);
        setBest(0);
        setLoading(false);
        return;
      }
      const data = docSnap.data();
      setStreak(data.currentStreak ?? 0);
      setBest(data.bestStreak ?? 0);
      setLoading(false);
    });

    return () => unsub();
  }, [userId, organizationId, orgLoading]);

  return { streak, best, loading };
}
