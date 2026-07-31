const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { admin } = require("../utils/database");

/**
 * Recalculate user streak whenever a streak document changes
 *
 * A day with no document is pending: "pending" means nothing has been logged for
 * that day, so it is the absence of a record rather than a stored one. Only
 * explicit success/fail results are written, which is why there is no scheduled
 * job materialising pending days ahead of time.
 */
exports.recalculateUserStreak = onDocumentWritten(
  "organizations/{orgId}/users/{uid}/streak/{date}",
  async (event) => {
    const before = event.data?.before;
    const after = event.data?.after;

    // Creating a "pending" day can never change currentStreak or bestStreak —
    // both loops below skip pending entries. Returning early avoids re-reading
    // the user's entire streak history every time a day is written as pending.
    // Note: this must only skip *creation*. An existing doc moving to pending
    // (the undo path) does change the math and must still recalculate.
    if (!before?.exists && after?.exists && after.data()?.status === "pending") {
      return;
    }

    try {
      const { orgId, uid } = event.params;
      const streakRef = admin
        .firestore()
        .collection(`organizations/${orgId}/users/${uid}/streak`);
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

      // Check if user document exists before updating
      const userDocRef = admin
        .firestore()
        .doc(`organizations/${orgId}/users/${uid}`);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        console.log(
          `⚠️ User document doesn't exist for ${uid} in org ${orgId}, skipping streak update`
        );
        return;
      }

      await userDocRef.set(
        {
          currentStreak,
          bestStreak,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(
        `🔥 Updated streak for ${uid} in org ${orgId}: current=${currentStreak}, best=${bestStreak}`
      );
    } catch (err) {
      console.error("Error recalculating streak:", err);
    }
  }
);
