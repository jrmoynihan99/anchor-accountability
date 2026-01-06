const { onSchedule } = require("firebase-functions/scheduler");
const axios = require("axios");
const { admin, formatDate, getAllOrgIds } = require("../utils/database");

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
          // Get all users in THIS org with general notifications enabled
          const usersSnap = await db
            .collection(`organizations/${orgId}/users`)
            .where("notificationPreferences.general", "==", true)
            .get();

          if (usersSnap.empty) {
            console.log(
              `No users with general notifications enabled in org ${orgId}.`
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

            // Only process if it's between 12:00 PM (12) and 12:59 PM (12)
            if (userHour !== 12) {
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

            // Check if yesterday's streak is pending
            const streakDoc = await db
              .doc(
                `organizations/${orgId}/users/${userId}/streak/${yesterdayDate}`
              )
              .get();

            if (!streakDoc.exists) {
              console.log(
                `No streak document for ${userId} on ${yesterdayDate} in org ${orgId}`
              );
              continue;
            }

            const streakData = streakDoc.data();

            if (streakData.status === "pending") {
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
