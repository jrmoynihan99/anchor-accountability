const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const axios = require("axios");
const { admin } = require("../utils/database");
const { eitherBlocked } = require("../utils/blocking");
const { incrementUnreadTotal } = require("../utils/notifications");

/**
 * Send notification when a new message is created in a thread
 */
exports.sendMessageNotification = onDocumentCreated(
  "organizations/{orgId}/threads/{threadId}/messages/{messageId}",
  async (event) => {
    const orgId = event.params.orgId;
    const snap = event.data;
    if (!snap) return;

    const message = snap.data();
    const { senderUid, text } = message;
    const { threadId } = event.params;

    // Fetch the thread to find participants
    const threadDoc = await admin
      .firestore()
      .doc(`organizations/${orgId}/threads/${threadId}`)
      .get();
    if (!threadDoc.exists) return;

    const thread = threadDoc.data();
    const userA = thread.userA;
    const userB = thread.userB;
    const threadRef = threadDoc.ref;

    // Determine recipients (everyone except sender)
    const recipients = [userA, userB].filter((uid) => uid !== senderUid);
    const senderName = `user-${senderUid.substring(0, 5)}`;

    for (const recipientUid of recipients) {
      // Check if users have blocked each other
      const blocked = await eitherBlocked(senderUid, recipientUid, orgId);
      if (blocked) {
        console.log(
          `[message] Skipping notify for blocked pair ${senderUid} <-> ${recipientUid} in org ${orgId}`
        );
        continue;
      }

      // Increment unread count on thread doc (moved from client-side)
      const unreadField =
        recipientUid === userA ? "userA_unreadCount" : "userB_unreadCount";
      await threadRef.update({
        [unreadField]: admin.firestore.FieldValue.increment(1),
      });

      // Increment centralized unreadTotal on recipient's user doc
      const totalUnread = await incrementUnreadTotal(recipientUid, orgId);

      const userDoc = await admin
        .firestore()
        .doc(`organizations/${orgId}/users/${recipientUid}`)
        .get();
      if (!userDoc.exists) continue;

      const userData = userDoc.data();
      const wantsMessages = userData.notificationPreferences?.messages ?? true;
      const expoPushToken = userData.expoPushToken;

      if (
        wantsMessages &&
        expoPushToken &&
        expoPushToken.startsWith("ExponentPushToken")
      ) {
        try {
          await axios.post(
            "https://exp.host/--/api/v2/push/send",
            [
              {
                to: expoPushToken,
                sound: "default",
                title: senderName,
                body: text && text.length ? text.slice(0, 100) : "",
                badge: totalUnread,
                data: {
                  threadId,
                  messageId: snap.id,
                },
              },
            ],
            { headers: { "Content-Type": "application/json" } }
          );

          console.log(
            `✅ Sent message notification to ${recipientUid} in org ${orgId}`
          );
        } catch (err) {
          console.error(
            `❌ Failed to send notification to ${recipientUid} in org ${orgId}:`,
            err
          );
        }
      }
    }
  }
);
