// Load environment variables from .env file
require("dotenv").config();

const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const { onSchedule } = require("firebase-functions/scheduler");
const {
  onDocumentCreated,
  onDocumentUpdated,
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
async function sendHelpNotificationToHelpers(plea, pleaId) {
  const { message, uid } = plea || {};

  try {
    // Only users who opted in for plea notifications
    const usersSnap = await admin
      .firestore()
      .collection("users")
      .where("notificationPreferences.pleas", "==", true)
      .get();

    const tokens = [];

    usersSnap.forEach((doc) => {
      const data = doc.data();

      if (
        data.expoPushToken &&
        typeof data.expoPushToken === "string" &&
        data.expoPushToken.startsWith("ExponentPushToken")
      ) {
        // Don't notify the sender of the plea
        if (doc.id === uid) return;

        tokens.push(data.expoPushToken);
      }
    });

    if (tokens.length === 0) {
      console.log("No users opted in for plea notifications.");
      return;
    }

    const notifications = tokens.map((token) => ({
      to: token,
      sound: "default",
      title: "Someone is struggling",
      body: message?.length
        ? `They wrote: "${message.slice(0, 100)}"`
        : "They need encouragement. Tap to respond.",
      data: {
        pleaId,
        type: "plea", // 👈 ADD THIS FLAG
      },
    }));

    // Send in batches of 100
    const batchSize = 100;
    for (let i = 0; i < notifications.length; i += batchSize) {
      const chunk = notifications.slice(i, i + batchSize);
      const res = await axios.post(
        "https://exp.host/--/api/v2/push/send",
        chunk,
        {
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log(`✅ Sent batch of ${chunk.length}:`, res.data?.data);
    }

    console.log(`✅ Notifications sent to ${tokens.length} helpers.`);
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

    // 👈 ADD THIS: Increment unread count
    await snap.ref.parent.parent.update({
      unreadEncouragementCount: admin.firestore.FieldValue.increment(1),
    });

    await sendEncouragementNotificationToPleaOwner(
      snap.ref.parent.parent, // pleaRef
      encouragement
    );
  }
);

// When an encouragement's status changes to approved
exports.sendEncouragementNotificationOnApprove = onDocumentUpdated(
  "pleas/{pleaId}/encouragements/{encId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    if (before.status !== "approved" && after.status === "approved") {
      // 👈 ADD THIS: Increment unread count
      await event.data.after.ref.parent.parent.update({
        unreadEncouragementCount: admin.firestore.FieldValue.increment(1),
      });

      // "pleaRef" is 2 levels up from encouragement doc
      await sendEncouragementNotificationToPleaOwner(
        event.data.after.ref.parent.parent,
        after
      );
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

    // Find recipient(s)
    const recipients = [userA, userB].filter((uid) => uid !== senderUid);

    // 🔹 Generate pseudo-username from UID
    const senderName = `user-${senderUid.substring(0, 5)}`;

    // For each recipient, check notification preferences
    for (const recipientUid of recipients) {
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
          // Get unread count for recipient
          const totalUnread = await getTotalUnreadForUser(recipientUid);

          await axios.post(
            "https://exp.host/--/api/v2/push/send",
            [
              {
                to: expoPushToken,
                sound: "default",
                title: senderName,
                body: text && text.length ? text.slice(0, 100) : "",
                badge: totalUnread, // <-- add this!
                data: {
                  threadId,
                  messageId: snap.id,
                },
              },
            ],
            {
              headers: { "Content-Type": "application/json" },
            }
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

  // 1. OpenAI Moderation API
  let flagged = false;
  try {
    const modResult = await openai.moderations.create({ input: message });
    flagged = modResult.results[0].flagged;
    logger.info(`[moderatePlea] OpenAI Moderation flagged: ${flagged}`);
  } catch (e) {
    logger.error("OpenAI Moderation API failed, skipping to GPT fallback.", e);
  }

  // 2. GPT moderation with Firestore prompt
  let gptFlagged = false;
  if (!flagged) {
    try {
      const filteringPrompt = await getFilteringPrompt("plea");
      logger.info(`[moderatePlea] Using prompt: ${filteringPrompt}`);
      const promptText = filteringPrompt.replace("{message}", message);
      logger.info(`[moderatePlea] Sending prompt text: ${promptText}`);
      const gptCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: promptText }],
        temperature: 0,
        max_tokens: 3,
      });
      const result = gptCheck.choices[0].message.content.trim();
      logger.info(`[moderatePlea] GPT result: ${result}`);
      gptFlagged = result !== "ALLOW";
    } catch (err) {
      logger.error("GPT moderation failed:", err);
      gptFlagged = true;
    }
  }

  const newStatus = flagged || gptFlagged ? "rejected" : "approved";
  logger.info(`Moderation result for plea ${snap.id}: ${newStatus}`);

  await snap.ref.update({
    status: newStatus,
    unreadEncouragementCount: 0, // 👈 Add this line
  });
});

