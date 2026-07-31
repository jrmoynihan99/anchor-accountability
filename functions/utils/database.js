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

// ============================================================================
// Timezone bucketing
// ============================================================================

/**
 * Candidate `utcOffsetMinutes` values for users whose local clock currently
 * reads `localHour`.
 *
 * At UTC hour U a user's local time is (U*60 + utcOffsetMinutes) minutes past
 * midnight, so their local hour is `localHour` exactly when their stored offset
 * falls inside one 60-minute window. Real-world UTC offsets are always whole
 * quarter-hours, so that window holds at most four values — few enough for a
 * single Firestore `in` query, which is what lets the hourly notification jobs
 * read ~1/24th of the user base instead of all of it.
 *
 * Offsets are emitted in both their positive and negative representation where
 * both are legal (UTC-12 and UTC+12 are the same clock position but store
 * differently), so the query can never silently miss a user.
 *
 * @param {number} localHour - Target local hour, 0-23
 * @param {Date} [now] - Instant to evaluate (defaults to now)
 * @returns {number[]} Candidate offsets in minutes east of UTC
 */
function offsetsForLocalHour(localHour, now = new Date()) {
  const utcHour = now.getUTCHours();
  const base = ((((localHour - utcHour) * 60) % 1440) + 1440) % 1440;

  const candidates = new Set();
  for (const m of [0, 15, 30, 45]) {
    const v = (base + m) % 1440;
    if (v <= 840) candidates.add(v); // max real offset is UTC+14
    if (v - 1440 >= -720) candidates.add(v - 1440); // min real offset is UTC-12
  }
  return [...candidates];
}

/**
 * Current UTC offset, in minutes east of UTC, for an IANA timezone name.
 *
 * Formats the instant in the target zone, reinterprets those wall-clock fields
 * as if they were UTC, and takes the difference. Correct across DST because it
 * evaluates the zone at the given instant rather than assuming a fixed offset.
 *
 * @param {string} timeZone - IANA name, e.g. "America/New_York"
 * @param {Date} [now] - Instant to evaluate (defaults to now)
 * @returns {number|null} Offset in minutes, or null if the zone is invalid
 */
function offsetMinutesForTimezone(timeZone, now = new Date()) {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(now);

    const get = (type) =>
      parseInt(parts.find((p) => p.type === type)?.value ?? "", 10);

    let hour = get("hour");
    if (hour === 24) hour = 0; // some ICU builds render midnight as 24

    const asUtc = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      hour,
      get("minute"),
      get("second")
    );
    if (Number.isNaN(asUtc)) return null;

    return Math.round((asUtc - now.getTime()) / 60000);
  } catch (err) {
    console.error(`Invalid timezone "${timeZone}":`, err);
    return null;
  }
}

module.exports = {
  admin,
  formatDate,
  getDateWithOffset,
  deleteBatch,
  // NEW org-aware helper
  getAllOrgIds,
  // Timezone bucketing
  offsetsForLocalHour,
  offsetMinutesForTimezone,
};
