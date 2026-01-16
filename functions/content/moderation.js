const { onDocumentCreated } = require("firebase-functions/v2/firestore");
const logger = require("firebase-functions/logger");
const { OpenAI } = require("openai");
const { admin } = require("../utils/database");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Get filtering prompt from org-specific Firestore config
 *
 * @param {string} orgId - Organization ID
 * @param {string} type - Prompt type (plea, encouragement, post, comment, or TEST versions)
 * @returns {Promise<string>} Filtering prompt
 */
async function getFilteringPrompt(orgId, type = "plea") {
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
    // Get from THIS org's config
    const doc = await admin
      .firestore()
      .doc(`organizations/${orgId}/config/${docId}`)
      .get();

    if (doc.exists) {
      return doc.data().prompt;
    }
  } catch (error) {
    logger.error(`Error fetching ${docId} from org ${orgId}:`, error);
  }

  // Fallback prompts if config doesn't exist
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
exports.moderatePlea = onDocumentCreated(
  "organizations/{orgId}/pleas/{pleaId}",
  async (event) => {
    const orgId = event.params.orgId;
    const snap = event.data;
    if (!snap) return;
    const plea = snap.data();
    const message = (plea?.message || "").trim();

    logger.info(`[moderatePlea] Org: ${orgId}, Message: "${message}"`);

    // If message/context is blank, auto-approve
    if (!message) {
      await snap.ref.update({ status: "approved" });
      logger.info(
        `Plea ${snap.id} in org ${orgId} has empty context, auto-approved.`
      );
      return;
    }

    let rejectionReason = null;

    // GPT moderation with org-specific Firestore prompt
    let gptFlagged = false;
    try {
      const filteringPrompt = await getFilteringPrompt(orgId, "plea");
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
    logger.info(
      `Moderation result for plea ${snap.id} in org ${orgId}: ${newStatus}`
    );

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
 * Moderate plea TEST collection on creation
 */
exports.moderatePleaTEST = onDocumentCreated(
  "organizations/{orgId}/pleas_test/{pleaId}",
  async (event) => {
    const orgId = event.params.orgId;
    const snap = event.data;
    if (!snap) return;
    const plea = snap.data();
    const message = (plea?.message || "").trim();

    logger.info(`[moderatePleaTEST] Org: ${orgId}, Message: "${message}"`);

    if (!message) {
      await snap.ref.update({ status: "approved" });
      logger.info(
        `TEST Plea ${snap.id} in org ${orgId} has empty context, auto-approved.`
      );
      return;
    }

    let rejectionReason = null;
    let gptFlagged = false;

    try {
      const filteringPrompt = await getFilteringPrompt(orgId, "pleaTEST");
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
      logger.error("GPT moderation TEST failed:", err);
      gptFlagged = true;
      rejectionReason = "Unable to process message at this time";
    }

    const newStatus = gptFlagged ? "rejected" : "approved";
    logger.info(
      `TEST moderation result for plea ${snap.id} in org ${orgId}: ${newStatus}`
    );

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
  "organizations/{orgId}/pleas/{pleaId}/encouragements/{encId}",
  async (event) => {
    const orgId = event.params.orgId;
    const snap = event.data;
    if (!snap) return;
    const encouragement = snap.data();
    const message = (encouragement?.message || "").trim();

    logger.info(`[moderateEncouragement] Org: ${orgId}, Message: "${message}"`);

    if (!message) {
      await snap.ref.update({ status: "approved" });
      logger.info(
        `Encouragement ${snap.id} in org ${orgId} has empty message, auto-approved.`
      );
      return;
    }

    let rejectionReason = null;
    let gptFlagged = false;

    try {
      const filteringPrompt = await getFilteringPrompt(orgId, "encouragement");
      logger.info(`[moderateEncouragement] Using prompt: ${filteringPrompt}`);
      const promptText = filteringPrompt.replace("{message}", message);

      const gptCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: promptText }],
        temperature: 0,
        max_tokens: 20,
      });

      const result = gptCheck.choices[0].message.content.trim();
      logger.info(`[moderateEncouragement] GPT result: ${result}`);

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
      logger.error("GPT encouragement moderation failed:", err);
      gptFlagged = true;
      rejectionReason = "Unable to process message at this time";
    }

    const newStatus = gptFlagged ? "rejected" : "approved";
    logger.info(
      `Moderation result for encouragement ${snap.id} in org ${orgId}: ${newStatus}`
    );

    const updateData = { status: newStatus };
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
  "organizations/{orgId}/encouragements_test/{encId}",
  async (event) => {
    const orgId = event.params.orgId;
    const snap = event.data;
    if (!snap) return;
    const encouragement = snap.data();
    const message = (encouragement?.message || "").trim();

    logger.info(
      `[moderateEncouragementTEST] Org: ${orgId}, Message: "${message}"`
    );

    if (!message) {
      await snap.ref.update({ status: "approved" });
      logger.info(
        `TEST Encouragement ${snap.id} in org ${orgId} has empty message, auto-approved.`
      );
      return;
    }

    let rejectionReason = null;
    let gptFlagged = false;

    try {
      const filteringPrompt = await getFilteringPrompt(
        orgId,
        "encouragementTEST"
      );
      logger.info(
        `[moderateEncouragementTEST] Using prompt: ${filteringPrompt}`
      );
      const promptText = filteringPrompt.replace("{message}", message);

      const gptCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: promptText }],
        temperature: 0,
        max_tokens: 20,
      });

      const result = gptCheck.choices[0].message.content.trim();
      logger.info(`[moderateEncouragementTEST] GPT result: ${result}`);

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
      logger.error("GPT encouragement TEST moderation failed:", err);
      gptFlagged = true;
      rejectionReason = "Unable to process message at this time";
    }

    const newStatus = gptFlagged ? "rejected" : "approved";
    logger.info(
      `TEST moderation result for encouragement ${snap.id} in org ${orgId}: ${newStatus}`
    );

    const updateData = { status: newStatus };
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await snap.ref.update(updateData);
  }
);

