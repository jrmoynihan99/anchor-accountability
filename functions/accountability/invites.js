const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const axios = require("axios");
const { admin } = require("../utils/database");
const { eitherBlocked } = require("../utils/blocking");
const { getTotalUnreadForUser } = require("../utils/notifications");

// Send notification when accountability invite is created
exports.sendAccountabilityInviteNotification = onDocumentCreated(
  "accountabilityRelationships/{inviteId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const invite = snap.data();
    const inviteId = snap.id;
    if (invite.status !== "pending") return;

    const menteeUid = invite.menteeUid;
    const mentorUid = invite.mentorUid;

    try {
      if (await eitherBlocked(menteeUid, mentorUid)) {
        console.log(`[accountability-invite] Skipping due to block`);
        return;
      }

      const mentorDoc = await admin.firestore().collection("users").doc(mentorUid).get();
      if (!mentorDoc.exists) return;
      const mentorData = mentorDoc.data();

      if (!mentorData.notificationPreferences?.accountability) return;
      if (!mentorData.expoPushToken?.startsWith("ExponentPushToken")) return;

      const menteeDoc = await admin.firestore().collection("users").doc(menteeUid).get();
      const menteeName = menteeDoc.exists ? menteeDoc.data()?.displayName || `user-${menteeUid.substring(0, 5)}` : `user-${menteeUid.substring(0, 5)}`;

      const threadsAsA = await admin.firestore().collection("threads").where("userA", "==", menteeUid).where("userB", "==", mentorUid).get();
      const threadsAsB = await admin.firestore().collection("threads").where("userA", "==", mentorUid).where("userB", "==", menteeUid).get();
      const allThreads = [...threadsAsA.docs, ...threadsAsB.docs];

      if (allThreads.length === 0) return;
      const threadId = allThreads[0].id;
      const totalUnread = await getTotalUnreadForUser(mentorUid);

      await axios.post("https://exp.host/--/api/v2/push/send", [{
        to: mentorData.expoPushToken,
        sound: "default",
        title: "New Accountability Request",
        body: `${menteeName} wants you to be their accountability partner`,
        badge: totalUnread,
        data: { type: "accountability_invite", inviteId, threadId, otherUserId: menteeUid, otherUserName: menteeName }
      }], { headers: { "Content-Type": "application/json" } });

      console.log(`✅ Sent accountability invite notification to ${mentorUid}`);
    } catch (error) {
      console.error(`❌ Error sending accountability invite notification:`, error);
    }
  }
);

// Clean up other pending invites when one is accepted
exports.cleanupPendingInvitesOnAccept = onDocumentUpdated(
  "accountabilityRelationships/{inviteId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status !== "pending" || after.status !== "active") return;

    const menteeUid = after.menteeUid;
    const acceptedInviteId = event.params.inviteId;

    try {
      const db = admin.firestore();
      const snapshot = await db.collection("accountabilityRelationships").where("menteeUid", "==", menteeUid).where("status", "==", "pending").get();
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

        const threadsSnapshot = await db.collection("threads").where("userA", "in", [menteeUid, otherMentorUid]).where("userB", "in", [menteeUid, otherMentorUid]).get();
        for (const threadDoc of threadsSnapshot.docs) {
          const threadData = threadDoc.data();
          if (threadData.userA === otherMentorUid) {
            batch.update(threadDoc.ref, { userA_unreadCount: Math.max(0, (threadData.userA_unreadCount || 0) - 1) });
          } else if (threadData.userB === otherMentorUid) {
            batch.update(threadDoc.ref, { userB_unreadCount: Math.max(0, (threadData.userB_unreadCount || 0) - 1) });
          }
        }
      }

      if (canceledCount > 0) {
        await batch.commit();
        console.log(`✅ Successfully canceled ${canceledCount} pending invite(s)`);
      }
    } catch (error) {
      console.error("❌ Error canceling pending invites:", error);
      throw error;
    }
  }
);

