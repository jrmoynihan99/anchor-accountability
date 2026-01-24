const { onRequest } = require("firebase-functions/v2/https");
const axios = require("axios");
const { admin } = require("../utils/database");

/**
 * Callable HTTP function to send update notification to all users
 *
 * Visit the URL to trigger this function manually.
 * Example: https://us-central1-YOUR_PROJECT_ID.cloudfunctions.net/sendUpdateNotification
 */
exports.sendUpdateNotification = onRequest({ cors: true }, async (req, res) => {
  try {
    const db = admin.firestore();

    // Get all organizations
    const orgsSnapshot = await db.collection("organizations").get();

    let totalSent = 0;
    let totalFailed = 0;
    const failedTokens = [];

    // Iterate through each organization
    for (const orgDoc of orgsSnapshot.docs) {
      const orgId = orgDoc.id;
      console.log(`Processing organization: ${orgId}`);

      // Get all users in this organization
      const usersSnapshot = await db
        .collection(`organizations/${orgId}/users`)
        .get();

      // Collect all valid push tokens
      const notifications = [];

      for (const userDoc of usersSnapshot.docs) {
        const user = userDoc.data();

        // Check if user has a valid expo push token
        if (
          user?.expoPushToken &&
          user.expoPushToken.startsWith("ExponentPushToken[")
        ) {
          notifications.push({
            to: user.expoPushToken,
            sound: "default",
            title: "App Update Available",
            body: "Please update your app to the newest version. This will happen automatically if you have automatic updates on.",
            priority: "high",
            data: {
              type: "app_update",
            },
          });
        }
      }

      // Send notifications in batches (Expo recommends batches of 100)
      const batchSize = 100;
      for (let i = 0; i < notifications.length; i += batchSize) {
        const batch = notifications.slice(i, i + batchSize);

        try {
          const response = await axios.post(
            "https://exp.host/--/api/v2/push/send",
            batch,
            {
              headers: { "Content-Type": "application/json" },
            },
          );

          // Check for individual failures in the response
          if (response.data?.data) {
            response.data.data.forEach((result, index) => {
              if (result.status === "error") {
                totalFailed++;
                failedTokens.push({
                  token: batch[index].to,
                  error: result.message,
                });
              } else {
                totalSent++;
              }
            });
          } else {
            totalSent += batch.length;
          }

          console.log(
            `✅ Sent ${batch.length} notifications for org ${orgId} (batch ${Math.floor(i / batchSize) + 1})`,
          );
        } catch (err) {
          console.error(
            `❌ Failed to send notification batch for org ${orgId}:`,
            err.response?.data || err.message,
          );
          totalFailed += batch.length;
        }

        // Small delay between batches to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    const result = {
      success: true,
      totalSent,
      totalFailed,
      message: `Update notifications sent successfully. Sent: ${totalSent}, Failed: ${totalFailed}`,
    };

    if (failedTokens.length > 0) {
      result.failedTokens = failedTokens.slice(0, 10); // Only return first 10 failures
      result.failedTokensNote = `Showing first 10 of ${failedTokens.length} failures`;
    }

    console.log("📊 Summary:", result);
    res.status(200).json(result);
  } catch (error) {
    console.error("❌ Error sending update notifications:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: "Failed to send update notifications",
    });
  }
});
