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
const fetch = require("node-fetch"); // ADD THIS LINE
const axios = require("axios");

// Initialize Firebase Admin
admin.initializeApp();

setGlobalOptions({ maxInstances: 10 });

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ADD THIS: Bible API configuration
const BIBLE_API_CONFIG = {
  baseUrl: "https://api.esv.org/v3",
  apiKey: process.env.ESV_API_KEY,
  version: "ESV",
};

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

// Get recent content to avoid repetition
const getRecentContent = async (daysToFetch = 7) => {
  try {
    const snapshot = await admin
      .firestore()
      .collection("dailyContent")
      .orderBy("date", "desc")
      .limit(daysToFetch)
      .get();

    const recentContent = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      recentContent.push({
        date: data.date,
        verse: data.verse,
        reference: data.reference,
        prayerContent: data.prayerContent,
      });
    });

    logger.info(
      `Found ${recentContent.length} recent content entries for context`
    );
    return recentContent;
  } catch (error) {
    logger.error("Error fetching recent content:", error);
    return [];
  }
};

// --- EXPO PUSH NOTIFICATION HELPER (AXIOS VERSION) --- //
const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

async function sendExpoPushNotification(to, title, body, data = {}) {
  const message = {
    to,
    sound: "default",
    title,
    body,
    data,
    // priority: "high",
  };

  try {
    const res = await axios.post(EXPO_PUSH_URL, [message], {
      headers: { "Content-Type": "application/json" },
    });
    if (res.data?.errors) {
      logger.error("Expo push error:", res.data.errors);
    }
    return res.data;
  } catch (e) {
    logger.error("Failed to send Expo push:", e);
  }
}

const getPrompt = async () => {
  try {
    const doc = await admin
      .firestore()
      .collection("config")
      .doc("dailyContentPrompt")
      .get();

    if (doc.exists) {
      return doc.data().prompt;
    }
  } catch (error) {
    logger.error("Error getting prompt from Firestore:", error);
  }

  // Fallback prompt if Firestore fails
  return `Generate devotional content for a Christian accountability app focused on helping people overcome pornography addiction. The content should include:

1. A 2-3 sentence prayer. This prayer should be specific to Christianity, and can be related to the bible verse of the day, but this is not required. It should be encouraging, biblically grounded, and helpful to their struggle.
2. A bible verse that is specific/related to the struggle against temptation and/or sexual temptation. 
3. The reference from the bible for the verse ("Matthew 16:21", "1 Corinthians 10:13", etc).

Please respond with a JSON object in this exact format:
{
  "prayerContent": "A 2-3 sentence prayer asking for strength, forgiveness, and God's help in overcoming temptation",
  "verse": "The actual Bible verse text", 
  "reference": "Book Chapter:Verse format (e.g., 'James 1:12')"
}

Focus on themes like: purity, strength, renewal, God's love, forgiveness, perseverance, and victory over sin.`;
};

// ADD THIS: Helper function to parse Bible reference
const parseBibleReference = (reference) => {
  // Examples: "John 3:16", "1 Corinthians 10:13", "Psalm 119:9-11"
  const match = reference.match(/^(\d?\s?\w+)\s+(\d+):(\d+)(?:-(\d+))?$/);
  if (!match) {
    throw new Error(`Invalid Bible reference format: ${reference}`);
  }

  const [, book, chapter, startVerse, endVerse] = match;
  return {
    book: book.trim(),
    chapter: parseInt(chapter),
    startVerse: parseInt(startVerse),
    endVerse: endVerse ? parseInt(endVerse) : parseInt(startVerse),
  };
};

