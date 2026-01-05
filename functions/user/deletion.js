const functions = require("firebase-functions/v1");
const { admin, deleteBatch } = require("../utils/database");

exports.onUserAccountDeleted = functions.auth.user().onDelete(async (user) => {
  const uid = user.uid;
  console.log(`🗑️ Starting account deletion for user: ${uid}`);

  const results = { uid, timestamp: new Date().toISOString(), success: [], failed: [] };

  try {
    await deleteUserDocument(uid, results);
    await deleteUserThreads(uid, results);
    await updateAccountabilityRelationships(uid, results);
    await deletePleasAndEncouragements(uid, results);
    await deleteCommunityPostsData(uid, results);

    console.log(`✅ Account deletion completed for user: ${uid}`);
    return results;
  } catch (error) {
    console.error(`❌ Critical error during account deletion for ${uid}:`, error);
    results.failed.push({ operation: "overall", error: error.message });
    return results;
  }
});

async function deleteUserDocument(uid, results) {
  try {
    const userRef = admin.firestore().collection("users").doc(uid);
    const streakSnap = await userRef.collection("streak").get();
    if (!streakSnap.empty) {
      const batch = admin.firestore().batch();
      streakSnap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }
    await userRef.delete();
    results.success.push({ operation: "deleteUserDocument", details: `Deleted user document and ${streakSnap.size} streak entries` });
  } catch (error) {
    results.failed.push({ operation: "deleteUserDocument", error: error.message });
  }
}

async function deleteUserThreads(uid, results) {
  try {
    const db = admin.firestore();
    const threadsAsASnap = await db.collection("threads").where("userA", "==", uid).get();
    const threadsAsBSnap = await db.collection("threads").where("userB", "==", uid).get();
    const allThreadDocs = [...threadsAsASnap.docs, ...threadsAsBSnap.docs];

    if (allThreadDocs.length === 0) {
      results.success.push({ operation: "deleteUserThreads", details: "No threads to delete" });
      return;
    }

    let totalDeleted = 0;
    for (const threadDoc of allThreadDocs) {
      try {
        const messagesSnap = await threadDoc.ref.collection("messages").get();
        if (!messagesSnap.empty) await deleteBatch(messagesSnap.docs.map((doc) => doc.ref));
        await threadDoc.ref.delete();
        totalDeleted++;
      } catch (error) {
        console.error(`Error deleting thread ${threadDoc.id}:`, error);
      }
    }
    results.success.push({ operation: "deleteUserThreads", details: `Deleted ${totalDeleted} threads` });
  } catch (error) {
    results.failed.push({ operation: "deleteUserThreads", error: error.message });
  }
}

async function updateAccountabilityRelationships(uid, results) {
  try {
    const db = admin.firestore();
    const asMentorSnap = await db.collection("accountabilityRelationships").where("mentorUid", "==", uid).get();
    const asMenteeSnap = await db.collection("accountabilityRelationships").where("menteeUid", "==", uid).get();
    const allRelationships = [...asMentorSnap.docs, ...asMenteeSnap.docs];

    if (allRelationships.length === 0) {
      results.success.push({ operation: "updateAccountabilityRelationships", details: "No relationships to update" });
      return;
    }

    const batch = admin.firestore().batch();
    let count = 0;
    for (const doc of allRelationships) {
      batch.update(doc.ref, { status: "deleted", updatedAt: admin.firestore.FieldValue.serverTimestamp() });
      count++;
      if (count % 500 === 0) await batch.commit();
    }
    if (count % 500 !== 0) await batch.commit();
    results.success.push({ operation: "updateAccountabilityRelationships", details: `Updated ${count} relationships` });
  } catch (error) {
    results.failed.push({ operation: "updateAccountabilityRelationships", error: error.message });
  }
}

