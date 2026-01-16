const { onCall, HttpsError } = require("firebase-functions/v2/https");
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
 * Check if user is a platform admin
 * - supports hardcoded UID
 * - supports adminUsers.platformAdmin === true
 */
async function isPlatformAdmin(uid, db) {
  if (uid === PLATFORM_ADMIN_UID) return true;

  const snap = await db.collection("adminUsers").doc(uid).get();
  if (!snap.exists) return false;

  return snap.data()?.platformAdmin === true;
}

/**
 * Check if user is super_admin for an organization
 */
async function isOrgSuperAdmin(uid, organizationId, db) {
  const snap = await db.collection("adminUsers").doc(uid).get();
  if (!snap.exists) return false;

  return snap.data()?.organizationAccess?.[organizationId] === "super_admin";
}

/**
 * Permission guard:
 * platform admin OR org super_admin
 */
async function assertCanManageOrg(uid, organizationId, db) {
  const platform = await isPlatformAdmin(uid, db);
  if (platform) return;

  const superAdmin = await isOrgSuperAdmin(uid, organizationId, db);
  if (!superAdmin) {
    throw new HttpsError(
      "permission-denied",
      "Insufficient permissions for this organization"
    );
  }
}

/**
 * ACCEPT INVITE
 */
exports.acceptOrgAdminInvite = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  // ✅ Accept name parameter from client
  const { token, name } = request.data;
  const uid = request.auth.uid;
  const userEmail = request.auth.token.email?.toLowerCase();

  if (!token || typeof token !== "string") {
    throw new HttpsError("invalid-argument", "Valid token is required");
  }

  if (!userEmail) {
    throw new HttpsError("invalid-argument", "User email not found");
  }

  try {
    const db = admin.firestore();

    // Find the invite
    const inviteSnap = await db
      .collection("organizationInvites")
      .where("token", "==", token)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (inviteSnap.empty) {
      throw new HttpsError("not-found", "Invite not found or already used");
    }

    const inviteDoc = inviteSnap.docs[0];
    const inviteData = inviteDoc.data();

    // Verify email matches
    if (inviteData.email.toLowerCase() !== userEmail) {
      throw new HttpsError(
        "permission-denied",
        "This invite is for a different email address"
      );
    }

    // Use a transaction to ensure atomicity
    await db.runTransaction(async (transaction) => {
      const adminUserRef = db.collection("adminUsers").doc(uid);
      const adminUserSnap = await transaction.get(adminUserRef);

      // Use .exists property, not .exists() method
      const orgAccess = adminUserSnap.exists
        ? adminUserSnap.data()?.organizationAccess || {}
        : {};

      // Add new org access
      orgAccess[inviteData.organizationId] = inviteData.role;

      // Update or create admin user
      if (adminUserSnap.exists) {
        // ✅ User exists - update organizationAccess and optionally update name if provided
        const updateData = {
          organizationAccess: orgAccess,
        };

        // If name is provided and user doesn't have a name, set it
        const existingData = adminUserSnap.data();
        if (name && name.trim() && !existingData.name) {
          updateData.name = name.trim();
        }

        transaction.update(adminUserRef, updateData);
      } else {
        // ✅ New user - create with name (prioritize passed name, fallback to auth token name)
        transaction.set(adminUserRef, {
          email: userEmail,
          name: (name && name.trim()) || request.auth.token.name || "",
          platformAdmin: false,
          organizationAccess: orgAccess,
        });
      }

      // Mark invite as accepted
      transaction.update(inviteDoc.ref, {
        status: "accepted",
        usedBy: uid,
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    return { success: true };
  } catch (err) {
    console.error("❌ acceptOrgAdminInvite:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", err.message);
  }
});

/**
 * CREATE INVITE
 */
exports.createOrgAdminInvite = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { organizationId, email, role } = request.data;
  const uid = request.auth.uid;

  if (!organizationId || typeof organizationId !== "string") {
    throw new HttpsError("invalid-argument", "organizationId is required");
  }

  if (!email || typeof email !== "string" || !email.includes("@")) {
    throw new HttpsError("invalid-argument", "Valid email is required");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedRole = role === "super_admin" ? "super_admin" : "admin";

  try {
    const db = admin.firestore();

    // 🔐 Permission guard
    await assertCanManageOrg(uid, organizationId, db);

    // 🔍 Validate organization exists
    const orgRef = db.collection("organizations").doc(organizationId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      throw new HttpsError("not-found", "Organization not found");
    }

    // 🔒 BLOCK: email already belongs to an admin in this org
    const existingAdminSnap = await db
      .collection("adminUsers")
      .where("email", "==", normalizedEmail)
      .limit(1)
      .get();

    if (!existingAdminSnap.empty) {
      const adminData = existingAdminSnap.docs[0].data();

      if (adminData.organizationAccess?.[organizationId]) {
        throw new HttpsError(
          "failed-precondition",
          "This user is already an administrator of this organization"
        );
      }
    }

    // 🔒 BLOCK: pending invite already exists
    const existingInviteSnap = await db
      .collection("organizationInvites")
      .where("organizationId", "==", organizationId)
      .where("email", "==", normalizedEmail)
      .where("status", "==", "pending")
      .limit(1)
      .get();

    if (!existingInviteSnap.empty) {
      throw new HttpsError(
        "already-exists",
        "A pending invite already exists for this email"
      );
    }

    // ✅ Create invite
    const token = generateInviteToken();

    const inviteRef = await db.collection("organizationInvites").add({
      organizationId,
      organizationName: orgDoc.data().name,
      email: normalizedEmail,
      token,
      role: normalizedRole,
      status: "pending",
      createdBy: uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      usedBy: null,
    });

    return {
      success: true,
      inviteId: inviteRef.id,
      token,
      email: normalizedEmail,
      role: normalizedRole,
    };
  } catch (err) {
    console.error("❌ createOrgAdminInvite:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", err.message);
  }
});

/**
 * GET INVITES
 */
exports.getOrgAdminInvites = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { organizationId } = request.data;
  const uid = request.auth.uid;

  if (!organizationId) {
    throw new HttpsError("invalid-argument", "organizationId is required");
  }

  try {
    const db = admin.firestore();

    await assertCanManageOrg(uid, organizationId, db);

    const snap = await db
      .collection("organizationInvites")
      .where("organizationId", "==", organizationId)
      .orderBy("createdAt", "desc")
      .get();

    const invites = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      role: doc.data().role || "admin",
    }));

    return { success: true, invites };
  } catch (err) {
    console.error("❌ getOrgAdminInvites:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", err.message);
  }
});

