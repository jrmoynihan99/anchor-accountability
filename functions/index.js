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

    // GPT moderation with Firestore prompt
    let gptFlagged = false;
    try {
      const filteringPrompt = await getFilteringPrompt("encouragement");
      logger.info(`[moderateEncouragement] Using prompt: ${filteringPrompt}`);
      const promptText = filteringPrompt.replace("{message}", message);
      logger.info(`[moderateEncouragement] Sending prompt text: ${promptText}`);
      const gptCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: promptText }],
        temperature: 0,
        max_tokens: 20, // Enough for our specific responses
      });
      const result = gptCheck.choices[0].message.content.trim();
      logger.info(`[moderateEncouragement] GPT result: ${result}`);

      const cleanResult = result.toLowerCase().trim();
      logger.info(`[moderateEncouragement] Clean result: "${cleanResult}"`);
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
    const combinedText = `${title} ${content}`.trim();

    let rejectionReason = null;

    // Log incoming fields
    logger.info(
      `[moderatePost] Title: "${title}" | Content: "${content}" | Combined: "${combinedText}"`
    );

    // If both title and content are blank, auto-reject
    if (!combinedText) {
      await snap.ref.update({
        status: "rejected",
        rejectionReason: "Post cannot be empty",
      });
      logger.info(`Post ${snap.id} was blank, auto-rejected.`);
      return;
    }

    // GPT moderation with Firestore prompt
    let gptFlagged = false;
    try {
      const filteringPrompt = await getFilteringPrompt("post");
      logger.info(`[moderatePost] Using prompt: ${filteringPrompt}`);
      const promptText = filteringPrompt.replace("{message}", combinedText);
      logger.info(`[moderatePost] Sending prompt text: ${promptText}`);
      const gptCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: promptText }],
        temperature: 0,
        max_tokens: 20, // Enough for our specific responses
      });
      const result = gptCheck.choices[0].message.content.trim();
      logger.info(`[moderatePost] GPT result: ${result}`);

      const cleanResult = result.toLowerCase().trim();
      logger.info(`[moderatePost] Clean result: "${cleanResult}"`);
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

    const updateData = {
      status: newStatus,
    };

    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

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
    encouragement: "encouragementFilteringPrompt",
    post: "postFilteringPrompt",
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
