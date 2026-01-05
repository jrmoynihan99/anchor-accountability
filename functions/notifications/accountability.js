const { onSchedule } = require("firebase-functions/scheduler");
const { onRequest } = require("firebase-functions/https");
const axios = require("axios");
const { admin, formatDate } = require("../utils/database");

/**
 * Send accountability check-in reminders at 6 PM local time
 */
exports.sendAccountabilityCheckInReminders = onSchedule(
  {
    schedule: "0 * * * *", // Every hour at minute 0
    timeZone: "UTC",
  },
  async () => {
    console.log("🔔 Running accountability check-in reminder check...");

    try {
      const db = admin.firestore();
      const now = new Date();

      // Get all users with accountability notifications enabled
      const usersSnap = await db
        .collection("users")
        .where("notificationPreferences.accountability", "==", true)
        .get();

      if (usersSnap.empty) {
        console.log("No users with accountability notifications enabled.");
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

        // Calculate current hour in user's timezone using Intl.DateTimeFormat
        const hourFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: userData.timezone,
          hour: "numeric",
          hour12: false,
        });

        const userHour = parseInt(
          hourFormatter.formatToParts(now).find((p) => p.type === "hour")
            ?.value || "0"
        );

        // Only process if it's between 6:00 PM (18) and 6:59 PM (18)
        if (userHour !== 18) {
          continue;
        }

        // Get today's date in user's timezone
        const dateFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: userData.timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });

        const dateParts = dateFormatter.formatToParts(now);
        const todayYear = dateParts.find((p) => p.type === "year")?.value;
        const todayMonth = dateParts.find((p) => p.type === "month")?.value;
        const todayDay = dateParts.find((p) => p.type === "day")?.value;
        const todayDate = `${todayYear}-${todayMonth}-${todayDay}`;

        // Check if we already sent an accountability reminder today
        const lastNotificationDate = userData.lastAccountabilityReminderDate;

        if (lastNotificationDate === todayDate) {
          console.log(
            `Already sent accountability reminder to ${userId} today.`
          );
          continue;
        }

        // Find the relationship where this user is the mentee
        const menteeRelationshipsSnap = await db
          .collection("accountabilityRelationships")
          .where("menteeUid", "==", userId)
          .where("status", "==", "active")
          .limit(1)
          .get();

        if (menteeRelationshipsSnap.empty) {
          console.log(
            `${userId} has no active accountability relationship as mentee.`
          );
          continue;
        }

        const relationshipDoc = menteeRelationshipsSnap.docs[0];
        const relationshipData = relationshipDoc.data();
        const lastCheckIn = relationshipData.lastCheckIn;

        // Calculate days since last check-in
        let daysSinceCheckIn = 0;
        if (lastCheckIn) {
          const lastCheckInDate = new Date(lastCheckIn);
          const today = new Date(todayDate);
          const diffTime = today - lastCheckInDate;
          daysSinceCheckIn = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        } else {
          // No check-in ever recorded - calculate from relationship creation
          const createdAt = relationshipData.createdAt?.toDate();
          if (createdAt) {
            const today = new Date(todayDate);
            const diffTime = today - createdAt;
            daysSinceCheckIn = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          }
        }

        // Determine notification message based on days missed
        let title = "Accountability Check-In";
        let body = "";

        if (daysSinceCheckIn === 0) {
          // Haven't checked in today yet
          if (lastCheckIn === todayDate) {
            console.log(`${userId} already checked in today.`);
            continue;
          }
          body =
            "Don't forget to check in with your accountability partner today";
        } else if (daysSinceCheckIn === 1) {
          body = "You didn't check in with your partner yesterday, do it now!";
        } else if (daysSinceCheckIn >= 7) {
          body =
            "You haven't checked in with your partner in over a week. Update them now!";
        } else {
          body = `You haven't checked in with your partner in ${daysSinceCheckIn} days. Update them now!`;
        }

        // Send notification
        notifications.push({
          to: userData.expoPushToken,
          sound: "default",
          title: title,
          body: body,
          data: {
            type: "accountability_reminder",
            relationshipId: relationshipDoc.id,
            daysSinceCheckIn: daysSinceCheckIn,
          },
        });

        // Mark that we sent the accountability reminder today
        await db.collection("users").doc(userId).update({
          lastAccountabilityReminderDate: todayDate,
        });

        console.log(
          `✅ Queued accountability reminder for ${userId} (${daysSinceCheckIn} days since check-in)`
        );
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
        console.log(
          `✅ Total accountability reminders sent: ${notifications.length}`
        );
      } else {
        console.log("No accountability reminders to send this hour.");
      }
    } catch (error) {
      console.error("❌ Error in sendAccountabilityCheckInReminders:", error);
    }
  }
);

/**
 * Test endpoint for accountability reminder
 */
exports.testAccountabilityReminder = onRequest(async (req, res) => {
  try {
    const menteeUid = req.query.menteeUid;
    if (!menteeUid) {
      return res.status(400).send("Missing menteeUid");
    }

    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(menteeUid).get();

    if (!userDoc.exists) return res.status(404).send("User not found");

    const user = userDoc.data();

    if (!user.expoPushToken) return res.send("User has no Expo push token");
    if (!user.notificationPreferences?.accountability)
      return res.send("User has accountability notifications OFF");
    if (!user.timezone) return res.send("User has no timezone set");

    const now = new Date();

    // Compute their local date and hour
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: user.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = dateFormatter.formatToParts(now);
    const todayDate = `${parts.find((p) => p.type === "year").value}-${
      parts.find((p) => p.type === "month").value
    }-${parts.find((p) => p.type === "day").value}`;

    // Fetch their accountability relationship
    const relSnap = await db
      .collection("accountabilityRelationships")
      .where("menteeUid", "==", menteeUid)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (relSnap.empty) return res.send("No active relationship");

    const relDoc = relSnap.docs[0];
    const rel = relDoc.data();

    const lastCheckIn = rel.lastCheckIn;

    // Calculate days since check-in
    let daysSince = 0;
    if (lastCheckIn) {
      daysSince = Math.floor(
        (new Date(todayDate) - new Date(lastCheckIn)) / (1000 * 60 * 60 * 24)
      );
    }

    // Build message
    let body = "";
    if (lastCheckIn === todayDate) {
      body = "You already checked in today";
    } else if (daysSince === 0) {
      body = "Don't forget to check in with your accountability partner today";
    } else if (daysSince === 1) {
      body = "You haven't checked in for 1 day";
    } else if (daysSince >= 7) {
      body = "You haven't checked in for over a week";
    } else {
      body = `You haven't checked in for ${daysSince} days`;
    }

    // Send push notification
    const message = {
      to: user.expoPushToken,
      sound: "default",
      title: "Accountability Check-In",
      body,
      data: {
        type: "accountability_reminder",
        relationshipId: relDoc.id,
        daysSinceCheckIn: daysSince,
      },
    };

    await axios.post("https://exp.host/--/api/v2/push/send", message, {
      headers: { "Content-Type": "application/json" },
    });

    return res.send({
      status: "OK",
      sentTo: menteeUid,
      message,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error: " + err.toString());
  }
});
