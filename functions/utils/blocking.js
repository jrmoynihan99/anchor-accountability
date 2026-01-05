const { admin } = require("./database");

/**
 * Check if either user has blocked the other
 * Returns true if blocked in either direction
 */
async function eitherBlocked(aUid, bUid) {
  const db = admin.firestore();
  const [aBlocksB, bBlocksA] = await Promise.all([
    db.doc(`users/${aUid}/blockList/${bUid}`).get(),
    db.doc(`users/${bUid}/blockList/${aUid}`).get(),
  ]);
  return aBlocksB.exists || bBlocksA.exists;
}

module.exports = {
  eitherBlocked,
};
