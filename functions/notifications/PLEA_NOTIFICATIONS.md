# Plea notification fan-out

Pleas no longer notify every opted-in user. They escalate in waves and stop
early once the author has enough support.

Rules and indexes are **not** deployed from this repo (`firebase.json` has no
`firestore` block), so the two setup steps below must be done in the console.

## 1. Required composite index

The escalation sweeper runs a collection-group query that needs an index:

| Setting          | Value                      |
| ---------------- | -------------------------- |
| Collection ID    | `pleas`                    |
| Query scope      | **Collection group**       |
| Field 1          | `notifyState` — Ascending  |
| Field 2          | `nextWaveAt` — Ascending   |

Without it the sweeper throws on every tick and no plea ever escalates past
wave 1. The error log links straight to a one-click create page.

The rotation query (`notificationPreferences.pleas` + order by document ID) is
served by Firestore's automatic single-field index — nothing to create.

## 2. Config document

`organizations/{orgId}/config/pleaNotificationConfig`

Every field is optional; anything missing or malformed falls back to the
default in `functions/utils/pleaNotificationConfig.js`. A typo cannot take
notifications down. Changes take effect within ~60s (module-scope cache TTL).

| Field                      | Default        | Meaning                                                     |
| -------------------------- | -------------- | ----------------------------------------------------------- |
| `strategy`                 | `"waves"`      | `waves` \| `fanout` \| `all`                                 |
| `waveSizes`                | `[20, 60, 200]`| Recipients per escalation wave, in order                     |
| `waveDelayMinutes`         | `5`            | Wait before deciding whether to escalate                     |
| `stopAfterEncouragements`  | `3`            | Stop escalating once the plea has this many approved replies |
| `minMinutesBetweenPerUser` | `120`          | Soft per-user cooldown                                       |
| `fanOutSize`               | `150`          | Wave size when `strategy` is `"fanout"`                      |
| `crisisBypass`             | `true`         | Crisis-flagged pleas skip throttling entirely                |
| `crisisFanOutSize`         | `500`          | Recipients for a crisis plea                                 |
| `quietHoursEnabled`        | `false`        | Suppress routine pleas during the recipient's local night    |
| `quietHoursStart`          | `22`           | Hour 0–23, recipient's local time, inclusive                 |
| `quietHoursEnd`            | `7`            | Hour 0–23, recipient's local time, exclusive                 |

### Tuning

Steady-state volume per user, once escalation is factored out:

```
notifications per user per day ≈ (pleas per day × avg recipients per plea) / opted-in users
```

Pick the number you want people to receive and solve for `waveSizes`.

### Quiet hours

Off by default. Enable by setting `quietHoursEnabled: true`.

The window is evaluated in each **recipient's** local time, not the server's,
using the `timezone` and `utcOffsetMinutes` fields that `updateUserTimezone()`
in `lib/firebase.ts` writes on every app open. The IANA `timezone` string is
preferred because it resolves DST at the moment of sending; `utcOffsetMinutes`
is the fallback.

Two behaviours worth knowing:

- **Crisis pleas ignore quiet hours entirely.** That is the point of the flag.
- **A wave whose candidates are all asleep is deferred, not dropped.** The
  rotation cursor does not advance and `notifyWave` is not consumed, so the
  same wave retries every 30 minutes until someone is awake. A routine plea
  posted at 3am reaches people in the morning rather than waking twenty of them
  or silently reaching nobody.

Users with no usable timezone data **fail open** — they stay reachable. Being
permanently unnotifiable is a worse failure than an occasional bad hour.

### Rollback

Set `strategy: "all"` in the console to restore notify-everyone behaviour
without a deploy. It still uses the parallel delivery path, so it is much
faster than the original implementation, but it is O(users) per plea again and
will not scale — treat it as an escape hatch, not a resting state.

## 3. Firestore rules

These fields are written by the admin SDK, which bypasses rules. Clients should
not be able to write them:

- On user docs: `lastPleaNotifiedAt`
- On plea docs: `notifyState`, `notifyWave`, `notifiedUids`, `nextWaveAt`
- The whole `config/pleaNotificationState` document (holds `rotationCursor`)

A client that could write `lastPleaNotifiedAt` could dodge or force its own
notifications; one that could write `notifyState` could mute a plea entirely.

## How it works

1. A plea is approved. `startPleaNotifications` transactionally claims it
   (`notifyState: "active"`), which makes retries and overlapping triggers safe.
2. Wave 1 goes to `waveSizes[0]` users chosen by a **rotation cursor** over
   document IDs, stored at `config/pleaNotificationState`.
3. `nextWaveAt` is set. The sweeper (`escalatePleaNotifications`, every minute)
   picks it up, counts approved encouragements, and either marks it complete or
   runs the next wave.
4. Crisis pleas skip all of this and fan out immediately.

### Why rotation is keyed on document ID

Firestore's `orderBy` **excludes documents missing the ordered field**. Ordering
by `lastPleaNotifiedAt` would make every user who has never been notified
permanently invisible to the query, and user docs are created client-side via
`setDoc(..., { merge: true })` from several call sites, so seeding that field
reliably is not realistic. Every document has an ID, so ordering by ID cannot
drop anyone. `lastPleaNotifiedAt` is still *read* to enforce the cooldown —
reading an absent field is safe, only ordering by one is not.

## What to watch after deploy

- `topped up wave with N recently-notified users` — the cooldown is fighting
  the wave size. Lower `minMinutesBetweenPerUser` or shrink `waveSizes`.
- `Sweeper hit its 50-plea cap` — escalation is falling behind; raise
  `SWEEP_BATCH` in `pleas.js`.
- `Expo push failed for batch` — counters for that batch are reverted, so
  badges stay honest. Repeated failures mean stale tokens worth pruning.
- `wave deferred (all candidates in quiet hours)` — expected overnight. If it
  appears in daylight hours, `quietHoursStart`/`End` are probably inverted.
