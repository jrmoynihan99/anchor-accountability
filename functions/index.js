// Load environment variables from .env file
require("dotenv").config();

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const { onSchedule } = require("firebase-functions/scheduler");
const {
  onDocumentCreated,
  onDocumentUpdated,
  onDocumentDeleted,
  onDocumentWritten,
} = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const { OpenAI } = require("openai");
const admin = require("firebase-admin");
const axios = require("axios");

// Initialize Firebase Admin
admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to format date as YYYY-MM-DD
const formatDate = (date) => {
  return date.toISOString().split("T")[0];
};

// Helper function to get date with offset
const getDateWithOffset = (offsetDays) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offsetDays);
  return date;
};

// MODIFY THIS: Enhanced generate daily content function
const generateDailyContent = async (targetDate) => {
  // 1. Get recent used verses
  const recentSnapshot = await admin
    .firestore()
    .collection("dailyContent")
    .orderBy("date", "desc")
    .limit(6)
    .get();

  const usedRefs = new Set();
  recentSnapshot.forEach((doc) => {
    const d = doc.data();
    if (d.reference) usedRefs.add(d.reference);
    if (d.chapterReference) usedRefs.add(d.chapterReference);
  });

  // 2. Get all bible verses, filter out recently used
  const bibleVersesSnap = await admin
    .firestore()
    .collection("bibleVerses")
    .get();
  const candidates = bibleVersesSnap.docs
    .map((doc) => doc.data())
    .filter(
      (d) => !usedRefs.has(d.reference) && !usedRefs.has(d.chapterReference)
    );

  if (!candidates.length)
    throw new Error("No eligible bible verses found for today.");

  const picked = candidates[Math.floor(Math.random() * candidates.length)];

  // 3. Generate prayer content with GPT
  const gptPrompt = `
Here is today's Bible verse:

"${picked.verse}"
(${picked.reference})

Write a 2-3 sentence prayer, rooted in biblical Christian faith, that is encouraging and specifically connects to this verse and its themes. Respond ONLY with the prayer text, no intro or outro.
  `;

  const gptResponse = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a Christian devotional writer. Write encouraging, biblically grounded prayers.",
      },
      { role: "user", content: gptPrompt },
    ],
    max_tokens: 120,
    temperature: 0.7,
  });

  const prayerContent = gptResponse.choices[0].message.content.trim();

  // 4. Save to Firestore
  const newContent = {
    date: targetDate,
    bibleVersion: picked.bibleVersion,
    chapterReference: picked.chapterReference,
    chapterText: picked.chapterText,
    reference: picked.reference,
    verse: picked.verse,
    prayerContent,
  };

  await admin
    .firestore()
    .collection("dailyContent")
    .doc(targetDate)
    .set(newContent);

  return newContent;
};

