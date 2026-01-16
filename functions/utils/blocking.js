const { admin } = require("./database");

/**
 * Check if either user has blocked the other (within the same organization)
 * Returns true if blocked in either direction
 *
 * Both users must be in the same organization (they can only interact within their org).
 * This function checks the blockList in the specified organization only.
 *
 * @param {string} aUid - First user ID
 * @param {string} bUid - Second user ID
 * @param {string} orgId - Organization ID (REQUIRED)
 * @returns {Promise<boolean>} True if blocked in either direction
 */
async function eitherBlocked(aUid, bUid, orgId) {
  if (!orgId) {
    console.error(
      "eitherBlocked called without orgId - this should not happen"
    );
    return false; // Fail open to avoid breaking functionality
  }

  const db = admin.firestore();

  try {
    // Check blocks within THIS organization only
    const [aBlocksB, bBlocksA] = await Promise.all([
      db.doc(`organizations/${orgId}/users/${aUid}/blockList/${bUid}`).get(),
      db.doc(`organizations/${orgId}/users/${bUid}/blockList/${aUid}`).get(),
    ]);

    return aBlocksB.exists || bBlocksA.exists;
  } catch (error) {
    console.error(
      `Error checking blocks between ${aUid} and ${bUid} in org ${orgId}:`,
      error
    );
    // Fail open (assume not blocked) to avoid breaking functionality
    return false;
  }
}

module.exports = {
  eitherBlocked,
};
