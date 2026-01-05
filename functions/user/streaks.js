const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/scheduler");
const logger = require("firebase-functions/logger");
const { admin, formatDate, getDateWithOffset } = require("../utils/database");

/**
 * Recalculate user streak whenever a streak document changes
 */
exports.recalculateUserStreak = onDocumentWritten(
  "/users/{uid}/streak/{date}",
  async (event) => {
    try {
      const uid = event.params.uid;
      const streakRef = admin.firestore().collection("users").doc(uid).collection("streak");
      const snapshot = await streakRef.orderBy("__name__", "asc").get();

      const entries = snapshot.docs.map((doc) => ({
        date: doc.id,
        status: doc.data().status,
      }));

      const now = new Date();
      const today = now.toISOString().split("T")[0];

      // Current streak logic
      let currentStreak = 0;
      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        if (entry.date === today) continue;
        if (entry.status === "fail") break;
        if (entry.status === "success") {
          currentStreak++;
          continue;
        }
        if (entry.status === "pending") continue;
      }

      // Best streak logic
      let bestStreak = 0;
      let continuous = 0;
      for (const entry of entries) {
        if (entry.date === today) continue;
        if (entry.status === "success") {
          continuous++;
          bestStreak = Math.max(bestStreak, continuous);
        } else if (entry.status === "fail") {
          continuous = 0;
        }
      }

      await admin.firestore().collection("users").doc(uid).set(
        {
          currentStreak,
          bestStreak,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(`🔥 Updated streak for ${uid}: current=${currentStreak}, best=${bestStreak}`);
    } catch (err) {
      console.error("Error recalculating streak:", err);
    }
  }
);

/**
 * Generate streak documents for all users (scheduled daily)
 */
exports.generateStreakDocsScheduled = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "UTC",
  },
  async (event) => {
    logger.info("Starting scheduled streak doc creation for all users...");
    const db = admin.firestore();
    const usersSnap = await db.collection("users").get();

    const getUtcDateString = (offset = 0) => {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() + offset);
      const year = d.getUTCFullYear();
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const today = getUtcDateString(0);
    const twoDaysAhead = getUtcDateString(2);

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;
      const streakRef = db.collection("users").doc(uid).collection("streak");

      const streakSnap = await streakRef.orderBy("date", "desc").limit(1).get();
      let lastDate = null;
      if (!streakSnap.empty) {
        lastDate = streakSnap.docs[0].id;
      } else {
        lastDate = getUtcDateString(-2);
      }

      let fillStart = new Date(lastDate);
      fillStart.setUTCDate(fillStart.getUTCDate() + 1);
      let curr = new Date(fillStart);
      const end = new Date(twoDaysAhead);

      while (curr <= end) {
        const yyyy = curr.getUTCFullYear();
        const mm = String(curr.getUTCMonth() + 1).padStart(2, "0");
        const dd = String(curr.getUTCDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;
        const docRef = streakRef.doc(dateStr);

        const existing = await docRef.get();
        if (!existing.exists) {
          await docRef.set({ status: "pending" }, { merge: true });
          logger.info(`Created streak doc for ${uid}: ${dateStr}`);
        }
        curr.setUTCDate(curr.getUTCDate() + 1);
      }
    }

    logger.info("✅ Finished scheduled streak doc creation for all users.");
  }
);
