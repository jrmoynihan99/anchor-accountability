// components/community/CommunityPostCard.tsx
import { useTheme } from "@/hooks/ThemeContext";
import { auth } from "@/lib/firebase";
import React from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import Animated from "react-native-reanimated";
import { CommunityPostCardContent } from "./CommunityPostCardContent";
import { CommunityPost } from "./types";

interface CommunityPostCardProps {
  post: CommunityPost;
  buttonRef?: any;
  style?: any;
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  isLiked?: boolean;
  likeCount?: number;
  onLikePress?: () => void;
  actionLoading?: boolean;
}

export function CommunityPostCard({
  post,
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
  isLiked,
  likeCount,
  onLikePress,
  actionLoading,
}: CommunityPostCardProps) {
  const { colors } = useTheme();
  const isOwnPost = auth.currentUser?.uid === post.uid;

  const handleLike = (e: any) => {
    e.stopPropagation?.();
    onLikePress?.();
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      activeOpacity={buttonRef ? 1 : 0.85}
      style={{ flex: 1 }}
    >
      <Animated.View
        ref={buttonRef}
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBackground,
            shadowColor: colors.shadow,
            borderColor: colors.cardBorder || "transparent",
          },
          style,
        ]}
      >
        <CommunityPostCardContent
          post={post}
          isOwnPost={isOwnPost}
          isLiked={isLiked}
          likeCount={likeCount}
          onLikePress={handleLike}
          actionLoading={actionLoading}
          showReadMoreHint={true}
        />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
});