// Send notifications for declined/accepted/ended relationships
exports.sendAccountabilityDeclinedNotification = onDocumentUpdated(
  "accountabilityRelationships/{relationshipId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status !== "declined" && after.status === "declined") {
      const menteeUid = after.menteeUid;
      const mentorUid = after.mentorUid;
      if (await eitherBlocked(menteeUid, mentorUid)) return;
      const menteeDoc = await admin.firestore().collection("users").doc(menteeUid).get();
      if (!menteeDoc.exists) return;
      const menteeData = menteeDoc.data();
      if (!menteeData.notificationPreferences?.accountability || !menteeData.expoPushToken?.startsWith("ExponentPushToken")) return;

      const threadsSnapshot = await admin.firestore().collection("threads").where("userA", "in", [menteeUid, mentorUid]).get();
      let threadId = null;
      for (const doc of threadsSnapshot.docs) {
        const thread = doc.data();
        if ((thread.userA === menteeUid && thread.userB === mentorUid) || (thread.userA === mentorUid && thread.userB === menteeUid)) {
          threadId = doc.id;
          break;
        }
      }
      if (!threadId) return;

      try {
        const totalUnread = await getTotalUnreadForUser(menteeUid);
        const mentorName = `user-${mentorUid.substring(0, 5)}`;
        await axios.post("https://exp.host/--/api/v2/push/send", [{
          to: menteeData.expoPushToken,
          sound: "default",
          title: "Invite Declined",
          body: `${mentorName} declined your accountability invite`,
          badge: totalUnread,
          data: { type: "accountability_declined", threadId, otherUserId: mentorUid }
        }], { headers: { "Content-Type": "application/json" } });
        console.log(`✅ Sent accountability declined notification`);
      } catch (err) {
        console.error(`❌ Failed to send declined notification:`, err);
      }
    }
  }
);

exports.sendAccountabilityAcceptedNotification = onDocumentUpdated(
  "accountabilityRelationships/{relationshipId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status === "pending" && after.status === "active") {
      const menteeUid = after.menteeUid;
      const mentorUid = after.mentorUid;
      if (await eitherBlocked(menteeUid, mentorUid)) return;
      const menteeDoc = await admin.firestore().collection("users").doc(menteeUid).get();
      if (!menteeDoc.exists) return;
      const menteeData = menteeDoc.data();
      if (!menteeData.notificationPreferences?.accountability || !menteeData.expoPushToken?.startsWith("ExponentPushToken")) return;

      try {
        const totalUnread = await getTotalUnreadForUser(menteeUid);
        const mentorName = `user-${mentorUid.substring(0, 5)}`;
        await axios.post("https://exp.host/--/api/v2/push/send", [{
          to: menteeData.expoPushToken,
          sound: "default",
          title: "Accountability Partner! 🎉",
          body: `${mentorName} accepted your invite`,
          badge: totalUnread,
          data: { type: "accountability_accepted" }
        }], { headers: { "Content-Type": "application/json" } });
        console.log(`✅ Sent accountability accepted notification`);
      } catch (err) {
        console.error(`❌ Failed to send accepted notification:`, err);
      }
    }
  }
);

exports.sendAccountabilityEndedNotification = onDocumentUpdated(
  "accountabilityRelationships/{relationshipId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status === "active" && after.status === "ended") {
      const menteeUid = after.menteeUid;
      const mentorUid = after.mentorUid;
      const endedByUid = after.endedByUid;
      if (await eitherBlocked(menteeUid, mentorUid)) return;

      const recipientUid = endedByUid === menteeUid ? mentorUid : menteeUid;
      const enderUid = endedByUid;
      const recipientDoc = await admin.firestore().collection("users").doc(recipientUid).get();
      if (!recipientDoc.exists) return;
      const recipientData = recipientDoc.data();
      if (!recipientData.notificationPreferences?.accountability || !recipientData.expoPushToken?.startsWith("ExponentPushToken")) return;

      try {
        const totalUnread = await getTotalUnreadForUser(recipientUid);
        const enderName = `user-${enderUid.substring(0, 5)}`;
        await axios.post("https://exp.host/--/api/v2/push/send", [{
          to: recipientData.expoPushToken,
          sound: "default",
          title: "Partnership Ended",
          body: `${enderName} ended the accountability partnership`,
          badge: totalUnread,
          data: { type: "accountability_ended" }
        }], { headers: { "Content-Type": "application/json" } });
        console.log(`✅ Sent accountability ended notification`);
      } catch (err) {
        console.error(`❌ Failed to send ended notification:`, err);
      }
    }
  }
);
