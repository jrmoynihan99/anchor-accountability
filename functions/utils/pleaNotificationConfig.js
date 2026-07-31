const { admin } = require("./database");

/**
 * Live-tunable configuration for plea notification fan-out.
 *
 * Stored at `organizations/{orgId}/config/pleaNotificationConfig` so it can be
 * edited from the Firebase console without shipping an app or functions update.
 * Every field is optional — anything missing or malformed falls back to the
 * default below, so a typo in the console can never take notifications down.
 */
const DEFAULTS = {
  // "waves"  - staged escalation, stops early once the plea has enough replies
  // "fanout" - single capped wave, no escalation
  // "all"    - legacy behaviour: notify every opted-in user (escape hatch)
  strategy: "waves",

  // Recipients per wave, in order. Wave 1 is waveSizes[0], and so on.
  waveSizes: [20, 60, 200],

  // How long to wait before deciding whether to escalate to the next wave.
  waveDelayMinutes: 5,

  // Once a plea has this many encouragements, stop escalating. Further
  // notifications would be noise — the author already has support.
  stopAfterEncouragements: 3,

  // A user notified more recently than this is skipped, unless honouring the
  // floor would leave the wave under-filled (coverage beats politeness).
  minMinutesBetweenPerUser: 120,

  // Used when strategy is "fanout".
  fanOutSize: 150,

  // Crisis pleas (flagged by moderation) skip throttling entirely.
  crisisBypass: true,
  crisisFanOutSize: 500,

  // Local-time window during which routine pleas are not delivered. Uses the
  // recipient's own clock, not the server's. Crisis pleas ignore this.
  quietHoursEnabled: false,
  quietHoursStart: 22, // 10pm
  quietHoursEnd: 7, // 7am
};

const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

/** Coerce to a positive integer, or return the fallback. */
function posInt(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : fallback;
}

/** Coerce to a non-negative number, or return the fallback. */
function nonNegNum(value, fallback) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : fallback;
}

/** Coerce to a whole hour in [0, 23], or return the fallback. */
function hourOfDay(value, fallback) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 23 ? n : fallback;
}

/**
 * Validate a raw config document into a fully-populated, safe config object.
 * Each field is sanitised independently so one bad value doesn't discard the rest.
 */
function sanitize(raw) {
  const data = raw && typeof raw === "object" ? raw : {};

  const strategy = ["waves", "fanout", "all"].includes(data.strategy)
    ? data.strategy
    : DEFAULTS.strategy;

  let waveSizes = Array.isArray(data.waveSizes)
    ? data.waveSizes.map((n) => posInt(n, 0)).filter((n) => n > 0)
    : [];
  if (waveSizes.length === 0) waveSizes = DEFAULTS.waveSizes;

  return {
    strategy,
    waveSizes,
    waveDelayMinutes: nonNegNum(
      data.waveDelayMinutes,
      DEFAULTS.waveDelayMinutes
    ),
    stopAfterEncouragements: nonNegNum(
      data.stopAfterEncouragements,
      DEFAULTS.stopAfterEncouragements
    ),
    minMinutesBetweenPerUser: nonNegNum(
      data.minMinutesBetweenPerUser,
      DEFAULTS.minMinutesBetweenPerUser
    ),
    fanOutSize: posInt(data.fanOutSize, DEFAULTS.fanOutSize),
    crisisBypass:
      typeof data.crisisBypass === "boolean"
        ? data.crisisBypass
        : DEFAULTS.crisisBypass,
    crisisFanOutSize: posInt(data.crisisFanOutSize, DEFAULTS.crisisFanOutSize),
    quietHoursEnabled:
      typeof data.quietHoursEnabled === "boolean"
        ? data.quietHoursEnabled
        : DEFAULTS.quietHoursEnabled,
    quietHoursStart: hourOfDay(data.quietHoursStart, DEFAULTS.quietHoursStart),
    quietHoursEnd: hourOfDay(data.quietHoursEnd, DEFAULTS.quietHoursEnd),
  };
}

/**
 * Fetch the plea notification config for an org.
 *
 * Cached at module scope for CACHE_TTL_MS so a burst of pleas doesn't re-read
 * the same document once per invocation. Console edits take effect within the
 * TTL plus however long the warm instance lives.
 *
 * @param {string} orgId - Organization ID
 * @returns {Promise<Object>} Fully-populated config (never partial, never null)
 */
async function getPleaNotificationConfig(orgId) {
  const cached = cache.get(orgId);
  if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
    return cached.config;
  }

  let config;
  try {
    const doc = await admin
      .firestore()
      .doc(`organizations/${orgId}/config/pleaNotificationConfig`)
      .get();
    config = sanitize(doc.exists ? doc.data() : null);
  } catch (error) {
    console.error(
      `[pleaConfig] Failed to load config for org ${orgId}, using defaults:`,
      error
    );
    config = sanitize(null);
  }

  cache.set(orgId, { config, fetchedAt: Date.now() });
  return config;
}

module.exports = {
  DEFAULTS,
  getPleaNotificationConfig,
};
