const { onSchedule } = require("firebase-functions/scheduler");
const axios = require("axios");
const {
  admin,
  formatDate,
  getAllOrgIds,
  offsetsForLocalHour,
} = require("../utils/database");

// Local hour at which streak reminders are sent
const REMINDER_LOCAL_HOUR = 12;

/**
 * Send streak reminders at 12 PM local time to users with pending streaks
 *
 * This scheduled function runs every hour and loops through ALL organizations,
 * checking each org's users for pending streak reminders.
 */
exports.sendStreakReminders = onSchedule(
  {
    schedule: "0 * * * *", // Every hour at minute 0
    timeZone: "UTC",
  },
  async () => {
    console.log("🔔 Running streak reminder check for all orgs...");

    try {
      const db = admin.firestore();
      const now = new Date();

      // Get all organization IDs
      const orgIds = await getAllOrgIds();
      console.log(`Processing ${orgIds.length} organizations`);

      let totalNotificationsSent = 0;

      // Loop through each organization
      for (const orgId of orgIds) {
        console.log(`\n--- Processing org: ${orgId} ---`);

        try {
          // Only users whose local clock currently reads REMINDER_LOCAL_HOUR.
          // Bucketing on utcOffsetMinutes means this reads ~1/24th of the org
          // per run instead of every user, 24 times a day.
          const usersSnap = await db
            .collection(`organizations/${orgId}/users`)
            .where("notificationPreferences.general", "==", true)
            .where(
              "utcOffsetMinutes",
              "in",
              offsetsForLocalHour(REMINDER_LOCAL_HOUR, now)
            )
            .get();

          if (usersSnap.empty) {
            console.log(
              `No users due for a streak reminder this hour in org ${orgId}.`
            );
            continue;
          }

          const notifications = [];

          for (const userDoc of usersSnap.docs) {
            const userData = userDoc.data();
            const userId = userDoc.id;

            // Skip if no push token or timezone
            if (
              !userData.expoPushToken ||
              !userData.expoPushToken.startsWith("ExponentPushToken") ||
              !userData.timezone
            ) {
              continue;
            }

            // Calculate current time in user's timezone
            const userTime = new Date(
              now.toLocaleString("en-US", { timeZone: userData.timezone })
            );
            const userHour = userTime.getHours();

            // Defence in depth. The offset bucket above already narrowed this
            // to the right hour, but `timezone` remains the source of truth and
            // `utcOffsetMinutes` is only a query accelerator. If a stored offset
            // is stale (e.g. a DST shift not yet picked up by refreshUserUtcOffsets)
            // this suppresses the send rather than firing at the wrong local time.
            if (userHour !== REMINDER_LOCAL_HOUR) {
              continue;
            }

            // Check if we already sent a streak reminder today
            const todayDate = formatDate(userTime);
            const lastNotificationDate = userData.lastStreakReminderDate;

            if (lastNotificationDate === todayDate) {
              console.log(`Already sent streak reminder to ${userId} today.`);
              continue;
            }

            // Calculate yesterday's date in user's timezone
            const yesterday = new Date(userTime);
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayDate = formatDate(yesterday);

            // A day with no document is pending — pending means nothing has
            // been logged for that day, not that a placeholder record exists.
            // Only an explicit success/fail means there is nothing to remind
            // about, so a missing document must remind rather than skip.
            const streakDoc = await db
              .doc(
                `organizations/${orgId}/users/${userId}/streak/${yesterdayDate}`
              )
              .get();

            const streakStatus = streakDoc.exists
              ? streakDoc.data()?.status
              : "pending";

            if (streakStatus === "pending") {
              // Send notification
              notifications.push({
                to: userData.expoPushToken,
                sound: "default",
                title: "Don't forget to log your streak!",
                body: "Tap here to update yesterday's streak check-in.",
                data: {
                  type: "streak_reminder",
                  date: yesterdayDate,
                },
              });

              // Mark that we sent the streak reminder today
              await db.doc(`organizations/${orgId}/users/${userId}`).update({
                lastStreakReminderDate: todayDate,
              });

              console.log(
                `✅ Queued streak reminder for ${userId} in org ${orgId}`
              );
            } else {
              console.log(
                `Streak already completed for ${userId} on ${yesterdayDate} in org ${orgId}`
              );
            }
          }

          // Send notifications for this org in batches
          if (notifications.length > 0) {
            const batchSize = 100;
            for (let i = 0; i < notifications.length; i += batchSize) {
              const chunk = notifications.slice(i, i + batchSize);
              const res = await axios.post(
                "https://exp.host/--/api/v2/push/send",
                chunk,
                { headers: { "Content-Type": "application/json" } }
              );
              console.log(
                `✅ Sent batch of ${chunk.length} for org ${orgId}:`,
                res.data?.data
              );
            }
            console.log(
              `✅ Streak reminders sent for org ${orgId}: ${notifications.length}`
            );
            totalNotificationsSent += notifications.length;
          } else {
            console.log(
              `No streak reminders to send for org ${orgId} this hour.`
            );
          }
        } catch (orgError) {
          // Log error but continue with other orgs
          console.error(`❌ Error processing org ${orgId}:`, orgError);
        }
      }

      console.log(
        `\n✅ Total streak reminders sent across all orgs: ${totalNotificationsSent}`
      );
    } catch (error) {
      console.error("❌ Error in sendStreakReminders:", error);
    }
  }
);
