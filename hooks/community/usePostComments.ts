// hooks/usePostComments.ts
import { PostComment } from "@/components/community/types";
import { auth, db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
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
import { useEffect, useRef, useState } from "react";
import { useBlockedByUsers } from "../block/useBlockedByUsers";
import { useBlockedUsers } from "../block/useBlockedUsers";

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

  // 2-way block state
  const { blockedUserIds, loading: blockedLoading } = useBlockedUsers(); // who I blocked
  const { blockedByUserIds, loading: blockedByLoading } = useBlockedByUsers(); // who blocked me

  const dismissedStatusesRef = useRef(new Set<string>());

  // Helper: hide if author is blocked either direction
  const shouldHideAuthor = (authorUid: string) =>
    blockedUserIds.has(authorUid) || blockedByUserIds.has(authorUid);

  // --- REAL-TIME COMMENT LISTENER (all approved comments) ---
  useEffect(() => {
    if (!postId || !auth.currentUser) {
      setAllComments([]);
      setLoading(false);
      return;
    }

    // wait for both block lists
    if (blockedLoading || blockedByLoading) return;

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
          // 2-way filter on author uid
          const visibleDocs = snapshot.docs.filter(
            (d) => !shouldHideAuthor((d.data() as any).uid)
          );

          const commentsData = await processComments(visibleDocs, postId);
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
  }, [
    postId,
    auth.currentUser?.uid,
    blockedLoading,
    blockedByLoading,
    blockedUserIds,
    blockedByUserIds,
  ]);

  // ---- userCommentStatus logic with fix for re-showing ----
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
          const commentId = doc.id;
          const status = data.status as "pending" | "approved" | "rejected";

          if (
            status === "approved" &&
            dismissedStatusesRef.current.has(commentId)
          ) {
            return;
          }

          setUserCommentStatus({
            status,
            commentId,
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

    return () => unsubscribe();
  }, [postId, auth.currentUser?.uid]);

  // Auto-dismiss approved status
  useEffect(() => {
    if (userCommentStatus?.status === "approved") {
      const timer = setTimeout(() => {
        dismissedStatusesRef.current.add(userCommentStatus.commentId);
        setUserCommentStatus(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [userCommentStatus?.status, userCommentStatus?.commentId]);

  // Reset dismissed statuses when post changes
  useEffect(() => {
    if (postId) dismissedStatusesRef.current.clear();
  }, [postId]);

  // ---- Build parent/replies tree ----
  async function processComments(
    docs: QueryDocumentSnapshot[],
    postId: string
  ): Promise<PostComment[]> {
    const currentUserId = auth.currentUser?.uid || "";

    const allComments = await Promise.all(
      docs.map(async (docSnap) => {
        const data = docSnap.data() as any;
        const commentId = docSnap.id;

        // like status: single get on like doc (no temp listener)
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
          const likeSnap = await getDoc(likeRef);
          hasUserLiked = likeSnap.exists();
        } catch {
          /* ignore */
        }

        const authorUsername = `user-${(data.uid as string).slice(0, 5)}`;

        return {
          id: commentId,
          uid: data.uid,
          content: data.content,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          parentCommentId: data.parentCommentId || null,
          likeCount: data.likeCount || 0,
          status: data.status,
          hasUserLiked,
          authorUsername,
          replies: [],
        } as PostComment;
      })
    );

    // organize into parent/replies
    const parentComments: PostComment[] = [];
    const map = new Map<string, PostComment>();
    allComments.forEach((c) => map.set(c.id, c));

    allComments.forEach((c) => {
      if (c.parentCommentId === null) {
        parentComments.push(c);
      } else {
        const parent = map.get(c.parentCommentId);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(c);
        }
      }
    });

    // sort replies by time
    parentComments.forEach((p) => {
      if (p.replies && p.replies.length) {
        p.replies.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
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
        status: "pending",
      };

      await addDoc(
        collection(db, "communityPosts", postId, "comments"),
        commentData
      );
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

      // Guard: prevent liking if the comment's author is blocked either way
      const commentRef = doc(
        db,
        "communityPosts",
        postId,
        "comments",
        commentId
      );
      const commentSnap = await getDoc(commentRef);
      if (!commentSnap.exists()) return false;

      const authorUid = (commentSnap.data() as any).uid as string;
      if (shouldHideAuthor(authorUid)) {
        setError("You can’t interact with this comment.");
        return false;
      }

      const likeRef = doc(
        db,
        "communityPosts",
        postId,
        "comments",
        commentId,
        "likes",
        userId
      );

      if (currentlyLiked) {
        // Unlike
        await deleteDoc(likeRef);
        await updateDoc(commentRef, { likeCount: increment(-1) });
      } else {
        // Like
        await setDoc(likeRef, { createdAt: serverTimestamp() });
        await updateDoc(commentRef, { likeCount: increment(1) });
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

      const postRef = doc(db, "communityPosts", postId);
      await updateDoc(postRef, { commentCount: increment(-1) });

      return true;
    } catch (err) {
      console.error("Error deleting comment:", err);
      setError("Failed to delete comment");
      return false;
    }
  };

  const dismissCommentStatus = () => {
    if (userCommentStatus) {
      dismissedStatusesRef.current.add(userCommentStatus.commentId);
    }
    setUserCommentStatus(null);
  };

  return {
    allComments, // fully filtered parent/reply tree (2-way blocking)
    loading: loading || blockedLoading || blockedByLoading,
    error,
    posting,
    postComment,
    toggleCommentLike,
    deleteComment,
    userCommentStatus,
    dismissCommentStatus,
  };
}
