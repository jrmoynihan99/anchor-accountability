// hooks/useCommunityPosts.ts
import { CommunityPost } from "@/components/community/types";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  DocumentSnapshot,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  startAfter,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";

const POSTS_PER_PAGE = 10;

export function useCommunityPosts() {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);

  // Used to force effect refresh for pull-to-refresh logic
  const [refreshKey, setRefreshKey] = useState(0);

  // Keep track of the last document for pagination
  const lastDocRef = useRef<DocumentSnapshot | null>(null);
  // Track if we've already set up the initial listener
  const listenerSetupRef = useRef(false);
  // Store the unsubscribe function
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initial load and real-time updates for first page
  useEffect(() => {
    if (!auth.currentUser || listenerSetupRef.current) {
      if (!auth.currentUser) {
        setLoading(false);
        setPosts([]);
      }
      return;
    }

    listenerSetupRef.current = true;
    const currentUserId = auth.currentUser.uid;

    // Query for approved posts only
    const postsQuery = query(
      collection(db, "communityPosts"),
      where("status", "==", "approved"),
      where("isDeleted", "==", false),
      orderBy("createdAt", "desc"),
      limit(POSTS_PER_PAGE)
    );

    const unsubscribe = onSnapshot(
      postsQuery,
      async (snapshot) => {
        try {
          if (!snapshot.empty) {
            lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
            setHasMore(snapshot.docs.length === POSTS_PER_PAGE);
          } else {
            setHasMore(false);
          }

          // Process posts and check for likes
          const postsData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const data = doc.data();
              const postId = doc.id;

              // Check if current user has liked this post
              let hasUserLiked = false;
              try {
                const likeQuery = query(
                  collection(db, "communityPosts", postId, "likes"),
                  where("__name__", "==", currentUserId),
                  limit(1)
                );
                const likeSnap = await new Promise<boolean>((resolve) => {
                  const unsub = onSnapshot(likeQuery, (snap) => {
                    resolve(!snap.empty);
                    unsub();
                  });
                });
                hasUserLiked = likeSnap;
              } catch (err) {
                console.error("Error checking like status:", err);
              }

              // Generate anonymous username
              const authorUsername = `user-${data.uid.substring(0, 5)}`;

              return {
                id: postId,
                uid: data.uid,
                title: data.title,
                content: data.content,
                categories: data.categories || [],
                createdAt: data.createdAt?.toDate() || new Date(),
                updatedAt: data.updatedAt?.toDate() || new Date(),
                lastEditableAt: data.lastEditableAt?.toDate() || new Date(),
                likeCount: data.likeCount || 0,
                commentCount: data.commentCount || 0,
                status: data.status,
                isDeleted: data.isDeleted || false,
                hasUserLiked,
                authorUsername,
              } as CommunityPost;
            })
          );

          setPosts(postsData);
          setError(null);
        } catch (err) {
          console.error("Error processing posts:", err);
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

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
      listenerSetupRef.current = false;
    };
  }, [auth.currentUser, refreshKey]); // <-- include refreshKey!

  // Load more posts (pagination)
  const loadMore = async () => {
    if (!auth.currentUser || !lastDocRef.current || loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);
    const currentUserId = auth.currentUser.uid;

    try {
      const morePostsQuery = query(
        collection(db, "communityPosts"),
        where("status", "==", "approved"),
        where("isDeleted", "==", false),
        orderBy("createdAt", "desc"),
        startAfter(lastDocRef.current),
        limit(POSTS_PER_PAGE)
      );

      // Use a one-time get instead of listener for pagination
      const snapshot = await new Promise<any>((resolve, reject) => {
        const unsub = onSnapshot(
          morePostsQuery,
          (snap) => {
            resolve(snap);
            unsub();
          },
          reject
        );
      });

      if (!snapshot.empty) {
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasMore(snapshot.docs.length === POSTS_PER_PAGE);

        const morePosts = await Promise.all(
          snapshot.docs.map(async (doc: QueryDocumentSnapshot) => {
            const data = doc.data();
            const postId = doc.id;

            // Check if current user has liked this post
            let hasUserLiked = false;
            try {
              const likeDoc = await new Promise<boolean>((resolve) => {
                const unsub = onSnapshot(
                  collection(db, "communityPosts", postId, "likes"),
                  (snap) => {
                    const hasLike = snap.docs.some(
                      (d) => d.id === currentUserId
                    );
                    resolve(hasLike);
                    unsub();
                  }
                );
              });
              hasUserLiked = likeDoc;
            } catch (err) {
              console.error("Error checking like status:", err);
            }

            const authorUsername = `user-${data.uid.substring(0, 5)}`;

            return {
              id: postId,
              uid: data.uid,
              title: data.title,
              content: data.content,
              categories: data.categories || [],
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
              lastEditableAt: data.lastEditableAt?.toDate() || new Date(),
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
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error("Error loading more posts:", err);
      setError("Failed to load more posts");
    } finally {
      setLoadingMore(false);
    }
  };

  // Refresh function for pull-to-refresh
  const refresh = async () => {
    setHasMore(true);
    setPosts([]);
    setLoading(true);

    // Unsubscribe and re-setup
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }
    lastDocRef.current = null;
    listenerSetupRef.current = false;

    // Bump the refreshKey to force effect to run again!
    setRefreshKey((k) => k + 1);
  };

  return {
    posts,
    loading,
    loadingMore,
    error,
    hasMore,
    loadMore,
    refresh,
  };
}
