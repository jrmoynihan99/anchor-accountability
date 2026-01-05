const { onDocumentCreated, onDocumentDeleted } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const { admin } = require("../utils/database");

exports.onBlockCreate = onDocumentCreated(
  "users/{uid}/blockList/{blockedUid}",
  async (event) => {
    const { uid, blockedUid } = event.params;
    try {
      await admin.firestore().doc(`users/${blockedUid}/blockedBy/${uid}`).set({
        uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    } catch (err) {
      logger.error("[onBlockCreate] mirror write failed:", err);
    }
  }
);

exports.onBlockDelete = onDocumentDeleted(
  "users/{uid}/blockList/{blockedUid}",
  async (event) => {
    const { uid, blockedUid } = event.params;
    try {
      await admin.firestore().doc(`users/${blockedUid}/blockedBy/${uid}`).delete();
    } catch (err) {
      logger.warn("[onBlockDelete] mirror delete warn:", err);
    }
  }
);
