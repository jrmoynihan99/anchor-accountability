// hooks/usePostComments.ts
import { PostComment } from "@/components/community/types";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

export function usePostComments(postId: string | null) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);

  // Fetch comments and set up real-time listener
  useEffect(() => {
    if (!postId || !auth.currentUser) {
      setComments([]);
      setLoading(false);
      return;
    }

    const currentUserId = auth.currentUser.uid;

    // Query for approved comments only
    const commentsQuery = query(
      collection(db, "communityPosts", postId, "comments"),
      where("status", "==", "approved"),
      orderBy("createdAt", "asc") // Oldest first for conversation flow
    );

    const unsubscribe = onSnapshot(
      commentsQuery,
      async (snapshot) => {
        try {
          // Process comments and organize into parent/reply structure
          const allComments = await Promise.all(
            snapshot.docs.map(async (docSnap) => {
              const data = docSnap.data();
              const commentId = docSnap.id;

              // Check if current user has liked this comment
              let hasUserLiked = false;
              try {
                const likeRef = doc(
                  db,
                  "communityPosts",
                  postId,
                  "comments",
                  commentId,
                  "likes",
                  currentUserId
                );
                const likeSnap = await new Promise<boolean>((resolve) => {
                  const unsub = onSnapshot(likeRef, (snap) => {
                    resolve(snap.exists());
                    unsub();
                  });
                });
                hasUserLiked = likeSnap;
              } catch (err) {
                console.error("Error checking comment like:", err);
              }

              const authorUsername = `user-${data.uid.substring(0, 5)}`;

              return {
                id: commentId,
                uid: data.uid,
                content: data.content,
                createdAt: data.createdAt?.toDate() || new Date(),
                parentCommentId: data.parentCommentId || null,
                likeCount: data.likeCount || 0,
                status: data.status,
                hasUserLiked,
                authorUsername,
                replies: [], // Will be populated below
              } as PostComment;
            })
          );

          // Organize comments into parent/reply structure
          const parentComments: PostComment[] = [];
          const commentMap = new Map<string, PostComment>();

          // First pass: create map
          allComments.forEach((comment) => {
            commentMap.set(comment.id, comment);
          });

          // Second pass: organize hierarchy
          allComments.forEach((comment) => {
            if (comment.parentCommentId === null) {
              // Top-level comment
              parentComments.push(comment);
            } else {
              // Reply to another comment
              const parent = commentMap.get(comment.parentCommentId);
              if (parent) {
                parent.replies = parent.replies || [];
                parent.replies.push(comment);
              }
            }
          });

          // Sort replies by date
          parentComments.forEach((comment) => {
            if (comment.replies && comment.replies.length > 0) {
              comment.replies.sort(
                (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
              );
            }
          });

          setComments(parentComments);
          setError(null);
        } catch (err) {
          console.error("Error processing comments:", err);
          setError("Failed to load comments");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error listening to comments:", err);
        setError("Failed to load comments");
        setLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [postId, auth.currentUser]);

  // Post a new comment
  const postComment = async (
    content: string,
    parentCommentId: string | null = null
  ): Promise<boolean> => {
    if (!auth.currentUser || !postId) {
      setError("You must be logged in to comment");
      return false;
    }

    if (!content.trim()) {
      setError("Comment cannot be empty");
      return false;
    }

    setPosting(true);
    setError(null);

    try {
      const commentData = {
        uid: auth.currentUser.uid,
        content: content.trim(),
        createdAt: serverTimestamp(),
        parentCommentId,
        likeCount: 0,
        status: "pending", // Will trigger moderation
      };

      const docRef = await addDoc(
        collection(db, "communityPosts", postId, "comments"),
        commentData
      );

      // Update comment count on post
      const postRef = doc(db, "communityPosts", postId);
      await updateDoc(postRef, {
        commentCount: increment(1),
      });

      console.log("Comment posted with ID:", docRef.id);
      return true;
    } catch (err) {
      console.error("Error posting comment:", err);
      setError("Failed to post comment");
      return false;
    } finally {
      setPosting(false);
    }
  };

  // Toggle like on a comment
  const toggleCommentLike = async (
    commentId: string,
    currentlyLiked: boolean
  ): Promise<boolean> => {
    if (!auth.currentUser || !postId) {
      setError("You must be logged in to like comments");
      return false;
    }

    try {
      const userId = auth.currentUser.uid;
      const likeRef = doc(
        db,
        "communityPosts",
        postId,
        "comments",
        commentId,
        "likes",
        userId
      );
      const commentRef = doc(
        db,
        "communityPosts",
        postId,
        "comments",
        commentId
      );

      if (currentlyLiked) {
        // Unlike
        await deleteDoc(likeRef);
        await updateDoc(commentRef, {
          likeCount: increment(-1),
        });
      } else {
        // Like
        await setDoc(likeRef, {
          createdAt: serverTimestamp(),
        });
        await updateDoc(commentRef, {
          likeCount: increment(1),
        });
      }

      return true;
    } catch (err) {
      console.error("Error toggling comment like:", err);
      setError("Failed to update like status");
      return false;
    }
  };

  // Delete own comment
  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!auth.currentUser || !postId) {
      setError("You must be logged in to delete comments");
      return false;
    }

    try {
      const commentRef = doc(
        db,
        "communityPosts",
        postId,
        "comments",
        commentId
      );

      // Could implement soft delete instead
      await deleteDoc(commentRef);

      // Update comment count
      const postRef = doc(db, "communityPosts", postId);
      await updateDoc(postRef, {
        commentCount: increment(-1),
      });

      return true;
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Failed to delete comment");
      return false;
    }
  };

  return {
    comments,
    loading,
    error,
    posting,
    postComment,
    toggleCommentLike,
    deleteComment,
  };
}
