// hooks/useCommunityPosts.ts
import { CommunityPost } from "@/components/morphing/community/types";
import { useOrganization } from "@/context/OrganizationContext";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  doc as fsDoc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  QueryDocumentSnapshot,
  where,
} from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { useBlockedByUsers } from "../block/useBlockedByUsers";
import { useBlockedUsers } from "../block/useBlockedUsers";

const POSTS_PER_PAGE = 10;

export function useCommunityPosts() {
  const uid = auth.currentUser?.uid ?? null;
  const { organizationId, loading: orgLoading } = useOrganization();

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

  // Pagination grows the window of the single realtime listener, so paginated
  // posts stay live and never get dropped by a first-page snapshot.
  const [currentLimit, setCurrentLimit] = useState(POSTS_PER_PAGE);
  const loadingMoreRef = useRef(false);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const shouldHideAuthor = (authorUid: string) =>
    blockedUserIds.has(authorUid) || blockedByUserIds.has(authorUid);

  useEffect(() => {
    // cleanup any previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    if (!uid || !organizationId || orgLoading) {
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

    // Growing the window is not a fresh load — keep the list on screen and let
    // the footer spinner cover it.
    if (currentLimit === POSTS_PER_PAGE) {
      setLoading(true);
    }
    setError(null);

    const postsQuery = query(
      collection(db, "organizations", organizationId, "communityPosts"),
      where("status", "==", "approved"),
      where("isDeleted", "==", false),
      orderBy("createdAt", "desc"),
      limit(currentLimit)
    );

    const unsub = onSnapshot(
      postsQuery,
      async (snapshot) => {
        try {
          // Fewer docs than we asked for means we've reached the end
          setHasMore(snapshot.docs.length >= currentLimit);

          // filter out authors hidden by 2-way blocks
          const visibleDocs = snapshot.docs.filter(
            (d) => !shouldHideAuthor((d.data() as any).uid)
          );

          // process posts + like status
          const rows = await Promise.all(
            visibleDocs.map((d) => toCommunityPost(d, organizationId, uid))
          );

          setPosts(rows);
          setError(null);
        } catch (e) {
          console.error("Error processing posts:", e);
          setError("Failed to load posts");
        } finally {
          setLoading(false);
          loadingMoreRef.current = false;
          setLoadingMore(false);
        }
      },
      (err) => {
        console.error("Error listening to posts:", err);
        setError("Failed to load posts");
        setLoading(false);
        loadingMoreRef.current = false;
        setLoadingMore(false);
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
    organizationId,
    orgLoading,
    refreshKey,
    currentLimit,
    blockedLoading,
    blockedByLoading,
    blockedUserIds,
    blockedByUserIds,
  ]);

  const loadMore = () => {
    // onEndReached can fire repeatedly before the next render, so guard on a ref
    if (loading || loadingMoreRef.current || !hasMore) return;

    loadingMoreRef.current = true;
    setLoadingMore(true);
    setCurrentLimit((prev) => prev + POSTS_PER_PAGE);
  };

  const refresh = async () => {
    setHasMore(true);
    setPosts([]);
    setLoading(true);
    loadingMoreRef.current = false;
    setLoadingMore(false);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
      unsubscribeRef.current = null;
    }

    setCurrentLimit(POSTS_PER_PAGE);
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

async function toCommunityPost(
  d: QueryDocumentSnapshot,
  organizationId: string,
  uid: string
): Promise<CommunityPost> {
  const data = d.data() as any;
  const postId = d.id;

  // like doc id == current user uid
  let hasUserLiked = false;
  try {
    const likeSnap = await getDoc(
      fsDoc(
        db,
        "organizations",
        organizationId,
        "communityPosts",
        postId,
        "likes",
        uid
      )
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
    openToChat: data.openToChat,
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
}
