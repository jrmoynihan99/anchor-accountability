const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const axios = require("axios");
const { admin } = require("../utils/database");
const { eitherBlocked } = require("../utils/blocking");

/**
 * Send help notifications to all opted-in helpers within the same organization
 *
 * @param {Object} plea - Plea document data
 * @param {string} pleaId - Plea document ID
 * @param {string} orgId - Organization ID
 */
async function sendHelpNotificationToHelpers(plea, pleaId, orgId) {
  const { message, uid } = plea || {}; // uid = plea author

  try {
    // Only users in THIS org who opted in for plea notifications
    const usersSnap = await admin
      .firestore()
      .collection(`organizations/${orgId}/users`)
      .where("notificationPreferences.pleas", "==", true)
      .get();

    const tokenPairs = [];

    usersSnap.forEach((doc) => {
      const data = doc.data();

      if (
        data.expoPushToken &&
        typeof data.expoPushToken === "string" &&
        data.expoPushToken.startsWith("ExponentPushToken")
      ) {
        // Don't notify the sender of the plea
        if (doc.id === uid) return;

        tokenPairs.push({ token: data.expoPushToken, helperUid: doc.id });
      }
    });

    if (tokenPairs.length === 0) {
      console.log(`No users opted in for plea notifications in org ${orgId}.`);
      return;
    }

    // Filter out helpers that are blocked either direction
    const notifications = [];
    for (const { token, helperUid } of tokenPairs) {
      const blocked = await eitherBlocked(uid, helperUid, orgId);
      if (blocked) {
        console.log(
          `[help] Skipping blocked pair ${uid} <-> ${helperUid} in org ${orgId}`
        );
        continue;
      }

      notifications.push({
        to: token,
        sound: "default",
        title: "Someone is struggling",
        body: message?.length
          ? `They wrote: "${message.slice(0, 100)}"`
          : "They need encouragement. Tap to respond.",
        data: {
          pleaId,
          type: "plea",
        },
      });
    }

    if (notifications.length === 0) {
      console.log(`No eligible helpers after block filtering in org ${orgId}.`);
      return;
    }

    // Send in batches of 100
    const batchSize = 100;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const chunk = notifications.slice(i, i + batchSize);
      const res = await axios.post(
        "https://exp.host/--/api/v2/push/send",
        chunk,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log(
        `✅ Sent batch of ${chunk.length} in org ${orgId}:`,
        res.data?.data
      );
    }

    console.log(
      `✅ Notifications sent to ${notifications.length} helpers in org ${orgId}.`
    );
  } catch (err) {
    console.error(`❌ Failed to send plea notifications in org ${orgId}:`, err);
  }
}

/**
 * When a plea is created and immediately approved
 */
exports.sendHelpNotification = onDocumentCreated(
  "organizations/{orgId}/pleas/{pleaId}",
  async (event) => {
    const orgId = event.params.orgId;
    const snap = event.data;
    const plea = snap?.data();

    // Only notify for approved pleas
    if (!plea || plea.status !== "approved") return;

    await sendHelpNotificationToHelpers(plea, snap.id, orgId);
  }
);

/**
 * When a plea's status changes to approved
 */
exports.sendHelpNotificationOnApprove = onDocumentUpdated(
  "organizations/{orgId}/pleas/{pleaId}",
  async (event) => {
    const orgId = event.params.orgId;
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status !== "approved" && after.status === "approved") {
      await sendHelpNotificationToHelpers(after, event.params.pleaId, orgId);
    }
  }
);
