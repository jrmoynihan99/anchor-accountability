// hooks/usePostComments.ts
import { PostComment } from "@/components/community/types";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

interface UserCommentStatus {
  status: "pending" | "approved" | "rejected";
  commentId: string;
  createdAt: Date;
}

export function usePostComments(postId: string | null) {
  const [allComments, setAllComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [userCommentStatus, setUserCommentStatus] =
    useState<UserCommentStatus | null>(null);

  // --- REAL-TIME COMMENT LISTENER (all approved comments) ---
  useEffect(() => {
    if (!postId || !auth.currentUser) {
      setAllComments([]);
      setLoading(false);
      return;
    }
    setLoading(true);

    const commentsQuery = query(
      collection(db, "communityPosts", postId, "comments"),
      where("status", "==", "approved"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      commentsQuery,
      async (snapshot) => {
        try {
          const commentsData = await processComments(snapshot.docs, postId);
          setAllComments(commentsData);
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

    return () => unsubscribe();
  }, [postId, auth.currentUser]);

  // ---- userCommentStatus logic (unchanged) ----
  useEffect(() => {
    if (!postId || !auth.currentUser) {
      setUserCommentStatus(null);
      return;
    }
    const userCommentsQuery = query(
      collection(db, "communityPosts", postId, "comments"),
      where("uid", "==", auth.currentUser.uid),
      orderBy("createdAt", "desc"),
      limit(1)
    );

    const unsubscribe = onSnapshot(
      userCommentsQuery,
      (snapshot) => {
        if (!snapshot.empty) {
          const doc = snapshot.docs[0];
          const data = doc.data();
          setUserCommentStatus({
            status: data.status as "pending" | "approved" | "rejected",
            commentId: doc.id,
            createdAt: data.createdAt?.toDate() || new Date(),
          });
        } else {
          setUserCommentStatus(null);
        }
      },
      (err) => {
        console.error("Error listening to user comment status:", err);
      }
    );
    return () => {
      unsubscribe();
    };
  }, [postId, auth.currentUser]);

  useEffect(() => {
    if (userCommentStatus?.status === "approved") {
      const timer = setTimeout(() => {
        setUserCommentStatus(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [userCommentStatus?.status]);

  // ---- Organize parent/replies tree as before ----
  async function processComments(
    docs: QueryDocumentSnapshot[],
    postId: string
  ): Promise<PostComment[]> {
    const currentUserId = auth.currentUser?.uid || "";

    const allComments = await Promise.all(
      docs.map(async (docSnap) => {
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
          // Fail silently
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
          replies: [],
        } as PostComment;
      })
    );
    // Now, organize into parent/reply structure
    const parentComments: PostComment[] = [];
    const commentMap = new Map<string, PostComment>();
    allComments.forEach((comment) => commentMap.set(comment.id, comment));
    allComments.forEach((comment) => {
      if (comment.parentCommentId === null) {
        parentComments.push(comment);
      } else {
        const parent = commentMap.get(comment.parentCommentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        }
      }
    });
    parentComments.forEach((comment) => {
      if (comment.replies && comment.replies.length > 0) {
        comment.replies.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
      }
    });
    return parentComments;
  }

  // ---- Comment actions ----
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
      await deleteDoc(commentRef);

      // Update comment count on parent post
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

  // Dismiss user comment status feedback
  const dismissCommentStatus = () => {
    setUserCommentStatus(null);
  };

  return {
    allComments, // <- This is the full, real-time parent/reply tree
    loading,
    error,
    posting,
    postComment,
    toggleCommentLike,
    deleteComment,
    userCommentStatus,
    dismissCommentStatus,
  };
}
