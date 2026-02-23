const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const { admin } = require("../utils/database");

/**
 * HTTPS endpoint for creating a plea from the iOS widget.
 *
 * The widget can't use the React Native Firebase SDK, so it calls this
 * endpoint directly. Auth is handled via a per-user widgetToken stored
 * in both Firestore and the App Group shared UserDefaults.
 *
 * POST body: { widgetToken, userId, orgId }
 *
 * The created plea has an empty message and status "approved", which
 * matches the existing client-side behavior for empty pleas. Existing
 * Firestore triggers (moderatePlea, sendHelpNotification) handle the
 * rest automatically.
 */
exports.createPleaFromWidget = onRequest(
  { cors: true, maxInstances: 5 },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    const { widgetToken, userId, orgId } = req.body;

    if (!widgetToken || !userId || !orgId) {
      res.status(400).json({ error: "Missing required fields" });
      return;
    }

    try {
      const db = admin.firestore();

      // Validate widget token
      const userRef = db.doc(`organizations/${orgId}/users/${userId}`);
      const userDoc = await userRef.get();

      if (!userDoc.exists) {
        logger.warn(`[widgetPlea] User ${userId} not found in org ${orgId}`);
        res.status(403).json({ error: "Invalid credentials" });
        return;
      }

      const storedToken = userDoc.data()?.widgetToken;
      if (!storedToken || storedToken !== widgetToken) {
        logger.warn(`[widgetPlea] Invalid widget token for user ${userId}`);
        res.status(403).json({ error: "Invalid widget token" });
        return;
      }

      // Server-side rate limiting (2 per 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const recentPleas = await db
        .collection(`organizations/${orgId}/pleas`)
        .where("uid", "==", userId)
        .where(
          "createdAt",
          ">=",
          admin.firestore.Timestamp.fromDate(fiveMinutesAgo)
        )
        .limit(2)
        .get();

      if (recentPleas.size >= 2) {
        logger.info(
          `[widgetPlea] Rate limited user ${userId} in org ${orgId}`
        );
        res.status(429).json({ error: "Rate limited", retryAfter: 300 });
        return;
      }

      // Create the plea (empty message = auto-approved)
      const pleaRef = await db
        .collection(`organizations/${orgId}/pleas`)
        .add({
          uid: userId,
          message: "",
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          status: "approved",
          source: "widget",
        });

      logger.info(
        `[widgetPlea] Created plea ${pleaRef.id} for user ${userId} in org ${orgId}`
      );

      res.status(200).json({ success: true, pleaId: pleaRef.id });
    } catch (error) {
      logger.error("[widgetPlea] Error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
