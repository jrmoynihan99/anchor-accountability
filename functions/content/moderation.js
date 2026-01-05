const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const { OpenAI } = require("openai");
const { admin } = require("../utils/database");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get filtering prompt from Firestore config
 */
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

/**
 * Moderate plea on creation
 */
exports.moderatePlea = onDocumentCreated("pleas/{pleaId}", async (event) => {
  const snap = event.data;
  if (!snap) return;
  const plea = snap.data();
  const message = (plea?.message || "").trim();

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
      max_tokens: 20,
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

/**
 * Moderate plea TEST collection on creation
 */
exports.moderatePleaTEST = onDocumentCreated(
  "pleas_test/{pleaId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const plea = snap.data();
    const message = (plea?.message || "").trim();

    logger.info(`[moderatePleaTEST] Message: "${message}"`);

    if (!message) {
      await snap.ref.update({ status: "approved" });
      logger.info(`Plea ${snap.id} has empty context, auto-approved.`);
      return;
    }

    let rejectionReason = null;
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
        max_tokens: 20,
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

/**
 * Moderate encouragement on creation
 */
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

/**
 * Moderate encouragement TEST collection on creation
 */
exports.moderateEncouragementTEST = onDocumentCreated(
  "pleas_test/{pleaId}/encouragements/{encId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    const encouragement = snap.data();
    const message = (encouragement?.message || "").trim();

    let rejectionReason = null;

    if (!message) {
      await snap.ref.update({
        status: "rejected",
        rejectionReason: "Message cannot be empty",
      });
      logger.info(`Encouragement ${snap.id} was blank, auto-rejected.`);
      return;
    }

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

/**
 * Moderate community post on creation
 */
exports.moderatePost = onDocumentCreated(
  "communityPosts/{postId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const post = snap.data();
    const title = (post?.title || "").trim();
    const content = (post?.content || "").trim();

    let rejectionReason = null;

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

/**
 * Moderate community post TEST collection on creation
 */
exports.moderatePostTEST = onDocumentCreated(
  "communityPosts_test/{postId}",
  async (event) => {
    const snap = event.data;
    if (!snap) return;

    const post = snap.data();
    const title = (post?.title || "").trim();
    const content = (post?.content || "").trim();

    let rejectionReason = null;

    logger.info(`[moderatePostTEST] Title: "${title}" | Content: "${content}"`);

    if (!title && !content) {
      await snap.ref.update({
        status: "rejected",
        rejectionReason: "Post cannot be empty",
      });
      logger.info(`Post ${snap.id} was blank, auto-rejected.`);
      return;
    }

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

/**
 * Moderate comment on creation
 */
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
