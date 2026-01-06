const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onSchedule } = require("firebase-functions/scheduler");
const { onRequest } = require("firebase-functions/https");
const axios = require("axios");
const { admin, getAllOrgIds } = require("../utils/database");

/**
 * Notify mentor when mentee checks in
 */
exports.notifyMentorOnCheckIn = onDocumentWritten(
  "organizations/{orgId}/accountabilityRelationships/{relationshipId}/checkIns/{checkInId}",
  async (event) => {
    const orgId = event.params.orgId;
    const checkIn = event.data?.after?.data();
    if (!checkIn) return;

    const relationshipId = event.params.relationshipId;

    // Get relationship
    const relationshipDoc = await admin
      .firestore()
      .doc(
        `organizations/${orgId}/accountabilityRelationships/${relationshipId}`
      )
      .get();

    if (!relationshipDoc.exists) return;

    const relationship = relationshipDoc.data();
    const mentorUid = relationship.mentorUid;
    const menteeUid = relationship.menteeUid;

    const menteeUserDoc = await admin
      .firestore()
      .doc(`organizations/${orgId}/users/${menteeUid}`)
      .get();

    const menteeTimezone = menteeUserDoc.data()?.timezone;

    if (!menteeTimezone) {
      console.log(
        `❌ No timezone found for mentee ${menteeUid} in org ${orgId}`
      );
      return;
    }

    // Get "today" in mentee's timezone
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: menteeTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = formatter.formatToParts(new Date());
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;

    const todayInMenteeTZ = `${year}-${month}-${day}`;

    // Only notify for a check-in that matches TODAY *in their timezone*
    if (checkIn.date !== todayInMenteeTZ) {
      console.log(
        `⏭️ Skipping notification in org ${orgId}: check-in for ${checkIn.date} != ${todayInMenteeTZ}`
      );
      return;
    }

    // Fetch mentor user
    const mentorDoc = await admin
      .firestore()
      .doc(`organizations/${orgId}/users/${mentorUid}`)
      .get();

    if (!mentorDoc.exists) return;

    const mentorData = mentorDoc.data();

    if (!mentorData.notificationPreferences?.accountability) {
      console.log(
        `🔕 Mentor ${mentorUid} has notifications off in org ${orgId}`
      );
      return;
    }

    if (!mentorData.expoPushToken?.startsWith("ExponentPushToken")) {
      console.log(
        `No valid push token for mentor ${mentorUid} in org ${orgId}`
      );
      return;
    }

    // Build notification based on temptation level
    const getNotificationText = (temptationLevel) => {
      if (temptationLevel <= 2) {
        return "stayed clean and strong today!";
      } else if (temptationLevel <= 4) {
        return "stayed clean but struggled today";
      } else {
        return "checked in - reach out to them";
      }
    };

    const anonymousUsername = `user-${menteeUid.slice(0, 5)}`;

    await axios.post(
      "https://exp.host/--/api/v2/push/send",
      [
        {
          to: mentorData.expoPushToken,
          sound: "default",
          title: "Your partner checked in!",
          body: `${anonymousUsername} ${getNotificationText(
            checkIn.temptationLevel
          )}`,
          data: {
            type: "mentee_checked_in",
            relationshipId,
            temptationLevel: checkIn.temptationLevel,
          },
        },
      ],
      { headers: { "Content-Type": "application/json" } }
    );

    console.log(
      `✅ Sent check-in notification to mentor ${mentorUid} in org ${orgId}`
    );
  }
);

/**
 * Send missed check-in notifications to mentors at 10 AM (mentee's timezone)
 *
 * This scheduled function runs every hour and loops through ALL organizations,
 * checking each org's accountability relationships for missed check-ins.
 */
