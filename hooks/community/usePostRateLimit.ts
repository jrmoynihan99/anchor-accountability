// hooks/usePostRateLimit.ts
import { useOrganization } from "@/context/OrganizationContext";
import { auth, db } from "@/lib/firebase";
import {
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { useEffect, useState } from "react";

interface PostRateLimitInfo {
  isRateLimited: boolean;
  waitTimeMs: number;
  recentCount: number;
}

export function usePostRateLimit(): PostRateLimitInfo {
  const { organizationId, loading: orgLoading } = useOrganization();
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser || !organizationId || orgLoading) {
      setLoading(false);
      setUserPosts([]);
      return;
    }

    const currentUserId = auth.currentUser.uid;

    // Query for current user's approved posts only
    const userPostsQuery = query(
      collection(db, "organizations", organizationId, "communityPosts"),
      where("uid", "==", currentUserId),
      where("status", "==", "approved"),
      orderBy("createdAt", "desc"),
      limit(10) // Only need recent posts for rate limiting
    );

    const unsubscribe = onSnapshot(
      userPostsQuery,
      (snapshot) => {
        const posts = snapshot.docs.map((doc) => ({
          id: doc.id,
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));

        setUserPosts(posts);
        setLoading(false);
      },
      (error) => {
        console.error("Error loading user posts for rate limiting:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth.currentUser, organizationId, orgLoading]);

  // Calculate rate limit info
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const recentPosts = userPosts.filter(
    (post) => post.createdAt >= fiveMinutesAgo
  );

  const recentCount = recentPosts.length;

  if (recentCount >= 2) {
    const oldestRecent = recentPosts.reduce((oldest, current) =>
      current.createdAt < oldest.createdAt ? current : oldest
    );

    const waitTimeMs =
      oldestRecent.createdAt.getTime() + 5 * 60 * 1000 - now.getTime();

    return {
      isRateLimited: true,
      waitTimeMs: Math.max(0, waitTimeMs),
      recentCount,
    };
  }

  return {
    isRateLimited: false,
    waitTimeMs: 0,
    recentCount,
  };
}
