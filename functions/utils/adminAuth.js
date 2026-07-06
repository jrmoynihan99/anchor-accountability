const crypto = require("crypto");

// Constant-time comparison that won't throw on length mismatch.
function safeEqual(a, b) {
  const ab = Buffer.from(String(a), "utf8");
  const bb = Buffer.from(String(b), "utf8");
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Guard for manual/admin onRequest (HTTP) endpoints.
 *
 * These endpoints are developer/admin utilities and must never be publicly
 * invocable. Provide the secret via the `x-admin-secret` header (preferred),
 * or a `secret` query param / body field. Configure ADMIN_TASK_SECRET in
 * functions/.env (already gitignored).
 *
 * Fails CLOSED: if ADMIN_TASK_SECRET is not set, every request is rejected.
 * On failure this sends the HTTP response and returns false, so the caller
 * only needs to `return`.
 *
 * @returns {boolean} true if authorized; false if the response was already sent
 */
function requireAdminSecret(req, res) {
  const expected = process.env.ADMIN_TASK_SECRET;

  if (!expected) {
    res
      .status(503)
      .json({ error: "Endpoint disabled: ADMIN_TASK_SECRET is not set." });
    return false;
  }

  const provided =
    (req.get && req.get("x-admin-secret")) ||
    (req.query && req.query.secret) ||
    (req.body && req.body.secret) ||
    "";

  if (!safeEqual(provided, expected)) {
    res.status(401).json({ error: "Unauthorized" });
    return false;
  }

  return true;
}

module.exports = { requireAdminSecret };
