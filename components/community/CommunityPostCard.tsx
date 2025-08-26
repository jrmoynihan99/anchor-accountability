// components/community/CommunityPostCard.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UserStreakDisplay } from "@/components/UserStreakDisplay";
import { useTheme } from "@/hooks/ThemeContext";
import { usePostActions } from "@/hooks/usePostActions";
import { auth } from "@/lib/firebase";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { PostDetailModal } from "./PostDetailsModal";
import { CommunityPost, PostCategory } from "./types";

interface CommunityPostCardProps {
  post: CommunityPost;
}

export function CommunityPostCard({ post }: CommunityPostCardProps) {
  const { colors } = useTheme();
  const { toggleLike, actionLoading } = usePostActions();
  const [showDetail, setShowDetail] = useState(false);
  const [isLiked, setIsLiked] = useState(post.hasUserLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const isOwnPost = auth.currentUser?.uid === post.uid;
  const timeAgo = getTimeAgo(post.createdAt);

  const handleLike = async (e: any) => {
    e.stopPropagation();
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Optimistic UI update
    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    const success = await toggleLike(post.id, isLiked);
    if (!success) {
      // Revert on failure
      setIsLiked(isLiked);
      setLikeCount(post.likeCount);
    }
  };

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

  return (
    <>
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBackground,
            shadowColor: colors.shadow,
            borderColor: colors.cardBorder || "transparent",
          },
        ]}
        onPress={() => setShowDetail(true)}
        activeOpacity={0.85}
      >
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

        {/* Content Preview */}
        <ThemedText
          type="body"
          numberOfLines={3}
          ellipsizeMode="tail"
          style={[styles.content, { color: colors.textSecondary }]}
        >
          {post.content}
        </ThemedText>

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.stats}>
            <TouchableOpacity
              style={[styles.statItem, isLiked && styles.statItemActive]}
              onPress={handleLike}
              disabled={actionLoading === `like-${post.id}`}
            >
              <IconSymbol
                name={isLiked ? "heart.fill" : "heart"}
                size={18}
                color={isLiked ? colors.error : colors.textSecondary}
              />
              <ThemedText
                type="captionMedium"
                style={{
                  color: isLiked ? colors.error : colors.textSecondary,
                }}
              >
                {likeCount}
              </ThemedText>
            </TouchableOpacity>

            <View style={styles.statItem}>
              <IconSymbol
                name="message"
                size={18}
                color={colors.textSecondary}
              />
              <ThemedText
                type="captionMedium"
                style={{ color: colors.textSecondary }}
              >
                {post.commentCount}
              </ThemedText>
            </View>
          </View>

          <View style={styles.readMore}>
            <ThemedText type="caption" style={{ color: colors.tint }}>
              Tap to read more
            </ThemedText>
            <IconSymbol name="arrow.right" size={12} color={colors.tint} />
          </View>
        </View>
      </TouchableOpacity>

      {/* Post Detail Modal */}
      <PostDetailModal
        post={{ ...post, hasUserLiked: isLiked, likeCount }}
        isVisible={showDetail}
        onClose={() => setShowDetail(false)}
      />
    </>
  );
}

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
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
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
    gap: 20,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statItemActive: {
    transform: [{ scale: 1.05 }],
  },
  readMore: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    opacity: 0.6,
  },
});
