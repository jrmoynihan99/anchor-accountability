// components/community/PostDetailView.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UserStreakDisplay } from "@/components/UserStreakDisplay";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { BlockUserIcon } from "../../BlockUserIcon";
import { CommunityPost, PostCategory } from "./types";

interface PostDetailViewProps {
  post: CommunityPost;
  isOwnPost?: boolean;
  isLiked?: boolean;
  likeCount?: number;
  onLikePress?: (e?: any) => void;
  actionLoading?: boolean;
  onClose?: () => void;
}

export function PostDetailView({
  post,
  isOwnPost,
  isLiked,
  likeCount,
  onLikePress,
  actionLoading,
  onClose,
}: PostDetailViewProps) {
  const { colors } = useTheme();

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
        return "#3B82F6"; // Blue
      case "resources":
        return colors.success; // Green
      case "testimonies":
        return "#F59E0B"; // Orange/amber
      case "other":
      default:
        return colors.textSecondary;
    }
  };

  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <View style={styles.container}>
      {/* Header */}
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
              {post.authorUsername?.[5]?.toUpperCase() || "U"}
            </ThemedText>
          </View>
          <View style={styles.userDetails}>
            <View style={styles.usernameRow}>
              <ThemedText
                type="bodyMedium"
                style={[styles.username, { color: colors.text }]}
              >
                {post.authorUsername}
              </ThemedText>
              <UserStreakDisplay userId={post.uid} size="small" />
              {!isOwnPost && <BlockUserIcon userIdToBlock={post.uid} />}
            </View>
            <ThemedText
              type="caption"
              style={[styles.timestamp, { color: colors.textSecondary }]}
            >
              {timeAgo}
              {isOwnPost && " • Your post"}
            </ThemedText>
          </View>
        </View>

        {/* Like Button - moved to top right */}
        <TouchableOpacity
          style={[
            styles.likeButton,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
            isLiked && {
              backgroundColor: colors.error + "11",
              borderColor: colors.error + "33",
            },
          ]}
          onPress={onLikePress}
          disabled={actionLoading}
          activeOpacity={0.75}
          hitSlop={8}
        >
          <IconSymbol
            name={isLiked ? "heart.fill" : "heart"}
            size={18}
            color={isLiked ? colors.error : colors.textSecondary}
            style={{ marginRight: 4 }}
          />
          <ThemedText
            type="captionMedium"
            style={{
              color: isLiked ? colors.error : colors.textSecondary,
              fontWeight: isLiked ? "700" : "400",
            }}
          >
            {likeCount}
          </ThemedText>
        </TouchableOpacity>
      </View>

      {/* Categories - now without icons */}
      {post.categories.length > 0 && (
        <View style={styles.categoriesRow}>
          {post.categories.map((category, index) => (
            <View
              key={index}
              style={[
                styles.categoryBadge,
                { backgroundColor: `${getCategoryColor(category)}20` },
              ]}
            >
              <ThemedText
                type="caption"
                style={{
                  color: getCategoryColor(category),
                  fontWeight: "500",
                }}
              >
                {category}
              </ThemedText>
            </View>
          ))}
        </View>
      )}

      {/* Title */}
      <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
        {post.title}
      </ThemedText>

      {/* Content */}
      <ThemedText
        type="body"
        style={[styles.content, { color: colors.textSecondary }]}
      >
        {post.content}
      </ThemedText>

      {/* Chat invitation section */}
      {post.openToChat && !isOwnPost && (
        <TouchableOpacity
          style={styles.chatInvitation}
          onPress={() => {
            // Close the modal first
            onClose?.();

            // Small delay to let modal close animation start
            setTimeout(() => {
              // Start a new chat with the post author
              router.push({
                pathname: "/message-thread",
                params: {
                  threadId: "", // Empty for new threads
                  threadName: post.authorUsername,
                  otherUserId: post.uid,
                  postId: post.id,
                  isNewThread: "true",
                },
              });
            }, 100); // 100ms delay for smooth transition
          }}
          activeOpacity={0.8}
        >
          <View style={styles.chatInvitationContent}>
            <ThemedText type="small" style={{ color: colors.textSecondary }}>
              Start a chat with the author
            </ThemedText>
            <View style={[styles.chatButton, { backgroundColor: colors.tint }]}>
              <IconSymbol
                name="square.and.pencil"
                size={20}
                color={colors.white}
              />
            </View>
          </View>
        </TouchableOpacity>
      )}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  avatarText: {
    fontWeight: "600",
  },
  userDetails: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  username: {
    lineHeight: 18,
  },
  timestamp: {
    marginTop: 1,
    opacity: 0.8,
  },
  categoriesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginBottom: 12,
    lineHeight: 26,
  },
  content: {
    lineHeight: 22,
    marginBottom: 20,
  },
  likeButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    right: 44,
  },
  // Chat invitation styles
  chatInvitation: {
    position: "relative",
    marginTop: 0,
    marginBottom: -8,
    marginRight: -8,
  },
  chatInvitationContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 8,
  },
  chatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
