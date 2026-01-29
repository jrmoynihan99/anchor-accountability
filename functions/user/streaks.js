const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/scheduler");
const logger = require("firebase-functions/logger");
const {
  admin,
  formatDate,
  getDateWithOffset,
  getAllOrgIds,
} = require("../utils/database");

/**
 * Recalculate user streak whenever a streak document changes
 */
exports.recalculateUserStreak = onDocumentWritten(
  "organizations/{orgId}/users/{uid}/streak/{date}",
  async (event) => {
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
      const userDocRef = admin.firestore().doc(`organizations/${orgId}/users/${uid}`);
      const userDoc = await userDocRef.get();

      if (!userDoc.exists) {
        console.log(`⚠️ User document doesn't exist for ${uid} in org ${orgId}, skipping streak update`);
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

/**
 * Generate streak documents for all users in all organizations (scheduled daily)
 *
 * This scheduled function runs at 2 AM UTC and loops through ALL organizations,
 * creating streak documents for each user in each org.
 */
exports.generateStreakDocsScheduled = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "UTC",
  },
  async (event) => {
    logger.info("Starting scheduled streak doc creation for all orgs...");
    const db = admin.firestore();

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

    // Get all organization IDs
    const orgIds = await getAllOrgIds();
    logger.info(`Processing ${orgIds.length} organizations`);

    let totalUsersProcessed = 0;

    // Loop through each organization
    for (const orgId of orgIds) {
      logger.info(`\n--- Processing org: ${orgId} ---`);

      try {
        const usersSnap = await db
          .collection(`organizations/${orgId}/users`)
          .get();

        logger.info(`Found ${usersSnap.size} users in org ${orgId}`);

        for (const userDoc of usersSnap.docs) {
          const uid = userDoc.id;
          const streakRef = db.collection(
            `organizations/${orgId}/users/${uid}/streak`
          );

          const streakSnap = await streakRef
            .orderBy("date", "desc")
            .limit(1)
            .get();
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
              logger.info(
                `Created streak doc for ${uid} in org ${orgId}: ${dateStr}`
              );
            }
            curr.setUTCDate(curr.getUTCDate() + 1);
          }

          totalUsersProcessed++;
        }

        logger.info(`✅ Completed streak doc creation for org ${orgId}`);
      } catch (orgError) {
        logger.error(`❌ Error processing org ${orgId}:`, orgError);
      }
    }

    logger.info(
      `\n✅ Finished scheduled streak doc creation. Processed ${totalUsersProcessed} users across ${orgIds.length} orgs.`
    );
  }
);
