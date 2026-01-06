const {
  onDocumentCreated,
  onDocumentDeleted,
} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const { admin } = require("../utils/database");

exports.onBlockCreate = onDocumentCreated(
  "organizations/{orgId}/users/{uid}/blockList/{blockedUid}",
  async (event) => {
    const { orgId, uid, blockedUid } = event.params;
    try {
      await admin
        .firestore()
        .doc(`organizations/${orgId}/users/${blockedUid}/blockedBy/${uid}`)
        .set(
          {
            uid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
      logger.info(
        `[onBlockCreate] Mirrored block in org ${orgId}: ${uid} -> ${blockedUid}`
      );
    } catch (err) {
      logger.error(`[onBlockCreate] mirror write failed in org ${orgId}:`, err);
    }
  }
);

exports.onBlockDelete = onDocumentDeleted(
  "organizations/{orgId}/users/{uid}/blockList/{blockedUid}",
  async (event) => {
    const { orgId, uid, blockedUid } = event.params;
    try {
      await admin
        .firestore()
        .doc(`organizations/${orgId}/users/${blockedUid}/blockedBy/${uid}`)
        .delete();
      logger.info(
        `[onBlockDelete] Removed mirror block in org ${orgId}: ${uid} -> ${blockedUid}`
      );
    } catch (err) {
      logger.warn(`[onBlockDelete] mirror delete warn in org ${orgId}:`, err);
    }
  }
);
