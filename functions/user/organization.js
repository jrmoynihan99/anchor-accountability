const { onCall } = require("firebase-functions/v2/https");
const { HttpsError } = require("firebase-functions/v2/https");
const { admin } = require("../utils/database");

/**
 * Set user's organization custom claim AND create user document
 * This ensures the user document is created with admin privileges,
 * avoiding client-side permission race conditions
 */
exports.setUserOrganization = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const uid = request.auth.uid;
  const { organizationId, timezone } = request.data;

  if (!organizationId || typeof organizationId !== "string") {
    throw new HttpsError("invalid-argument", "organizationId is required");
  }

  try {
    // 1. Set custom claim
    await admin.auth().setCustomUserClaims(uid, { organizationId });
    console.log(`✅ Set organizationId="${organizationId}" for user ${uid}`);

    // 2. Get user data from auth
    const userRecord = await admin.auth().getUser(uid);

    // 3. Create user document in the organization
    const userRef = admin
      .firestore()
      .doc(`organizations/${organizationId}/users/${uid}`);

    await userRef.set({
      email: userRecord.email || null,
      isAnonymous: userRecord.providerData.length === 0,
      timezone: timezone || "Unknown",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(
      `✅ Created user document for ${uid} in org ${organizationId}`
    );

    return {
      success: true,
      organizationId,
    };
  } catch (error) {
    console.error(`❌ Error setting up user in org ${organizationId}:`, error);
    throw new HttpsError("internal", "Failed to set organization");
  }
});
