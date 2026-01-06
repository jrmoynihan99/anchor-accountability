const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const axios = require("axios");
const { admin } = require("../utils/database");
const { eitherBlocked } = require("../utils/blocking");
const { getTotalUnreadForUser } = require("../utils/notifications");

/**
 * Helper function to send encouragement notification to plea owner
 *
 * @param {DocumentReference} pleaRef - Reference to the plea document
 * @param {Object} encouragement - Encouragement document data
 * @param {string} orgId - Organization ID
 */
async function sendEncouragementNotificationToPleaOwner(
  pleaRef,
  encouragement,
  orgId
) {
  // Find the parent plea
  const pleaDoc = await pleaRef.get();
  if (!pleaDoc.exists) return;
  const plea = pleaDoc.data();

  // Don't notify the sender of the encouragement
  if (plea.uid === encouragement.helperUid) return;

  // Fetch the user who created the plea from THIS org
  const userDoc = await admin
    .firestore()
    .doc(`organizations/${orgId}/users/${plea.uid}`)
    .get();
  const user = userDoc.data();

  // Only notify if they want encouragement notifications and have a token
  if (user?.expoPushToken && user?.notificationPreferences?.encouragements) {
    const totalUnread = await getTotalUnreadForUser(plea.uid, orgId);

    const notification = {
      to: user.expoPushToken,
      sound: "default",
      title: "Someone encouraged you!",
      body: encouragement.message?.length
        ? `"${encouragement.message.slice(0, 100)}"`
        : "Someone sent encouragement. Tap to view.",
      badge: totalUnread,
      data: {
        pleaId: pleaRef.id,
        type: "encouragement",
      },
    };

    try {
      await axios.post("https://exp.host/--/api/v2/push/send", [notification], {
        headers: { "Content-Type": "application/json" },
      });
      console.log(
        `✅ Encouragement notification sent to ${user.expoPushToken} in org ${orgId}`
      );
    } catch (err) {
      console.error(
        `❌ Failed to send encouragement notification in org ${orgId}:`,
        err
      );
    }
  }
}

/**
 * When an encouragement is created and immediately approved
 */
exports.sendEncouragementNotification = onDocumentCreated(
  "organizations/{orgId}/pleas/{pleaId}/encouragements/{encId}",
  async (event) => {
    const orgId = event.params.orgId;
    const snap = event.data;
    if (!snap) return;
    const encouragement = snap.data();

    // Only notify for approved encouragements
    if (encouragement.status !== "approved") return;

    const pleaRef = snap.ref.parent.parent;
    const pleaDoc = await pleaRef.get();
    if (!pleaDoc.exists) return;
    const plea = pleaDoc.data();

    // Skip if blocked either direction
    if (await eitherBlocked(plea.uid, encouragement.helperUid, orgId)) {
      console.log(
        `[encouragement:create] Skipping due to block between ${plea.uid} and ${encouragement.helperUid} in org ${orgId}`
      );
      return;
    }

    // Increment unread count
    await pleaRef.update({
      unreadEncouragementCount: admin.firestore.FieldValue.increment(1),
    });

    await sendEncouragementNotificationToPleaOwner(
      pleaRef,
      encouragement,
      orgId
    );
  }
);

/**
 * When an encouragement's status changes to approved
 */
exports.sendEncouragementNotificationOnApprove = onDocumentUpdated(
  "organizations/{orgId}/pleas/{pleaId}/encouragements/{encId}",
  async (event) => {
    const orgId = event.params.orgId;
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Only trigger when newly approved
    if (before.status !== "approved" && after.status === "approved") {
      const pleaRef = event.data.after.ref.parent.parent;
      const pleaDoc = await pleaRef.get();
      if (!pleaDoc.exists) return;
      const plea = pleaDoc.data();

      // Skip if blocked either direction
      if (await eitherBlocked(plea.uid, after.helperUid, orgId)) {
        console.log(
          `[encouragement:approve] Skipping due to block between ${plea.uid} and ${after.helperUid} in org ${orgId}`
        );
        return;
      }

      // Increment unread count
      await pleaRef.update({
        unreadEncouragementCount: admin.firestore.FieldValue.increment(1),
      });

      await sendEncouragementNotificationToPleaOwner(pleaRef, after, orgId);
    }
  }
);
