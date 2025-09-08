// components/community/ViewPostModal.tsx
import { BaseModal } from "@/components/morphing/BaseModal";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { usePostComments } from "@/hooks/usePostComments";
import { auth } from "@/lib/firebase";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { CommentInput, CommentInputRef } from "./CommentInput";
import { CommunityPostCardContent } from "./CommunityPostCardContent";
import { PostCommentsSection } from "./PostCommentsSection";
import { PostDetailView } from "./PostDetailView";
import { CommunityPost } from "./types";

const COMMENTS_PER_PAGE = 15;

interface ViewPostModalProps {
  isVisible: boolean;
  progress: any;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  post: CommunityPost | null;
  isLiked?: boolean;
  likeCount?: number;
  onLikePress?: () => void;
  actionLoading?: boolean;
}

export function ViewPostModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  post,
  isLiked,
  likeCount,
  onLikePress,
  actionLoading,
}: ViewPostModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const {
    allComments,
    loading,
    error,
    posting,
    postComment,
    toggleCommentLike,
    userCommentStatus,
    dismissCommentStatus,
  } = usePostComments(post?.id || null);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const commentInputRef = useRef<CommentInputRef>(null);

  // Pagination state
  const [displayCount, setDisplayCount] = useState(COMMENTS_PER_PAGE);
  const [showComments, setShowComments] = useState(false);

  // Refs for previous postId and latest revealed comment
  const prevPostIdRef = useRef<string | null>(null);
  const lastShownCommentIdRef = useRef<string | null>(null);

  // --- 1. Always reset displayCount first on open or post change ---
  useEffect(() => {
    if (isVisible && post?.id) {
      setDisplayCount(COMMENTS_PER_PAGE);
      prevPostIdRef.current = post.id;
    }
    // Don't reset displayCount on modal close, only on open/post change.
    // showComments is handled in the next effect.
    // eslint-disable-next-line
  }, [isVisible, post?.id]);

  // --- 2. Delay rendering comments until after animation (show spinner) ---
  useEffect(() => {
    let timer: number | undefined;
    if (isVisible) {
      timer = setTimeout(() => setShowComments(true), 350);
    } else {
      setShowComments(false);
      dismissCommentStatus?.();
      // Important: also reset last shown comment for fresh reveals on next open
      lastShownCommentIdRef.current = null;
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible, dismissCommentStatus]);

  // --- 3. Always reveal the latest user's own comment, even if paginated ---
  useEffect(() => {
    if (
      userCommentStatus &&
      (userCommentStatus.status === "pending" ||
        userCommentStatus.status === "approved")
    ) {
      const userCommentId = userCommentStatus.commentId;
      const idx = allComments.findIndex((c) => c.id === userCommentId);
      if (
        idx !== -1 &&
        idx + 1 > displayCount &&
        lastShownCommentIdRef.current !== userCommentId
      ) {
        setDisplayCount(idx + 1); // reveal up to the user's comment
        lastShownCommentIdRef.current = userCommentId;
      }
    }
    // eslint-disable-next-line
  }, [userCommentStatus, allComments, displayCount]);

  const paginatedComments = allComments.slice(0, displayCount);
  const hasMore = allComments.length > displayCount;

  const handleLoadMore = () =>
    setDisplayCount((prev) => prev + COMMENTS_PER_PAGE);

  if (!post) return null;

  const isOwnPost = auth.currentUser?.uid === post.uid;

  const handleLike = (e: any) => {
    e?.stopPropagation?.();
    onLikePress?.();
  };

  const handlePostComment = async (content: string) => {
    const success = await postComment(content, replyingTo);
    if (success) {
      setReplyingTo(null);
    }
    return success;
  };

  const handleReplyToComment = (commentId: string) => {
    setReplyingTo(commentId);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 100);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
  };

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.cardBackground}
      buttonBackgroundColor={colors.cardBackground}
      buttonContentPadding={20}
      buttonBorderWidth={1}
      buttonBorderColor={colors.cardBorder || "transparent"}
      buttonBorderRadius={16}
      buttonContent={
        <CommunityPostCardContent
          post={post}
          isOwnPost={isOwnPost}
          isLiked={post.hasUserLiked}
          likeCount={post.likeCount}
          showReadMoreHint={true}
        />
      }
      buttonContentOpacityRange={[0, 0.12]}
    >
      <View style={styles.modalContainer}>
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Full Post Content */}
          <View
            style={[styles.postSection, { borderBottomColor: colors.border }]}
          >
            <PostDetailView
              post={post}
              isOwnPost={isOwnPost}
              isLiked={isLiked}
              likeCount={likeCount}
              onLikePress={handleLike}
              actionLoading={actionLoading}
            />
          </View>

          {/* Comments Section - LAZY LOADED */}
          {showComments ? (
            <PostCommentsSection
              comments={paginatedComments}
              loading={loading}
              error={error}
              onToggleCommentLike={toggleCommentLike}
              onReplyToComment={handleReplyToComment}
              replyingTo={replyingTo}
              hasMore={hasMore}
              loadingMore={false}
              loadMore={handleLoadMore}
            />
          ) : (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <ThemedText
                type="caption"
                style={{ color: colors.textSecondary, marginTop: 8 }}
              >
                Loading comments...
              </ThemedText>
            </View>
          )}
        </ScrollView>

        {/* Comment Input - Sticky at bottom of modal */}
        <CommentInput
          ref={commentInputRef}
          onSubmit={handlePostComment}
          posting={posting}
          replyingTo={replyingTo}
          replyingToComment={
            replyingTo
              ? paginatedComments.find((c) => c.id === replyingTo) ||
                paginatedComments
                  .find((c) => c.replies?.find((r) => r.id === replyingTo))
                  ?.replies?.find((r) => r.id === replyingTo)
              : undefined
          }
          onCancelReply={handleCancelReply}
          userCommentStatus={userCommentStatus}
          onDismissCommentStatus={dismissCommentStatus}
        />
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 12,
    paddingBottom: 120,
  },
  postSection: {
    paddingHorizontal: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
});
