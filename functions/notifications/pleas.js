const {
  onDocumentCreated,
  onDocumentUpdated,
} = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/v2/scheduler");
const axios = require("axios");
const { admin, offsetMinutesForTimezone } = require("../utils/database");
const { eitherBlocked } = require("../utils/blocking");
const {
  getPleaNotificationConfig,
} = require("../utils/pleaNotificationConfig");

const FieldPath = admin.firestore.FieldPath;
const FieldValue = admin.firestore.FieldValue;

// Per-user Firestore work runs in parallel, chunked so a large wave doesn't
// open hundreds of simultaneous connections.
const FIRESTORE_CONCURRENCY = 25;

// Expo's push API accepts up to 100 messages per request.
const EXPO_BATCH_SIZE = 100;

// Expo rate-limits bursts of back-to-back batches with HTTP 429. Under waves a
// single wave is one or two batches and never trips it, but the "all" strategy
// and any large waveSizes still can, so batches are paced and retried.
const EXPO_MAX_RETRIES = 4;
const EXPO_BACKOFF_BASE_MS = 500;
const EXPO_INTER_BATCH_DELAY_MS = 250;

// Candidates are over-fetched so the per-user cooldown has something to filter
// against. Without this the cooldown is inert: a slice of exactly N always
// yields exactly N recipients regardless of when they were last notified.
const CANDIDATE_OVERSAMPLE = 2;

// Ceiling on how many user documents a single rotation claim reads.
const MAX_CANDIDATE_FETCH = 1000;

// The escalation sweeper processes at most this many pleas per tick.
const SWEEP_BATCH = 50;

// How long to wait before retrying a wave that was deferred because every
// candidate was inside their quiet hours. Longer than waveDelayMinutes so a
// plea posted overnight doesn't re-check every few minutes until morning.
const QUIET_HOURS_RETRY_MINUTES = 30;

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * POST one batch to Expo, retrying on rate limits and transient server errors.
 *
 * Honours Retry-After when Expo sends it, otherwise backs off exponentially.
 * Anything still failing after EXPO_MAX_RETRIES throws, so the caller can
 * revert that batch's counters rather than leaving badges claiming a
 * notification that never arrived.
 */
