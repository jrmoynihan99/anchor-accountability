const { onSchedule } = require("firebase-functions/scheduler");
const { onRequest } = require("firebase-functions/https");
const logger = require("firebase-functions/logger");
const {
  admin,
  getAllOrgIds,
  offsetMinutesForTimezone,
} = require("../utils/database");
const { requireAdminSecret } = require("../utils/adminAuth");

/**
 * Recompute `utcOffsetMinutes` from each user's stored `timezone`.
 *
 * The hourly notification jobs bucket on `utcOffsetMinutes` so they can read
 * ~1/24th of the user base per run instead of scanning everyone. That field is
 * a derived query accelerator — `timezone` remains the source of truth — and it
 * has to stay in sync or those jobs silently stop reaching people.
 *
 * The client rewrites it on every app open, which covers active users. This
 * exists for dormant ones: without it a DST transition would leave their offset
 * stale and they would stop receiving reminders until they next opened the app,
 * which is exactly the population the reminders are meant to bring back.
 *
 * Only writes when the value actually changed, so on a normal day this costs one
 * read per user and no writes. Around a DST boundary it writes the affected zones.
 *
 * @param {Date} now - Instant to evaluate offsets at
 * @returns {Promise<{scanned: number, updated: number, skipped: number, orgs: number}>}
 */
async function refreshUtcOffsets(now) {
  const db = admin.firestore();
  const orgIds = await getAllOrgIds();

  let scanned = 0;
  let updated = 0;
  let skipped = 0;

  for (const orgId of orgIds) {
    try {
      const usersSnap = await db.collection(`organizations/${orgId}/users`).get();

      let batch = db.batch();
      let pending = 0;

      for (const userDoc of usersSnap.docs) {
        scanned++;
        const data = userDoc.data();

        if (!data.timezone || data.timezone === "Unknown") {
          skipped++;
          continue;
        }

        const offset = offsetMinutesForTimezone(data.timezone, now);
        if (offset === null) {
          skipped++;
          continue;
        }
        if (offset === data.utcOffsetMinutes) continue;

        batch.set(userDoc.ref, { utcOffsetMinutes: offset }, { merge: true });
        pending++;
        updated++;

        // Firestore caps a batch at 500 writes.
        if (pending === 400) {
          await batch.commit();
          batch = db.batch();
          pending = 0;
        }
      }

      if (pending > 0) await batch.commit();

      logger.info(`Refreshed UTC offsets for org ${orgId}`);
    } catch (err) {
      logger.error(`Error refreshing UTC offsets for org ${orgId}:`, err);
    }
  }

  return { scanned, updated, skipped, orgs: orgIds.length };
}

/**
 * Daily DST/staleness sweep. Runs at 00:30 UTC, before the earliest local
 * reminder hour comes around, so a zone that shifted overnight is corrected
 * before its users are due to be notified.
 */
exports.refreshUserUtcOffsets = onSchedule(
  {
    schedule: "30 0 * * *",
    timeZone: "UTC",
  },
  async () => {
    const result = await refreshUtcOffsets(new Date());
    logger.info(
      `UTC offset refresh complete: ${result.updated} updated, ${result.skipped} skipped, of ${result.scanned} users across ${result.orgs} orgs.`
    );
  }
);

/**
 * Manual trigger for the same sweep. This is the one-time backfill: existing
 * users have no `utcOffsetMinutes`, and a Firestore `in` filter silently
 * excludes documents missing the field, so the hourly jobs would reach nobody
 * until this has run at least once.
 *
 * Run it BEFORE deploying the bucketed notification functions.
 */
exports.backfillUserUtcOffsets = onRequest(async (req, res) => {
  if (!requireAdminSecret(req, res)) return;

  try {
    const result = await refreshUtcOffsets(new Date());
    res.status(200).json({ ok: true, ...result });
  } catch (err) {
    logger.error("Backfill of utcOffsetMinutes failed:", err);
    res.status(500).json({ ok: false, error: String(err) });
  }
});