// ADD THIS: Function to get chapter text from Bible API
const getChapterText = async (reference) => {
  try {
    logger.info(`Fetching chapter text for reference: ${reference}`);

    const { book, chapter } = parseBibleReference(reference);

    // Build the API request for the full chapter
    const passage = `${book} ${chapter}`;
    const url = `${
      BIBLE_API_CONFIG.baseUrl
    }/passage/text/?q=${encodeURIComponent(
      passage
    )}&include-headings=false&include-footnotes=false&include-verse-numbers=true&include-short-copyright=false`;

    logger.info(`Making request to ESV API: ${url}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Token ${BIBLE_API_CONFIG.apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(
        `Bible API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    logger.info(`ESV API response received for ${passage}`);

    // ESV API returns the text in the `passages` array
    if (data.passages && data.passages.length > 0) {
      const rawText = data.passages[0].trim();
      const lines = rawText.split("\n").filter((line) => line.trim() !== "");

      // Remove the chapter title if it's the first line (e.g., "John 3")
      if (lines[0] === `${book} ${chapter}`) {
        lines.shift();
      }

      const chapterText = lines.join("\n");
      logger.info(
        `Successfully fetched ${chapterText.length} characters of chapter text`
      );

      return {
        chapterText: chapterText,
        chapterReference: `${book} ${chapter}`,
        bibleVersion: BIBLE_API_CONFIG.version,
      };
    } else {
      throw new Error("No passage text returned from ESV API");
    }
  } catch (error) {
    logger.error("Error fetching chapter text:", error);

    // Fallback: return placeholder text
    return {
      chapterText: `Chapter text for ${reference} could not be loaded. Please check your internet connection and try again. You can read this chapter at https://www.biblegateway.com/passage/?search=${encodeURIComponent(
        reference
      )}&version=ESV`,
      chapterReference: reference,
      bibleVersion: "Error",
    };
  }
};

// MODIFY THIS: Enhanced generate daily content function
const generateDailyContent = async (targetDate) => {
  try {
    logger.info(`Generating content for date: ${targetDate}`);

    const prompt = await getPrompt();
    const recentContent = await getRecentContent(7);

    // Build the full prompt with recent content context
    let fullPrompt = prompt;

    if (recentContent.length > 0) {
      fullPrompt += `\n\nIMPORTANT: Here are the last ${recentContent.length} days of content to avoid repetition:\n\n`;

      recentContent.forEach((content, index) => {
        fullPrompt += `${content.date}:\n`;
        fullPrompt += `Verse: "${content.verse}"\n`;
        fullPrompt += `Reference: ${content.reference}\n`;
        fullPrompt += `Prayer: "${content.prayerContent}"\n\n`;
      });

      fullPrompt += "Please ensure:\n";
      fullPrompt +=
        "- DO NOT use any of the above Bible verses or references\n";
      fullPrompt += "- Create a different prayer (similar themes are fine)\n";
    }

    // Step 1: Get verse/prayer content from GPT
    logger.info("Requesting content from OpenAI...");
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a Christian devotional writer specializing in content for accountability and recovery apps. Always respond with valid JSON only. Avoid repeating content you've been shown.",
        },
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      max_tokens: 500,
      temperature: 0.7,
    });

    const content = response.choices[0].message.content;
    logger.info("OpenAI response received");

    // Parse the JSON response
    const parsedContent = JSON.parse(content);

    // Validate required fields
    if (
      !parsedContent.prayerContent ||
      !parsedContent.verse ||
      !parsedContent.reference
    ) {
      throw new Error("Missing required fields in OpenAI response");
    }

    logger.info(`GPT generated reference: ${parsedContent.reference}`);

    // Step 2: Get the full chapter text for the reference
    const chapterData = await getChapterText(parsedContent.reference);

    // Step 3: Combine everything
    const finalContent = {
      date: targetDate,
      prayerContent: parsedContent.prayerContent,
      verse: parsedContent.verse,
      reference: parsedContent.reference,
      // NEW: Chapter context fields
      chapterText: chapterData.chapterText,
      chapterReference: chapterData.chapterReference,
      bibleVersion: chapterData.bibleVersion,
    };

    logger.info(`Successfully generated complete content for ${targetDate}`);
    return finalContent;
  } catch (error) {
    logger.error("Error generating content with OpenAI:", error);

    // Enhanced fallback content with chapter text
    const fallbackReference = "1 Corinthians 10:13";
    logger.info(`Using fallback content with reference: ${fallbackReference}`);
    const fallbackChapter = await getChapterText(fallbackReference);

    return {
      date: targetDate,
      prayerContent:
        "Lord, thank you for your grace and mercy. Strengthen me today to walk in purity and to honor you with my thoughts and actions. Help me to rely on your power when I am weak. In Jesus' name, Amen.",
      verse:
        "No temptation has overtaken you except what is common to mankind. And God is faithful; he will not let you be tempted beyond what you can bear. But when you are tempted, he will also provide a way out so that you can endure it.",
      reference: fallbackReference,
      chapterText: fallbackChapter.chapterText,
      chapterReference: fallbackChapter.chapterReference,
      bibleVersion: fallbackChapter.bibleVersion,
    };
  }
};

