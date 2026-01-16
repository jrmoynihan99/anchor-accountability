const { onSchedule } = require("firebase-functions/scheduler");
const { onRequest } = require("firebase-functions/https");
const { admin, formatDate, getAllOrgIds } = require("../utils/database");

/**
 * Calculate analytics for a single organization
 * @param {string} orgId - Organization ID
 * @returns {Promise<Object>} Analytics data
 */
async function calculateOrgAnalytics(orgId) {
  console.log(`\n📊 Calculating analytics for org: ${orgId}`);

  const db = admin.firestore();
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  try {
    // ========================================================================
    // FETCH ALL DATA
    // ========================================================================

    console.log("Fetching all data...");

    // Fetch all users
    const usersSnap = await db.collection(`organizations/${orgId}/users`).get();
    const totalUsers = usersSnap.size;

    // Fetch all pleas (reach outs) with status = approved
    const pleasSnap = await db
      .collection(`organizations/${orgId}/pleas`)
      .where("status", "==", "approved")
      .get();

    // Fetch pleas from last 30 days
    const pleasThisMonthSnap = await db
      .collection(`organizations/${orgId}/pleas`)
      .where("status", "==", "approved")
      .where("createdAt", ">=", thirtyDaysAgo)
      .get();

    // Fetch all threads
    const threadsSnap = await db
      .collection(`organizations/${orgId}/threads`)
      .get();

    // Fetch ALL accountability relationships (active AND ended)
    const allRelationshipsSnap = await db
      .collection(`organizations/${orgId}/accountabilityRelationships`)
      .get();

    // Filter active relationships
    const activeRelationships = allRelationshipsSnap.docs.filter(
      (doc) => doc.data().status === "active"
    );

    console.log(
      `Found: ${totalUsers} users, ${pleasSnap.size} pleas, ${threadsSnap.size} threads, ${activeRelationships.length} active relationships`
    );

    // ========================================================================
    // CALCULATE TOP-LEVEL METRICS
    // ========================================================================

    // 1. Total Active Users
    const totalActiveUsers = totalUsers;

    // 2. Reach Outs This Month (rolling 30 days)
    const reachOutsThisMonth = pleasThisMonthSnap.size;

    // 2b. Total Reach Outs (all time cumulative)
    const totalReachOuts = pleasSnap.size;

    // 3. Average Replies per Reach Out & Response Time & % Pleas With Reply
    let totalReplies = 0;
    let pleasWithReplies = 0;
    const responseTimes = [];

    for (const pleaDoc of pleasSnap.docs) {
      const pleaData = pleaDoc.data();

      // Count approved encouragements
      const encouragementsSnap = await db
        .collection(`organizations/${orgId}/pleas/${pleaDoc.id}/encouragements`)
        .where("status", "==", "approved")
        .get();

      const replyCount = encouragementsSnap.size;
      totalReplies += replyCount;

      if (replyCount > 0) {
        pleasWithReplies++;

        // Calculate response time (time to first reply)
        const pleaCreatedAt = pleaData.createdAt?.toDate();
        if (pleaCreatedAt && encouragementsSnap.docs.length > 0) {
          // Find earliest encouragement
          let earliestReply = null;
          encouragementsSnap.docs.forEach((encDoc) => {
            const encData = encDoc.data();
            const encCreatedAt = encData.createdAt?.toDate();
            if (
              encCreatedAt &&
              (!earliestReply || encCreatedAt < earliestReply)
            ) {
              earliestReply = encCreatedAt;
            }
          });

          if (earliestReply) {
            const diffMs = earliestReply - pleaCreatedAt;
            const diffHours = diffMs / (1000 * 60 * 60);
            responseTimes.push(diffHours);
          }
        }
      }
    }

    // FIXED: Divide by ALL approved pleas, not just pleas with replies
    const avgRepliesPerReachOut =
      pleasSnap.size > 0
        ? parseFloat((totalReplies / pleasSnap.size).toFixed(1))
        : 0;

    // NEW METRIC: % of pleas that receive a reply
    const percentPleasWithReply =
      pleasSnap.size > 0
        ? Math.round((pleasWithReplies / pleasSnap.size) * 100)
        : 0;

    // 4. Active Partnerships
    const activePartnerships = activeRelationships.length;

    // 5. % of Users Who Have Reached Out (all time)
    const usersWhoReachedOutSet = new Set();
    pleasSnap.docs.forEach((doc) => {
      const uid = doc.data().uid;
      if (uid) usersWhoReachedOutSet.add(uid);
    });
    const percentUsersReachedOut =
      totalUsers > 0
        ? Math.round((usersWhoReachedOutSet.size / totalUsers) * 100)
        : 0;

    // 6. Average Response Time (only for pleas that got replies)
    const avgResponseTimeHours =
      responseTimes.length > 0
        ? parseFloat(
            (
              responseTimes.reduce((sum, t) => sum + t, 0) /
              responseTimes.length
            ).toFixed(1)
          )
        : 0;

    // 7. FIXED Check-In Completion Rate (handle ended relationships)
    let totalCheckInsCompleted = 0;
    let totalCheckInsPossible = 0;

    for (const relDoc of allRelationshipsSnap.docs) {
      const relData = relDoc.data();
      const createdAt = relData.createdAt?.toDate();
      const endedAt = relData.endedAt?.toDate();

      if (createdAt) {
        // If relationship ended, use endedAt. Otherwise use now.
        const endDate = endedAt || now;

        // Calculate days relationship was active
        const daysActive = Math.floor(
          (endDate - createdAt) / (1000 * 60 * 60 * 24)
        );
        totalCheckInsPossible += daysActive;

        // Count actual check-ins (each date document = 1 check-in)
        const checkInsSnap = await db
          .collection(
            `organizations/${orgId}/accountabilityRelationships/${relDoc.id}/checkIns`
          )
          .get();

        totalCheckInsCompleted += checkInsSnap.size;
      }
    }

    const checkInCompletionRate =
      totalCheckInsPossible > 0
        ? Math.round((totalCheckInsCompleted / totalCheckInsPossible) * 100)
        : 0;

    // 8. Trigger Data (from check-ins with temptation level >= 3)
    const triggerCounts = {};
    let highTemptationCheckIns = 0;

    for (const relDoc of allRelationshipsSnap.docs) {
      const checkInsSnap = await db
        .collection(
          `organizations/${orgId}/accountabilityRelationships/${relDoc.id}/checkIns`
        )
        .get();

      for (const checkInDoc of checkInsSnap.docs) {
        const checkInData = checkInDoc.data();
        const temptationLevel = checkInData.temptationLevel;

        if (temptationLevel >= 3) {
          highTemptationCheckIns++;
          const triggers = checkInData.triggers || [];

          triggers.forEach((trigger) => {
            triggerCounts[trigger] = (triggerCounts[trigger] || 0) + 1;
          });
        }
      }
    }

    // Convert to percentages and sort
    const triggerData = Object.entries(triggerCounts)
      .map(([trigger, count]) => ({
        trigger: trigger,
        percentage:
          highTemptationCheckIns > 0
            ? Math.round((count / highTemptationCheckIns) * 100)
            : 0,
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 10); // Top 10 triggers

    // ========================================================================
    // CALCULATE FUNNEL STEPS (FIXED - 5 steps with unique users)
    // ========================================================================

    // Step 1: Total Active Users
    const step1Users = totalUsers;

    // Step 2: Unique users who reached out
    const step2Users = usersWhoReachedOutSet;

    // Step 3: Unique users who received replies
    const step3Users = new Set();
    for (const pleaDoc of pleasSnap.docs) {
      const pleaData = pleaDoc.data();
      const pleaUid = pleaData.uid;

      if (pleaUid && step2Users.has(pleaUid)) {
        const encouragementsSnap = await db
          .collection(
            `organizations/${orgId}/pleas/${pleaDoc.id}/encouragements`
          )
          .where("status", "==", "approved")
          .limit(1)
          .get();

        if (!encouragementsSnap.empty) {
          step3Users.add(pleaUid);
        }
      }
    }

    // Step 4: Unique users who appear as userA in any thread
    const step4Users = new Set();
    threadsSnap.docs.forEach((threadDoc) => {
      const threadData = threadDoc.data();
      const userA = threadData.userA;

      if (userA && step3Users.has(userA)) {
        step4Users.add(userA);
      }
    });

    // Step 5: Unique users who have a partnership (active or ended)
    const step5Users = new Set();
    allRelationshipsSnap.docs.forEach((relDoc) => {
      const relData = relDoc.data();
      const menteeUid = relData.menteeUid;
      const mentorUid = relData.mentorUid;

      if (menteeUid && step4Users.has(menteeUid)) {
        step5Users.add(menteeUid);
      }
      if (mentorUid && step4Users.has(mentorUid)) {
        step5Users.add(mentorUid);
      }
    });

    const funnelSteps = [
      {
        label: "Total Active Users",
        value: step1Users,
        percentage: 100,
      },
      {
        label: "Users Reached Out",
        value: step2Users.size,
        percentage:
          step1Users > 0 ? Math.round((step2Users.size / step1Users) * 100) : 0,
      },
      {
        label: "Users Received Replies",
        value: step3Users.size,
        percentage:
          step2Users.size > 0
            ? Math.round((step3Users.size / step2Users.size) * 100)
            : 0,
      },
      {
        label: "Users Started Private Chats",
        value: step4Users.size,
        percentage:
          step3Users.size > 0
            ? Math.round((step4Users.size / step3Users.size) * 100)
            : 0,
      },
      {
        label: "Users Formed Partnerships",
        value: step5Users.size,
        percentage:
          step4Users.size > 0
            ? Math.round((step5Users.size / step4Users.size) * 100)
            : 0,
      },
    ];

    // ========================================================================
    // CALCULATE TIME-SERIES DATA
    // ========================================================================

    // Activity data (weekly for last 4 weeks)
    const activityData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(
        now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000
      );
      const weekEnd = new Date(now.getTime() - i * 7 * 24 * 60 * 60 * 1000);

      const weekPleasSnap = await db
        .collection(`organizations/${orgId}/pleas`)
        .where("status", "==", "approved")
        .where("createdAt", ">=", weekStart)
        .where("createdAt", "<", weekEnd)
        .get();

      let weekReplies = 0;
      for (const pleaDoc of weekPleasSnap.docs) {
        const encouragementsSnap = await db
          .collection(
            `organizations/${orgId}/pleas/${pleaDoc.id}/encouragements`
          )
          .where("status", "==", "approved")
          .get();
        weekReplies += encouragementsSnap.size;
      }

      activityData.push({
        date: formatDate(weekStart),
        reachOuts: weekPleasSnap.size,
        replies: weekReplies,
      });
    }

    // Check-in trend data (use current completion rate for all weeks as placeholder)
    const checkInTrendData = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(
        now.getTime() - (i + 1) * 7 * 24 * 60 * 60 * 1000
      );

      checkInTrendData.push({
        date: formatDate(weekStart),
        completionRate: checkInCompletionRate,
      });
    }

    // ========================================================================
    // STORE SNAPSHOT
    // ========================================================================

    // Calculate activity for TODAY (for this snapshot)
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const pleasTodaySnap = await db
      .collection(`organizations/${orgId}/pleas`)
      .where("status", "==", "approved")
      .where("createdAt", ">=", startOfToday)
      .where("createdAt", "<=", now)
      .get();

    const reachOutsToday = pleasTodaySnap.size;

    // Count replies created today (to ANY plea, not just today's pleas)
    let repliesToday = 0;
    const allCurrentPleasSnap = await db
      .collection(`organizations/${orgId}/pleas`)
      .where("status", "==", "approved")
      .get();

    for (const pleaDoc of allCurrentPleasSnap.docs) {
      const encouragementsTodaySnap = await db
        .collection(`organizations/${orgId}/pleas/${pleaDoc.id}/encouragements`)
        .where("status", "==", "approved")
        .where("createdAt", ">=", startOfToday)
        .where("createdAt", "<=", now)
        .get();
      repliesToday += encouragementsTodaySnap.size;
    }

    const snapshot = {
      timestamp: now.toISOString(),
      totalActiveUsers,
      reachOutsThisMonth,
      totalReachOuts,
      avgRepliesPerReachOut,
      percentPleasWithReply,
      activePartnerships,
      percentUsersReachedOut,
      avgResponseTimeHours,
      checkInCompletionRate,
      reachOutsToday,
      repliesToday,
    };

    await db
      .doc(`organizations/${orgId}/analytics/snapshots`)
      .collection("data")
      .doc(now.toISOString())
      .set(snapshot);

    console.log(`✅ Snapshot stored for org ${orgId}`);

    // ========================================================================
    // BUILD HISTORICAL DATA FROM SNAPSHOTS
    // ========================================================================

    // Fetch all snapshots, ordered by timestamp
    const snapshotsSnap = await db
      .collection(`organizations/${orgId}/analytics`)
      .doc("snapshots")
      .collection("data")
      .orderBy("timestamp", "desc")
      .get(); // No limit - read all snapshots for true "all time" historical data

    const snapshots = snapshotsSnap.docs.map((doc) => doc.data());

    // Build sparklines (last 7 snapshots = last ~42 hours)
    const sparklineSnapshots = snapshots.slice(0, 7);
    const sparklines = {
      totalActiveUsers: sparklineSnapshots.map((s) => ({
        value: s.totalActiveUsers || 0,
      })),
      reachOutsThisMonth: sparklineSnapshots.map((s) => ({
        value: s.reachOutsThisMonth || 0,
      })),
      totalReachOuts: sparklineSnapshots.map((s) => ({
        value: s.totalReachOuts || 0,
      })),
      avgRepliesPerReachOut: sparklineSnapshots.map((s) => ({
        value: s.avgRepliesPerReachOut || 0,
      })),
      percentPleasWithReply: sparklineSnapshots.map((s) => ({
        value: s.percentPleasWithReply || 0,
      })),
      activePartnerships: sparklineSnapshots.map((s) => ({
        value: s.activePartnerships || 0,
      })),
      percentUsersReachedOut: sparklineSnapshots.map((s) => ({
        value: s.percentUsersReachedOut || 0,
      })),
      avgResponseTimeHours: sparklineSnapshots.map((s) => ({
        value: s.avgResponseTimeHours || 0,
      })),
      checkInCompletionRate: sparklineSnapshots.map((s) => ({
        value: s.checkInCompletionRate || 0,
      })),
    };

    // ========================================================================
    // CALCULATE TRENDS (compare current to oldest sparkline value)
    // ========================================================================

    function calculateTrend(currentValue, sparklineData) {
      if (!sparklineData || sparklineData.length < 2) {
        return null;
      }

      // Compare to oldest value (last item in sparkline since newest is first)
      const oldValue = sparklineData[sparklineData.length - 1].value;

      if (oldValue === 0) {
        return null;
      }

      const percentChange = ((currentValue - oldValue) / oldValue) * 100;

      return {
        value: Math.abs(Math.round(percentChange)),
        isPositive: percentChange >= 0,
      };
    }

    const trends = {
      totalActiveUsers: calculateTrend(
        totalActiveUsers,
        sparklines.totalActiveUsers
      ),
      reachOutsThisMonth: calculateTrend(
        reachOutsThisMonth,
        sparklines.reachOutsThisMonth
      ),
      totalReachOuts: calculateTrend(totalReachOuts, sparklines.totalReachOuts),
      avgRepliesPerReachOut: calculateTrend(
        avgRepliesPerReachOut,
        sparklines.avgRepliesPerReachOut
      ),
      percentPleasWithReply: calculateTrend(
        percentPleasWithReply,
        sparklines.percentPleasWithReply
      ),
      activePartnerships: calculateTrend(
        activePartnerships,
        sparklines.activePartnerships
      ),
      percentUsersReachedOut: calculateTrend(
        percentUsersReachedOut,
        sparklines.percentUsersReachedOut
      ),
      avgResponseTimeHours: calculateTrend(
        avgResponseTimeHours,
        sparklines.avgResponseTimeHours
      ),
      checkInCompletionRate: calculateTrend(
        checkInCompletionRate,
        sparklines.checkInCompletionRate
      ),
    };

    // Build historical ranges from snapshots
    function buildHistoricalRange(snapshots, metricKey) {
      if (snapshots.length === 0) {
        return {
          "7d": [],
          "30d": [],
          "90d": [],
          all: [],
        };
      }

      // Helper to format date based on time range
      function formatDate(timestamp, range) {
        const date = new Date(timestamp);
        if (range === "7d") {
          // For 7 days: show day of week + date (e.g., "Mon 1/13")
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          return `${days[date.getDay()]} ${
            date.getMonth() + 1
          }/${date.getDate()}`;
        } else if (range === "30d") {
          // For 30 days: show date (e.g., "1/13")
          return `${date.getMonth() + 1}/${date.getDate()}`;
        } else {
          // For 90d and all: show month/day (e.g., "Jan 13")
          const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          return `${months[date.getMonth()]} ${date.getDate()}`;
        }
      }

      // Helper to sample data points
      function sampleData(data, targetPoints) {
        if (data.length <= targetPoints) {
          return data;
        }

        const step = data.length / targetPoints;
        const sampled = [];

        for (let i = 0; i < targetPoints; i++) {
          const index = Math.floor(i * step);
          sampled.push(data[index]);
        }

        // Always include the last data point
        if (sampled[sampled.length - 1] !== data[data.length - 1]) {
          sampled.push(data[data.length - 1]);
        }

        return sampled;
      }

      // Get snapshots for different time ranges
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Filter and map snapshots for each range (oldest to newest)
      const sevenDaySnapshots = snapshots
        .filter((s) => new Date(s.timestamp) >= sevenDaysAgo)
        .reverse();

      const thirtyDaySnapshots = snapshots
        .filter((s) => new Date(s.timestamp) >= thirtyDaysAgo)
        .reverse();

      const ninetyDaySnapshots = snapshots
        .filter((s) => new Date(s.timestamp) >= ninetyDaysAgo)
        .reverse();

      const allSnapshots = snapshots.slice().reverse();

      // Sample to appropriate granularity
      // 7d: 1 per day (7 points)
      const sevenDaySampled = sampleData(sevenDaySnapshots, 7);
      const sevenDayData = sevenDaySampled.map((s) => ({
        date: formatDate(s.timestamp, "7d"),
        value: s[metricKey] || 0,
      }));

      // 30d: 1 every 3 days (~10 points)
      const thirtyDaySampled = sampleData(thirtyDaySnapshots, 10);
      const thirtyDayData = thirtyDaySampled.map((s) => ({
        date: formatDate(s.timestamp, "30d"),
        value: s[metricKey] || 0,
      }));

      // 90d: 1 per week (~13 points)
      const ninetyDaySampled = sampleData(ninetyDaySnapshots, 13);
      const ninetyDayData = ninetyDaySampled.map((s) => ({
        date: formatDate(s.timestamp, "90d"),
        value: s[metricKey] || 0,
      }));

      // All: Adaptive sampling based on span
      // If > 180 days, sample to ~20 points; otherwise sample to ~15 points
      const daysSpan = allSnapshots.length / 4; // Rough days (4 snapshots per day)
      const allTargetPoints = daysSpan > 180 ? 20 : 15;
      const allSampled = sampleData(allSnapshots, allTargetPoints);
      const allData = allSampled.map((s) => ({
        date: formatDate(s.timestamp, "all"),
        value: s[metricKey] || 0,
      }));

      return {
        "7d": sevenDayData,
        "30d": thirtyDayData,
        "90d": ninetyDayData,
        all: allData,
      };
    }

    const historical = {
      totalActiveUsers: buildHistoricalRange(snapshots, "totalActiveUsers"),
      reachOutsThisMonth: buildHistoricalRange(snapshots, "reachOutsThisMonth"),
      totalReachOuts: buildHistoricalRange(snapshots, "totalReachOuts"),
      avgRepliesPerReachOut: buildHistoricalRange(
        snapshots,
        "avgRepliesPerReachOut"
      ),
      percentPleasWithReply: buildHistoricalRange(
        snapshots,
        "percentPleasWithReply"
      ),
      activePartnerships: buildHistoricalRange(snapshots, "activePartnerships"),
      percentUsersReachedOut: buildHistoricalRange(
        snapshots,
        "percentUsersReachedOut"
      ),
      avgResponseTimeHours: buildHistoricalRange(
        snapshots,
        "avgResponseTimeHours"
      ),
      activityData: buildActivityData(snapshots),
      sparklines,
    };

    // Build activity data (reach outs & replies per time period)
    function buildActivityData(snapshots) {
      if (snapshots.length === 0) {
        return {
          "7d": [],
          "30d": [],
          "90d": [],
          all: [],
        };
      }

      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

      // Helper to bucket snapshots by day (take one snapshot per day, don't sum duplicates)
      function bucketByDay(snapshots) {
        const buckets = new Map();

        snapshots.forEach((s) => {
          const date = new Date(s.timestamp);
          const dayKey = `${date.getFullYear()}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

          // Only set if not already set (take first snapshot of the day)
          if (!buckets.has(dayKey)) {
            buckets.set(dayKey, {
              date: dayKey,
              reachOuts: s.reachOutsToday || 0,
              replies: s.repliesToday || 0,
            });
          }
        });

        return Array.from(buckets.values()).sort((a, b) =>
          a.date.localeCompare(b.date)
        );
      }

      // Helper to format date for display
      function formatActivityDate(dateStr, range) {
        const date = new Date(dateStr);
        if (range === "7d") {
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          return `${days[date.getDay()]} ${
            date.getMonth() + 1
          }/${date.getDate()}`;
        } else if (range === "30d") {
          return `${date.getMonth() + 1}/${date.getDate()}`;
        } else {
          const months = [
            "Jan",
            "Feb",
            "Mar",
            "Apr",
            "May",
            "Jun",
            "Jul",
            "Aug",
            "Sep",
            "Oct",
            "Nov",
            "Dec",
          ];
          return `${months[date.getMonth()]} ${date.getDate()}`;
        }
      }

      // Get snapshots for each range
      const sevenDaySnaps = snapshots.filter(
        (s) => new Date(s.timestamp) >= sevenDaysAgo
      );
      const thirtyDaySnaps = snapshots.filter(
        (s) => new Date(s.timestamp) >= thirtyDaysAgo
      );
      const ninetyDaySnaps = snapshots.filter(
        (s) => new Date(s.timestamp) >= ninetyDaysAgo
      );
      const allSnaps = snapshots.slice();

      // Bucket by day
      const sevenDayBuckets = bucketByDay(sevenDaySnaps);
      const thirtyDayBuckets = bucketByDay(thirtyDaySnaps);
      const ninetyDayBuckets = bucketByDay(ninetyDaySnaps);
      const allBuckets = bucketByDay(allSnaps);

      // Format for display
      const sevenDayData = sevenDayBuckets.map((b) => ({
        date: formatActivityDate(b.date, "7d"),
        reachOuts: b.reachOuts,
        replies: b.replies,
      }));

      // For 30d, bucket every 3 days
      const thirtyDayData = [];
      for (let i = 0; i < thirtyDayBuckets.length; i += 3) {
        const chunk = thirtyDayBuckets.slice(i, i + 3);
        const totalReachOuts = chunk.reduce((sum, b) => sum + b.reachOuts, 0);
        const totalReplies = chunk.reduce((sum, b) => sum + b.replies, 0);
        thirtyDayData.push({
          date: formatActivityDate(chunk[0].date, "30d"),
          reachOuts: totalReachOuts,
          replies: totalReplies,
        });
      }

      // For 90d, bucket weekly (every 7 days)
      const ninetyDayData = [];
      for (let i = 0; i < ninetyDayBuckets.length; i += 7) {
        const chunk = ninetyDayBuckets.slice(i, i + 7);
        const totalReachOuts = chunk.reduce((sum, b) => sum + b.reachOuts, 0);
        const totalReplies = chunk.reduce((sum, b) => sum + b.replies, 0);
        ninetyDayData.push({
          date: formatActivityDate(chunk[0].date, "90d"),
          reachOuts: totalReachOuts,
          replies: totalReplies,
        });
      }

      // For all, bucket weekly
      const allData = [];
      for (let i = 0; i < allBuckets.length; i += 7) {
        const chunk = allBuckets.slice(i, i + 7);
        const totalReachOuts = chunk.reduce((sum, b) => sum + b.reachOuts, 0);
        const totalReplies = chunk.reduce((sum, b) => sum + b.replies, 0);
        allData.push({
          date: formatActivityDate(chunk[0].date, "all"),
          reachOuts: totalReachOuts,
          replies: totalReplies,
        });
      }

      return {
        "7d": sevenDayData,
        "30d": thirtyDayData,
        "90d": ninetyDayData,
        all: allData,
      };
    }

    // ========================================================================
    // BUILD FINAL ANALYTICS OBJECT
    // ========================================================================

    const analytics = {
      stats: {
        totalActiveUsers,
        reachOutsThisMonth,
        avgRepliesPerReachOut,
        percentPleasWithReply,
        activePartnerships,
        percentUsersReachedOut,
        avgResponseTimeHours,
        checkInCompletionRate,
        checkInsCompleted: totalCheckInsCompleted,
        checkInsPossible: totalCheckInsPossible,
        trends,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      timeSeries: {
        activityData,
        funnelSteps,
        checkInTrendData,
        triggerData,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
      historical: {
        ...historical,
        lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
      },
    };

    console.log(`✅ Analytics calculated for org ${orgId}`);
    return analytics;
  } catch (error) {
    console.error(`❌ Error calculating analytics for org ${orgId}:`, error);
    throw error;
  }
}

/**
 * Write analytics data to Firestore
 */
async function writeAnalytics(orgId, analytics) {
  const db = admin.firestore();

  try {
    // Write to three separate documents
    await db.doc(`organizations/${orgId}/analytics/stats`).set(analytics.stats);
    await db
      .doc(`organizations/${orgId}/analytics/timeSeries`)
      .set(analytics.timeSeries);
    await db
      .doc(`organizations/${orgId}/analytics/historical`)
      .set(analytics.historical);

    console.log(`✅ Analytics written to Firestore for org ${orgId}`);
  } catch (error) {
    console.error(`❌ Error writing analytics for org ${orgId}:`, error);
    throw error;
  }
}

/**
 * Scheduled function - runs every 6 hours for all organizations
 */
exports.calculateOrganizationAnalytics = onSchedule(
  {
    schedule: "0 */6 * * *", // Every 6 hours
    timeZone: "UTC",
  },
  async () => {
    console.log("📊 Starting scheduled analytics calculation for all orgs...");

    try {
      const orgIds = await getAllOrgIds();
      console.log(`Processing ${orgIds.length} organizations`);

      let successCount = 0;
      let errorCount = 0;

      for (const orgId of orgIds) {
        try {
          const analytics = await calculateOrgAnalytics(orgId);
          await writeAnalytics(orgId, analytics);
          successCount++;
        } catch (error) {
          console.error(`Failed to process org ${orgId}:`, error);
          errorCount++;
        }
      }

      console.log(
        `\n✅ Analytics calculation complete: ${successCount} succeeded, ${errorCount} failed`
      );
    } catch (error) {
      console.error("❌ Error in calculateOrganizationAnalytics:", error);
    }
  }
);

/**
 * Test endpoint for manual analytics calculation
 * Usage: GET /testOrganizationAnalytics?orgId=public
 */
exports.testOrganizationAnalytics = onRequest(async (req, res) => {
  try {
    const orgId = req.query.orgId || "public";

    console.log(
      `\n📊 Manual analytics calculation triggered for org: ${orgId}`
    );

    const analytics = await calculateOrgAnalytics(orgId);
    await writeAnalytics(orgId, analytics);

    res.status(200).json({
      success: true,
      orgId,
      message: "Analytics calculated successfully",
      data: {
        stats: analytics.stats,
        timeSeries: analytics.timeSeries,
        // Don't return full historical data in response (too large)
      },
    });
  } catch (error) {
    console.error("❌ Error in testOrganizationAnalytics:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
