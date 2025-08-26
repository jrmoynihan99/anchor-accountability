import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UserStreakDisplay } from "@/components/UserStreakDisplay";
import { useTheme } from "@/hooks/ThemeContext";
import { usePostActions } from "@/hooks/usePostActions";
import { usePostComments } from "@/hooks/usePostComments";
import { auth } from "@/lib/firebase";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CommunityPost, PostCategory, PostComment } from "./types";

// Utility for time ago display
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

interface PostDetailModalProps {
  post: CommunityPost;
  isVisible: boolean;
  onClose: () => void;
}

export function PostDetailModal({
  post,
  isVisible,
  onClose,
}: PostDetailModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { toggleLike, deletePost, reportPost, actionLoading } =
    usePostActions();
  const {
    comments,
    loading: commentsLoading,
    error: commentsError,
    posting: postingComment,
    postComment,
    toggleCommentLike,
    deleteComment,
  } = usePostComments(post.id);

  const [isLiked, setIsLiked] = useState(post.hasUserLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [commentInput, setCommentInput] = useState("");
  const [replyingTo, setReplyingTo] = useState<null | PostComment>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentUserId = auth.currentUser?.uid;
  const isOwnPost = currentUserId === post.uid;

  // Like/unlike post
  const handleLikePost = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLiked((prev) => !prev);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
    const success = await toggleLike(post.id, isLiked);
    if (!success) {
      setIsLiked(isLiked);
      setLikeCount(post.likeCount);
    }
  };

  // Delete post
  const handleDeletePost = () => {
    Alert.alert(
      "Delete Post?",
      "Are you sure you want to delete this post? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const success = await deletePost(post.id);
            if (success) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              onClose();
            }
          },
        },
      ]
    );
  };

  // Report post
  const handleReportPost = () => {
    Alert.prompt(
      "Report Post",
      "Why are you reporting this post?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Report",
          style: "destructive",
          onPress: async (reason) => {
            if (!reason || !reason.trim()) return;
            await reportPost(post.id, reason.trim());
            Alert.alert("Reported", "Thanks for letting us know.");
          },
        },
      ],
      "plain-text"
    );
  };

  // Submit comment or reply
  const handleSubmitComment = async () => {
    if (!commentInput.trim()) return;
    setSubmitting(true);
    const ok = await postComment(commentInput, replyingTo?.id ?? null);
    setSubmitting(false);
    if (ok) {
      setCommentInput("");
      setReplyingTo(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  // Category badge/icon
  const getCategoryIcon = (category: PostCategory) => {
    switch (category) {
      case "questions":
        return "questionmark.circle";
      case "resources":
        return "book";
      case "testimonies":
        return "star";
      case "other":
      default:
        return "ellipsis.circle";
    }
  };
  const getCategoryColor = (category: PostCategory) => {
    switch (category) {
      case "questions":
        return colors.info;
      case "resources":
        return colors.success;
      case "testimonies":
        return colors.warning;
      case "other":
      default:
        return colors.textSecondary;
    }
  };

  // Render a single comment and its replies (1-level nesting)
  const renderComment = (
    comment: PostComment,
    depth: number = 0
  ): React.ReactNode => {
    const isOwn = currentUserId === comment.uid;

    return (
      <View
        key={comment.id}
        style={[styles.commentContainer, depth > 0 && styles.replyContainer]}
      >
        <View style={styles.commentHeader}>
          <View style={styles.commentUserRow}>
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
            <ThemedText
              type="captionMedium"
              style={[styles.commentUsername, { color: colors.text }]}
            >
              {comment.authorUsername}
            </ThemedText>
            <ThemedText
              type="caption"
              style={{ color: colors.textSecondary, marginLeft: 6 }}
            >
              {getTimeAgo(comment.createdAt)}
            </ThemedText>
          </View>

          {/* Comment actions */}
          <View style={styles.commentActions}>
            {/* Like comment */}
            <TouchableOpacity
              onPress={async () => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                await toggleCommentLike(
                  comment.id,
                  comment.hasUserLiked || false
                );
              }}
              hitSlop={10}
              style={{ flexDirection: "row", alignItems: "center" }}
            >
              <IconSymbol
                name={comment.hasUserLiked ? "heart.fill" : "heart"}
                size={15}
                color={
                  comment.hasUserLiked ? colors.error : colors.textSecondary
                }
              />
              <ThemedText
                type="caption"
                style={{
                  color: comment.hasUserLiked
                    ? colors.error
                    : colors.textSecondary,
                  marginLeft: 2,
                }}
              >
                {comment.likeCount}
              </ThemedText>
            </TouchableOpacity>
            {/* Reply */}
            <TouchableOpacity
              onPress={() => setReplyingTo(comment)}
              hitSlop={10}
              style={{ marginLeft: 18 }}
            >
              <ThemedText
                type="caption"
                style={{ color: colors.tint, fontWeight: "600" }}
              >
                Reply
              </ThemedText>
            </TouchableOpacity>
            {/* Delete (if own) */}
            {isOwn && (
              <TouchableOpacity
                onPress={async () => {
                  Alert.alert(
                    "Delete Comment?",
                    "Are you sure you want to delete this comment?",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Delete",
                        style: "destructive",
                        onPress: async () => await deleteComment(comment.id),
                      },
                    ]
                  );
                }}
                hitSlop={10}
                style={{ marginLeft: 18 }}
              >
                <IconSymbol name="trash" size={15} color={colors.error} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ThemedText
          type="body"
          style={[
            styles.commentContent,
            { color: colors.textSecondary, marginTop: 2 },
          ]}
        >
          {comment.content}
        </ThemedText>

        {/* Replies */}
        {comment.replies?.length > 0 &&
          comment.replies?.map((reply) => renderComment(reply, depth + 1))}
      </View>
    );
  };

  // Modal Content
  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: colors.background }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          {/* HEADER */}
          <View
            style={[
              styles.modalHeader,
              {
                paddingTop: insets.top + 14,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={12}
            >
              <IconSymbol name="x" size={22} color={colors.textSecondary} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: "center" }}>
              <ThemedText
                type="subtitleSemibold"
                style={{ color: colors.text }}
              >
                Post
              </ThemedText>
            </View>
            {/* Placeholder for header alignment */}
            <View style={{ width: 32 }} />
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Author row */}
            <View style={styles.authorRow}>
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
                  {post.authorUsername?.[5]?.toUpperCase() || "U"}
                </ThemedText>
              </View>
              <View style={{ marginLeft: 10, flex: 1 }}>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <ThemedText
                    type="bodyMedium"
                    style={{ color: colors.text, fontWeight: "600" }}
                  >
                    {post.authorUsername}
                  </ThemedText>
                  <UserStreakDisplay userId={post.uid} size="small" />
                </View>
                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary, marginTop: 1 }}
                >
                  {getTimeAgo(post.createdAt)}
                  {isOwnPost && " • Your post"}
                </ThemedText>
              </View>
            </View>

            {/* Categories */}
            <View style={styles.categoriesRow}>
              {post.categories.map((cat, i) => (
                <View
                  key={i}
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: `${getCategoryColor(cat)}20` },
                  ]}
                >
                  <IconSymbol
                    name={getCategoryIcon(cat)}
                    size={13}
                    color={getCategoryColor(cat)}
                  />
                  <ThemedText
                    type="caption"
                    style={{
                      color: getCategoryColor(cat),
                      marginLeft: 4,
                      fontWeight: "500",
                    }}
                  >
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </ThemedText>
                </View>
              ))}
            </View>

            {/* Post title/content */}
            <View style={{ marginBottom: 18 }}>
              <ThemedText
                type="subtitleSemibold"
                style={{ color: colors.text, marginBottom: 4, fontSize: 18 }}
              >
                {post.title}
              </ThemedText>
              <ThemedText
                type="body"
                style={{
                  color: colors.textSecondary,
                  fontSize: 16,
                  lineHeight: 22,
                }}
              >
                {post.content}
              </ThemedText>
            </View>

            {/* Like/Comment actions */}
            <View style={styles.statsRow}>
              <TouchableOpacity
                style={[styles.statButton, isLiked && styles.statButtonActive]}
                onPress={handleLikePost}
                disabled={actionLoading === `like-${post.id}`}
                hitSlop={10}
              >
                <IconSymbol
                  name={isLiked ? "heart.fill" : "heart"}
                  size={21}
                  color={isLiked ? colors.error : colors.textSecondary}
                />
                <ThemedText
                  type="bodyMedium"
                  style={{
                    color: isLiked ? colors.error : colors.textSecondary,
                    marginLeft: 6,
                  }}
                >
                  {likeCount}
                </ThemedText>
              </TouchableOpacity>

              <View style={[styles.statButton, { marginLeft: 24 }]}>
                <IconSymbol
                  name="message"
                  size={21}
                  color={colors.textSecondary}
                />
                <ThemedText
                  type="bodyMedium"
                  style={{ color: colors.textSecondary, marginLeft: 6 }}
                >
                  {post.commentCount}
                </ThemedText>
              </View>
            </View>

            {/* Post actions (delete/report) */}
            <View style={styles.actionsRow}>
              {isOwnPost && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleDeletePost}
                  hitSlop={10}
                >
                  <IconSymbol name="trash" size={16} color={colors.error} />
                  <ThemedText
                    type="caption"
                    style={{ color: colors.error, marginLeft: 5 }}
                  >
                    Delete
                  </ThemedText>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleReportPost}
                hitSlop={10}
              >
                <IconSymbol name="flag" size={16} color={colors.warning} />
                <ThemedText
                  type="caption"
                  style={{ color: colors.warning, marginLeft: 5 }}
                >
                  Report
                </ThemedText>
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View
              style={[styles.divider, { borderBottomColor: colors.border }]}
            />

            {/* COMMENTS */}
            <ThemedText
              type="bodyMedium"
              style={{
                color: colors.text,
                fontWeight: "700",
                fontSize: 16,
                marginBottom: 6,
                letterSpacing: 0.2,
              }}
            >
              Comments
            </ThemedText>

            {commentsLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="small" color={colors.textSecondary} />
              </View>
            ) : commentsError ? (
              <View style={styles.loadingContainer}>
                <IconSymbol
                  name="exclamationmark.triangle"
                  size={20}
                  color={colors.error}
                />
                <ThemedText
                  type="caption"
                  style={{ color: colors.error, marginLeft: 5 }}
                >
                  {commentsError}
                </ThemedText>
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary, opacity: 0.8 }}
                >
                  No comments yet. Be the first to reply!
                </ThemedText>
              </View>
            ) : (
              <View>{comments.map((comment) => renderComment(comment))}</View>
            )}
          </ScrollView>

          {/* COMMENT INPUT */}
          <View
            style={[
              styles.commentInputBar,
              {
                backgroundColor: colors.cardBackground,
                borderTopColor: colors.border,
                paddingBottom: insets.bottom + 8,
              },
            ]}
          >
            {replyingTo && (
              <View style={styles.replyingToBar}>
                <ThemedText
                  type="caption"
                  style={{
                    color: colors.textSecondary,
                    marginRight: 10,
                  }}
                >
                  Replying to{" "}
                  <ThemedText
                    type="captionMedium"
                    style={{ color: colors.tint }}
                  >
                    {replyingTo.authorUsername}
                  </ThemedText>
                </ThemedText>
                <TouchableOpacity
                  onPress={() => setReplyingTo(null)}
                  hitSlop={10}
                >
                  <IconSymbol name="x" size={15} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputRow}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.inputBackground,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder={
                  replyingTo
                    ? `Reply to ${replyingTo.authorUsername}...`
                    : "Add a comment..."
                }
                placeholderTextColor={colors.textSecondary}
                value={commentInput}
                onChangeText={setCommentInput}
                editable={!postingComment && !submitting}
                multiline
                maxLength={500}
                numberOfLines={1}
                blurOnSubmit={true}
                returnKeyType="send"
                onSubmitEditing={handleSubmitComment}
              />
              <TouchableOpacity
                onPress={handleSubmitComment}
                disabled={!commentInput.trim() || postingComment || submitting}
                style={[
                  styles.sendButton,
                  (!commentInput.trim() || postingComment || submitting) && {
                    opacity: 0.6,
                  },
                ]}
                hitSlop={10}
              >
                <IconSymbol name="arrow.up" size={20} color={colors.tint} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingBottom: 6,
    paddingHorizontal: 20,
    minHeight: 56,
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 10,
    paddingHorizontal: 2,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 0,
  },
  avatarText: {
    fontWeight: "600",
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    marginRight: 8,
    marginBottom: 5,
    minWidth: 32,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 4,
  },
  statButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  statButtonActive: {
    transform: [{ scale: 1.08 }],
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 16,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 14,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 64,
    flexDirection: "row",
  },
  commentContainer: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    backgroundColor: "rgba(0,0,0,0.04)",
  },
  replyContainer: {
    marginLeft: 30,
    backgroundColor: "rgba(0,0,0,0.02)",
  },
  commentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  commentUserRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
  },
  commentUsername: {
    fontWeight: "600",
    marginLeft: 2,
  },
  commentActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  commentContent: {
    fontSize: 15,
    lineHeight: 19,
    marginTop: 2,
  },
  commentInputBar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingVertical: 8,
    paddingHorizontal: 18,
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 99,
  },
  replyingToBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
  },
  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 100,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 9,
    borderWidth: 1,
    fontWeight: "500",
  },
  sendButton: {
    padding: 8,
    borderRadius: 999,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 4,
    backgroundColor: "transparent",
  },
});