/**
 * Moderate post on creation
 */
exports.moderatePost = onDocumentCreated(
  "organizations/{orgId}/communityPosts/{postId}",
  async (event) => {
    const orgId = event.params.orgId;
    const snap = event.data;
    if (!snap) return;
    const post = snap.data();
    const content = (post?.content || "").trim();

    logger.info(`[moderatePost] Org: ${orgId}, Content: "${content}"`);

    if (!content) {
      await snap.ref.update({ status: "approved" });
      logger.info(
        `Post ${snap.id} in org ${orgId} has empty content, auto-approved.`
      );
      return;
    }

    let rejectionReason = null;
    let gptFlagged = false;

    try {
      const filteringPrompt = await getFilteringPrompt(orgId, "post");
      logger.info(`[moderatePost] Using prompt: ${filteringPrompt}`);
      const promptText = filteringPrompt.replace("{message}", content);

      const gptCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: promptText }],
        temperature: 0,
        max_tokens: 20,
      });

      const result = gptCheck.choices[0].message.content.trim();
      logger.info(`[moderatePost] GPT result: ${result}`);

      if (result !== "ALLOW") {
        gptFlagged = true;
        if (result === "BLOCK: hateful/derogatory") {
          rejectionReason = "Content contains hateful or derogatory language";
        } else if (result === "BLOCK: spam/trolling") {
          rejectionReason = "Content appears to be spam or trolling";
        } else {
          rejectionReason = "Content doesn't align with community guidelines";
        }
      }
    } catch (err) {
      logger.error("GPT post moderation failed:", err);
      gptFlagged = true;
      rejectionReason = "Unable to process content at this time";
    }

    const newStatus = gptFlagged ? "rejected" : "approved";
    logger.info(
      `Moderation result for post ${snap.id} in org ${orgId}: ${newStatus}`
    );

    const updateData = { status: newStatus };
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await snap.ref.update(updateData);
  }
);

