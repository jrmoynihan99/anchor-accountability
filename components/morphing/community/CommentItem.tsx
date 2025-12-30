// components/community/CommentItem.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UserStreakDisplay } from "@/components/UserStreakDisplay";
import { useTheme } from "@/context/ThemeContext";
import { auth } from "@/lib/firebase";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { PostComment } from "./types";

interface CommentItemProps {
  comment: PostComment;
  onToggleCommentLike: (
    commentId: string,
    currentlyLiked: boolean
  ) => Promise<boolean>;
  onReplyToComment: (commentId: string) => void;
  isReplyingTo: boolean;
  isReply?: boolean;
  parentAuthorUsername?: string;
}

export function CommentItem({
  comment,
  onToggleCommentLike,
  onReplyToComment,
  isReplyingTo,
  isReply = false,
  parentAuthorUsername,
}: CommentItemProps) {
  const { colors } = useTheme();
  const [isLiked, setIsLiked] = useState(comment.hasUserLiked || false);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [showReplies, setShowReplies] = useState(false);

  const isOwnComment = auth.currentUser?.uid === comment.uid;
  const hasReplies = comment.replies && comment.replies.length > 0;

  const handleLike = async (e: any) => {
    e?.stopPropagation?.(); // Prevent keyboard dismissal

    const originalLiked = isLiked;
    const originalCount = likeCount;

    // Optimistic update
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    const success = await onToggleCommentLike(comment.id, isLiked);
    if (!success) {
      // Revert on failure
      setIsLiked(originalLiked);
      setLikeCount(originalCount);
    }
  };

  const handleReply = (e: any) => {
    e?.stopPropagation?.(); // Prevent keyboard dismissal
    onReplyToComment(comment.id);
  };

  const handleShowReplies = (e: any) => {
    e?.stopPropagation?.(); // Prevent keyboard dismissal
    setShowReplies(true);
  };

  const handleHideReplies = (e: any) => {
    e?.stopPropagation?.(); // Prevent keyboard dismissal
    setShowReplies(false);
  };

  const timeAgo = getTimeAgo(comment.createdAt);

  return (
    <View style={styles.container}>
      {/* Reply connecting line */}
      {isReply && (
        <View style={styles.replyLine}>
          <View
            style={[styles.connectingLine, { borderColor: colors.border }]}
          />
        </View>
      )}

      {/* Comment content */}
      <View style={[styles.commentContent, isReply && styles.replyContent]}>
        {/* Header with inline like button */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View
              style={[
                styles.avatarCircle,
                { backgroundColor: colors.iconCircleSecondaryBackground },
              ]}
            >
              <ThemedText
                type="caption"
                style={[styles.avatarText, { color: colors.icon }]}
              >
                {comment.authorUsername?.[5]?.toUpperCase() || "U"}
              </ThemedText>
            </View>
            <View style={styles.userDetails}>
              <View style={styles.usernameRow}>
                <ThemedText
                  type="captionMedium"
                  style={[styles.username, { color: colors.text }]}
                >
                  {comment.authorUsername}
                </ThemedText>
                <UserStreakDisplay userId={comment.uid} size="small" />
              </View>
              <View style={styles.timestampRow}>
                <ThemedText
                  type="caption"
                  style={[styles.timestamp, { color: colors.textSecondary }]}
                >
                  {timeAgo}
                  {isOwnComment && " • Your comment"}
                </ThemedText>
                {isReplyingTo && (
                  <View
                    style={[
                      styles.replyingIndicator,
                      { backgroundColor: colors.tint + "20" },
                    ]}
                  >
                    <ThemedText
                      type="caption"
                      style={[styles.replyingText, { color: colors.tint }]}
                    >
                      Replying...
                    </ThemedText>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Inline Like Button - Prevent keyboard dismissal */}
          <TouchableOpacity
            style={styles.inlineLikeButton}
            onPress={handleLike}
            onPressIn={(e) => e.stopPropagation()} // Prevent keyboard dismissal
            activeOpacity={0.75}
            hitSlop={8}
          >
            <IconSymbol
              name={isLiked ? "heart.fill" : "heart"}
              size={14}
              color={isLiked ? colors.error : colors.textSecondary}
              style={{ marginRight: 4 }}
            />
            <ThemedText
              type="captionMedium"
              style={{
                color: isLiked ? colors.error : colors.textSecondary,
                fontWeight: isLiked ? "600" : "400",
              }}
            >
              {likeCount}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Comment Content */}
        <ThemedText
          type="body"
          style={[styles.content, { color: colors.textSecondary }]}
        >
          {comment.content}
        </ThemedText>

        {/* Reply Button (only for top-level comments) - Prevent keyboard dismissal */}
        {!isReply && (
          <View style={styles.replyButtonContainer}>
            <TouchableOpacity
              style={[
                styles.replyButton,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                },
                isReplyingTo && {
                  backgroundColor: colors.tint + "11",
                  borderColor: colors.tint + "33",
                },
              ]}
              onPress={handleReply}
              onPressIn={(e) => e.stopPropagation()} // Prevent keyboard dismissal
              activeOpacity={0.75}
              hitSlop={8}
            >
              <IconSymbol
                name="arrowshape.turn.up.left"
                size={14}
                color={isReplyingTo ? colors.tint : colors.textSecondary}
                style={{ marginRight: 3 }}
              />
              <ThemedText
                type="caption"
                style={{
                  color: isReplyingTo ? colors.tint : colors.textSecondary,
                  fontSize: 12,
                }}
              >
                Reply
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Replies Section */}
        {hasReplies && !isReply && (
          <View style={styles.repliesSection}>
            {!showReplies ? (
              <TouchableOpacity
                style={styles.showRepliesButton}
                onPress={handleShowReplies}
                onPressIn={(e) => e.stopPropagation()} // Prevent keyboard dismissal
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.repliesConnector,
                    { borderColor: colors.border },
                  ]}
                />
                <ThemedText
                  type="caption"
                  style={[styles.showRepliesText, { color: colors.tint }]}
                >
                  Show {comment.replies!.length}{" "}
                  {comment.replies!.length === 1 ? "reply" : "replies"}
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <View style={styles.repliesContainer}>
                <TouchableOpacity
                  style={styles.hideRepliesButton}
                  onPress={handleHideReplies}
                  onPressIn={(e) => e.stopPropagation()} // Prevent keyboard dismissal
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.repliesConnector,
                      { borderColor: colors.border },
                    ]}
                  />
                  <ThemedText
                    type="caption"
                    style={[
                      styles.hideRepliesText,
                      { color: colors.textSecondary },
                    ]}
                  >
                    Hide replies
                  </ThemedText>
                </TouchableOpacity>

                {comment.replies!.map((reply) => (
                  <CommentItem
                    key={reply.id}
                    comment={reply}
                    onToggleCommentLike={onToggleCommentLike}
                    onReplyToComment={onReplyToComment}
                    isReplyingTo={false} // Replies can't be replied to
                    isReply={true}
                    parentAuthorUsername={comment.authorUsername}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// Helper function for time ago
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) return `${diffInWeeks}w ago`;

  const diffInMonths = Math.floor(diffInDays / 30);
  return `${diffInMonths}mo ago`;
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  commentContent: {
    paddingVertical: 12,
  },
  replyContent: {
    marginLeft: 24,
  },
  replyLine: {
    position: "absolute",
    left: 12,
    top: 0,
    bottom: 0,
    width: 24,
  },
  connectingLine: {
    position: "absolute",
    left: 0,
    top: 36,
    width: 12,
    height: 12,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderBottomLeftRadius: 8,
  },
  header: {
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "flex-start",
    flex: 1,
  },
  avatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  avatarText: {
    fontWeight: "600",
    fontSize: 11,
  },
  userDetails: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  username: {
    lineHeight: 16,
  },
  timestampRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 1,
  },
  timestamp: {
    opacity: 0.8,
    fontSize: 11,
  },
  replyingIndicator: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  replyingText: {
    fontSize: 10,
    fontWeight: "500",
  },
  inlineLikeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 8,
  },
  content: {
    lineHeight: 18,
    marginBottom: 10,
    marginLeft: 36, // Align with username
  },
  replyButtonContainer: {
    marginLeft: 36, // Align with username
  },
  replyButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  repliesSection: {
    marginTop: 8,
    marginLeft: 36,
  },
  showRepliesButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  hideRepliesButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    marginBottom: 0,
  },
  repliesConnector: {
    width: 16,
    height: 16,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderBottomLeftRadius: 8,
    marginRight: 8,
  },
  showRepliesText: {
    fontSize: 12,
    fontWeight: "500",
  },
  hideRepliesText: {
    fontSize: 11,
    opacity: 0.6,
  },
  repliesContainer: {
    marginTop: 4,
  },
});