// EXISTING FUNCTIONS (unchanged)
exports.testGenerateContent = onRequest(async (request, response) => {
  try {
    logger.info("Manual content generation test triggered");

    const targetDate = request.query.date || formatDate(new Date());
    const content = await generateDailyContent(targetDate);

    // Show the content but don't save it to database
    response.json({
      success: true,
      message: "Content generated successfully (test mode - not saved)",
      content: content,
      targetDate: targetDate,
    });
  } catch (error) {
    logger.error("Error in test content generation:", error);
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

exports.updatePrompt = onRequest(async (request, response) => {
  try {
    const { prompt } = request.body;

    if (!prompt) {
      return response.status(400).json({
        success: false,
        error: "Prompt is required",
      });
    }

    await admin.firestore().collection("config").doc("dailyContentPrompt").set({
      prompt: prompt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    response.json({
      success: true,
      message: "Prompt updated successfully",
    });
  } catch (error) {
    logger.error("Error updating prompt:", error);
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

exports.createContentNow = onRequest(async (request, response) => {
  try {
    logger.info("Manual content creation triggered");

    const dateString = request.query.date || formatDate(getDateWithOffset(2));

    logger.info(`Creating enhanced content for ${dateString}`);

    const content = await generateDailyContent(dateString);

    await admin
      .firestore()
      .collection("dailyContent")
      .doc(dateString)
      .set(content);

    logger.info(`Successfully created enhanced content for ${dateString}`);

    response.json({
      success: true,
      message: `Enhanced content created for ${dateString}`,
      content: content,
      firebaseUrl: `https://console.firebase.google.com/project/accountability-app-a7767/firestore/data/dailyContent/${dateString}`,
    });
  } catch (error) {
    logger.error("Error creating content:", error);
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

exports.generateDailyContentScheduled = onSchedule(
  "0 2 * * *",
  async (context) => {
    logger.info("Starting scheduled daily content generation...");

    try {
      const targetDate = getDateWithOffset(2);
      const dateString = formatDate(targetDate);

      logger.info(`Generating enhanced content for ${dateString}`);

      const content = await generateDailyContent(dateString);

      await admin
        .firestore()
        .collection("dailyContent")
        .doc(dateString)
        .set(content);

      logger.info(`Successfully created enhanced content for ${dateString}`);
      logger.info("Scheduled content generation completed successfully");
    } catch (error) {
      logger.error("Error in scheduled content generation:", error);
      throw error;
    }
  }
);

// --- HELP NOTIFICATIONS --- //

// When a plea is created and immediately approved
exports.sendHelpNotification = onDocumentCreated(
  "pleas/{pleaId}",
  async (event) => {
    const snap = event.data;
    const plea = snap?.data();

    // Only notify for approved pleas
    if (!plea || plea.status !== "approved") return;

    await sendHelpNotificationToHelpers(plea, snap.id);
  }
);

// When a plea's status changes to approved
exports.sendHelpNotificationOnApprove = onDocumentUpdated(
  "pleas/{pleaId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status !== "approved" && after.status === "approved") {
      await sendHelpNotificationToHelpers(after, event.params.pleaId);
    }
  }
);

// Helper function (use for both triggers) - UPDATE THIS
// --- HELP NOTIFICATIONS (updated with block checks) ---
async function sendHelpNotificationToHelpers(plea, pleaId) {
  const { message, uid } = plea || {}; // uid = plea author

  try {
    // Only users who opted in for plea notifications
    const usersSnap = await admin
      .firestore()
      .collection("users")
      .where("notificationPreferences.pleas", "==", true)
      .get();

    const tokenPairs = [];

    usersSnap.forEach((doc) => {
      const data = doc.data();

      if (
        data.expoPushToken &&
        typeof data.expoPushToken === "string" &&
        data.expoPushToken.startsWith("ExponentPushToken")
      ) {
        // Don't notify the sender of the plea
        if (doc.id === uid) return;

        tokenPairs.push({ token: data.expoPushToken, helperUid: doc.id });
      }
    });

    if (tokenPairs.length === 0) {
      console.log("No users opted in for plea notifications.");
      return;
    }

    // Filter out helpers that are blocked either direction
    const notifications = [];
    for (const { token, helperUid } of tokenPairs) {
      const blocked = await eitherBlocked(uid, helperUid);
      if (blocked) {
        console.log(`[help] Skipping blocked pair ${uid} <-> ${helperUid}`);
        continue;
      }

      notifications.push({
        to: token,
        sound: "default",
        title: "Someone is struggling",
        body: message?.length
          ? `They wrote: "${message.slice(0, 100)}"`
          : "They need encouragement. Tap to respond.",
        data: {
          pleaId,
          type: "plea",
        },
      });
    }

    if (notifications.length === 0) {
      console.log("No eligible helpers after block filtering.");
      return;
    }

    // Send in batches of 100
    const batchSize = 100;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const chunk = notifications.slice(i, i + batchSize);
      const res = await axios.post(
        "https://exp.host/--/api/v2/push/send",
        chunk,
        { headers: { "Content-Type": "application/json" } }
      );
      console.log(`✅ Sent batch of ${chunk.length}:`, res.data?.data);
    }

    console.log(`✅ Notifications sent to ${notifications.length} helpers.`);
  } catch (err) {
    console.error("❌ Failed to send plea notifications:", err);
  }
}

// --- ENCOURAGEMENT NOTIFICATIONS --- //

// When an encouragement is created and immediately approved
exports.sendEncouragementNotification = onDocumentCreated(
  "pleas/{pleaId}/encouragements/{encId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const encouragement = snap.data();

    // Only notify for approved encouragements
    if (encouragement.status !== "approved") return;

    const pleaRef = snap.ref.parent.parent;
    const pleaDoc = await pleaRef.get();
    if (!pleaDoc.exists) return;
    const plea = pleaDoc.data();

    // Skip if blocked either direction
    if (await eitherBlocked(plea.uid, encouragement.helperUid)) {
      console.log(
        `[encouragement:create] Skipping due to block between ${plea.uid} and ${encouragement.helperUid}`
      );
      return;
    }

    // Increment unread count
    await pleaRef.update({
      unreadEncouragementCount: admin.firestore.FieldValue.increment(1),
    });

    await sendEncouragementNotificationToPleaOwner(pleaRef, encouragement);
  }
);

// When an encouragement's status changes to approved
exports.sendEncouragementNotificationOnApprove = onDocumentUpdated(
  "pleas/{pleaId}/encouragements/{encId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Only trigger when newly approved
    if (before.status !== "approved" && after.status === "approved") {
      const pleaRef = event.data.after.ref.parent.parent;
      const pleaDoc = await pleaRef.get();
      if (!pleaDoc.exists) return;
      const plea = pleaDoc.data();

      // Skip if blocked either direction
      if (await eitherBlocked(plea.uid, after.helperUid)) {
        console.log(
          `[encouragement:approve] Skipping due to block between ${plea.uid} and ${after.helperUid}`
        );
        return;
      }

      // Increment unread count
      await pleaRef.update({
        unreadEncouragementCount: admin.firestore.FieldValue.increment(1),
      });

      await sendEncouragementNotificationToPleaOwner(pleaRef, after);
    }
  }
);

// Helper function for encouragement notifications - UPDATE THIS
async function sendEncouragementNotificationToPleaOwner(
  pleaRef,
  encouragement
) {
  // Find the parent plea
  const pleaDoc = await pleaRef.get();
  if (!pleaDoc.exists) return;
  const plea = pleaDoc.data();

  // Don't notify the sender of the encouragement
  if (plea.uid === encouragement.helperUid) return;

  // Fetch the user who created the plea
  const userDoc = await admin
    .firestore()
    .collection("users")
    .doc(plea.uid)
    .get();
  const user = userDoc.data();

  // Only notify if they want encouragement notifications and have a token
  if (user?.expoPushToken && user?.notificationPreferences?.encouragements) {
    const totalUnread = await getTotalUnreadForUser(plea.uid);

    const notification = {
      to: user.expoPushToken,
      sound: "default",
      title: "Someone encouraged you!",
      body: encouragement.message?.length
        ? `"${encouragement.message.slice(0, 100)}"`
        : "Someone sent encouragement. Tap to view.",
      badge: totalUnread, // <-- add this!
      data: {
        pleaId: pleaRef.id,
        type: "encouragement",
      },
    };

    try {
      await axios.post("https://exp.host/--/api/v2/push/send", [notification], {
        headers: { "Content-Type": "application/json" },
      });
      console.log(
        `✅ Encouragement notification sent to ${user.expoPushToken}`
      );
    } catch (err) {
      console.error("❌ Failed to send encouragement notification:", err);
    }
  }
}

// This triggers on every new message in a thread
exports.sendMessageNotification = onDocumentCreated(
  "threads/{threadId}/messages/{messageId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const message = snap.data();
    const { senderUid, text } = message;
    const { threadId } = event.params;

    // Fetch the thread to find participants
    const threadDoc = await admin
      .firestore()
      .collection("threads")
      .doc(threadId)
      .get();
    if (!threadDoc.exists) return;

    const thread = threadDoc.data();
    const userA = thread.userA;
    const userB = thread.userB;

    // Determine recipients (everyone except sender)
    const recipients = [userA, userB].filter((uid) => uid !== senderUid);
    const senderName = `user-${senderUid.substring(0, 5)}`;

    for (const recipientUid of recipients) {
      // Check if users have blocked each other
      const blocked = await eitherBlocked(senderUid, recipientUid);
      if (blocked) {
        console.log(
          `[message] Skipping notify for blocked pair ${senderUid} <-> ${recipientUid}`
        );
        continue;
      }

      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(recipientUid)
        .get();
      if (!userDoc.exists) continue;

      const userData = userDoc.data();
      const wantsMessages = userData.notificationPreferences?.messages ?? true;
      const expoPushToken = userData.expoPushToken;

      if (
        wantsMessages &&
        expoPushToken &&
        expoPushToken.startsWith("ExponentPushToken")
      ) {
        try {
          const totalUnread = await getTotalUnreadForUser(recipientUid);

          await axios.post(
            "https://exp.host/--/api/v2/push/send",
            [
              {
                to: expoPushToken,
                sound: "default",
                title: senderName,
                body: text && text.length ? text.slice(0, 100) : "",
                badge: totalUnread, // iOS badge count
                data: {
                  threadId,
                  messageId: snap.id,
                },
              },
            ],
            { headers: { "Content-Type": "application/json" } }
          );

          console.log(`✅ Sent message notification to ${recipientUid}`);
        } catch (err) {
          console.error(
            `❌ Failed to send notification to ${recipientUid}:`,
            err
          );
        }
      }
    }
  }
);

exports.moderatePlea = onDocumentCreated("pleas/{pleaId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const plea = snap.data();
  const message = (plea?.message || "").trim();

  // Log incoming fields
  logger.info(`[moderatePlea] Message: "${message}"`);

  // If message/context is blank, auto-approve
  if (!message) {
    await snap.ref.update({ status: "approved" });
    logger.info(`Plea ${snap.id} has empty context, auto-approved.`);
    return;
  }

  let rejectionReason = null;

  // GPT moderation with Firestore prompt
  let gptFlagged = false;
  try {
    const filteringPrompt = await getFilteringPrompt("plea");
    logger.info(`[moderatePlea] Using prompt: ${filteringPrompt}`);
    const promptText = filteringPrompt.replace("{message}", message);
    logger.info(`[moderatePlea] Sending prompt text: ${promptText}`);
    const gptCheck = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "system", content: promptText }],
      temperature: 0,
      max_tokens: 20, // Enough for our specific responses
    });
    const result = gptCheck.choices[0].message.content.trim();
    logger.info(`[moderatePlea] GPT result: ${result}`);

    if (result !== "ALLOW") {
      gptFlagged = true;
      if (result === "BLOCK: hateful/derogatory") {
        rejectionReason = "Content contains hateful or derogatory language";
      } else if (result === "BLOCK: spam/trolling") {
        rejectionReason = "Content appears to be spam or trolling";
      } else {
        // Fallback for any unexpected responses
        rejectionReason = "Message doesn't align with community guidelines";
      }
    }
  } catch (err) {
    logger.error("GPT moderation failed:", err);
    gptFlagged = true;
    rejectionReason = "Unable to process message at this time";
  }

  const newStatus = gptFlagged ? "rejected" : "approved";
  logger.info(`Moderation result for plea ${snap.id}: ${newStatus}`);

  const updateData = {
    status: newStatus,
    unreadEncouragementCount: 0,
  };

  if (rejectionReason) {
    updateData.rejectionReason = rejectionReason;
  }

  await snap.ref.update(updateData);
});