async function deletePleasAndEncouragements(uid, results) {
  try {
    const db = admin.firestore();
    const userPleasSnap = await db.collection("pleas").where("uid", "==", uid).get();
    let pleasDeleted = 0;

    for (const pleaDoc of userPleasSnap.docs) {
      try {
        const encouragementsSnap = await pleaDoc.ref.collection("encouragements").get();
        if (!encouragementsSnap.empty) await deleteBatch(encouragementsSnap.docs.map((doc) => doc.ref));
        await pleaDoc.ref.delete();
        pleasDeleted++;
      } catch (error) {
        console.error(`Error deleting plea ${pleaDoc.id}:`, error);
      }
    }

    const allPleasSnap = await db.collection("pleas").get();
    let encouragementsDeleted = 0;

    for (const pleaDoc of allPleasSnap.docs) {
      if (pleaDoc.data().uid === uid) continue;
      try {
        const encouragementsSnap = await pleaDoc.ref.collection("encouragements").where("helperUid", "==", uid).get();
        if (!encouragementsSnap.empty) {
          await deleteBatch(encouragementsSnap.docs.map((doc) => doc.ref));
          encouragementsDeleted += encouragementsSnap.size;
        }
      } catch (error) {
        console.error(`Error deleting encouragements from plea ${pleaDoc.id}:`, error);
      }
    }

    results.success.push({ operation: "deletePleasAndEncouragements", details: `Deleted ${pleasDeleted} pleas and ${encouragementsDeleted} encouragements` });
  } catch (error) {
    results.failed.push({ operation: "deletePleasAndEncouragements", error: error.message });
  }
}

async function deleteCommunityPostsData(uid, results) {
  try {
    const db = admin.firestore();
    const userPostsSnap = await db.collection("communityPosts").where("uid", "==", uid).get();
    let postsDeleted = 0;

    for (const postDoc of userPostsSnap.docs) {
      try {
        const commentsSnap = await postDoc.ref.collection("comments").get();
        if (!commentsSnap.empty) {
          for (const commentDoc of commentsSnap.docs) {
            const commentLikesSnap = await commentDoc.ref.collection("likes").get();
            if (!commentLikesSnap.empty) await deleteBatch(commentLikesSnap.docs.map((doc) => doc.ref));
          }
          await deleteBatch(commentsSnap.docs.map((doc) => doc.ref));
        }
        const likesSnap = await postDoc.ref.collection("likes").get();
        if (!likesSnap.empty) await deleteBatch(likesSnap.docs.map((doc) => doc.ref));
        await postDoc.ref.delete();
        postsDeleted++;
      } catch (error) {
        console.error(`Error deleting post ${postDoc.id}:`, error);
      }
    }

    const allPostsSnap = await db.collection("communityPosts").get();
    let postLikesDeleted = 0, commentsDeleted = 0, commentLikesDeleted = 0;

    for (const postDoc of allPostsSnap.docs) {
      if (postDoc.data().uid === uid) continue;
      try {
        const likeDoc = await postDoc.ref.collection("likes").doc(uid).get();
        if (likeDoc.exists) {
          await likeDoc.ref.delete();
          postLikesDeleted++;
          await postDoc.ref.update({ likeCount: admin.firestore.FieldValue.increment(-1) });
        }
      } catch (error) {}

      try {
        const userCommentsSnap = await postDoc.ref.collection("comments").where("uid", "==", uid).get();
        if (!userCommentsSnap.empty) {
          for (const commentDoc of userCommentsSnap.docs) {
            const commentLikesSnap = await commentDoc.ref.collection("likes").get();
            if (!commentLikesSnap.empty) await deleteBatch(commentLikesSnap.docs.map((doc) => doc.ref));
            await commentDoc.ref.delete();
            commentsDeleted++;
          }
        }
      } catch (error) {}

      try {
        const commentsSnap = await postDoc.ref.collection("comments").get();
        for (const commentDoc of commentsSnap.docs) {
          if (commentDoc.data().uid === uid) continue;
          const likeDoc = await commentDoc.ref.collection("likes").doc(uid).get();
          if (likeDoc.exists) {
            await likeDoc.ref.delete();
            commentLikesDeleted++;
            await commentDoc.ref.update({ likeCount: admin.firestore.FieldValue.increment(-1) });
          }
        }
      } catch (error) {}
    }

    results.success.push({ operation: "deleteCommunityPostsData", details: `Deleted ${postsDeleted} posts, ${postLikesDeleted} post likes, ${commentsDeleted} comments, ${commentLikesDeleted} comment likes` });
  } catch (error) {
    results.failed.push({ operation: "deleteCommunityPostsData", error: error.message });
  }
}