async function postToExpo(payload, attempt = 0) {
  try {
    return await axios.post("https://exp.host/--/api/v2/push/send", payload, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const status = error?.response?.status;
    const retryable = status === 429 || (status >= 500 && status < 600);

    if (!retryable || attempt >= EXPO_MAX_RETRIES) throw error;

    const retryAfter = Number(error?.response?.headers?.["retry-after"]);
    const delay = Number.isFinite(retryAfter)
      ? retryAfter * 1000
      : EXPO_BACKOFF_BASE_MS * Math.pow(2, attempt);

    console.warn(
      `[plea] Expo returned ${status}; retrying in ${delay}ms (attempt ${
        attempt + 1
      }/${EXPO_MAX_RETRIES})`
    );
    await sleep(delay);
    return postToExpo(payload, attempt + 1);
  }
}

/** Run `fn` over `items` in parallel, at most `limit` at a time. */
async function mapWithConcurrency(items, limit, fn) {
  const results = [];
  for (const group of chunk(items, limit)) {
    results.push(...(await Promise.all(group.map(fn))));
  }
  return results;
}

/* -------------------------------------------------------------------------- */
/* Recipient selection                                                        */
/* -------------------------------------------------------------------------- */

/**
 * Claim the next slice of users in the org's rotation.
 *
 * Rotation is ordered by document ID rather than a "last notified" timestamp
 * because Firestore's orderBy silently excludes documents missing the ordered
 * field — any user created without that field would become permanently
 * unreachable. Every document has an ID, so ordering by it can't drop anyone.
 *
 * The cursor advance happens inside the transaction so two pleas arriving at
 * once claim different slices instead of both notifying the same people.
 *
 * Filtering happens inside the transaction so the cursor can rest on the last
 * user actually consumed. Advancing past the whole over-fetched page instead
 * would skip eligible users for a full rotation cycle.
 *
 * @param {string} orgId - Organization ID
 * @param {Object} config - Sanitised plea notification config
 * @param {Object} plea - Plea document data
 * @param {number} size - Recipients wanted
 * @param {Set<string>} exclude - UIDs never to select
 * @param {boolean} respectQuietHours - False for crisis pleas
 * @returns {Promise<{recipients: Array<{uid: string, token: string}>, deferred: boolean}>}
 */
async function claimRotationSlice(
  orgId,
  config,
  plea,
  size,
  exclude,
  respectQuietHours
) {
  const db = admin.firestore();
  const usersCol = db.collection(`organizations/${orgId}/users`);
  const stateRef = db.doc(`organizations/${orgId}/config/pleaNotificationState`);

  const baseQuery = usersCol
    .where("notificationPreferences.pleas", "==", true)
    .orderBy(FieldPath.documentId());

  // Over-fetch so the per-user cooldown has something to filter against. A page
  // of exactly `size` would make the cooldown inert. Capped because this reads
  // inside a transaction, where very large reads are slow and contention-prone.
  const pageSize = Math.min(size * CANDIDATE_OVERSAMPLE, MAX_CANDIDATE_FETCH);
  const cutoff = Date.now() - config.minMinutesBetweenPerUser * 60 * 1000;

  return db.runTransaction(async (t) => {
    const stateSnap = await t.get(stateRef);
    const cursor = stateSnap.exists ? stateSnap.data()?.rotationCursor : null;

    let query = baseQuery.limit(pageSize);
    if (cursor) query = query.startAfter(usersCol.doc(cursor));

    const snap = await t.get(query);
    let docs = snap.docs;

    // Reached the end of the org — wrap around to the start of the rotation.
    if (docs.length < pageSize) {
      const wrapSnap = await t.get(baseQuery.limit(pageSize - docs.length));
      const seen = new Set(docs.map((d) => d.id));
      docs = docs.concat(wrapSnap.docs.filter((d) => !seen.has(d.id)));
    }

    const fresh = [];
    const throttled = [];
    let quietCount = 0;
    let lastConsumed = cursor;

    for (const d of docs) {
      if (fresh.length >= size) break;
      lastConsumed = d.id;

      const data = d.data();
      if (exclude.has(d.id) || !hasValidToken(data)) continue;

      if (respectQuietHours && inQuietHours(data, config)) {
        quietCount++;
        continue;
      }

      // A missing timestamp means "never notified" — always eligible. Reading
      // an absent field is safe; only ordering by one is not.
      const lastMs = data.lastPleaNotifiedAt?.toMillis?.() ?? 0;
      const entry = { uid: d.id, token: data.expoPushToken };
      if (lastMs <= cutoff) fresh.push(entry);
      else throttled.push(entry);
    }

    // Everyone in range is asleep. Defer without advancing the cursor —
    // otherwise a plea posted at 3am burns through the rotation reaching
    // nobody, and those users lose their turn for the whole cycle.
    if (fresh.length === 0 && throttled.length === 0 && quietCount > 0) {
      return { recipients: [], deferred: true };
    }

    // The cooldown is a preference, not a hard rule: if honouring it would
    // leave the wave under-filled, top up from recently-notified users. A plea
    // reaching nobody is far worse than someone getting two pings.
    if (fresh.length < size) {
      const topUp = throttled.slice(0, size - fresh.length);
      if (topUp.length) {
        console.log(
          `[plea] Org ${orgId}: topped up wave with ${topUp.length} recently-notified users to preserve coverage`
        );
      }
      fresh.push(...topUp);
    }

    t.set(
      stateRef,
      {
        rotationCursor: lastConsumed || null,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    return { recipients: fresh, deferred: false };
  });
}

/** Fetch every opted-in user. Only used by the "all" escape-hatch strategy. */
async function fetchAllOptedIn(orgId) {
  const snap = await admin
    .firestore()
    .collection(`organizations/${orgId}/users`)
    .where("notificationPreferences.pleas", "==", true)
    .get();
  return snap.docs.map((d) => ({ uid: d.id, data: d.data() }));
}

function hasValidToken(userData) {
  const token = userData?.expoPushToken;
  return (
    typeof token === "string" && token.startsWith("ExponentPushToken")
  );
}

/**
 * Resolve a user's current local hour (0-23), or null if unknowable.
 *
 * Offset resolution is delegated to `offsetMinutesForTimezone` — the same
 * function the hour-bucketed notification jobs use — so the two systems cannot
 * disagree about what time it is for a user, including across DST boundaries.
 *
 * The IANA `timezone` string is preferred because it is evaluated at the moment
 * of sending. The stored `utcOffsetMinutes` is the fallback for users whose
 * zone is missing or unrecognised. Both fields are written by
 * `updateUserTimezone()` in `lib/firebase.ts`.
 */
function localHourFor(userData, now = new Date()) {
  const tz = userData?.timezone;
  let offset =
    typeof tz === "string" && tz && tz !== "Unknown"
      ? offsetMinutesForTimezone(tz, now)
      : null;

  if (offset === null || !Number.isFinite(offset)) {
    const stored = userData?.utcOffsetMinutes;
    offset =
      typeof stored === "number" && Number.isFinite(stored) ? stored : null;
  }

  if (offset === null) return null;

  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const localMinutes = (((utcMinutes + offset) % 1440) + 1440) % 1440;
  return Math.floor(localMinutes / 60);
}

/** True when `hour` is inside the [start, end) window, which may wrap midnight. */
function isQuietHour(hour, start, end) {
  if (start === end) return false;
  return start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

/**
 * Whether a user should be skipped right now for quiet hours.
 *
 * Users with no usable timezone data fail open: being permanently unreachable
 * is a worse outcome than an occasional badly-timed notification.
 */
function inQuietHours(userData, config) {
  if (!config.quietHoursEnabled) return false;
  const hour = localHourFor(userData);
  if (hour === null) return false;
  return isQuietHour(hour, config.quietHoursStart, config.quietHoursEnd);
}

/**
 * Pick recipients for one wave.
 *
 * @returns {Promise<{recipients: Array<{uid: string, token: string}>, deferred: boolean}>}
 */
async function selectRecipients(
  orgId,
  config,
  plea,
  size,
  excludeUids,
  respectQuietHours
) {
  const exclude = new Set(excludeUids || []);
  exclude.add(plea.uid); // never notify the plea's author

  if (config.strategy === "all") {
    const all = await fetchAllOptedIn(orgId);
    const recipients = [];
    let quietCount = 0;

    for (const { uid, data } of all) {
      if (exclude.has(uid) || !hasValidToken(data)) continue;
      if (respectQuietHours && inQuietHours(data, config)) {
        quietCount++;
        continue;
      }
      recipients.push({ uid, token: data.expoPushToken });
    }

    return {
      recipients,
      deferred: recipients.length === 0 && quietCount > 0,
    };
  }

  return claimRotationSlice(
    orgId,
    config,
    plea,
    size,
    exclude,
    respectQuietHours
  );
}

/* -------------------------------------------------------------------------- */
/* Delivery                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Increment a user's plea and total unread counters in one transaction and
 * return the new total, which becomes the push badge value.
 *
 * Both counters move together so the badge can't drift from the plea count,
 * and it's one round trip instead of two.
 */
async function incrementPleaCounters(uid, orgId) {
  const userRef = admin.firestore().doc(`organizations/${orgId}/users/${uid}`);
  return admin.firestore().runTransaction(async (t) => {
    const snap = await t.get(userRef);
    const data = snap.data() || {};
    const newTotal = (data.unreadTotal || 0) + 1;
    t.update(userRef, {
      unreadPleaCount: (data.unreadPleaCount || 0) + 1,
      unreadTotal: newTotal,
    });
    return newTotal;
  });
}

/** Undo an increment when the corresponding push failed to send. */
async function revertPleaCounters(uid, orgId) {
  const userRef = admin.firestore().doc(`organizations/${orgId}/users/${uid}`);
  try {
    await admin.firestore().runTransaction(async (t) => {
      const snap = await t.get(userRef);
      const data = snap.data() || {};
      t.update(userRef, {
        unreadPleaCount: Math.max(0, (data.unreadPleaCount || 0) - 1),
        unreadTotal: Math.max(0, (data.unreadTotal || 0) - 1),
      });
    });
  } catch (error) {
    // reconcileUnreadTotal will self-heal this on next app foreground.
    console.error(`[plea] Failed to revert counters for ${uid}:`, error);
  }
}

function buildNotification(recipient, plea, pleaId, badge) {
  const message = plea.message;
  return {
    to: recipient.token,
    sound: "default",
    title: "Someone is struggling",
    body: message?.length
      ? `They wrote: "${message.slice(0, 100)}"`
      : "They need encouragement. Tap to respond.",
    badge,
    data: { pleaId, type: "plea" },
  };
}

/**
 * Deliver one wave: filter blocked pairs, increment counters, push, and stamp
 * the rotation timestamp.
 *
 * Failure is scoped per Expo batch — if one batch of 100 fails, only those
 * users have their counters reverted. The rest of the wave still lands.
 *
 * @returns {Promise<string[]>} UIDs actually notified
 */
async function deliverWave(orgId, plea, pleaId, recipients) {
  if (recipients.length === 0) return [];

  // Block-check every recipient in parallel rather than serially.
  const allowed = (
    await mapWithConcurrency(recipients, FIRESTORE_CONCURRENCY, async (r) => {
      const blocked = await eitherBlocked(plea.uid, r.uid, orgId);
      return blocked ? null : r;
    })
  ).filter(Boolean);

  if (allowed.length === 0) {
    console.log(`[plea] ${pleaId}: no eligible recipients after block filter`);
    return [];
  }

  // Counters must be incremented before sending because the new total is the
  // badge value carried in the payload.
  const prepared = (
    await mapWithConcurrency(allowed, FIRESTORE_CONCURRENCY, async (r) => {
      try {
        const badge = await incrementPleaCounters(r.uid, orgId);
        return { ...r, badge };
      } catch (error) {
        console.error(`[plea] Counter increment failed for ${r.uid}:`, error);
        return null;
      }
    })
  ).filter(Boolean);

  const notified = [];
  const batches = chunk(prepared, EXPO_BATCH_SIZE);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    // Pace multi-batch sends. A single-batch wave pays nothing for this.
    if (i > 0) await sleep(EXPO_INTER_BATCH_DELAY_MS);

    const payload = batch.map((r) =>
      buildNotification(r, plea, pleaId, r.badge)
    );
    try {
      await postToExpo(payload);
      notified.push(...batch.map((r) => r.uid));
    } catch (error) {
      console.error(
        `[plea] ${pleaId}: Expo push failed for batch of ${batch.length}, reverting counters:`,
        error?.response?.data || error.message
      );
      await mapWithConcurrency(batch, FIRESTORE_CONCURRENCY, (r) =>
        revertPleaCounters(r.uid, orgId)
      );
    }
  }

  // Stamp the cooldown only for users who actually received something.
  for (const group of chunk(notified, 400)) {
    const writer = admin.firestore().batch();
    for (const uid of group) {
      writer.update(
        admin.firestore().doc(`organizations/${orgId}/users/${uid}`),
        { lastPleaNotifiedAt: FieldValue.serverTimestamp() }
      );
    }
    await writer.commit();
  }

  console.log(`[plea] ${pleaId}: notified ${notified.length} users in ${orgId}`);
  return notified;
}

/* -------------------------------------------------------------------------- */
/* Wave state machine                                                          */
/* -------------------------------------------------------------------------- */

async function countEncouragements(pleaRef) {
  try {
    const agg = await pleaRef
      .collection("encouragements")
      .where("status", "==", "approved")
      .count()
      .get();
    return agg.data().count || 0;
  } catch (error) {
    console.error(`[plea] Failed to count encouragements:`, error);
    // Return 0 so a counting failure escalates rather than silently muting
    // a plea that may still need help.
    return 0;
  }
}

/**
 * Run the next wave for a plea, then schedule or close out the escalation.
 */
async function runPleaWave(orgId, pleaId) {
  const pleaRef = admin
    .firestore()
    .doc(`organizations/${orgId}/pleas/${pleaId}`);
  const snap = await pleaRef.get();
  if (!snap.exists) return;

  const plea = snap.data();
  if (plea.status !== "approved") return;

  const config = await getPleaNotificationConfig(orgId);
  const alreadyNotified = plea.notifiedUids || [];

  /** Push the next attempt out without consuming a wave. */
  const deferWave = async (reason) => {
    await pleaRef.update({
      notifyState: "active",
      nextWaveAt: admin.firestore.Timestamp.fromMillis(
        Date.now() + QUIET_HOURS_RETRY_MINUTES * 60 * 1000
      ),
    });
    console.log(`[plea] ${pleaId}: wave deferred (${reason})`);
  };

  // Crisis pleas and the "all" escape hatch both fan out once, wide, and finish.
  // Crisis ignores quiet hours by design — that is the whole point of the flag.
  const isCrisis = plea.crisis === true && config.crisisBypass;
  if (isCrisis || config.strategy === "all") {
    const size = config.strategy === "all" ? Infinity : config.crisisFanOutSize;
    const { recipients, deferred } = await selectRecipients(
      orgId,
      config,
      plea,
      size,
      alreadyNotified,
      !isCrisis
    );

    if (deferred) return deferWave("all candidates in quiet hours");

    const notified = await deliverWave(orgId, plea, pleaId, recipients);
    // notifiedUids is only needed to keep later waves from repeating people.
    // These paths finish here, so storing thousands of UIDs would just risk
    // the 1MB document limit for no benefit.
    await pleaRef.update({
      notifyState: "complete",
      notifyWave: 1,
      nextWaveAt: null,
    });
    console.log(
      `[plea] ${pleaId}: ${isCrisis ? "crisis" : "strategy=all"} fan-out complete, ${notified.length} notified`
    );
    return;
  }

  const waveIndex = plea.notifyWave || 0;
  const waveSizes =
    config.strategy === "fanout" ? [config.fanOutSize] : config.waveSizes;

  if (waveIndex >= waveSizes.length) {
    await pleaRef.update({ notifyState: "complete", nextWaveAt: null });
    return;
  }

  const { recipients, deferred } = await selectRecipients(
    orgId,
    config,
    plea,
    waveSizes[waveIndex],
    alreadyNotified,
    true
  );

  // Deferring leaves notifyWave untouched, so this same wave runs again later
  // rather than being consumed on an empty delivery.
  if (deferred) return deferWave("all candidates in quiet hours");

  const notified = await deliverWave(orgId, plea, pleaId, recipients);

  const isLastWave = waveIndex + 1 >= waveSizes.length;
  const update = {
    notifyWave: waveIndex + 1,
    notifyState: isLastWave ? "complete" : "active",
    nextWaveAt: isLastWave
      ? null
      : admin.firestore.Timestamp.fromMillis(
          Date.now() + config.waveDelayMinutes * 60 * 1000
        ),
  };
  if (notified.length) {
    update.notifiedUids = FieldValue.arrayUnion(...notified);
  }
  await pleaRef.update(update);
}

/**
 * Transactionally claim a plea for notification so retries and overlapping
 * triggers can't start two escalation chains for the same plea.
 *
 * `nextWaveAt` is set as part of the claim so that if the first wave throws,
 * the sweeper picks the plea back up and retries instead of leaving it stuck
 * in "active" forever — which would mean silently notifying nobody.
 *
 * @returns {Promise<boolean>} True if this caller owns the notification run
 */
async function claimPleaForNotification(pleaRef, retryAt) {
  try {
    return await admin.firestore().runTransaction(async (t) => {
      const snap = await t.get(pleaRef);
      if (!snap.exists) return false;
      if (snap.data().notifyState) return false; // already started
      t.update(pleaRef, {
        notifyState: "active",
        notifyWave: 0,
        nextWaveAt: retryAt,
      });
      return true;
    });
  } catch (error) {
    console.error(`[plea] Failed to claim ${pleaRef.id}:`, error);
    return false;
  }
}

async function startPleaNotifications(orgId, pleaId) {
  const pleaRef = admin
    .firestore()
    .doc(`organizations/${orgId}/pleas/${pleaId}`);

  const config = await getPleaNotificationConfig(orgId);
  const retryAt = admin.firestore.Timestamp.fromMillis(
    Date.now() + Math.max(config.waveDelayMinutes, 1) * 60 * 1000
  );

  if (!(await claimPleaForNotification(pleaRef, retryAt))) return;
  await runPleaWave(orgId, pleaId);
}

/* -------------------------------------------------------------------------- */
/* Triggers                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * When a plea is created and immediately approved
 */
exports.sendHelpNotification = onDocumentCreated(
  {
    document: "organizations/{orgId}/pleas/{pleaId}",
    timeoutSeconds: 180,
  },
  async (event) => {
    const plea = event.data?.data();
    if (!plea || plea.status !== "approved") return;
    await startPleaNotifications(event.params.orgId, event.params.pleaId);
  }
);

/**
 * When a plea's status changes to approved
 */
exports.sendHelpNotificationOnApprove = onDocumentUpdated(
  {
    document: "organizations/{orgId}/pleas/{pleaId}",
    timeoutSeconds: 180,
  },
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();
    if (before.status === "approved" || after.status !== "approved") return;
    await startPleaNotifications(event.params.orgId, event.params.pleaId);
  }
);

/**
 * Escalation sweeper.
 *
 * Advances any plea whose next wave is due, unless it has already collected
 * enough encouragement — at which point further notifications are pure noise.
 */
exports.escalatePleaNotifications = onSchedule(
  {
    // Waves are waveDelayMinutes apart (default 5), so sub-2-minute precision
    // buys nothing and this is by far the highest-frequency function here.
    schedule: "every 2 minutes",
    timeoutSeconds: 300,
  },
  async () => {
    const due = await admin
      .firestore()
      .collectionGroup("pleas")
      .where("notifyState", "==", "active")
      .where("nextWaveAt", "<=", admin.firestore.Timestamp.now())
      .limit(SWEEP_BATCH)
      .get();

    if (due.empty) return;

    if (due.size === SWEEP_BATCH) {
      console.warn(
        `[plea] Sweeper hit its ${SWEEP_BATCH}-plea cap; remaining pleas escalate next tick`
      );
    }

    await mapWithConcurrency(due.docs, 5, async (doc) => {
      const orgId = doc.ref.parent.parent?.id;
      if (!orgId) return;

      try {
        const config = await getPleaNotificationConfig(orgId);
        const encouragements = await countEncouragements(doc.ref);

        if (encouragements >= config.stopAfterEncouragements) {
          await doc.ref.update({
            notifyState: "complete",
            nextWaveAt: null,
          });
          console.log(
            `[plea] ${doc.id}: stopping escalation, ${encouragements} encouragements received`
          );
          return;
        }

        await runPleaWave(orgId, doc.id);
      } catch (error) {
        console.error(`[plea] Escalation failed for ${doc.id}:`, error);
      }
    });
  }
);
