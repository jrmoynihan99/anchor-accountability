// hooks/messages/useThreadContext.ts
import { useOrganization } from "@/context/OrganizationContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

interface ThreadContextData {
  pleaId: string | null;
  encouragementId: string | null;
  postId: string | null;
  pleaMessage: string | null;
  encouragementMessage: string | null;
  postTitle: string | null;
  pleaOwnerUid: string | null;
  encouragementOwnerUid: string | null;
  postOwnerUid: string | null;
  userA: string | null; // Added: userA from thread
  userB: string | null; // Added: userB from thread
  loading: boolean;
}

/**
 * Fetches thread context - determines if thread started from a plea/encouragement/post
 * and fetches the associated content for display
 */
export function useThreadContext(
  threadId: string | null,
  providedPleaId?: string,
  providedEncouragementId?: string,
  providedPostId?: string
): ThreadContextData {
  const { organizationId, loading: orgLoading } = useOrganization();
  const [loading, setLoading] = useState(true);
  const [contextData, setContextData] = useState<ThreadContextData>({
    pleaId: null,
    encouragementId: null,
    postId: null,
    pleaMessage: null,
    encouragementMessage: null,
    postTitle: null,
    pleaOwnerUid: null,
    encouragementOwnerUid: null,
    postOwnerUid: null,
    userA: null,
    userB: null,
    loading: true,
  });

  useEffect(() => {
    if (!organizationId || orgLoading) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const fetchContext = async () => {
      setLoading(true);

      try {
        let pleaId = providedPleaId || null;
        let encouragementId = providedEncouragementId || null;
        let postId = providedPostId || null;
        let userA = null;
        let userB = null;

        // If IDs not provided, fetch from thread document
        if (!pleaId && !encouragementId && !postId && threadId) {
          const threadDoc = await getDoc(
            doc(db, "organizations", organizationId, "threads", threadId)
          );
          if (threadDoc.exists()) {
            const data = threadDoc.data();
            pleaId = data.startedFromPleaId || null;
            encouragementId = data.startedFromEncouragementId || null;
            postId = data.startedFromPostId || null;
            userA = data.userA || null;
            userB = data.userB || null;
          }
        }

        // If still no context IDs, return empty state
        if (!pleaId && !postId) {
          if (isMounted) {
            setContextData({
              pleaId: null,
              encouragementId: null,
              postId: null,
              pleaMessage: null,
              encouragementMessage: null,
              postTitle: null,
              pleaOwnerUid: null,
              encouragementOwnerUid: null,
              postOwnerUid: null,
              userA,
              userB,
              loading: false,
            });
            setLoading(false);
          }
          return;
        }

        // Fetch plea content if pleaId exists
        let pleaMessage = null;
        let pleaOwnerUid = null;
        if (pleaId) {
          const pleaDoc = await getDoc(
            doc(db, "organizations", organizationId, "pleas", pleaId)
          );
          if (pleaDoc.exists()) {
            const data = pleaDoc.data();
            pleaOwnerUid = data.uid || data.userId || null;
            pleaMessage =
              typeof data.message === "string" && data.message.trim().length > 0
                ? data.message
                : null;
          }
        }

        // Fetch encouragement content if both pleaId and encouragementId exist
        let encouragementMessage = null;
        let encouragementOwnerUid = null;
        if (pleaId && encouragementId) {
          const encDoc = await getDoc(
            doc(
              db,
              "organizations",
              organizationId,
              "pleas",
              pleaId,
              "encouragements",
              encouragementId
            )
          );
          if (encDoc.exists()) {
            const data = encDoc.data();
            encouragementOwnerUid = data.helperUid || data.userId || null;
            encouragementMessage =
              typeof data.message === "string" && data.message.trim().length > 0
                ? data.message
                : null;
          }
        }

        // Fetch post content if postId exists
        let postTitle = null;
        let postOwnerUid = null;
        if (postId) {
          const postDoc = await getDoc(
            doc(db, "organizations", organizationId, "communityPosts", postId)
          );
          if (postDoc.exists()) {
            const data = postDoc.data();
            postOwnerUid = data.uid || null;
            postTitle =
              typeof data.title === "string" && data.title.trim().length > 0
                ? data.title
                : null;
          }
        }

        if (isMounted) {
          setContextData({
            pleaId,
            encouragementId,
            postId,
            pleaMessage,
            encouragementMessage,
            postTitle,
            pleaOwnerUid,
            encouragementOwnerUid,
            postOwnerUid,
            userA,
            userB,
            loading: false,
          });
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching thread context:", error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchContext();

    return () => {
      isMounted = false;
    };
  }, [
    threadId,
    providedPleaId,
    providedEncouragementId,
    providedPostId,
    organizationId,
    orgLoading,
  ]);

  return { ...contextData, loading: loading || orgLoading };
}
