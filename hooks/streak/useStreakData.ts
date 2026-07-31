import {
  STREAK_WINDOW_DAYS,
  StreakEntry,
  getLocalDateString,
  withImplicitPending,
} from "@/components/morphing/home/streak/streakUtils";
import { useOrganization } from "@/context/OrganizationContext";
import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection,
  doc,
  documentId,
  endAt,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  startAt,
} from "firebase/firestore";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppState } from "react-native";

// Local YYYY-MM-DD for a given Date
const toLocalDateString = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

/**
 * Streak data for the signed-in user.
 *
 * Two things worth knowing about the shape of this:
 *
 * 1. A day with no document is pending. Only explicit success/fail results are
 *    written, so nothing creates placeholder rows — `withImplicitPending` fills
 *    unlogged days back in for rendering. Consumers see a dense list either way.
 * 2. The subscription is bounded to STREAK_WINDOW_DAYS, widened when the user's
 *    server-computed streak is longer than that (see effectiveWindowDays).
 *    Older months are fetched on demand via `loadMonth`, so the cost of opening
 *    the app stays flat instead of growing with the length of the user's
 *    history.
 */
export function useStreakData() {
  // Documents from the live, bounded subscription
  const [streakDocs, setStreakDocs] = useState<StreakEntry[]>([]);
  // Documents pulled on demand when browsing months outside that window
  const [olderDocs, setOlderDocs] = useState<StreakEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth.currentUser);
  const [todayKey, setTodayKey] = useState(getLocalDateString(0));
  const loadedMonths = useRef<Set<string>>(new Set());
  // Server-computed streak length, used only to size the window below.
  const [serverStreak, setServerStreak] = useState(0);

  const { organizationId, loading: orgLoading } = useOrganization();

  // Listen to auth state changes
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  // Roll the window over at local midnight so "today" advances while the app
  // stays open. Previously this also wrote placeholder documents; now it only
  // needs to nudge the derived state.
  useEffect(() => {
    const checkDate = () => {
      const current = getLocalDateString(0);
      setTodayKey((prev) => (prev === current ? prev : current));
    };

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") checkDate();
    });
    const interval = setInterval(() => {
      if (AppState.currentState === "active") checkDate();
    }, 60000);

    return () => {
      subscription?.remove();
      clearInterval(interval);
    };
  }, []);

  // Reset on-demand history when the account or org changes
  useEffect(() => {
    loadedMonths.current = new Set();
    setOlderDocs([]);
  }, [user?.uid, organizationId]);

  // The authoritative streak length, recomputed server-side over the user's
  // whole history by recalculateUserStreak. Read here purely to size the
  // subscription window — see effectiveWindowDays.
  useEffect(() => {
    const uid = user?.uid;
    if (!uid || !organizationId || orgLoading) {
      setServerStreak(0);
      return;
    }

    const unsub = onSnapshot(
      doc(db, "organizations", organizationId, "users", uid),
      (snap) => setServerStreak(snap.data()?.currentStreak ?? 0),
      (error) =>
        console.error(`useStreakData: user doc listener error:`, error)
    );

    return () => unsub();
  }, [user?.uid, organizationId, orgLoading]);

  /**
   * How far back to subscribe.
   *
   * getCurrentStreak counts successes after the most recent `fail`. If no fail
   * is loaded it cannot tell where the streak began and simply counts every
   * success in view, so a streak longer than the window reads as exactly the
   * window size — a 307-day streak displayed as 90.
   *
   * Widening the window to cover the server's count pulls that bounding fail
   * back into view, so the existing client calculation becomes correct on its
   * own and every consumer keeps working unchanged. Users below the default
   * window are unaffected and still load only STREAK_WINDOW_DAYS.
   */
  const effectiveWindowDays = useMemo(
    () => Math.max(STREAK_WINDOW_DAYS, serverStreak + 2),
    [serverStreak]
  );

  // Subscribe to a bounded window rather than the whole collection. Document IDs
  // are YYYY-MM-DD, so a documentId() range is a date range and needs no index.
  useEffect(() => {
    const uid = user?.uid;

    if (!uid || !organizationId || orgLoading) {
      setStreakDocs([]);
      return;
    }

    const windowStart = getLocalDateString(-effectiveWindowDays);
    const streakQuery = query(
      collection(db, "organizations", organizationId, "users", uid, "streak"),
      orderBy(documentId()),
      startAt(windowStart)
    );

    const unsub = onSnapshot(
      streakQuery,
      (snapshot) => {
        setStreakDocs(
          snapshot.docs.map((d) => ({
            date: d.id,
            status: d.data().status as StreakEntry["status"],
          }))
        );
        setLoading(false);
      },
      (error) => {
        console.error(`useStreakData: snapshot listener error:`, error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, [user?.uid, organizationId, orgLoading, todayKey, effectiveWindowDays]);

  /**
   * Fetch a month that falls outside the live window, for calendar browsing.
   * No-ops for months already loaded or already covered by the subscription.
   */
  const loadMonth = useCallback(
    async (month: Date) => {
      const uid = user?.uid;
      if (!uid || !organizationId) return;

      const monthKey = `${month.getFullYear()}-${String(
        month.getMonth() + 1
      ).padStart(2, "0")}`;
      if (loadedMonths.current.has(monthKey)) return;

      // Anything at or after the window start is already live.
      const monthEnd = toLocalDateString(
        new Date(month.getFullYear(), month.getMonth() + 1, 0)
      );
      if (monthEnd >= getLocalDateString(-effectiveWindowDays)) return;

      loadedMonths.current.add(monthKey);

      try {
        const snapshot = await getDocs(
          query(
            collection(
              db,
              "organizations",
              organizationId,
              "users",
              uid,
              "streak"
            ),
            orderBy(documentId()),
            startAt(`${monthKey}-01`),
            endAt(`${monthKey}-31`)
          )
        );

        const fetched = snapshot.docs.map((d) => ({
          date: d.id,
          status: d.data().status as StreakEntry["status"],
        }));

        setOlderDocs((prev) => {
          const byDate = new Map(prev.map((e) => [e.date, e]));
          for (const entry of fetched) byDate.set(entry.date, entry);
          return [...byDate.values()];
        });
      } catch (error) {
        // Allow a retry on the next navigation
        loadedMonths.current.delete(monthKey);
        console.error(`useStreakData: failed to load ${monthKey}:`, error);
      }
    },
    [user?.uid, organizationId, effectiveWindowDays]
  );

  // Never synthesise pending days from before the account existed.
  const accountCreatedDate = useMemo(() => {
    const created = user?.metadata?.creationTime;
    return created ? toLocalDateString(new Date(created)) : null;
  }, [user?.uid, user?.metadata?.creationTime]);

  const streakData = useMemo(() => {
    // Live documents win over anything cached from an on-demand fetch.
    const merged = [...olderDocs, ...streakDocs];
    return withImplicitPending(merged, { since: accountCreatedDate });
  }, [streakDocs, olderDocs, accountCreatedDate, todayKey]);

  // Update a specific day's status
  const updateStreakStatus = async (
    date: string,
    status: "success" | "fail"
  ) => {
    const uid = user?.uid;
    if (!uid || !organizationId) return;

    const ref = doc(
      db,
      "organizations",
      organizationId,
      "users",
      uid,
      "streak",
      date
    );

    try {
      await setDoc(ref, { status });
    } catch (error) {
      console.error(`updateStreakStatus: Error:`, error);
    }
  };

  // Undo a specific day's status (revert to pending)
  const undoStreakStatus = async (date: string) => {
    const uid = user?.uid;
    if (!uid || !organizationId) return;

    const ref = doc(
      db,
      "organizations",
      organizationId,
      "users",
      uid,
      "streak",
      date
    );

    try {
      await setDoc(ref, { status: "pending" });
    } catch (error) {
      console.error(`undoStreakStatus: Error:`, error);
    }
  };

  return {
    streakData,
    loading,
    updateStreakStatus,
    undoStreakStatus,
    loadMonth,
    user,
  };
}
