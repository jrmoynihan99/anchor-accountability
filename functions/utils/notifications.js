const { onRequest } = require("firebase-functions/https");
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
 * One-time migration: backfill unreadTotal and unreadPleaCount on all user docs.
 * Run once before deploying the refactored notification functions.
 *
 * GET /migrateUnreadTotals
 */
const migrateUnreadTotals = onRequest(async (req, res) => {
  try {
    const orgsSnap = await admin
      .firestore()
      .collection("organizations")
      .get();

    let totalUsers = 0;
    let totalUpdated = 0;

    for (const orgDoc of orgsSnap.docs) {
      const orgId = orgDoc.id;
      const usersSnap = await admin
        .firestore()
        .collection(`organizations/${orgId}/users`)
        .get();

      for (const userDoc of usersSnap.docs) {
        totalUsers++;
        const uid = userDoc.id;
        const calculatedTotal = await getTotalUnreadForUser(uid, orgId);

        const updateData = {
          unreadTotal: calculatedTotal,
        };
        // Initialize unreadPleaCount if it doesn't exist
        if (userDoc.data().unreadPleaCount === undefined) {
          updateData.unreadPleaCount = 0;
        }

        await userDoc.ref.update(updateData);
        totalUpdated++;
        console.log(
          `[migrate] ${uid} in org ${orgId}: unreadTotal = ${calculatedTotal}`
        );
      }
    }

    const message = `Migration complete: ${totalUpdated}/${totalUsers} users updated.`;
    console.log(message);
    res.status(200).send(message);
  } catch (error) {
    console.error("Migration failed:", error);
    res.status(500).send(`Migration failed: ${error.message}`);
  }
});

module.exports = {
  getTotalUnreadForUser,
  getUnreadTotal,
  incrementUnreadTotal,
  migrateUnreadTotals,
};
