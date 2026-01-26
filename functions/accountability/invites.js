const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const axios = require("axios");
const { admin } = require("../utils/database");
const { eitherBlocked } = require("../utils/blocking");
const { getTotalUnreadForUser } = require("../utils/notifications");

// Send notification when accountability invite is created
exports.sendAccountabilityInviteNotification = onDocumentCreated(
  "organizations/{orgId}/accountabilityRelationships/{inviteId}",
  async (event) => {
    const orgId = event.params.orgId;
    const snap = event.data;
    if (!snap) return;
    const invite = snap.data();
    const inviteId = snap.id;
    if (invite.status !== "pending") return;

    const menteeUid = invite.menteeUid;
    const mentorUid = invite.mentorUid;

    try {
      if (await eitherBlocked(menteeUid, mentorUid, orgId)) {
        console.log(
          `[accountability-invite] Skipping due to block in org ${orgId}`,
        );
        return;
      }

      const mentorDoc = await admin
        .firestore()
        .doc(`organizations/${orgId}/users/${mentorUid}`)
        .get();
      if (!mentorDoc.exists) return;
      const mentorData = mentorDoc.data();

      if (!mentorData.notificationPreferences?.accountability) return;
      if (!mentorData.expoPushToken?.startsWith("ExponentPushToken")) return;

      const menteeDoc = await admin
        .firestore()
        .doc(`organizations/${orgId}/users/${menteeUid}`)
        .get();
      const menteeName = menteeDoc.exists
        ? menteeDoc.data()?.displayName || `user-${menteeUid.substring(0, 5)}`
        : `user-${menteeUid.substring(0, 5)}`;

      const threadsAsA = await admin
        .firestore()
        .collection(`organizations/${orgId}/threads`)
        .where("userA", "==", menteeUid)
        .where("userB", "==", mentorUid)
        .get();
      const threadsAsB = await admin
        .firestore()
        .collection(`organizations/${orgId}/threads`)
        .where("userA", "==", mentorUid)
        .where("userB", "==", menteeUid)
        .get();
      const allThreads = [...threadsAsA.docs, ...threadsAsB.docs];

      if (allThreads.length === 0) return;
      const threadId = allThreads[0].id;
      const totalUnread = await getTotalUnreadForUser(mentorUid, orgId);

      await axios.post(
        "https://exp.host/--/api/v2/push/send",
        [
          {
            to: mentorData.expoPushToken,
            sound: "default",
            title: "New Accountability Request",
            body: `${menteeName} wants you to be their Anchor partner`,
            badge: totalUnread,
            data: {
              type: "accountability_invite",
              inviteId,
              threadId,
              otherUserId: menteeUid,
              otherUserName: menteeName,
            },
          },
        ],
        { headers: { "Content-Type": "application/json" } },
      );

      console.log(
        `✅ Sent accountability invite notification to ${mentorUid} in org ${orgId}`,
      );
    } catch (error) {
      console.error(
        `❌ Error sending accountability invite notification in org ${orgId}:`,
        error,
      );
    }
  },
);

// Clean up other pending invites when one is accepted
exports.cleanupPendingInvitesOnAccept = onDocumentUpdated(
  "organizations/{orgId}/accountabilityRelationships/{inviteId}",
  async (event) => {
    const orgId = event.params.orgId;
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status !== "pending" || after.status !== "active") return;

    const menteeUid = after.menteeUid;
    const acceptedInviteId = event.params.inviteId;

    try {
      const db = admin.firestore();
      const snapshot = await db
        .collection(`organizations/${orgId}/accountabilityRelationships`)
        .where("menteeUid", "==", menteeUid)
        .where("status", "==", "pending")
        .get();
      if (snapshot.empty) return;

      const batch = db.batch();
      let canceledCount = 0;

      for (const doc of snapshot.docs) {
        if (doc.id === acceptedInviteId) continue;
        const inviteData = doc.data();
        const otherMentorUid = inviteData.mentorUid;

        batch.update(doc.ref, {
          status: "canceled",
          endedByUid: menteeUid,
          endedAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        canceledCount++;

        const threadsSnapshot = await db
          .collection(`organizations/${orgId}/threads`)
          .where("userA", "in", [menteeUid, otherMentorUid])
          .where("userB", "in", [menteeUid, otherMentorUid])
          .get();
        for (const threadDoc of threadsSnapshot.docs) {
          const threadData = threadDoc.data();
          if (threadData.userA === otherMentorUid) {
            batch.update(threadDoc.ref, {
              userA_unreadCount: Math.max(
                0,
                (threadData.userA_unreadCount || 0) - 1,
              ),
            });
          } else if (threadData.userB === otherMentorUid) {
            batch.update(threadDoc.ref, {
              userB_unreadCount: Math.max(
                0,
                (threadData.userB_unreadCount || 0) - 1,
              ),
            });
          }
        }
      }

      if (canceledCount > 0) {
        await batch.commit();
        console.log(
          `✅ Successfully canceled ${canceledCount} pending invite(s) in org ${orgId}`,
        );
      }
    } catch (error) {
      console.error(
        `❌ Error canceling pending invites in org ${orgId}:`,
        error,
      );
      throw error;
    }
  },
);

// Send notifications for declined/accepted/ended relationships
exports.sendAccountabilityDeclinedNotification = onDocumentUpdated(
  "organizations/{orgId}/accountabilityRelationships/{relationshipId}",
  async (event) => {
    const orgId = event.params.orgId;
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status !== "declined" && after.status === "declined") {
      const menteeUid = after.menteeUid;
      const mentorUid = after.mentorUid;
      if (await eitherBlocked(menteeUid, mentorUid, orgId)) return;

      const menteeDoc = await admin
        .firestore()
        .doc(`organizations/${orgId}/users/${menteeUid}`)
        .get();
      if (!menteeDoc.exists) return;
      const menteeData = menteeDoc.data();
      if (
        !menteeData.notificationPreferences?.accountability ||
        !menteeData.expoPushToken?.startsWith("ExponentPushToken")
      )
        return;

      const threadsSnapshot = await admin
        .firestore()
        .collection(`organizations/${orgId}/threads`)
        .where("userA", "in", [menteeUid, mentorUid])
        .get();
      let threadId = null;
      for (const doc of threadsSnapshot.docs) {
        const thread = doc.data();
        if (
          (thread.userA === menteeUid && thread.userB === mentorUid) ||
          (thread.userA === mentorUid && thread.userB === menteeUid)
        ) {
          threadId = doc.id;
          break;
        }
      }
      if (!threadId) return;

      try {
        const totalUnread = await getTotalUnreadForUser(menteeUid, orgId);
        const mentorName = `user-${mentorUid.substring(0, 5)}`;
        await axios.post(
          "https://exp.host/--/api/v2/push/send",
          [
            {
              to: menteeData.expoPushToken,
              sound: "default",
              title: "Invite Declined",
              body: `${mentorName} declined your accountability invite`,
              badge: totalUnread,
              data: {
                type: "accountability_declined",
                threadId,
                otherUserId: mentorUid,
              },
            },
          ],
          { headers: { "Content-Type": "application/json" } },
        );
        console.log(
          `✅ Sent accountability declined notification in org ${orgId}`,
        );
      } catch (err) {
        console.error(
          `❌ Failed to send declined notification in org ${orgId}:`,
          err,
        );
      }
    }
  },
);