exports.moderatePleaTEST = onDocumentCreated(
  "pleas_test/{pleaId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const plea = snap.data();
    const message = (plea?.message || "").trim();

    // Log incoming fields
    logger.info(`[moderatePleaTEST] Message: "${message}"`);

    // If message/context is blank, auto-approve
    if (!message) {
      await snap.ref.update({ status: "approved" });
      logger.info(`Plea ${snap.id} has empty context, auto-approved.`);
      return;
    }

    let rejectionReason = null;

    // GPT moderation with Firestore prompt
    let gptFlagged = false;
    try {
      const filteringPrompt = await getFilteringPrompt("pleaTEST");
      logger.info(`[moderatePleaTEST] Using prompt: ${filteringPrompt}`);
      const promptText = filteringPrompt.replace("{message}", message);
      logger.info(`[moderatePleaTEST] Sending prompt text: ${promptText}`);
      const gptCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: promptText }],
        temperature: 0,
        max_tokens: 20, // Enough for our specific responses
      });
      const result = gptCheck.choices[0].message.content.trim();
      logger.info(`[moderatePleaTEST] GPT result: ${result}`);

      if (result !== "ALLOW") {
        gptFlagged = true;
        if (result === "BLOCK: hateful/derogatory") {
          rejectionReason = "Content contains hateful or derogatory language";
        } else if (result === "BLOCK: spam/trolling") {
          rejectionReason = "Content appears to be spam or trolling";
        } else {
          // Fallback for any unexpected responses
          rejectionReason = "Message doesn't align with community guidelines";
        }
      }
    } catch (err) {
      logger.error("GPT moderation failed:", err);
      gptFlagged = true;
      rejectionReason = "Unable to process message at this time";
    }

    const newStatus = gptFlagged ? "rejected" : "approved";
    logger.info(`Moderation result for plea ${snap.id}: ${newStatus}`);

    const updateData = {
      status: newStatus,
      unreadEncouragementCount: 0,
    };

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await snap.ref.update(updateData);
  }
);

exports.moderateEncouragement = onDocumentCreated(
  "pleas/{pleaId}/encouragements/{encId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const encouragement = snap.data();
    const message = (encouragement?.message || "").trim();

    let rejectionReason = null;

    // If blank, auto-reject
    if (!message) {
      await snap.ref.update({
        status: "rejected",
        rejectionReason: "Message cannot be empty",
      });
      logger.info(`Encouragement ${snap.id} was blank, auto-rejected.`);
      return;
    }

    // Fetch the original plea for context
    const pleaId = event.params.pleaId;
    let originalPlea = "";

    try {
      logger.info(`Fetching plea document: pleas/${pleaId}`);
      const pleaSnap = await admin.firestore().doc(`pleas/${pleaId}`).get();

      if (!pleaSnap.exists) {
        logger.error(`Plea document ${pleaId} does not exist`);
        originalPlea = "(Original plea not found)";
      } else {
        const pleaData = pleaSnap.data();
        originalPlea = pleaData?.message || "(No message in plea)";
        logger.info(
          `Successfully fetched plea message: ${originalPlea.substring(
            0,
            50
          )}...`
        );
      }
    } catch (err) {
      logger.error("Failed to fetch original plea:", err);
      originalPlea = "(Unable to retrieve original plea)";
    }

    // GPT moderation with Firestore prompt and context
    let gptFlagged = false;
    try {
      const filteringPrompt = await getFilteringPrompt("encouragement");
      logger.info(`[moderateEncouragement] Using prompt: ${filteringPrompt}`);

      const promptText = filteringPrompt
        .replace("{originalPlea}", originalPlea)
        .replace("{message}", message);

      logger.info(`[moderateEncouragement] Sending prompt text: ${promptText}`);

      const gptCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: promptText }],
        temperature: 0,
        max_tokens: 30,
      });

      const result = gptCheck.choices[0].message.content.trim();
      logger.info(`[moderateEncouragement] GPT result: ${result}`);

      const cleanResult = result.toLowerCase().trim();
      logger.info(`[moderateEncouragement] Clean result: "${cleanResult}"`);

      if (cleanResult !== "allow") {
        gptFlagged = true;

        // Match the actual BLOCK format from the prompt
        if (
          cleanResult.includes("hateful") ||
          cleanResult.includes("derogatory")
        ) {
          rejectionReason = "Content contains hateful or derogatory language";
        } else if (
          cleanResult.includes("spam") ||
          cleanResult.includes("trolling")
        ) {
          rejectionReason = "Content appears to be spam or trolling";
        } else {
          // Fallback for any unexpected responses
          rejectionReason = "Message doesn't align with community guidelines";
        }
      }
    } catch (err) {
      logger.error("GPT moderation failed:", err);
      gptFlagged = true;
      rejectionReason = "Unable to process message at this time";
    }

    const newStatus = gptFlagged ? "rejected" : "approved";
    logger.info(`Moderation result for encouragement ${snap.id}: ${newStatus}`);

    const updateData = {
      status: newStatus,
    };

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await snap.ref.update(updateData);
  }
);

