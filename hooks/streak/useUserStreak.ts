import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";

export function useUserStreak(userId: string) {
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const ref = doc(db, "users", userId);

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
  }, [userId]);

  return { streak, best, loading };
}