exports.sendAccountabilityAcceptedNotification = onDocumentUpdated(
  "organizations/{orgId}/accountabilityRelationships/{relationshipId}",
  async (event) => {
    const orgId = event.params.orgId;
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status === "pending" && after.status === "active") {
      const menteeUid = after.menteeUid;
      const mentorUid = after.mentorUid;
      if (await eitherBlocked(menteeUid, mentorUid, orgId)) return;

      const menteeDoc = await admin
        .firestore()
        .doc(`organizations/${orgId}/users/${menteeUid}`)
        .get();
      if (!menteeDoc.exists) return;
      const menteeData = menteeDoc.data();
      if (
        !menteeData.notificationPreferences?.accountability ||
        !menteeData.expoPushToken?.startsWith("ExponentPushToken")
      )
        return;

      try {
        const totalUnread = await getTotalUnreadForUser(menteeUid, orgId);
        const mentorName = `user-${mentorUid.substring(0, 5)}`;
        await axios.post(
          "https://exp.host/--/api/v2/push/send",
          [
            {
              to: menteeData.expoPushToken,
              sound: "default",
              title: "Anchor Partner! 🎉",
              body: `${mentorName} accepted your invite`,
              badge: totalUnread,
              data: { type: "accountability_accepted" },
            },
          ],
          { headers: { "Content-Type": "application/json" } },
        );
        console.log(
          `✅ Sent accountability accepted notification in org ${orgId}`,
        );
      } catch (err) {
        console.error(
          `❌ Failed to send accepted notification in org ${orgId}:`,
          err,
        );
      }
    }
  },
);

exports.sendAccountabilityEndedNotification = onDocumentUpdated(
  "organizations/{orgId}/accountabilityRelationships/{relationshipId}",
  async (event) => {
    const orgId = event.params.orgId;
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status === "active" && after.status === "ended") {
      const menteeUid = after.menteeUid;
      const mentorUid = after.mentorUid;
      const endedByUid = after.endedByUid;
      if (await eitherBlocked(menteeUid, mentorUid, orgId)) return;

      const recipientUid = endedByUid === menteeUid ? mentorUid : menteeUid;
      const enderUid = endedByUid;

      const recipientDoc = await admin
        .firestore()
        .doc(`organizations/${orgId}/users/${recipientUid}`)
        .get();
      if (!recipientDoc.exists) return;
      const recipientData = recipientDoc.data();
      if (
        !recipientData.notificationPreferences?.accountability ||
        !recipientData.expoPushToken?.startsWith("ExponentPushToken")
      )
        return;

      try {
        const totalUnread = await getTotalUnreadForUser(recipientUid, orgId);
        const enderName = `user-${enderUid.substring(0, 5)}`;
        await axios.post(
          "https://exp.host/--/api/v2/push/send",
          [
            {
              to: recipientData.expoPushToken,
              sound: "default",
              title: "Partnership Ended",
              body: `${enderName} ended the accountability partnership`,
              badge: totalUnread,
              data: { type: "accountability_ended" },
            },
          ],
          { headers: { "Content-Type": "application/json" } },
        );
        console.log(
          `✅ Sent accountability ended notification in org ${orgId}`,
        );
      } catch (err) {
        console.error(
          `❌ Failed to send ended notification in org ${orgId}:`,
          err,
        );
      }
    }
  },
);