exports.sendMissedCheckInNotifications = onSchedule(
  {
    schedule: "0 * * * *", // Every hour at minute 0
    timeZone: "UTC",
  },
  async () => {
    console.log(
      "🔔 Running missed check-in notification check for all orgs..."
    );

    try {
      const db = admin.firestore();
      const now = new Date();

      // Get all organization IDs
      const orgIds = await getAllOrgIds();
      console.log(`Processing ${orgIds.length} organizations`);

      let totalNotificationsSent = 0;

      // Loop through each organization
      for (const orgId of orgIds) {
        console.log(`\n--- Processing org: ${orgId} ---`);

        try {
          // Get all active relationships in THIS org
          const relationshipsSnap = await db
            .collection(`organizations/${orgId}/accountabilityRelationships`)
            .where("status", "==", "active")
            .get();

          if (relationshipsSnap.empty) {
            console.log(
              `No active accountability relationships in org ${orgId}.`
            );
            continue;
          }

          const notifications = [];

          for (const relationshipDoc of relationshipsSnap.docs) {
            const relationship = relationshipDoc.data();
            const mentorUid = relationship.mentorUid;
            const menteeUid = relationship.menteeUid;

            // Get MENTEE's timezone
            const menteeDoc = await db
              .doc(`organizations/${orgId}/users/${menteeUid}`)
              .get();
            if (!menteeDoc.exists) continue;

            const menteeData = menteeDoc.data();
            const menteeTimezone = menteeData.timezone;

            if (!menteeTimezone) {
              console.log(
                `Mentee ${menteeUid} has no timezone set in org ${orgId}`
              );
              continue;
            }

            // Calculate current hour in MENTEE's timezone
            const hourFormatter = new Intl.DateTimeFormat("en-US", {
              timeZone: menteeTimezone,
              hour: "numeric",
              hour12: false,
            });

            const menteeHour = parseInt(
              hourFormatter.formatToParts(now).find((p) => p.type === "hour")
                ?.value || "0"
            );

            // Only process if it's 10:00 AM in the MENTEE's timezone
            if (menteeHour !== 10) {
              continue;
            }

            // Get mentor's data
            const mentorDoc = await db
              .doc(`organizations/${orgId}/users/${mentorUid}`)
              .get();
            if (!mentorDoc.exists) continue;

            const mentorData = mentorDoc.data();

            // Skip if no push token or notifications disabled
            if (
              !mentorData.expoPushToken?.startsWith("ExponentPushToken") ||
              !mentorData.notificationPreferences?.accountability
            ) {
              continue;
            }

            // Get today's date in mentee's timezone
            const dateFormatter = new Intl.DateTimeFormat("en-US", {
              timeZone: menteeTimezone,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
            });

            const dateParts = dateFormatter.formatToParts(now);
            const todayYear = dateParts.find((p) => p.type === "year")?.value;
            const todayMonth = dateParts.find((p) => p.type === "month")?.value;
            const todayDay = dateParts.find((p) => p.type === "day")?.value;
            const todayDate = `${todayYear}-${todayMonth}-${todayDay}`;

            // Calculate yesterday in mentee's timezone
            const menteeToday = new Date(
              parseInt(todayYear),
              parseInt(todayMonth) - 1,
              parseInt(todayDay)
            );
            const menteeYesterday = new Date(menteeToday);
            menteeYesterday.setDate(menteeYesterday.getDate() - 1);
            const yesterdayYear = menteeYesterday.getFullYear();
            const yesterdayMonth = String(
              menteeYesterday.getMonth() + 1
            ).padStart(2, "0");
            const yesterdayDay = String(menteeYesterday.getDate()).padStart(
              2,
              "0"
            );
            const yesterdayDate = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;

            // Check if we already sent this notification today
            const lastNotificationKey = `lastMissedCheckInNotification_${relationshipDoc.id}`;
            const lastNotificationDate = mentorData[lastNotificationKey];

            if (lastNotificationDate === todayDate) {
              console.log(
                `Already sent missed check-in notification to ${mentorUid} today for relationship ${relationshipDoc.id} in org ${orgId}.`
              );
              continue;
            }

            const lastCheckIn = relationship.lastCheckIn;

            // Did they check in yesterday?
            if (lastCheckIn === yesterdayDate) {
              console.log(
                `${menteeUid} checked in yesterday (${yesterdayDate}) in org ${orgId}, no notification needed.`
              );
              continue;
            }

            // Calculate days since last check-in
            let daysSinceCheckIn = 0;
            if (lastCheckIn) {
              const lastCheckInDate = new Date(lastCheckIn);
              const today = new Date(todayDate);
              const diffTime = today - lastCheckInDate;
              daysSinceCheckIn = Math.floor(diffTime / (1000 * 60 * 60 * 24));
            } else {
              // No check-in ever recorded
              const createdAt = relationship.createdAt?.toDate();
              if (createdAt) {
                const today = new Date(todayDate);
                const diffTime = today - createdAt;
                daysSinceCheckIn = Math.floor(diffTime / (1000 * 60 * 60 * 24));
              }
            }

            // Only notify if mentee has actually missed at least 1 day
            if (daysSinceCheckIn < 1) {
              console.log(
                `${menteeUid} is up to date with check-ins in org ${orgId}.`
              );
              continue;
            }

            // Generate escalating message
            const anonymousUsername = `user-${menteeUid.slice(0, 5)}`;
            let title = "Missed check-in";
            let body = "";

            if (daysSinceCheckIn === 1) {
              body = `${anonymousUsername} missed their daily check in`;
            } else if (daysSinceCheckIn >= 7) {
              body = `${anonymousUsername} hasn't checked in for over a week`;
            } else {
              body = `${anonymousUsername} hasn't checked in for ${daysSinceCheckIn} days`;
            }

            notifications.push({
              to: mentorData.expoPushToken,
              sound: "default",
              title: title,
              body: body,
              data: {
                type: "mentee_missed_checkin",
                relationshipId: relationshipDoc.id,
                daysSinceCheckIn: daysSinceCheckIn,
              },
            });

            // Mark that we sent this notification today
            await db.doc(`organizations/${orgId}/users/${mentorUid}`).update({
              [lastNotificationKey]: todayDate,
            });

            console.log(
              `✅ Queued missed check-in notification for mentor ${mentorUid} in org ${orgId} (${daysSinceCheckIn} days since check-in)`
            );
          }

          // Send notifications for this org in batches
          if (notifications.length > 0) {
            const batchSize = 100;
            for (let i = 0; i < notifications.length; i += batchSize) {
              const chunk = notifications.slice(i, i + batchSize);
              const res = await axios.post(
                "https://exp.host/--/api/v2/push/send",
                chunk,
                { headers: { "Content-Type": "application/json" } }
              );
              console.log(
                `✅ Sent batch of ${chunk.length} for org ${orgId}:`,
                res.data?.data
              );
            }
            console.log(
              `✅ Missed check-in notifications sent for org ${orgId}: ${notifications.length}`
            );
            totalNotificationsSent += notifications.length;
          } else {
            console.log(
              `No missed check-in notifications to send for org ${orgId} this hour.`
            );
          }
        } catch (orgError) {
          // Log error but continue with other orgs
          console.error(`❌ Error processing org ${orgId}:`, orgError);
        }
      }

      console.log(
        `\n✅ Total missed check-in notifications sent across all orgs: ${totalNotificationsSent}`
      );
    } catch (error) {
      console.error("❌ Error in sendMissedCheckInNotifications:", error);
    }
  }
);

