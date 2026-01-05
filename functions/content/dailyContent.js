const { onRequest } = require("firebase-functions/https");
const { onSchedule } = require("firebase-functions/scheduler");
const logger = require("firebase-functions/logger");
const { OpenAI } = require("openai");
const { admin, formatDate, getDateWithOffset } = require("../utils/database");

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate daily content with GPT-generated prayer
 */
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

/**
 * Test endpoint for manual content generation
 */
exports.testGenerateContent = onRequest(async (request, response) => {
  try {
    logger.info("Manual content generation test triggered");

    const targetDate = request.query.date || formatDate(new Date());
    const content = await generateDailyContent(targetDate);

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

/**
 * Update the daily content prompt in Firestore
 */
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

/**
 * Manual endpoint to create content for a specific date
 */
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

/**
 * Scheduled function to generate daily content at 2 AM UTC
 */
exports.generateDailyContentScheduled = onSchedule(
  {
    schedule: "0 2 * * *",
    timeZone: "UTC",
  },
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
