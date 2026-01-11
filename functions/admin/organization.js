const { onCall } = require("firebase-functions/v2/https");
const { HttpsError } = require("firebase-functions/v2/https");
const { admin } = require("../utils/database");

const PLATFORM_ADMIN_UID = "yKzJx7a37sPPrDNGnMQ7prpEAbO2";

/**
 * Helper function to convert organization name to document ID
 * Removes spaces, special characters, and converts to camelCase
 */
function nameToDocId(name) {
  // Remove all special characters except spaces
  const cleaned = name.replace(/[^a-zA-Z0-9\s]/g, "");

  // Split by spaces and convert to camelCase
  const words = cleaned.split(/\s+/).filter((word) => word.length > 0);

  if (words.length === 0) {
    throw new HttpsError("invalid-argument", "Invalid organization name");
  }

  // First word lowercase, rest capitalized
  return words
    .map((word, index) => {
      if (index === 0) {
        return word.toLowerCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join("");
}

/**
 * Generate a unique 6-digit PIN
 */
async function generateUniquePin(db) {
  const maxAttempts = 100;

  for (let i = 0; i < maxAttempts; i++) {
    // Generate random 6-digit PIN
    const pin = Math.floor(100000 + Math.random() * 900000).toString();

    // Check if PIN already exists
    const orgsSnapshot = await db
      .collection("organizations")
      .where("pin", "==", pin)
      .limit(1)
      .get();

    if (orgsSnapshot.empty) {
      return pin;
    }
  }

  throw new HttpsError("internal", "Failed to generate unique PIN");
}

/**
 * Get the last N documents from a collection sorted by document ID (date format)
 */
async function getLastNDocuments(collectionRef, n) {
  const snapshot = await collectionRef.get();

  // Sort document IDs (which are dates like "2026-01-09") in descending order
  const docs = snapshot.docs.sort((a, b) => {
    return b.id.localeCompare(a.id);
  });

  // Return the first N documents (most recent)
  return docs.slice(0, n);
}

/**
 * Copy a collection from source to destination
 */
async function copyCollection(sourceRef, destRef) {
  const snapshot = await sourceRef.get();

  const batch = admin.firestore().batch();
  snapshot.docs.forEach((doc) => {
    const destDocRef = destRef.doc(doc.id);
    batch.set(destDocRef, doc.data());
  });

  await batch.commit();
}

/**
 * Create a new organization
 * Platform admin only
 */
exports.createOrganization = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "User must be authenticated");
  }

  const uid = request.auth.uid;

  // Check if user is platform admin
  if (uid !== PLATFORM_ADMIN_UID) {
    throw new HttpsError(
      "permission-denied",
      "Only platform admins can create organizations"
    );
  }

  const { name, mission } = request.data;

  // Validate input
  if (!name || typeof name !== "string" || name.trim().length === 0) {
    throw new HttpsError("invalid-argument", "Organization name is required");
  }

  try {
    const db = admin.firestore();

    // Convert name to document ID
    const orgId = nameToDocId(name.trim());

    console.log(`📝 Creating organization: ${name} (${orgId})`);

    // Check if organization already exists
    const orgRef = db.collection("organizations").doc(orgId);
    const orgDoc = await orgRef.get();

    if (orgDoc.exists) {
      throw new HttpsError(
        "already-exists",
        "An organization with this name already exists"
      );
    }

    // Generate unique PIN
    const pin = await generateUniquePin(db);
    console.log(`🔢 Generated PIN: ${pin}`);

    // Create organization document
    await orgRef.set({
      name: name.trim(),
      mission: mission?.trim() || "",
      pin: pin,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`✅ Created organization document`);

    // Copy config collection from public
    const publicConfigRef = db
      .collection("organizations")
      .doc("public")
      .collection("config");
    const orgConfigRef = orgRef.collection("config");

    await copyCollection(publicConfigRef, orgConfigRef);
    console.log(`✅ Copied config collection`);

    // Copy last 7 documents from dailyContent
    const publicDailyContentRef = db
      .collection("organizations")
      .doc("public")
      .collection("dailyContent");

    const recentDocs = await getLastNDocuments(publicDailyContentRef, 7);

    const batch = db.batch();
    const orgDailyContentRef = orgRef.collection("dailyContent");

    recentDocs.forEach((doc) => {
      const destDocRef = orgDailyContentRef.doc(doc.id);
      batch.set(destDocRef, doc.data());
    });

    await batch.commit();
    console.log(`✅ Copied last 7 dailyContent documents`);

    console.log(`🎉 Organization ${name} created successfully!`);

    return {
      success: true,
      organizationId: orgId,
      name: name.trim(),
      pin: pin,
    };
  } catch (error) {
    console.error(`❌ Error creating organization:`, error);

    // Re-throw HttpsErrors as-is
    if (error instanceof HttpsError) {
      throw error;
    }

    // Wrap other errors
    throw new HttpsError(
      "internal",
      `Failed to create organization: ${error.message}`
    );
  }
});