exports.moderateEncouragement = onDocumentCreated(
  "pleas/{pleaId}/encouragements/{encId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const encouragement = snap.data();
    const message = (encouragement?.message || "").trim();

    // If blank, auto-reject
    if (!message) {
      await snap.ref.update({ status: "rejected" });
      logger.info(`Encouragement ${snap.id} was blank, auto-rejected.`);
      return;
    }

    // 1. OpenAI Moderation API
    let flagged = false;
    try {
      const modResult = await openai.moderations.create({ input: message });
      flagged = modResult.results[0].flagged;
    } catch (e) {
      logger.error(
        "OpenAI Moderation API failed, skipping to GPT fallback.",
        e
      );
    }

    // 2. GPT moderation with Firestore prompt
    let gptFlagged = false;
    if (!flagged) {
      try {
        const filteringPrompt = await getFilteringPrompt("encouragement");
        const promptText = filteringPrompt.replace("{message}", message);
        const gptCheck = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "system", content: promptText }],
          temperature: 0,
          max_tokens: 3,
        });
        const result = gptCheck.choices[0].message.content.trim();
        gptFlagged = result !== "ALLOW";
      } catch (err) {
        logger.error("GPT moderation failed:", err);
        gptFlagged = true;
      }
    }

    const newStatus = flagged || gptFlagged ? "rejected" : "approved";
    logger.info(`Moderation result for encouragement ${snap.id}: ${newStatus}`);

    await snap.ref.update({ status: newStatus });
  }
);

// Add these two functions to your existing index.js

exports.moderatePost = onDocumentCreated(
  "communityPosts/{postId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const post = snap.data();
    const title = (post?.title || "").trim();
    const content = (post?.content || "").trim();
    const combinedText = `${title} ${content}`.trim();

    // Log incoming fields
    logger.info(
      `[moderatePost] Title: "${title}" | Content: "${content}" | Combined: "${combinedText}"`
    );

    // If both title and content are blank, auto-reject
    if (!combinedText) {
      await snap.ref.update({ status: "rejected" });
      logger.info(`Post ${snap.id} was blank, auto-rejected.`);
      return;
    }

    // 1. OpenAI Moderation API
    let flagged = false;
    try {
      const modResult = await openai.moderations.create({
        input: combinedText,
      });
      flagged = modResult.results[0].flagged;
      logger.info(`[moderatePost] OpenAI Moderation flagged: ${flagged}`);
    } catch (e) {
      logger.error(
        "OpenAI Moderation API failed, skipping to GPT fallback.",
        e
      );
    }

    // 2. GPT moderation with Firestore prompt
    let gptFlagged = false;
    if (!flagged) {
      try {
        const filteringPrompt = await getFilteringPrompt("post");
        logger.info(`[moderatePost] Using prompt: ${filteringPrompt}`);
        const promptText = filteringPrompt.replace("{message}", combinedText);
        logger.info(`[moderatePost] Sending prompt text: ${promptText}`);
        const gptCheck = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "system", content: promptText }],
          temperature: 0,
          max_tokens: 3,
        });
        const result = gptCheck.choices[0].message.content.trim();
        logger.info(`[moderatePost] GPT result: ${result}`);
        gptFlagged = result !== "ALLOW";
      } catch (err) {
        logger.error("GPT moderation failed:", err);
        gptFlagged = true;
      }
    }

    const newStatus = flagged || gptFlagged ? "rejected" : "approved";
    logger.info(`Moderation result for post ${snap.id}: ${newStatus}`);

    await snap.ref.update({ status: newStatus });
  }
);

exports.moderateComment = onDocumentCreated(
  "communityPosts/{postId}/comments/{commentId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const comment = snap.data();
    const content = (comment?.content || "").trim();

    // If content is blank, auto-reject
    if (!content) {
      await snap.ref.update({ status: "rejected" });
      logger.info(`Comment ${snap.id} was blank, auto-rejected.`);
      return;
    }

    // 1. OpenAI Moderation API
    let flagged = false;
    try {
      const modResult = await openai.moderations.create({ input: content });
      flagged = modResult.results[0].flagged;
    } catch (e) {
      logger.error(
        "OpenAI Moderation API failed, skipping to GPT fallback.",
        e
      );
    }

    // 2. GPT moderation with Firestore prompt
    let gptFlagged = false;
    if (!flagged) {
      try {
        const filteringPrompt = await getFilteringPrompt("comment");
        const promptText = filteringPrompt.replace("{message}", content);
        const gptCheck = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "system", content: promptText }],
          temperature: 0,
          max_tokens: 3,
        });
        const result = gptCheck.choices[0].message.content.trim();
        gptFlagged = result !== "ALLOW";
      } catch (err) {
        logger.error("GPT moderation failed:", err);
        gptFlagged = true;
      }
    }

    const newStatus = flagged || gptFlagged ? "rejected" : "approved";
    logger.info(`Moderation result for comment ${snap.id}: ${newStatus}`);

    // Update comment status
    await snap.ref.update({ status: newStatus });

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