exports.moderateEncouragementTEST = onDocumentCreated(
  "pleas_test/{pleaId}/encouragements/{encId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const encouragement = snap.data();
    const message = (encouragement?.message || "").trim();

    let rejectionReason = null;

    // If blank, auto-reject
    if (!message) {
      await snap.ref.update({
        status: "rejected",
        rejectionReason: "Message cannot be empty",
      });
      logger.info(`Encouragement ${snap.id} was blank, auto-rejected.`);
      return;
    }

    // Fetch the original plea for context
    const pleaId = event.params.pleaId;
    let originalPlea = "";

    try {
      logger.info(`Fetching plea document: pleas_test/${pleaId}`);
      const pleaSnap = await admin
        .firestore()
        .doc(`pleas_test/${pleaId}`)
        .get();

      if (!pleaSnap.exists) {
        logger.error(`Plea document ${pleaId} does not exist`);
        originalPlea = "(Original plea not found)";
      } else {
        const pleaData = pleaSnap.data();
        originalPlea = pleaData?.message || "(No message in plea)";
        logger.info(
          `Successfully fetched plea message: ${originalPlea.substring(
            0,
            50
          )}...`
        );
      }
    } catch (err) {
      logger.error("Failed to fetch original plea:", err);
      originalPlea = "(Unable to retrieve original plea)";
    }

    // GPT moderation with Firestore prompt and context
    let gptFlagged = false;
    try {
      const filteringPrompt = await getFilteringPrompt("encouragementTEST");
      logger.info(
        `[moderateEncouragementTEST] Using prompt: ${filteringPrompt}`
      );

      const promptText = filteringPrompt
        .replace("{originalPlea}", originalPlea)
        .replace("{message}", message);

      logger.info(
        `[moderateEncouragementTEST] Sending prompt text: ${promptText}`
      );

      const gptCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: promptText }],
        temperature: 0,
        max_tokens: 30,
      });

      const result = gptCheck.choices[0].message.content.trim();
      logger.info(`[moderateEncouragementTEST] GPT result: ${result}`);

      const cleanResult = result.toLowerCase().trim();
      logger.info(`[moderateEncouragementTEST] Clean result: "${cleanResult}"`);

      if (cleanResult !== "allow") {
        gptFlagged = true;

        // Match the actual BLOCK format from the prompt
        if (
          cleanResult.includes("hateful") ||
          cleanResult.includes("derogatory")
        ) {
          rejectionReason = "Content contains hateful or derogatory language";
        } else if (
          cleanResult.includes("spam") ||
          cleanResult.includes("trolling")
        ) {
          rejectionReason = "Content appears to be spam or trolling";
        } else {
          // Fallback for any unexpected responses
          rejectionReason = "Message doesn't align with community guidelines";
        }
      }
    } catch (err) {
      logger.error("GPT moderation failed:", err);
      gptFlagged = true;
      rejectionReason = "Unable to process message at this time";
    }

    const newStatus = gptFlagged ? "rejected" : "approved";
    logger.info(`Moderation result for encouragement ${snap.id}: ${newStatus}`);

    const updateData = {
      status: newStatus,
    };

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await snap.ref.update(updateData);
  }
);

exports.moderatePost = onDocumentCreated(
  "communityPosts/{postId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const post = snap.data();
    const title = (post?.title || "").trim();
    const content = (post?.content || "").trim();

    let rejectionReason = null;

    // Log incoming fields
    logger.info(`[moderatePost] Title: "${title}" | Content: "${content}"`);

    // If both fields are blank, auto-reject
    if (!title && !content) {
      await snap.ref.update({
        status: "rejected",
        rejectionReason: "Post cannot be empty",
      });
      logger.info(`Post ${snap.id} was blank, auto-rejected.`);
      return;
    }

    // GPT moderation using prompt with title + content
    let gptFlagged = false;
    try {
      const filteringPrompt = await getFilteringPrompt("post");
      logger.info(`[moderatePost] Using prompt: ${filteringPrompt}`);

      const promptText = filteringPrompt
        .replace("{title}", title)
        .replace("{content}", content);

      logger.info(`[moderatePost] Prompt text: ${promptText}`);

      const gptCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: promptText }],
        temperature: 0,
        max_tokens: 30,
      });

      const result = gptCheck.choices[0].message.content.trim();
      logger.info(`[moderatePost] GPT result: ${result}`);

      const clean = result.toLowerCase().trim();
      logger.info(`[moderatePost] Clean result: "${clean}"`);

      if (clean !== "allow") {
        gptFlagged = true;

        if (clean.includes("hateful") || clean.includes("derogatory")) {
          rejectionReason = "Content contains hateful or derogatory language";
        } else if (clean.includes("spam") || clean.includes("trolling")) {
          rejectionReason = "Content appears to be spam or trolling";
        } else {
          rejectionReason = "Post doesn't align with community guidelines";
        }
      }
    } catch (err) {
      logger.error("GPT moderation failed:", err);
      gptFlagged = true;
      rejectionReason = "Unable to process post at this time";
    }

    const newStatus = gptFlagged ? "rejected" : "approved";
    logger.info(`Moderation result for post ${snap.id}: ${newStatus}`);

    const updateData = { status: newStatus };
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    await snap.ref.update(updateData);
  }
);

exports.moderatePostTEST = onDocumentCreated(
  "communityPosts_test/{postId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const post = snap.data();
    const title = (post?.title || "").trim();
    const content = (post?.content || "").trim();

    let rejectionReason = null;

    // Log incoming fields
    logger.info(`[moderatePostTEST] Title: "${title}" | Content: "${content}"`);

    // If both fields are blank, auto-reject
    if (!title && !content) {
      await snap.ref.update({
        status: "rejected",
        rejectionReason: "Post cannot be empty",
      });
      logger.info(`Post ${snap.id} was blank, auto-rejected.`);
      return;
    }

    // GPT moderation using prompt with title + content
    let gptFlagged = false;
    try {
      const filteringPrompt = await getFilteringPrompt("postTEST");
      logger.info(`[moderatePostTEST] Using prompt: ${filteringPrompt}`);

      const promptText = filteringPrompt
        .replace("{title}", title)
        .replace("{content}", content);

      logger.info(`[moderatePostTEST] Prompt text: ${promptText}`);

      const gptCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: promptText }],
        temperature: 0,
        max_tokens: 30,
      });

      const result = gptCheck.choices[0].message.content.trim();
      logger.info(`[moderatePostTEST] GPT result: ${result}`);

      const clean = result.toLowerCase().trim();
      logger.info(`[moderatePostTEST] Clean result: "${clean}"`);

      if (clean !== "allow") {
        gptFlagged = true;

        if (clean.includes("hateful") || clean.includes("derogatory")) {
          rejectionReason = "Content contains hateful or derogatory language";
        } else if (clean.includes("spam") || clean.includes("trolling")) {
          rejectionReason = "Content appears to be spam or trolling";
        } else {
          rejectionReason = "Post doesn't align with community guidelines";
        }
      }
    } catch (err) {
      logger.error("GPT moderation failed:", err);
      gptFlagged = true;
      rejectionReason = "Unable to process post at this time";
    }

    const newStatus = gptFlagged ? "rejected" : "approved";
    logger.info(`Moderation result for post ${snap.id}: ${newStatus}`);

    const updateData = { status: newStatus };
    if (rejectionReason) updateData.rejectionReason = rejectionReason;

    await snap.ref.update(updateData);
  }
);

