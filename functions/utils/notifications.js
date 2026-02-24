const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { admin } = require("./database");

/**
 * Calculate total unread count for a user by summing all unread sources:
 * - Messages: userA/B_unreadCount from all threads
 * - Encouragements: unreadEncouragementCount from all owned pleas
 * - Pleas: unreadPleaCount from user doc
 * - Invites: count of pending accountability invites where user is mentor
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
    return 0;
  }

  try {
    const db = admin.firestore();

    // --- Messages ---
    let messageUnread = 0;

    const threadsA = await db
      .collection(`organizations/${orgId}/threads`)
      .where("userA", "==", uid)
      .get();

    threadsA.forEach((doc) => {
      messageUnread += doc.data().userA_unreadCount || 0;
    });

    const threadsB = await db
      .collection(`organizations/${orgId}/threads`)
      .where("userB", "==", uid)
      .get();

    threadsB.forEach((doc) => {
      messageUnread += doc.data().userB_unreadCount || 0;
    });

    // --- Encouragements ---
    let encouragementUnread = 0;

    const pleasSnap = await db
      .collection(`organizations/${orgId}/pleas`)
      .where("uid", "==", uid)
      .get();

    pleasSnap.forEach((doc) => {
      encouragementUnread += doc.data().unreadEncouragementCount || 0;
    });

    // --- Pleas ---
    const userDoc = await db
      .doc(`organizations/${orgId}/users/${uid}`)
      .get();
    const pleaUnread = userDoc.data()?.unreadPleaCount || 0;

    // --- Pending invites (where user is mentor) ---
    const invitesSnap = await db
      .collection(`organizations/${orgId}/accountabilityRelationships`)
      .where("mentorUid", "==", uid)
      .where("status", "==", "pending")
      .get();
    const inviteUnread = invitesSnap.size;

    const totalUnread =
      messageUnread + encouragementUnread + pleaUnread + inviteUnread;

    console.log(
      `[getTotalUnreadForUser] User ${uid} in org ${orgId}: ${messageUnread} messages + ${encouragementUnread} encouragements + ${pleaUnread} pleas + ${inviteUnread} invites = ${totalUnread} total`
    );

    return totalUnread;
  } catch (error) {
    console.error(
      `Error calculating unread for user ${uid} in org ${orgId}:`,
      error
    );
    return 0;
  }
}

/**
 * Read the cached unreadTotal from a user's document.
 *
 * @param {string} uid - User ID
 * @param {string} orgId - Organization ID
 * @returns {Promise<number>} Current unread total (0 if missing)
 */
async function getUnreadTotal(uid, orgId) {
  try {
    const userDoc = await admin
      .firestore()
      .doc(`organizations/${orgId}/users/${uid}`)
      .get();
    return userDoc.data()?.unreadTotal || 0;
  } catch (error) {
    console.error(
      `Error reading unreadTotal for user ${uid} in org ${orgId}:`,
      error
    );
    return 0;
  }
}

/**
 * Atomically increment unreadTotal on a user's document and return the new value.
 * Used by notification functions to get the badge number after incrementing.
 *
 * @param {string} uid - User ID
 * @param {string} orgId - Organization ID
 * @returns {Promise<number>} New unread total after increment
 */
async function incrementUnreadTotal(uid, orgId) {
  const userRef = admin
    .firestore()
    .doc(`organizations/${orgId}/users/${uid}`);

  try {
    const newTotal = await admin.firestore().runTransaction(async (t) => {
      const userDoc = await t.get(userRef);
      const current = userDoc.data()?.unreadTotal || 0;
      const updated = current + 1;
      t.update(userRef, { unreadTotal: updated });
      return updated;
    });
    return newTotal;
  } catch (error) {
    console.error(
      `Error incrementing unreadTotal for user ${uid} in org ${orgId}:`,
      error
    );
    return 0;
  }
}

/**
 * Reconcile unreadTotal for the calling user.
 * Recalculates the true total from all sources and corrects if drifted.
 * Called by the client on app foreground as a self-healing mechanism.
 */
const reconcileUnreadTotal = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const uid = request.auth.uid;
  const orgId = request.auth.token.organizationId;

  if (!orgId) {
    throw new HttpsError(
      "failed-precondition",
      "User has no organizationId claim"
    );
  }

  try {
    const calculatedTotal = await getTotalUnreadForUser(uid, orgId);

    const userRef = admin
      .firestore()
      .doc(`organizations/${orgId}/users/${uid}`);
    const userDoc = await userRef.get();
    const currentTotal = userDoc.data()?.unreadTotal || 0;

    if (currentTotal !== calculatedTotal) {
      await userRef.update({ unreadTotal: calculatedTotal });
      console.log(
        `[reconcile] Corrected unreadTotal for ${uid} in org ${orgId}: ${currentTotal} → ${calculatedTotal}`
      );
      return { corrected: true, oldValue: currentTotal, newValue: calculatedTotal };
    }

    return { corrected: false, oldValue: currentTotal, newValue: currentTotal };
  } catch (error) {
    console.error(
      `[reconcile] Error for ${uid} in org ${orgId}:`,
      error
    );
    throw new HttpsError("internal", "Failed to reconcile unread total");
  }
});

module.exports = {
  getTotalUnreadForUser,
  getUnreadTotal,
  incrementUnreadTotal,
  reconcileUnreadTotal,
};
