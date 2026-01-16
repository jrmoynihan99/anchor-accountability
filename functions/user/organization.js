const { onCall } = require("firebase-functions/v2/https");
const { HttpsError } = require("firebase-functions/v2/https");
const { admin } = require("../utils/database");

/**
 * Set user's organization custom claim
 */
exports.setUserOrganization = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const uid = request.auth.uid;
  const { organizationId } = request.data;

  if (!organizationId || typeof organizationId !== "string") {
    throw new HttpsError("invalid-argument", "organizationId is required");
  }

  try {
    await admin.auth().setCustomUserClaims(uid, { organizationId });
    console.log(`✅ Set organizationId="${organizationId}" for user ${uid}`);

    return {
      success: true,
      organizationId,
    };
  } catch (error) {
    console.error(`❌ Error setting custom claim for ${uid}:`, error);
    throw new HttpsError("internal", "Failed to set organization");
  }
});
