const { admin } = require("./database");

/**
 * Calculate total unread count for a user (messages + encouragements)
 *
 * This function calculates the badge count shown in the app by summing:
 * - Unread messages from all threads (where user is either userA or userB)
 * - Unread encouragements on all of the user's pleas
 *
 * @param {string} uid - User ID
 * @param {string} orgId - Organization ID (REQUIRED)
 * @returns {Promise<number>} Total unread count
 */
async function getTotalUnreadForUser(uid, orgId) {
  if (!orgId) {
    console.error(
      "getTotalUnreadForUser called without orgId - this should not happen"
    );
    return 0; // Return 0 to avoid breaking badge functionality
  }

  try {
    // --- Messages ---
    let messageUnread = 0;

    // UserA side - get threads where this user is userA
    const threadsA = await admin
      .firestore()
      .collection(`organizations/${orgId}/threads`)
      .where("userA", "==", uid)
      .get();

    threadsA.forEach((doc) => {
      messageUnread += doc.data().userA_unreadCount || 0;
    });

    // UserB side - get threads where this user is userB
    const threadsB = await admin
      .firestore()
      .collection(`organizations/${orgId}/threads`)
      .where("userB", "==", uid)
      .get();

    threadsB.forEach((doc) => {
      messageUnread += doc.data().userB_unreadCount || 0;
    });

    // --- Encouragements ---
    let encouragementUnread = 0;

    // Get all pleas owned by this user
    const pleasSnap = await admin
      .firestore()
      .collection(`organizations/${orgId}/pleas`)
      .where("uid", "==", uid)
      .get();

    pleasSnap.forEach((doc) => {
      encouragementUnread += doc.data().unreadEncouragementCount || 0;
    });

    const totalUnread = messageUnread + encouragementUnread;

    console.log(
      `[getTotalUnreadForUser] User ${uid} in org ${orgId}: ${messageUnread} messages + ${encouragementUnread} encouragements = ${totalUnread} total`
    );

    return totalUnread;
  } catch (error) {
    console.error(
      `Error calculating unread for user ${uid} in org ${orgId}:`,
      error
    );
    return 0; // Return 0 to avoid breaking badge functionality
  }
}

module.exports = {
  getTotalUnreadForUser,
};
