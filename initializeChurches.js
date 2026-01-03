// scripts/initializeChurches.js
// Run with: node scripts/initializeChurches.js

const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

// Churches to initialize
const CHURCHES_TO_INIT = ["aletheia", "testChurch1", "testChurch2"];

async function initializeChurch(orgId) {
  console.log(`\n🏛️  Initializing ${orgId}...`);

  try {
    // 1. Copy bibleVerses collection from public
    console.log(`  📖 Copying bibleVerses...`);
    const publicVersesRef = db.collection("organizations/public/bibleVerses");
    const versesSnapshot = await publicVersesRef.get();

    const batch = db.batch();
    let verseCount = 0;

    versesSnapshot.forEach((doc) => {
      const newVerseRef = db.doc(
        `organizations/${orgId}/bibleVerses/${doc.id}`
      );
      batch.set(newVerseRef, doc.data());
      verseCount++;
    });

    await batch.commit();
    console.log(`  ✅ Copied ${verseCount} bible verses`);

    // 2. Copy config documents from public
    console.log(`  ⚙️  Copying config...`);
    const publicConfigRef = db.collection("organizations/public/config");
    const configSnapshot = await publicConfigRef.get();

    const configBatch = db.batch();
    let configCount = 0;

    configSnapshot.forEach((doc) => {
      const newConfigRef = db.doc(`organizations/${orgId}/config/${doc.id}`);
      configBatch.set(newConfigRef, doc.data());
      configCount++;
    });

    await configBatch.commit();
    console.log(`  ✅ Copied ${configCount} config documents`);

    // 3. Copy dailyContent collection from public (optional - you decide)
    console.log(`  📅 Copying dailyContent...`);
    const publicDailyRef = db.collection("organizations/public/dailyContent");
    const dailySnapshot = await publicDailyRef.get();

    const dailyBatch = db.batch();
    let dailyCount = 0;

    dailySnapshot.forEach((doc) => {
      const newDailyRef = db.doc(
        `organizations/${orgId}/dailyContent/${doc.id}`
      );
      dailyBatch.set(newDailyRef, doc.data());
      dailyCount++;
    });

    await dailyBatch.commit();
    console.log(`  ✅ Copied ${dailyCount} dailyContent documents`);

    console.log(`✅ ${orgId} initialized successfully!`);
  } catch (error) {
    console.error(`❌ Error initializing ${orgId}:`, error);
  }
}

async function main() {
  console.log("🚀 Starting church initialization...\n");

  for (const orgId of CHURCHES_TO_INIT) {
    await initializeChurch(orgId);
  }

  console.log("\n🎉 All churches initialized!");
  process.exit(0);
}

main();
