const { onSchedule } = require("firebase-functions/scheduler");
const axios = require("axios");
const { admin, formatDate } = require("../utils/database");

/**
 * Send streak reminders at 12 PM local time to users with pending streaks
 */
exports.sendStreakReminders = onSchedule(
  {
    schedule: "0 * * * *", // Every hour at minute 0
    timeZone: "UTC",
  },
  async () => {
    console.log("🔔 Running streak reminder check...");

    try {
      const db = admin.firestore();
      const now = new Date();

      // Get all users with general notifications enabled
      const usersSnap = await db
        .collection("users")
        .where("notificationPreferences.general", "==", true)
        .get();

      if (usersSnap.empty) {
        console.log("No users with general notifications enabled.");
        return;
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
        const streakDocRef = db
          .collection("users")
          .doc(userId)
          .collection("streak")
          .doc(yesterdayDate);

        const streakDoc = await streakDocRef.get();

        if (!streakDoc.exists) {
          console.log(`No streak document for ${userId} on ${yesterdayDate}`);
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
          await db.collection("users").doc(userId).update({
            lastStreakReminderDate: todayDate,
          });

          console.log(`✅ Queued streak reminder for ${userId}`);
        } else {
          console.log(
            `Streak already completed for ${userId} on ${yesterdayDate}`
          );
        }
      }

      // Send notifications in batches
      if (notifications.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < notifications.length; i += batchSize) {
          const chunk = notifications.slice(i, i + batchSize);
          const res = await axios.post(
            "https://exp.host/--/api/v2/push/send",
            chunk,
            { headers: { "Content-Type": "application/json" } }
          );
          console.log(`✅ Sent batch of ${chunk.length}:`, res.data?.data);
        }
        console.log(`✅ Total streak reminders sent: ${notifications.length}`);
      } else {
        console.log("No streak reminders to send this hour.");
      }
    } catch (error) {
      console.error("❌ Error in sendStreakReminders:", error);
    }
  }
);
