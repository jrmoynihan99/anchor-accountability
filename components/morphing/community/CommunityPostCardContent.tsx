import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UserStreakDisplay } from "@/components/UserStreakDisplay";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { CommunityPost, PostCategory } from "./types";

interface CommunityPostCardContentProps {
  post: CommunityPost;
  isOwnPost?: boolean;
  isLiked?: boolean;
  likeCount?: number;
  onLikePress?: (e?: any) => void;
  onCommentPress?: () => void; // <- NEW
  actionLoading?: boolean;
  showReadMoreHint?: boolean;
}

export function CommunityPostCardContent({
  post,
  isOwnPost,
  isLiked,
  likeCount,
  onLikePress,
  onCommentPress, // <- NEW
  actionLoading,
  showReadMoreHint = true,
}: CommunityPostCardContentProps) {
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
        return "#3B82F6"; // Blue - keep as is
      case "resources":
        return colors.success; // Green - keep as is since it's working
      case "testimonies":
        return "#F59E0B"; // Orange/amber - distinct from blue
      case "other":
      default:
        return colors.textSecondary; // Gray - keep as is
    }
  };

  const timeAgo = getTimeAgo(post.createdAt);

  return (
    <View style={styles.inner}>
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
        {/* Categories */}
        <View style={styles.categories}>
          {post.categories.map((category, index) => (
            <View
              key={index}
              style={[
                styles.categoryBadge,
                { backgroundColor: `${getCategoryColor(category)}20` },
              ]}
            >
              <IconSymbol
                name={getCategoryIcon(category)}
                size={12}
                color={getCategoryColor(category)}
              />
            </View>
          ))}
        </View>
      </View>

      {/* Title */}
      <ThemedText
        type="subtitleSemibold"
        numberOfLines={2}
        style={[styles.title, { color: colors.text }]}
      >
        {post.title}
      </ThemedText>

      {/* Content */}
      <ThemedText
        type="body"
        numberOfLines={showReadMoreHint ? 3 : 999}
        ellipsizeMode="tail"
        style={[styles.content, { color: colors.textSecondary }]}
      >
        {post.content}
      </ThemedText>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.stats}>
          {/* Like Button */}
          <TouchableOpacity
            style={[
              styles.statButton,
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

          {/* Comment "Button" - not touchable */}
          <View
            style={[
              styles.statButton,
              {
                backgroundColor: colors.cardBackground,
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
              {post.commentCount}
            </ThemedText>
          </View>
        </View>

        {/* Read More hint (hide in modal) */}
        {showReadMoreHint && (
          <View style={styles.readMore}>
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              Tap to read more
            </ThemedText>
            <IconSymbol
              name="arrow.right"
              size={12}
              color={colors.textSecondary}
            />
          </View>
        )}
      </View>
    </View>
  );
}

// Helpers
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
  inner: {
    width: "100%",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
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
  categories: {
    flexDirection: "row",
    gap: 6,
  },
  categoryBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    marginBottom: 8,
    lineHeight: 22,
  },
  content: {
    lineHeight: 20,
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stats: {
    flexDirection: "row",
    gap: 8,
  },
  statButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  readMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    opacity: 0.6,
  },
});
