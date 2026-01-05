const { admin } = require("./database");

/**
 * Calculate total unread count for a user (messages + encouragements)
 */
async function getTotalUnreadForUser(uid) {
  // --- Messages ---
  let messageUnread = 0;

  // UserA side
  const threadsA = await admin
    .firestore()
    .collection("threads")
    .where("userA", "==", uid)
    .get();

  threadsA.forEach((doc) => {
    messageUnread += doc.data().userA_unreadCount || 0;
  });

  // UserB side
  const threadsB = await admin
    .firestore()
    .collection("threads")
    .where("userB", "==", uid)
    .get();

  threadsB.forEach((doc) => {
    messageUnread += doc.data().userB_unreadCount || 0;
  });

  // --- Encouragements ---
  let encouragementUnread = 0;
  const pleasSnap = await admin
    .firestore()
    .collection("pleas")
    .where("uid", "==", uid)
    .get();

  pleasSnap.forEach((doc) => {
    encouragementUnread += doc.data().unreadEncouragementCount || 0;
  });

  return messageUnread + encouragementUnread;
}

module.exports = {
  getTotalUnreadForUser,
};
