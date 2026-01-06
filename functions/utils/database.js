const admin = require("firebase-admin");

// Initialize Firebase Admin (only once)
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Helper function to format date as YYYY-MM-DD
 */
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

/**
 * Helper function to get date with offset
 */
const getDateWithOffset = (offsetDays) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date;
};

/**
 * Delete documents in batches
 */
async function deleteBatch(refs) {
  const batchSize = 500;
  for (let i = 0; i < refs.length; i += batchSize) {
    const batch = admin.firestore().batch();
    const chunk = refs.slice(i, i + batchSize);
    chunk.forEach((ref) => batch.delete(ref));
    await batch.commit();
  }
}

// ============================================================================
// NEW: Organization-Aware Helper Functions
// ============================================================================

/**
 * Get all organization IDs from Firestore
 * Used by scheduled functions to process all orgs
 * @returns {Promise<string[]>} Array of organization IDs
 */
async function getAllOrgIds() {
  try {
    const orgsSnap = await admin.firestore().collection("organizations").get();
    return orgsSnap.docs.map((doc) => doc.id);
  } catch (error) {
    console.error("Error getting all org IDs:", error);
    return ["public"]; // Fallback to just public
  }
}

module.exports = {
  admin,
  formatDate,
  getDateWithOffset,
  deleteBatch,
  // NEW org-aware helper
  getAllOrgIds,
};