/**
 * Moderate post TEST collection on creation
 */
exports.moderatePostTEST = onDocumentCreated(
  "organizations/{orgId}/communityPosts_test/{postId}",
  async (event) => {
    const orgId = event.params.orgId;
    const snap = event.data;
    if (!snap) return;
    const post = snap.data();
    const content = (post?.content || "").trim();

    logger.info(`[moderatePostTEST] Org: ${orgId}, Content: "${content}"`);

    if (!content) {
      await snap.ref.update({ status: "approved" });
      logger.info(
        `TEST Post ${snap.id} in org ${orgId} has empty content, auto-approved.`
      );
      return;
    }

    let rejectionReason = null;
    let gptFlagged = false;

    try {
      const filteringPrompt = await getFilteringPrompt(orgId, "postTEST");
      logger.info(`[moderatePostTEST] Using prompt: ${filteringPrompt}`);
      const promptText = filteringPrompt.replace("{message}", content);

      const gptCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: promptText }],
        temperature: 0,
        max_tokens: 20,
      });

      const result = gptCheck.choices[0].message.content.trim();
      logger.info(`[moderatePostTEST] GPT result: ${result}`);

      if (result !== "ALLOW") {
        gptFlagged = true;
        if (result === "BLOCK: hateful/derogatory") {
          rejectionReason = "Content contains hateful or derogatory language";
        } else if (result === "BLOCK: spam/trolling") {
          rejectionReason = "Content appears to be spam or trolling";
        } else {
          rejectionReason = "Content doesn't align with community guidelines";
        }
      }
    } catch (err) {
      logger.error("GPT post TEST moderation failed:", err);
      gptFlagged = true;
      rejectionReason = "Unable to process content at this time";
    }

    const newStatus = gptFlagged ? "rejected" : "approved";
    logger.info(
      `TEST moderation result for post ${snap.id} in org ${orgId}: ${newStatus}`
    );

    const updateData = { status: newStatus };
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await snap.ref.update(updateData);
  }
);

/**
 * Moderate comment on creation
 */
exports.moderateComment = onDocumentCreated(
  "organizations/{orgId}/communityPosts/{postId}/comments/{commentId}",
  async (event) => {
    const orgId = event.params.orgId;
    const snap = event.data;
    if (!snap) return;
    const comment = snap.data();
    const content = (comment?.content || "").trim();

    logger.info(`[moderateComment] Org: ${orgId}, Content: "${content}"`);

    if (!content) {
      await snap.ref.update({ status: "approved" });
      logger.info(
        `Comment ${snap.id} in org ${orgId} has empty content, auto-approved.`
      );
      return;
    }

    let rejectionReason = null;
    let gptFlagged = false;

    try {
      const filteringPrompt = await getFilteringPrompt(orgId, "comment");
      logger.info(`[moderateComment] Using prompt: ${filteringPrompt}`);
      const promptText = filteringPrompt.replace("{message}", content);

      const gptCheck = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "system", content: promptText }],
        temperature: 0,
        max_tokens: 20,
      });

      const result = gptCheck.choices[0].message.content.trim();
      logger.info(`[moderateComment] GPT result: ${result}`);

      if (result !== "ALLOW") {
        gptFlagged = true;
        if (result === "BLOCK: hateful/derogatory") {
          rejectionReason = "Content contains hateful or derogatory language";
        } else if (result === "BLOCK: spam/trolling") {
          rejectionReason = "Content appears to be spam or trolling";
        } else {
          rejectionReason = "Content doesn't align with community guidelines";
        }
      }
    } catch (err) {
      logger.error("GPT comment moderation failed:", err);
      gptFlagged = true;
      rejectionReason = "Unable to process content at this time";
    }

    const newStatus = gptFlagged ? "rejected" : "approved";
    logger.info(
      `Moderation result for comment ${snap.id} in org ${orgId}: ${newStatus}`
    );

    const updateData = { status: newStatus };
    if (rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await snap.ref.update(updateData);
  }
);