/**
 * Test endpoint for missed check-in notification
 * Usage: GET /testMissedCheckInNotification?orgId=public&relationshipId=abc123
 */
exports.testMissedCheckInNotification = onRequest(async (req, res) => {
  try {
    const orgId = req.query.orgId || "public";
    const relationshipId = req.query.relationshipId;

    if (!relationshipId) return res.status(400).send("Missing relationshipId");

    const db = admin.firestore();

    const relDoc = await db
      .doc(
        `organizations/${orgId}/accountabilityRelationships/${relationshipId}`
      )
      .get();

    if (!relDoc.exists) return res.send("Relationship not found");

    const rel = relDoc.data();

    const mentorUid = rel.mentorUid;
    const menteeUid = rel.menteeUid;

    // Get mentee's timezone
    const menteeDoc = await db
      .doc(`organizations/${orgId}/users/${menteeUid}`)
      .get();
    if (!menteeDoc.exists) return res.send("Mentee user not found");

    const menteeTimezone = menteeDoc.data()?.timezone;

    if (!menteeTimezone) return res.send("Mentee has no timezone set");

    const mentorDoc = await db
      .doc(`organizations/${orgId}/users/${mentorUid}`)
      .get();
    if (!mentorDoc.exists) return res.send("Mentor user not found");

    const mentor = mentorDoc.data();

    if (!mentor.notificationPreferences?.accountability)
      return res.send("Mentor has notifications OFF");

    if (!mentor.expoPushToken) return res.send("Mentor has no push token");

    const now = new Date();

    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: menteeTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const parts = dateFormatter.formatToParts(now);
    const todayYear = parts.find((p) => p.type === "year")?.value;
    const todayMonth = parts.find((p) => p.type === "month")?.value;
    const todayDay = parts.find((p) => p.type === "day")?.value;
    const todayDate = `${todayYear}-${todayMonth}-${todayDay}`;

    const menteeToday = new Date(
      parseInt(todayYear),
      parseInt(todayMonth) - 1,
      parseInt(todayDay)
    );
    const menteeYesterday = new Date(menteeToday);
    menteeYesterday.setDate(menteeYesterday.getDate() - 1);

    const yesterdayDate = `${menteeYesterday.getFullYear()}-${String(
      menteeYesterday.getMonth() + 1
    ).padStart(2, "0")}-${String(menteeYesterday.getDate()).padStart(2, "0")}`;

    const lastCheckIn = rel.lastCheckIn;

    // Calculate days since check-in
    let daysSinceCheckIn = 0;
    if (lastCheckIn) {
      const lastCheckInDate = new Date(lastCheckIn);
      const today = new Date(todayDate);
      const diffTime = today - lastCheckInDate;
      daysSinceCheckIn = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    }

    const missed = lastCheckIn !== yesterdayDate;
    const anon = "user-" + menteeUid.slice(0, 5);

    let body = "";
    if (daysSinceCheckIn === 1) {
      body = `${anon} hasn't checked in for 1 day`;
    } else if (daysSinceCheckIn >= 7) {
      body = `${anon} hasn't checked in for over a week`;
    } else {
      body = `${anon} hasn't checked in for ${daysSinceCheckIn} days`;
    }

    const message = {
      to: mentor.expoPushToken,
      sound: "default",
      title: "Missed check-in",
      body,
      data: {
        type: "mentee_missed_checkin",
        relationshipId: relDoc.id,
        daysSinceCheckIn,
      },
    };

    await axios.post("https://exp.host/--/api/v2/push/send", [message], {
      headers: { "Content-Type": "application/json" },
    });

    return res.send({
      status: "OK",
      sentTo: mentorUid,
      orgId: orgId,
      missedYesterday: missed,
      daysSinceCheckIn,
      message,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error: " + err.toString());
  }
});