exports.moderateComment = onDocumentCreated(
  "communityPosts/{postId}/comments/{commentId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const comment = snap.data();
    const content = (comment?.content || "").trim();

    let rejectionReason = null;

    // If content is blank, auto-reject
    if (!content) {
      await snap.ref.update({
        status: "rejected",
        rejectionReason: "Message cannot be empty",
      });
      logger.info(`Comment ${snap.id} was blank, auto-rejected.`);
      return;
    }

    // GPT moderation with Firestore prompt
    let gptFlagged = false;
    try {
      const filteringPrompt = await getFilteringPrompt("comment");
      logger.info(`[moderateComment] Using prompt: ${filteringPrompt}`);
      const promptText = filteringPrompt.replace("{message}", content);
      logger.info(`[moderateComment] Sending prompt text: ${promptText}`);
      const gptCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: promptText }],
        temperature: 0,
        max_tokens: 20,
      });
      const result = gptCheck.choices[0].message.content.trim();
      logger.info(`[moderateComment] GPT result: ${result}`);

      const cleanResult = result.toLowerCase().trim();
      logger.info(`[moderateComment] Clean result: "${cleanResult}"`);
      if (cleanResult !== "allow") {
        gptFlagged = true;
        if (
          cleanResult.includes("hateful") ||
          cleanResult.includes("derogatory")
        ) {
          rejectionReason = "Content contains hateful or derogatory language";
        } else if (
          cleanResult.includes("spam") ||
          cleanResult.includes("trolling")
        ) {
          rejectionReason = "Content appears to be spam or trolling";
        } else {
          // Fallback for any unexpected responses
          rejectionReason = "Message doesn't align with community guidelines";
        }
      }
    } catch (err) {
      logger.error("GPT moderation failed:", err);
      gptFlagged = true;
      rejectionReason = "Unable to process message at this time";
    }

    const newStatus = gptFlagged ? "rejected" : "approved";
    logger.info(`Moderation result for comment ${snap.id}: ${newStatus}`);

    const updateData = {
      status: newStatus,
    };

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    // Update comment status
    await snap.ref.update(updateData);

    // Increment comment count only if approved
    if (newStatus === "approved") {
      const postRef = admin
        .firestore()
        .doc(`communityPosts/${event.params.postId}`);
      await postRef.update({
        commentCount: admin.firestore.FieldValue.increment(1),
      });
      logger.info(`Comment count incremented for post ${event.params.postId}`);
    }
  }
);

async function getFilteringPrompt(type = "plea") {
  const docMap = {
    plea: "pleaFilteringPrompt",
    pleaTEST: "pleaFilteringPromptTEST",
    encouragement: "encouragementFilteringPrompt",
    encouragementTEST: "encouragementFilteringPromptTEST",
    post: "postFilteringPrompt",
    postTEST: "postFilteringPromptTEST",
    comment: "commentFilteringPrompt",
  };

  const docId = docMap[type] || "pleaFilteringPrompt";

  try {
    const doc = await admin.firestore().collection("config").doc(docId).get();
    if (doc.exists) {
      return doc.data().prompt;
    }
  } catch (error) {
    logger.error(`Error fetching ${docId} from Firestore:`, error);
  }

  // Fallback prompts
  const fallbacks = {
    plea: "You are an expert moderator for a Christian accountability support app. Block inappropriate context. Only reply ALLOW or BLOCK. {message}",
    encouragement:
      "You are an expert moderator for a Christian encouragement system. Only reply ALLOW or BLOCK. {message}",
    post: "You are an expert moderator for a Christian community forum. Block trolling, spam, hate speech, or inappropriate content. Only reply ALLOW or BLOCK. {message}",
    comment:
      "You are an expert moderator for community comments. Block trolling, spam, or inappropriate responses. Only reply ALLOW or BLOCK. {message}",
  };

  return fallbacks[type] || fallbacks.plea;
}

exports.generateStreakDocsScheduled = onSchedule("0 2 * * *", async (event) => {
  logger.info("Starting scheduled streak doc creation for all users...");
  const db = admin.firestore();
  const usersSnap = await db.collection("users").get();

  // Helper to format YYYY-MM-DD in UTC
  const getUtcDateString = (offset = 0) => {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() + offset);
    const year = d.getUTCFullYear();
    const month = String(d.getUTCMonth() + 1).padStart(2, "0");
    const day = String(d.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const today = getUtcDateString(0);
  const twoDaysAhead = getUtcDateString(2);

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    const streakRef = db.collection("users").doc(uid).collection("streak");

    // Find latest streak doc (if any)
    const streakSnap = await streakRef.orderBy("date", "desc").limit(1).get();
    let lastDate = null;
    if (!streakSnap.empty) {
      lastDate = streakSnap.docs[0].id;
    } else {
      // If never streaked before, backfill the last 2 days
      lastDate = getUtcDateString(-2);
    }

    // Backfill from day after last doc up to twoDaysAhead
    let fillStart = new Date(lastDate);
    fillStart.setUTCDate(fillStart.getUTCDate() + 1);
    let curr = new Date(fillStart);
    const end = new Date(twoDaysAhead);

    while (curr <= end) {
      const yyyy = curr.getUTCFullYear();
      const mm = String(curr.getUTCMonth() + 1).padStart(2, "0");
      const dd = String(curr.getUTCDate()).padStart(2, "0");
      const dateStr = `${yyyy}-${mm}-${dd}`;
      const docRef = streakRef.doc(dateStr);

      // Only create if missing
      const existing = await docRef.get();
      if (!existing.exists) {
        await docRef.set({ status: "pending" }, { merge: true });
        logger.info(`Created streak doc for ${uid}: ${dateStr}`);
      }
      curr.setUTCDate(curr.getUTCDate() + 1);
    }
  }

  logger.info("✅ Finished scheduled streak doc creation for all users.");
});

async function getTotalUnreadForUser(uid) {
  // --- Messages ---
  let messageUnread = 0;

  // UserA side
  const threadsA = await admin
    .firestore()
    .collection("threads")
    .where("userA", "==", uid)
    .get();

  threadsA.forEach((doc) => {
    messageUnread += doc.data().userA_unreadCount || 0;
  });

  // UserB side
  const threadsB = await admin
    .firestore()
    .collection("threads")
    .where("userB", "==", uid)
    .get();

  threadsB.forEach((doc) => {
    messageUnread += doc.data().userB_unreadCount || 0;
  });

  // --- Encouragements ---
  let encouragementUnread = 0;
  const pleasSnap = await admin
    .firestore()
    .collection("pleas")
    .where("uid", "==", uid)
    .get();

  pleasSnap.forEach((doc) => {
    encouragementUnread += doc.data().unreadEncouragementCount || 0;
  });

  return messageUnread + encouragementUnread;
}

// ─────────────────────────────────────────────────────────────────────────────
// Block mirror: when a user blocks someone, mirror into the other user's
// `/blockedBy/{blockerUid}`; when unblocked, delete the mirror.
// Clients **only** write to /blockList; server (Admin SDK) writes /blockedBy.
// ─────────────────────────────────────────────────────────────────────────────

