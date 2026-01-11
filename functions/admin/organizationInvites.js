const { onCall } = require("firebase-functions/v2/https");
const { HttpsError } = require("firebase-functions/v2/https");
const { admin } = require("../utils/database");
const crypto = require("crypto");

const PLATFORM_ADMIN_UID = "yKzJx7a37sPPrDNGnMQ7prpEAbO2";

/**
 * Generate a secure random token
 */
function generateInviteToken() {
  return crypto.randomBytes(32).toString("hex");
}

/**
 * Create an organization admin invite
 * Platform admin only
 */
exports.createOrgAdminInvite = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const uid = request.auth.uid;

  // Check if user is platform admin
  if (uid !== PLATFORM_ADMIN_UID) {
    throw new HttpsError(
      "permission-denied",
      "Only platform admins can create invites"
    );
  }

  const { organizationId, email } = request.data;

  // Validate input
  if (!organizationId || typeof organizationId !== "string") {
    throw new HttpsError("invalid-argument", "organizationId is required");
  }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Valid email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const db = admin.firestore();

    // Check if organization exists
    const orgRef = db.collection("organizations").doc(organizationId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      throw new HttpsError("not-found", "Organization not found");
    }

    const orgData = orgDoc.data();

    console.log(`📧 Creating invite for ${normalizedEmail} to ${orgData.name}`);

    // Check if there's already a pending invite for this email and org
    const existingInvites = await db
      .collection("organizationInvites")
      .where("organizationId", "==", organizationId)
      .where("email", "==", normalizedEmail)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existingInvites.empty) {
      // Return existing invite
      const existingInvite = existingInvites.docs[0];
      console.log(`✅ Returning existing invite for ${normalizedEmail}`);

      return {
        success: true,
        inviteId: existingInvite.id,
        token: existingInvite.data().token,
        email: normalizedEmail,
        organizationName: orgData.name,
      };
    }

    // Generate unique token
    const token = generateInviteToken();

    // Create invite document
    const inviteRef = await db.collection("organizationInvites").add({
      organizationId: organizationId,
      organizationName: orgData.name,
      email: normalizedEmail,
      token: token,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: uid,
      status: "pending",
      usedBy: null,
    });

    console.log(`✅ Created invite ${inviteRef.id} for ${normalizedEmail}`);

    return {
      success: true,
      inviteId: inviteRef.id,
      token: token,
      email: normalizedEmail,
      organizationName: orgData.name,
    };
  } catch (error) {
    console.error(`❌ Error creating invite:`, error);

    // Re-throw HttpsErrors as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Wrap other errors
    throw new HttpsError(
      "internal",
      `Failed to create invite: ${error.message}`
    );
  }
});

/**
 * Get invites for an organization
 * Platform admin only
 */
exports.getOrgAdminInvites = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const uid = request.auth.uid;

  // Check if user is platform admin
  if (uid !== PLATFORM_ADMIN_UID) {
    throw new HttpsError(
      "permission-denied",
      "Only platform admins can view invites"
    );
  }

  const { organizationId } = request.data;

  // Validate input
  if (!organizationId || typeof organizationId !== "string") {
    throw new HttpsError("invalid-argument", "organizationId is required");
  }

  try {
    const db = admin.firestore();

    // Get all invites for this organization
    const invitesSnapshot = await db
      .collection("organizationInvites")
      .where("organizationId", "==", organizationId)
      .orderBy("createdAt", "desc")
      .get();

    const invites = [];
    invitesSnapshot.forEach((doc) => {
      const data = doc.data();
      invites.push({
        id: doc.id,
        email: data.email,
        status: data.status,
        token: data.token,
        createdAt: data.createdAt,
        usedBy: data.usedBy,
      });
    });

    return {
      success: true,
      invites: invites,
    };
  } catch (error) {
    console.error(`❌ Error fetching invites:`, error);

    if (error instanceof HttpsError) {
      throw error;
    }

    throw new HttpsError(
      "internal",
      `Failed to fetch invites: ${error.message}`
    );
  }
});