// ADD THIS: Test function for Bible API
exports.testBibleApi = onRequest(async (request, response) => {
  try {
    const reference = request.query.reference || "John 3:16";
    logger.info(`Testing Bible API with reference: ${reference}`);

    const chapterData = await getChapterText(reference);

    response.json({
      success: true,
      message: "Bible API test successful",
      input: reference,
      result: chapterData,
      preview: chapterData.chapterText.substring(0, 200) + "...",
    });
  } catch (error) {
    logger.error("Error testing Bible API:", error);
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

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

    const targetDate = getDateWithOffset(2);
    const dateString = formatDate(targetDate);

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
        if (data.uid && data.uid === uid) return;
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
    const notification = {
      to: user.expoPushToken,
      sound: "default",
      title: "Someone encouraged you!",
      body: encouragement.message?.length
        ? `"${encouragement.message.slice(0, 100)}"`
        : "Someone sent encouragement. Tap to view.",
      data: {
        pleaId: pleaRef.id,
        type: "encouragement", // 👈 ADD THIS FLAG
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

    // For each recipient, check notification preferences
    for (const recipientUid of recipients) {
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(recipientUid)
        .get();
      if (!userDoc.exists) continue;

      const userData = userDoc.data();
      // Default to true if not set (optional: up to you)
      const wantsMessages = userData.notificationPreferences?.messages ?? true;
      const expoPushToken = userData.expoPushToken;

      if (
        wantsMessages &&
        expoPushToken &&
        expoPushToken.startsWith("ExponentPushToken")
      ) {
        // Send push notification
        try {
          await axios.post(
            "https://exp.host/--/api/v2/push/send",
            [
              {
                to: expoPushToken,
                sound: "default",
                title: "New Message",
                body:
                  text && text.length
                    ? text.slice(0, 100)
                    : "You have a new message.",
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

  // --- NEW: Send push notification on REJECTION ---
  if (newStatus === "rejected") {
    try {
      const userSnap = await admin
        .firestore()
        .collection("users")
        .doc(plea.uid)
        .get();
      const userData = userSnap.data();
      const expoPushToken = userData?.expoPushToken;
      if (expoPushToken && expoPushToken.startsWith("ExponentPushToken")) {
        const title = "Your plea for help was not approved";
        const body =
          "We couldn't approve your request. Please make sure it follows our community guidelines.";
        const data = {
          type: "rejection",
          itemType: "plea",
          pleaId: snap.id,
          message: message,
        };
        await sendExpoPushNotification(expoPushToken, title, body, data);
      } else {
        logger.warn(`No expoPushToken for user ${plea.uid}`);
      }
    } catch (err) {
      logger.error("Error sending push notification for rejected plea:", err);
    }
  }
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

    // --- NEW: Send push notification on REJECTION ---
    if (newStatus === "rejected") {
      try {
        const userSnap = await admin
          .firestore()
          .collection("users")
          .doc(post.uid)
          .get();
        const userData = userSnap.data();
        const expoPushToken = userData?.expoPushToken;
        if (expoPushToken && expoPushToken.startsWith("ExponentPushToken")) {
          const title = "Your post was not approved";
          const body =
            "We couldn't approve your post. Please make sure it follows our community guidelines.";
          const data = {
            type: "rejection",
            itemType: "post",
            postId: snap.id,
            message: combinedText,
          };
          await sendExpoPushNotification(expoPushToken, title, body, data);
        } else {
          logger.warn(`No expoPushToken for user ${post.uid}`);
        }
      } catch (err) {
        logger.error("Error sending push notification for rejected post:", err);
      }
    }
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