/**
 * CANCEL INVITE
 */
exports.cancelOrgAdminInvite = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { inviteId } = request.data;
  const uid = request.auth.uid;

  if (!inviteId) {
    throw new HttpsError("invalid-argument", "inviteId is required");
  }

  try {
    const db = admin.firestore();

    const inviteRef = db.collection("organizationInvites").doc(inviteId);
    const inviteDoc = await inviteRef.get();

    if (!inviteDoc.exists) {
      throw new HttpsError("not-found", "Invite not found");
    }

    const invite = inviteDoc.data();
    if (invite.status !== "pending") {
      throw new HttpsError("failed-precondition", "Invite is not pending");
    }

    await assertCanManageOrg(uid, invite.organizationId, db);

    await inviteRef.delete();

    return { success: true };
  } catch (err) {
    console.error("❌ cancelOrgAdminInvite:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", err.message);
  }
});

/**
 * REMOVE ADMIN
 */
exports.removeOrgAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const { organizationId, userId } = request.data;
  const callerUid = request.auth.uid;

  if (!organizationId || !userId) {
    throw new HttpsError(
      "invalid-argument",
      "organizationId and userId required"
    );
  }

  try {
    const db = admin.firestore();

    await assertCanManageOrg(callerUid, organizationId, db);

    const adminUserRef = db.collection("adminUsers").doc(userId);
    const snap = await adminUserRef.get();

    if (!snap.exists) {
      throw new HttpsError("not-found", "Admin user not found");
    }

    const data = snap.data();
    if (!data.organizationAccess?.[organizationId]) {
      throw new HttpsError(
        "failed-precondition",
        "User does not belong to this organization"
      );
    }

    const updatedAccess = { ...data.organizationAccess };
    delete updatedAccess[organizationId];

    if (Object.keys(updatedAccess).length === 0) {
      await adminUserRef.delete();
    } else {
      await adminUserRef.update({ organizationAccess: updatedAccess });
    }

    return { success: true };
  } catch (err) {
    console.error("❌ removeOrgAdmin:", err);
    if (err instanceof HttpsError) throw err;
    throw new HttpsError("internal", err.message);
  }
});
