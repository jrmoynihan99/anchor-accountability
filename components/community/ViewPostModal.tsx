// components/community/ViewPostModal.tsx
import { BaseModal } from "@/components/morphing/BaseModal";
import { useTheme } from "@/hooks/ThemeContext";
import { usePostComments } from "@/hooks/usePostComments";
import { auth } from "@/lib/firebase";
import React, { useRef, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { CommentInput, CommentInputRef } from "./CommentInput";
import { CommunityPostCardContent } from "./CommunityPostCardContent";
import { PostCommentsSection } from "./PostCommentsSection";
import { PostDetailView } from "./PostDetailView";
import { CommunityPost } from "./types";

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
  const { comments, loading, error, posting, postComment, toggleCommentLike } =
    usePostComments(post?.id || null);

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const commentInputRef = useRef<CommentInputRef>(null);

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
          keyboardShouldPersistTaps="always"
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

          {/* Comments Section */}
          <PostCommentsSection
            comments={comments}
            loading={loading}
            error={error}
            onToggleCommentLike={toggleCommentLike}
            onReplyToComment={handleReplyToComment}
            replyingTo={replyingTo}
          />
        </ScrollView>

        {/* Comment Input - Sticky at bottom of modal */}
        <CommentInput
          ref={commentInputRef}
          onSubmit={handlePostComment}
          posting={posting}
          replyingTo={replyingTo}
          replyingToComment={
            replyingTo
              ? comments.find((c) => c.id === replyingTo) ||
                comments
                  .find((c) => c.replies?.find((r) => r.id === replyingTo))
                  ?.replies?.find((r) => r.id === replyingTo)
              : undefined
          }
          onCancelReply={handleCancelReply}
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
    paddingTop: 32,
    paddingBottom: 120,
  },
  postSection: {
    paddingHorizontal: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
});
