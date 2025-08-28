// components/community/PostCommentsSection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { CommentItem } from "./CommentItem";
import { PostComment } from "./types";

interface PostCommentsSectionProps {
  comments: PostComment[];
  loading: boolean;
  error: string | null;
  onToggleCommentLike: (
    commentId: string,
    currentlyLiked: boolean
  ) => Promise<boolean>;
  onReplyToComment: (commentId: string) => void;
  replyingTo: string | null;
}

export function PostCommentsSection({
  comments,
  loading,
  error,
  onToggleCommentLike,
  onReplyToComment,
  replyingTo,
}: PostCommentsSectionProps) {
  const { colors } = useTheme();

  const totalCommentCount = comments.reduce((total, comment) => {
    return total + 1 + (comment.replies?.length || 0);
  }, 0);

  const renderComments = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
          <ThemedText
            type="caption"
            style={[styles.loadingText, { color: colors.textSecondary }]}
          >
            Loading comments...
          </ThemedText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={24}
            color={colors.textSecondary}
          />
          <ThemedText
            type="caption"
            style={[styles.errorText, { color: colors.textSecondary }]}
          >
            {error}
          </ThemedText>
        </View>
      );
    }

    if (comments.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="message"
            size={32}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <ThemedText
            type="bodyMedium"
            style={[styles.emptyTitle, { color: colors.text }]}
          >
            No comments yet
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            Be the first to share your thoughts
          </ThemedText>
        </View>
      );
    }

    return comments.map((comment) => (
      <CommentItem
        key={comment.id}
        comment={comment}
        onToggleCommentLike={onToggleCommentLike}
        onReplyToComment={onReplyToComment}
        isReplyingTo={replyingTo === comment.id}
      />
    ));
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <ThemedText
          type="subtitleSemibold"
          style={[styles.headerTitle, { color: colors.text }]}
        >
          Comments
        </ThemedText>
        <View
          style={[
            styles.commentCount,
            {
              borderColor: colors.border,
            },
          ]}
        >
          <IconSymbol
            name="message"
            size={18}
            color={colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <ThemedText
            type="captionMedium"
            style={{ color: colors.textSecondary }}
          >
            {totalCommentCount}
          </ThemedText>
        </View>
      </View>

      {/* Comments */}
      <View style={styles.commentsContainer}>{renderComments()}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  headerTitle: {
    lineHeight: 20,
  },
  commentCount: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
  },
  commentsContainer: {
    paddingBottom: 20,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 8,
  },
  loadingText: {
    opacity: 0.8,
  },
  errorText: {
    textAlign: "center",
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.4,
  },
  emptyTitle: {
    marginBottom: 4,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 16,
  },
});