exports.onBlockCreate = onDocumentCreated(
  "users/{uid}/blockList/{blockedUid}",
  async (event) => {
    const { uid, blockedUid } = event.params; // uid = blocker, blockedUid = target
    try {
      await admin.firestore().doc(`users/${blockedUid}/blockedBy/${uid}`).set(
        {
          uid, // who blocked you
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    } catch (err) {
      logger.error("[onBlockCreate] mirror write failed:", err, {
        uid,
        blockedUid,
      });
    }
  }
);

exports.onBlockDelete = onDocumentDeleted(
  "users/{uid}/blockList/{blockedUid}",
  async (event) => {
    const { uid, blockedUid } = event.params;
    try {
      await admin
        .firestore()
        .doc(`users/${blockedUid}/blockedBy/${uid}`)
        .delete();
    } catch (err) {
      // mirror might already be gone; swallow
      logger.warn("[onBlockDelete] mirror delete warn:", err, {
        uid,
        blockedUid,
      });
    }
  }
);

exports.recalculateUserStreak = onDocumentWritten(
  "/users/{uid}/streak/{date}",
  async (event) => {
    try {
      const uid = event.params.uid;

      const streakRef = admin
        .firestore()
        .collection("users")
        .doc(uid)
        .collection("streak");

      const snapshot = await streakRef.orderBy("__name__", "asc").get();

      // Convert docs to array of {date, status}
      const entries = snapshot.docs.map((doc) => ({
        date: doc.id,
        status: doc.data().status,
      }));

      console.log("ENTRIES DEBUG:", JSON.stringify(entries, null, 2));

      // --- determine "today" in YYYY-MM-DD (local time)
      const now = new Date();
      const today = now.toISOString().split("T")[0];

      // ============================================================
      // 🔥 CURRENT STREAK LOGIC (matches your app EXACTLY)
      // - Ignore today
      // - Ignore pending (do not count, do not break)
      // - Count consecutive successes backward from yesterday
      // - Stop only when hitting a fail
      // ============================================================
      let currentStreak = 0;

      for (let i = entries.length - 1; i >= 0; i--) {
        const entry = entries[i];
        if (entry.date === today) continue; // 🔥 ignore today completely
        if (entry.status === "fail") break; // ❌ streak ends
        if (entry.status === "success") {
          currentStreak++; // ✅ add to streak
          continue;
        }
        if (entry.status === "pending") {
          continue; // ❗ pending does NOT break streak
        }
      }

      // ============================================================
      // 🔥 BEST STREAK LOGIC (personal best)
      // - Ignore today
      // - Success: increment
      // - Fail: reset
      // - Pending: ignore
      // ============================================================
      let bestStreak = 0;
      let continuous = 0;

      for (const entry of entries) {
        if (entry.date === today) continue; // ignore today

        if (entry.status === "success") {
          continuous++;
          bestStreak = Math.max(bestStreak, continuous);
        } else if (entry.status === "fail") {
          continuous = 0;
        }
        // "pending" → ignore (doesn’t increment, doesn’t reset)
      }

      // ============================================================
      // 🔥 Write back results to /users/{uid}
      // ============================================================
      await admin.firestore().collection("users").doc(uid).set(
        {
          currentStreak,
          bestStreak,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

      console.log(
        `🔥 Updated streak for ${uid}: current=${currentStreak}, best=${bestStreak}`
      );
    } catch (err) {
      console.error("Error recalculating streak:", err);
    }
  }
);

// Reusable Admin helper: returns true if either user blocked the other
async function eitherBlocked(aUid, bUid) {
  const db = admin.firestore();
  const [aBlocksB, bBlocksA] = await Promise.all([
    db.doc(`users/${aUid}/blockList/${bUid}`).get(),
    db.doc(`users/${bUid}/blockList/${aUid}`).get(),
  ]);
  return aBlocksB.exists || bBlocksA.exists;
}
exports._eitherBlocked = eitherBlocked; // (optional) export for reuse/tests

// ─────────────────────────────────────────────────────────────────────────────
// STREAK REMINDER NOTIFICATIONS
// Sends a notification at 12 PM local time to users who haven't completed
// yesterday's streak (status: "pending")
// ─────────────────────────────────────────────────────────────────────────────

exports.sendStreakReminders = onSchedule(
  {
    schedule: "0 * * * *", // Every hour at minute 0
    timeZone: "UTC",
  },
  async () => {
    console.log("🔔 Running streak reminder check...");

    try {
      const db = admin.firestore();
      const now = new Date();

      // Get all users with general notifications enabled
      const usersSnap = await db
        .collection("users")
        .where("notificationPreferences.general", "==", true)
        .get();

      if (usersSnap.empty) {
        console.log("No users with general notifications enabled.");
        return;
      }

      const notifications = [];

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Skip if no push token or timezone
        if (
          !userData.expoPushToken ||
          !userData.expoPushToken.startsWith("ExponentPushToken") ||
          !userData.timezone
        ) {
          continue;
        }

        // Calculate current time in user's timezone
        const userTime = new Date(
          now.toLocaleString("en-US", { timeZone: userData.timezone })
        );
        const userHour = userTime.getHours();

        // Only process if it's between 12:00 PM (12) and 12:59 PM (12)
        if (userHour !== 12) {
          continue;
        }

        // Check if we already sent a streak reminder today
        const todayDate = formatDate(userTime);
        const lastNotificationDate = userData.lastStreakReminderDate;

        if (lastNotificationDate === todayDate) {
          console.log(`Already sent streak reminder to ${userId} today.`);
          continue;
        }

        // Calculate yesterday's date in user's timezone
        const yesterday = new Date(userTime);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayDate = formatDate(yesterday);

        // Check if yesterday's streak is pending
        const streakDocRef = db
          .collection("users")
          .doc(userId)
          .collection("streak")
          .doc(yesterdayDate);

        const streakDoc = await streakDocRef.get();

        if (!streakDoc.exists) {
          console.log(`No streak document for ${userId} on ${yesterdayDate}`);
          continue;
        }

        const streakData = streakDoc.data();

        if (streakData.status === "pending") {
          // Send notification
          notifications.push({
            to: userData.expoPushToken,
            sound: "default",
            title: "Don't forget to log your streak!",
            body: "Tap here to update yesterday's streak check-in.",
            data: {
              type: "streak_reminder",
              date: yesterdayDate,
            },
          });

          // Mark that we sent the streak reminder today
          await db.collection("users").doc(userId).update({
            lastStreakReminderDate: todayDate,
          });

          console.log(`✅ Queued streak reminder for ${userId}`);
        } else {
          console.log(
            `Streak already completed for ${userId} on ${yesterdayDate}`
          );
        }
      }

      // Send notifications in batches
      if (notifications.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < notifications.length; i += batchSize) {
          const chunk = notifications.slice(i, i + batchSize);
          const res = await axios.post(
            "https://exp.host/--/api/v2/push/send",
            chunk,
            { headers: { "Content-Type": "application/json" } }
          );
          console.log(`✅ Sent batch of ${chunk.length}:`, res.data?.data);
        }
        console.log(`✅ Total streak reminders sent: ${notifications.length}`);
      } else {
        console.log("No streak reminders to send this hour.");
      }
    } catch (error) {
      console.error("❌ Error in sendStreakReminders:", error);
    }
  }
);

exports.sendAccountabilityCheckInReminders = onSchedule(
  {
    schedule: "0 * * * *", // Every hour at minute 0
    timeZone: "UTC",
  },
  async () => {
    console.log("🔔 Running accountability check-in reminder check...");

    try {
      const db = admin.firestore();
      const now = new Date();

      // Get all users with accountability notifications enabled
      const usersSnap = await db
        .collection("users")
        .where("notificationPreferences.accountability", "==", true)
        .get();

      if (usersSnap.empty) {
        console.log("No users with accountability notifications enabled.");
        return;
      }

      const notifications = [];

      for (const userDoc of usersSnap.docs) {
        const userData = userDoc.data();
        const userId = userDoc.id;

        // Skip if no push token or timezone
        if (
          !userData.expoPushToken ||
          !userData.expoPushToken.startsWith("ExponentPushToken") ||
          !userData.timezone
        ) {
          continue;
        }

        // Calculate current hour in user's timezone using Intl.DateTimeFormat
        const hourFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: userData.timezone,
          hour: "numeric",
          hour12: false,
        });

        const userHour = parseInt(
          hourFormatter.formatToParts(now).find((p) => p.type === "hour")
            ?.value || "0"
        );

        // Only process if it's between 6:00 PM (18) and 6:59 PM (18)
        // TODO: Make this configurable via systemConfig collection
        if (userHour !== 18) {
          continue;
        }

        // Get today's date in user's timezone
        const dateFormatter = new Intl.DateTimeFormat("en-US", {
          timeZone: userData.timezone,
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        });

        const dateParts = dateFormatter.formatToParts(now);
        const todayYear = dateParts.find((p) => p.type === "year")?.value;
        const todayMonth = dateParts.find((p) => p.type === "month")?.value;
        const todayDay = dateParts.find((p) => p.type === "day")?.value;
        const todayDate = `${todayYear}-${todayMonth}-${todayDay}`;

        // Check if we already sent an accountability reminder today
        const lastNotificationDate = userData.lastAccountabilityReminderDate;

        if (lastNotificationDate === todayDate) {
          console.log(
            `Already sent accountability reminder to ${userId} today.`
          );
          continue;
        }

        // Find the relationship where this user is the mentee
        const menteeRelationshipsSnap = await db
          .collection("accountabilityRelationships")
          .where("menteeUid", "==", userId)
          .where("status", "==", "active")
          .limit(1)
          .get();

        if (menteeRelationshipsSnap.empty) {
          console.log(
            `${userId} has no active accountability relationship as mentee.`
          );
          continue;
        }

        const relationshipDoc = menteeRelationshipsSnap.docs[0];
        const relationshipData = relationshipDoc.data();
        const lastCheckIn = relationshipData.lastCheckIn; // Format: "YYYY-MM-DD"

        // Calculate days since last check-in
        let daysSinceCheckIn = 0;
        if (lastCheckIn) {
          const lastCheckInDate = new Date(lastCheckIn);
          const today = new Date(todayDate);
          const diffTime = today - lastCheckInDate;
          daysSinceCheckIn = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        } else {
          // No check-in ever recorded - calculate from relationship creation
          const createdAt = relationshipData.createdAt?.toDate();
          if (createdAt) {
            const today = new Date(todayDate);
            const diffTime = today - createdAt;
            daysSinceCheckIn = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          }
        }

        // Determine notification message based on days missed
        let title = "Accountability Check-In";
        let body = "";

        if (daysSinceCheckIn === 0) {
          // Haven't checked in today yet (or already checked in today)
          // Only send if they haven't checked in today
          if (lastCheckIn === todayDate) {
            console.log(`${userId} already checked in today.`);
            continue;
          }
          body =
            "Don't forget to check in with your accountability partner today";
        } else if (daysSinceCheckIn === 1) {
          body = "You didn't check in with your partner yesterday, do it now!";
        } else if (daysSinceCheckIn >= 7) {
          body =
            "You haven't checked in with your partner in over a week. Update them now!";
        } else {
          body = `You haven't checked in with your partner in ${daysSinceCheckIn} days. Update them now!`;
        }

        // Send notification
        notifications.push({
          to: userData.expoPushToken,
          sound: "default",
          title: title,
          body: body,
          data: {
            type: "accountability_reminder",
            relationshipId: relationshipDoc.id,
            daysSinceCheckIn: daysSinceCheckIn,
          },
        });

        // Mark that we sent the accountability reminder today
        await db.collection("users").doc(userId).update({
          lastAccountabilityReminderDate: todayDate,
        });

        console.log(
          `✅ Queued accountability reminder for ${userId} (${daysSinceCheckIn} days since check-in)`
        );
      }

      // Send notifications in batches
      if (notifications.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < notifications.length; i += batchSize) {
          const chunk = notifications.slice(i, i + batchSize);
          const res = await axios.post(
            "https://exp.host/--/api/v2/push/send",
            chunk,
            { headers: { "Content-Type": "application/json" } }
          );
          console.log(`✅ Sent batch of ${chunk.length}:`, res.data?.data);
        }
        console.log(
          `✅ Total accountability reminders sent: ${notifications.length}`
        );
      } else {
        console.log("No accountability reminders to send this hour.");
      }
    } catch (error) {
      console.error("❌ Error in sendAccountabilityCheckInReminders:", error);
    }
  }
);

