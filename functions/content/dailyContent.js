const { onRequest } = require("firebase-functions/https");
const { onSchedule } = require("firebase-functions/scheduler");
const logger = require("firebase-functions/logger");
const { OpenAI } = require("openai");
const {
  admin,
  formatDate,
  getDateWithOffset,
  getAllOrgIds,
} = require("../utils/database");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate daily content with GPT-generated prayer for a specific organization
 *
 * This uses SHARED bible verses (root level) but generates org-specific content
 * based on that org's history of recently used verses.
 *
 * @param {string} orgId - Organization ID
 * @param {string} targetDate - Date string in YYYY-MM-DD format
 * @returns {Promise<Object>} Generated content object
 */
const generateDailyContent = async (orgId, targetDate) => {
  // 1. Get recent used verses from THIS org's history
  const recentSnapshot = await admin
    .firestore()
    .collection(`organizations/${orgId}/dailyContent`)
    .orderBy("date", "desc")
    .limit(6)
    .get();

  const usedRefs = new Set();
  recentSnapshot.forEach((doc) => {
    const d = doc.data();
    if (d.reference) usedRefs.add(d.reference);
    if (d.chapterReference) usedRefs.add(d.chapterReference);
  });

  // 2. Get all bible verses from SHARED collection (root level)
  const bibleVersesSnap = await admin
    .firestore()
    .collection("bibleVerses") // ← SHARED across all orgs
    .get();

  const candidates = bibleVersesSnap.docs
    .map((doc) => doc.data())
    .filter(
      (d) => !usedRefs.has(d.reference) && !usedRefs.has(d.chapterReference)
    );

  if (!candidates.length)
    throw new Error(
      `No eligible bible verses found for org ${orgId} on ${targetDate}.`
    );

  const picked = candidates[Math.floor(Math.random() * candidates.length)];

  // 3. Get GPT prompt from THIS org's config
  const promptDoc = await admin
    .firestore()
    .doc(`organizations/${orgId}/config/dailyContentPrompt`)
    .get();

  const customPrompt = promptDoc.exists ? promptDoc.data().prompt : null;

  // 4. Generate prayer content with GPT
  const gptPrompt =
    customPrompt ||
    `
Here is today's Bible verse:

Reference: ${picked.reference}
Text: ${picked.text}

Please write a short, heartfelt prayer (2-3 sentences) that:
1. Reflects on the meaning and message of this verse
2. Asks God for help in applying this truth to daily life
3. Uses warm, accessible language
4. Ends with "Amen"

Keep it concise and meaningful.
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: gptPrompt }],
    temperature: 0.8,
  });

  const prayerText = completion.choices[0].message.content.trim();

  logger.info(
    `Generated content for org ${orgId} on ${targetDate}: ${picked.reference}`
  );

  return {
    date: targetDate,
    reference: picked.reference,
    text: picked.text,
    chapterReference: picked.chapterReference || picked.reference,
    prayer: prayerText,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  };
};

/**
 * Test endpoint to generate content without saving
 * Usage: GET /testGenerateContent?orgId=public&date=2026-01-10
 */
exports.testGenerateContent = onRequest(async (request, response) => {
  try {
    const orgId = request.query.orgId || "public";
    const targetDate = request.query.date || formatDate(new Date());

    logger.info(`Test generating content for org ${orgId} on ${targetDate}`);

    const content = await generateDailyContent(orgId, targetDate);

    response.json({
      success: true,
      message: "Content generated successfully (test mode - not saved)",
      content: content,
      orgId: orgId,
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

/**
 * Update the daily content prompt in Firestore for a specific org
 * Usage: POST /updatePrompt with body: { orgId: "public", prompt: "..." }
 */
exports.updatePrompt = onRequest(async (request, response) => {
  try {
    const { orgId, prompt } = request.body;

    if (!orgId) {
      return response.status(400).json({
        success: false,
        error: "orgId is required",
      });
    }

    if (!prompt) {
      return response.status(400).json({
        success: false,
        error: "Prompt is required",
      });
    }

    // Update THIS org's prompt
    await admin
      .firestore()
      .doc(`organizations/${orgId}/config/dailyContentPrompt`)
      .set({
        prompt: prompt,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    response.json({
      success: true,
      message: `Prompt updated successfully for org ${orgId}`,
      orgId: orgId,
    });
  } catch (error) {
    logger.error("Error updating prompt:", error);
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Manual endpoint to create content for a specific date and org
 * Usage: GET /createContentNow?orgId=public&date=2026-01-10
 */
exports.createContentNow = onRequest(async (request, response) => {
  try {
    const orgId = request.query.orgId || "public";
    const dateString = request.query.date || formatDate(getDateWithOffset(2));

    logger.info(
      `Manual content creation triggered for org ${orgId} on ${dateString}`
    );

    const content = await generateDailyContent(orgId, dateString);

    // Save to THIS org's dailyContent collection
    await admin
      .firestore()
      .doc(`organizations/${orgId}/dailyContent/${dateString}`)
      .set(content);

    logger.info(
      `Successfully created content for org ${orgId} on ${dateString}`
    );

    response.json({
      success: true,
      message: `Content created for org ${orgId} on ${dateString}`,
      content: content,
      orgId: orgId,
      firebaseUrl: `https://console.firebase.google.com/project/accountability-app-a7767/firestore/data/organizations~2F${orgId}~2FdailyContent~2F${dateString}`,
    });
  } catch (error) {
    logger.error("Error creating content:", error);
    response.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Scheduled function to generate daily content at 2 AM UTC for ALL organizations
 *
 * This loops through all orgs and generates unique daily content for each,
 * using the shared bible verses pool but respecting each org's usage history.
 */
exports.generateDailyContentScheduled = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "UTC",
  },
  async (context) => {
    logger.info("Starting scheduled daily content generation for all orgs...");

    try {
      const targetDate = getDateWithOffset(2);
      const dateString = formatDate(targetDate);

      // Get all organization IDs
      const orgIds = await getAllOrgIds();
      logger.info(`Generating content for ${orgIds.length} organizations`);

      // Generate content for each org
      for (const orgId of orgIds) {
        try {
          logger.info(`Generating content for org: ${orgId}`);

          const content = await generateDailyContent(orgId, dateString);

          await admin
            .firestore()
            .doc(`organizations/${orgId}/dailyContent/${dateString}`)
            .set(content);

          logger.info(`✅ Successfully created content for org ${orgId}`);
        } catch (orgError) {
          // Log error but continue with other orgs
          logger.error(
            `❌ Error generating content for org ${orgId}:`,
            orgError
          );
        }
      }

      logger.info("Scheduled content generation completed for all orgs");
    } catch (error) {
      logger.error("Error in scheduled content generation:", error);
      throw error;
    }
  }
);
