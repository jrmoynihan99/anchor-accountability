// hooks/useCommunityPosts.ts
import { CommunityPost } from "@/components/morphing/community/types";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  DocumentSnapshot,
  doc as fsDoc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useBlockedByUsers } from "../block/useBlockedByUsers";
import { useBlockedUsers } from "../block/useBlockedUsers";

const POSTS_PER_PAGE = 10;

export function useCommunityPosts() {
  const uid = auth.currentUser?.uid ?? null;

  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // 2-way block state
  const { blockedUserIds, loading: blockedLoading } = useBlockedUsers(); // who I blocked
  const { blockedByUserIds, loading: blockedByLoading } = useBlockedByUsers(); // who blocked me

  // pull-to-refresh trigger
  const [refreshKey, setRefreshKey] = useState(0);

  // pagination & listener refs
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const shouldHideAuthor = (authorUid: string) =>
    blockedUserIds.has(authorUid) || blockedByUserIds.has(authorUid);

  // Initial page listener (re-run when uid or block sets change, or refreshKey bumps)
  useEffect(() => {
    // cleanup any previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!uid) {
      setPosts([]);
      setHasMore(false);
      setLoading(false);
      return;
    }

    // wait until both block lists are resolved
    if (blockedLoading || blockedByLoading) {
      setLoading(true);
      return;
    }

    setLoading(true);
    setError(null);
    lastDocRef.current = null;

    const postsQuery = query(
      collection(db, "communityPosts"),
      where("status", "==", "approved"),
      where("isDeleted", "==", false),
      orderBy("createdAt", "desc"),
      limit(POSTS_PER_PAGE)
    );

    const unsub = onSnapshot(
      postsQuery,
      async (snapshot) => {
        try {
          if (!snapshot.empty) {
            lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
            setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
          } else {
            setHasMore(false);
          }

          // filter out authors hidden by 2-way blocks
          const visibleDocs = snapshot.docs.filter(
            (d) => !shouldHideAuthor((d.data() as any).uid)
          );

          // process posts + like status
          const rows = await Promise.all(
            visibleDocs.map(async (d) => {
              const data = d.data() as any;
              const postId = d.id;

              // like doc id == current user uid
              let hasUserLiked = false;
              try {
                const likeSnap = await getDoc(
                  fsDoc(db, "communityPosts", postId, "likes", uid)
                );
                hasUserLiked = likeSnap.exists();
              } catch (e) {
                console.error("like check failed:", e);
              }

              const authorUsername = `user-${(data.uid as string).slice(0, 5)}`;

              return {
                id: postId,
                uid: data.uid,
                title: data.title,
                content: data.content,
                categories: data.categories || [],
                createdAt: data.createdAt?.toDate?.() || new Date(),
                updatedAt: data.updatedAt?.toDate?.() || new Date(),
                lastEditableAt: data.lastEditableAt?.toDate?.() || new Date(),
                likeCount: data.likeCount || 0,
                commentCount: data.commentCount || 0,
                status: data.status,
                isDeleted: data.isDeleted || false,
                hasUserLiked,
                authorUsername,
              } as CommunityPost;
            })
          );

          setPosts(rows);
          setError(null);
        } catch (e) {
          console.error("Error processing posts:", e);
          setError("Failed to load posts");
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        console.error("Error listening to posts:", err);
        setError("Failed to load posts");
        setLoading(false);
      }
    );

    unsubscribeRef.current = unsub;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [
    uid,
    refreshKey,
    blockedLoading,
    blockedByLoading,
    blockedUserIds,
    blockedByUserIds,
  ]);

  // Pagination (respects 2-way blocks and reuses getDoc like check)
  const loadMore = async () => {
    if (!uid || !lastDocRef.current || loadingMore || !hasMore) return;

    setLoadingMore(true);
    try {
      const moreQuery = query(
        collection(db, "communityPosts"),
        where("status", "==", "approved"),
        where("isDeleted", "==", false),
        orderBy("createdAt", "desc"),
        startAfter(lastDocRef.current),
        limit(POSTS_PER_PAGE)
      );

      const snapshot = await new Promise<any>((resolve, reject) => {
        const unsub = onSnapshot(
          moreQuery,
          (snap) => {
            resolve(snap);
            unsub();
          },
          reject
        );
      });

      if (snapshot.empty) {
        setHasMore(false);
        setLoadingMore(false);
        return;
      }

      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      setHasMore(snapshot.docs.length === POSTS_PER_PAGE);

      const visibleDocs: QueryDocumentSnapshot[] = snapshot.docs.filter(
        (d: QueryDocumentSnapshot) => !shouldHideAuthor((d.data() as any).uid)
      );

      const morePosts: CommunityPost[] = await Promise.all(
        visibleDocs.map(async (d: QueryDocumentSnapshot) => {
          const data = d.data() as any;
          const postId = d.id;

          let hasUserLiked = false;
          try {
            const likeSnap = await getDoc(
              fsDoc(db, "communityPosts", postId, "likes", uid)
            );
            hasUserLiked = likeSnap.exists();
          } catch (e) {
            console.error("like check failed:", e);
          }

          const authorUsername = `user-${(data.uid as string).slice(0, 5)}`;

          return {
            id: postId,
            uid: data.uid,
            title: data.title,
            content: data.content,
            categories: data.categories || [],
            createdAt: data.createdAt?.toDate?.() || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || new Date(),
            lastEditableAt: data.lastEditableAt?.toDate?.() || new Date(),
            likeCount: data.likeCount || 0,
            commentCount: data.commentCount || 0,
            status: data.status,
            isDeleted: data.isDeleted || false,
            hasUserLiked,
            authorUsername,
          } as CommunityPost;
        })
      );

      setPosts((prev) => [...prev, ...morePosts]);
    } catch (err) {
      console.error("Error loading more posts:", err);
      setError("Failed to load more posts");
    } finally {
      setLoadingMore(false);
    }
  };

  const refresh = async () => {
    setHasMore(true);
    setPosts([]);
    setLoading(true);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    lastDocRef.current = null;

    setRefreshKey((k) => k + 1);
  };

  return {
    posts,
    loading: loading || blockedLoading || blockedByLoading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
