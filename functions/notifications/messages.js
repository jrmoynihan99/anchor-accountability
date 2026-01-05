const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const axios = require("axios");
const { admin } = require("../utils/database");
const { eitherBlocked } = require("../utils/blocking");
const { getTotalUnreadForUser } = require("../utils/notifications");

/**
 * Send notification when a new message is created in a thread
 */
exports.sendMessageNotification = onDocumentCreated(
  "threads/{threadId}/messages/{messageId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const message = snap.data();
    const { senderUid, text } = message;
    const { threadId } = event.params;

    // Fetch the thread to find participants
    const threadDoc = await admin
      .firestore()
      .collection("threads")
      .doc(threadId)
      .get();
    if (!threadDoc.exists) return;

    const thread = threadDoc.data();
    const userA = thread.userA;
    const userB = thread.userB;

    // Determine recipients (everyone except sender)
    const recipients = [userA, userB].filter((uid) => uid !== senderUid);
    const senderName = `user-${senderUid.substring(0, 5)}`;

    for (const recipientUid of recipients) {
      // Check if users have blocked each other
      const blocked = await eitherBlocked(senderUid, recipientUid);
      if (blocked) {
        console.log(
          `[message] Skipping notify for blocked pair ${senderUid} <-> ${recipientUid}`
        );
        continue;
      }

      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(recipientUid)
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
          const totalUnread = await getTotalUnreadForUser(recipientUid);

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

          console.log(`✅ Sent message notification to ${recipientUid}`);
        } catch (err) {
          console.error(
            `❌ Failed to send notification to ${recipientUid}:`,
            err
          );
        }
      }
    }
  }
);