exports.notifyMentorOnCheckIn = onDocumentWritten(
  "accountabilityRelationships/{relationshipId}/checkIns/{checkInId}",
  async (event) => {
    const checkIn = event.data?.after?.data();
    if (!checkIn) return;

    const relationshipId = event.params.relationshipId;

    // Get relationship
    const relationshipDoc = await admin
      .firestore()
      .collection("accountabilityRelationships")
      .doc(relationshipId)
      .get();

    if (!relationshipDoc.exists) return;

    const relationship = relationshipDoc.data();
    const mentorUid = relationship.mentorUid;
    const menteeUid = relationship.menteeUid;

    // ❗ FIXED: Must use admin.firestore()
    const menteeUserDoc = await admin
      .firestore()
      .collection("users")
      .doc(menteeUid)
      .get();

    const menteeTimezone = menteeUserDoc.data()?.timezone;

    if (!menteeTimezone) {
      console.log(`❌ No timezone found for mentee ${menteeUid}`);
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
        `⏭️ Skipping notification: check-in for ${checkIn.date} != ${todayInMenteeTZ}`
      );
      return;
    }

    // Fetch mentor user
    const mentorDoc = await admin
      .firestore()
      .collection("users")
      .doc(mentorUid)
      .get();

    if (!mentorDoc.exists) return;

    const mentorData = mentorDoc.data();

    if (!mentorData.notificationPreferences?.accountability) {
      console.log(`🔕 Mentor ${mentorUid} has notifications off`);
      return;
    }

    if (!mentorData.expoPushToken?.startsWith("ExponentPushToken")) {
      console.log(`No valid push token for mentor ${mentorUid}`);
      return;
    }

    // Build notification
    const getStatusLabel = (status) => {
      switch (status) {
        case "great":
          return "is doing great";
        case "struggling":
          return "is struggling today";
        case "support":
          return "needs support";
        default:
          return "checked in";
      }
    };

    const anonymousUsername = `user-${menteeUid.slice(0, 5)}`;

    await axios.post(
      "https://exp.host/--/api/v2/push/send",
      [
        {
          to: mentorData.expoPushToken,
          sound: "default",
          title: "One of your partners checked in!",
          body: `${anonymousUsername} ${getStatusLabel(checkIn.status)}`,
          data: {
            type: "mentee_checked_in",
            relationshipId,
            status: checkIn.status,
          },
        },
      ],
      { headers: { "Content-Type": "application/json" } }
    );

    console.log(`✅ Sent check-in notification to mentor ${mentorUid}`);
  }
);

