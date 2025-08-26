// hooks/usePostActions.ts
import { auth, db } from "@/lib/firebase";
import {
  deleteDoc,
  doc,
  increment,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { useState } from "react";

export function usePostActions() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Toggle like on a post
  const toggleLike = async (postId: string, currentlyLiked: boolean) => {
    if (!auth.currentUser) {
      setError("You must be logged in to like posts");
      return false;
    }

    setActionLoading(`like-${postId}`);
    setError(null);

    try {
      const userId = auth.currentUser.uid;
      const likeRef = doc(db, "communityPosts", postId, "likes", userId);
      const postRef = doc(db, "communityPosts", postId);

      if (currentlyLiked) {
        // Unlike
        await deleteDoc(likeRef);
        await updateDoc(postRef, {
          likeCount: increment(-1),
        });
        console.log("Post unliked");
      } else {
        // Like
        await setDoc(likeRef, {
          createdAt: serverTimestamp(),
        });
        await updateDoc(postRef, {
          likeCount: increment(1),
        });
        console.log("Post liked");
      }

      return true;
    } catch (err) {
      console.error("Error toggling like:", err);
      setError("Failed to update like status");
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  // Edit a post (only within time limit)
  const editPost = async (postId: string, title: string, content: string) => {
    if (!auth.currentUser) {
      setError("You must be logged in to edit posts");
      return false;
    }

    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return false;
    }

    setActionLoading(`edit-${postId}`);
    setError(null);

    try {
      const postRef = doc(db, "communityPosts", postId);

      // The Cloud Function or security rules will verify:
      // 1. User owns the post
      // 2. Still within edit time limit

      await updateDoc(postRef, {
        title: title.trim(),
        content: content.trim(),
        updatedAt: serverTimestamp(),
      });

      console.log("Post edited successfully");
      return true;
    } catch (err) {
      console.error("Error editing post:", err);
      if (err instanceof Error && err.message.includes("permission")) {
        setError("You can no longer edit this post (15 minute limit)");
      } else {
        setError("Failed to edit post");
      }
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  // Soft delete a post
  const deletePost = async (postId: string) => {
    if (!auth.currentUser) {
      setError("You must be logged in to delete posts");
      return false;
    }

    setActionLoading(`delete-${postId}`);
    setError(null);

    try {
      const postRef = doc(db, "communityPosts", postId);

      // Soft delete - just mark as deleted
      await updateDoc(postRef, {
        isDeleted: true,
        updatedAt: serverTimestamp(),
      });

      console.log("Post deleted successfully");
      return true;
    } catch (err) {
      console.error("Error deleting post:", err);
      setError("Failed to delete post");
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  // Report a post (for future moderation)
  const reportPost = async (postId: string, reason: string) => {
    if (!auth.currentUser) {
      setError("You must be logged in to report posts");
      return false;
    }

    setActionLoading(`report-${postId}`);
    setError(null);

    try {
      // You could create a reports collection later
      // For now, just log it
      console.log(`Post ${postId} reported for: ${reason}`);

      // In the future:
      // await addDoc(collection(db, "reports"), {
      //   postId,
      //   reportedBy: auth.currentUser.uid,
      //   reason,
      //   createdAt: serverTimestamp(),
      //   type: "post",
      //   status: "pending"
      // });

      return true;
    } catch (err) {
      console.error("Error reporting post:", err);
      setError("Failed to report post");
      return false;
    } finally {
      setActionLoading(null);
    }
  };

  return {
    toggleLike,
    editPost,
    deletePost,
    reportPost,
    actionLoading,
    error,
  };
}