exports.sendMissedCheckInNotifications = onSchedule(
  {
    schedule: "0 * * * *", // Every hour at minute 0
    timeZone: "UTC",
  },
  async () => {
    console.log("🔔 Running missed check-in notification check for mentors...");

    try {
      const db = admin.firestore();
      const now = new Date();

      // Get all active relationships
      const relationshipsSnap = await db
        .collection("accountabilityRelationships")
        .where("status", "==", "active")
        .get();

      if (relationshipsSnap.empty) {
        console.log("No active accountability relationships.");
        return;
      }

      const notifications = [];

      for (const relationshipDoc of relationshipsSnap.docs) {
        const relationship = relationshipDoc.data();
        const mentorUid = relationship.mentorUid;
        const menteeUid = relationship.menteeUid;

        // Get MENTEE's timezone from user document
        const menteeDoc = await db.collection("users").doc(menteeUid).get();
        if (!menteeDoc.exists) continue;

        const menteeData = menteeDoc.data();
        const menteeTimezone = menteeData.timezone;

        if (!menteeTimezone) {
          console.log(`Mentee ${menteeUid} has no timezone set`);
          continue;
        }

        // Calculate current time in MENTEE's timezone using Intl.DateTimeFormat
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

        // Now get mentor's data
        const mentorDoc = await db.collection("users").doc(mentorUid).get();
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
        const yesterdayMonth = String(menteeYesterday.getMonth() + 1).padStart(
          2,
          "0"
        );
        const yesterdayDay = String(menteeYesterday.getDate()).padStart(2, "0");
        const yesterdayDate = `${yesterdayYear}-${yesterdayMonth}-${yesterdayDay}`;

        // Check if we already sent this notification today (in mentee's timezone)
        const lastNotificationKey = `lastMissedCheckInNotification_${relationshipDoc.id}`;
        const lastNotificationDate = mentorData[lastNotificationKey];

        if (lastNotificationDate === todayDate) {
          console.log(
            `Already sent missed check-in notification to ${mentorUid} today for relationship ${relationshipDoc.id}.`
          );
          continue;
        }

        const lastCheckIn = relationship.lastCheckIn;

        // Did they check in yesterday?
        if (lastCheckIn === yesterdayDate) {
          console.log(
            `${menteeUid} checked in yesterday (${yesterdayDate}), no notification needed.`
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
          // No check-in ever recorded - calculate from relationship creation
          const createdAt = relationship.createdAt?.toDate();
          if (createdAt) {
            const today = new Date(todayDate);
            const diffTime = today - createdAt;
            daysSinceCheckIn = Math.floor(diffTime / (1000 * 60 * 60 * 24));
          }
        }

        // Only notify if mentee has actually missed at least 1 day
        if (daysSinceCheckIn < 1) {
          console.log(`${menteeUid} is up to date with check-ins.`);
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
        await db
          .collection("users")
          .doc(mentorUid)
          .update({
            [lastNotificationKey]: todayDate,
          });

        console.log(
          `✅ Queued missed check-in notification for mentor ${mentorUid} (${daysSinceCheckIn} days since check-in)`
        );
      }

      // Send notifications in batches
      if (notifications.length > 0) {
        const batchSize = 100;
        for (let i = 0; i < notifications.length; i += batchSize) {
          const chunk = notifications.slice(i, i + batchSize);
          const res = await axios.post(
            "https://exp.host/--/api/v2/push/send",
            chunk,
            { headers: { "Content-Type": "application/json" } }
          );
          console.log(`✅ Sent batch of ${chunk.length}:`, res.data?.data);
        }
        console.log(
          `✅ Total missed check-in notifications sent: ${notifications.length}`
        );
      } else {
        console.log("No missed check-in notifications to send this hour.");
      }
    } catch (error) {
      console.error("❌ Error in sendMissedCheckInNotifications:", error);
    }
  }
);

exports.testAccountabilityReminder = onRequest(async (req, res) => {
  try {
    const menteeUid = req.query.menteeUid;
    if (!menteeUid) {
      return res.status(400).send("Missing menteeUid");
    }

    const db = admin.firestore();
    const userDoc = await db.collection("users").doc(menteeUid).get();

    if (!userDoc.exists) return res.status(404).send("User not found");

    const user = userDoc.data();

    if (!user.expoPushToken) return res.send("User has no Expo push token");
    if (!user.notificationPreferences?.accountability)
      return res.send("User has accountability notifications OFF");
    if (!user.timezone) return res.send("User has no timezone set");

    const now = new Date();

    // Compute their local date and hour
    const dateFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: user.timezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });

    const hourFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: user.timezone,
      hour: "numeric",
      hour12: false,
    });

    const parts = dateFormatter.formatToParts(now);
    const todayDate = `${parts.find((p) => p.type === "year").value}-${
      parts.find((p) => p.type === "month").value
    }-${parts.find((p) => p.type === "day").value}`;

    // Fetch their accountability relationship
    const relSnap = await db
      .collection("accountabilityRelationships")
      .where("menteeUid", "==", menteeUid)
      .where("status", "==", "active")
      .limit(1)
      .get();

    if (relSnap.empty) return res.send("No active relationship");

    const relDoc = relSnap.docs[0];
    const rel = relDoc.data();

    const lastCheckIn = rel.lastCheckIn;

    // Calculate days since check-in
    let daysSince = 0;
    if (lastCheckIn) {
      daysSince = Math.floor(
        (new Date(todayDate) - new Date(lastCheckIn)) / (1000 * 60 * 60 * 24)
      );
    }

    // Build message
    let body = "";
    if (lastCheckIn === todayDate) {
      body = "You already checked in today";
    } else if (daysSince === 0) {
      body = "Don't forget to check in with your accountability partner today";
    } else if (daysSince === 1) {
      body = "You haven't checked in for 1 day";
    } else if (daysSince >= 7) {
      body = "You haven't checked in for over a week";
    } else {
      body = `You haven't checked in for ${daysSince} days`;
    }

    // Send push notification
    const message = {
      to: user.expoPushToken,
      sound: "default",
      title: "Accountability Check-In",
      body,
      data: {
        type: "accountability_reminder",
        relationshipId: relDoc.id,
        daysSinceCheckIn: daysSince,
      },
    };

    await axios.post("https://exp.host/--/api/v2/push/send", message, {
      headers: { "Content-Type": "application/json" },
    });

    return res.send({
      status: "OK",
      sentTo: menteeUid,
      message,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error: " + err.toString());
  }
});

exports.testMissedCheckInNotification = onRequest(async (req, res) => {
  try {
    const relationshipId = req.query.relationshipId;
    if (!relationshipId) return res.status(400).send("Missing relationshipId");

    const db = admin.firestore();

    const relDoc = await db
      .collection("accountabilityRelationships")
      .doc(relationshipId)
      .get();

    if (!relDoc.exists) return res.send("Relationship not found");

    const rel = relDoc.data();

    const mentorUid = rel.mentorUid;
    const menteeUid = rel.menteeUid;

    // Get mentee's timezone from user document
    const menteeDoc = await db.collection("users").doc(menteeUid).get();
    if (!menteeDoc.exists) return res.send("Mentee user not found");

    const menteeTimezone = menteeDoc.data()?.timezone;

    if (!menteeTimezone) return res.send("Mentee has no timezone set");

    const mentorDoc = await db.collection("users").doc(mentorUid).get();
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
      missedYesterday: missed,
      daysSinceCheckIn,
      message,
    });
  } catch (err) {
    console.error(err);
    return res.status(500).send("Error: " + err.toString());
  }
});
