// components/community/CommunityPostCard.tsx
import { useTheme } from "@/hooks/ThemeContext";
import { usePostActions } from "@/hooks/usePostActions";
import { auth } from "@/lib/firebase";
import React, { useState } from "react";
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
}

export function CommunityPostCard({
  post,
  buttonRef,
  style,
  onPress,
  onPressIn,
  onPressOut,
}: CommunityPostCardProps) {
  const { colors } = useTheme();
  const { toggleLike, actionLoading } = usePostActions();
  const [isLiked, setIsLiked] = useState(post.hasUserLiked || false);
  const [likeCount, setLikeCount] = useState(post.likeCount);

  const isOwnPost = auth.currentUser?.uid === post.uid;

  const handleLike = async (e: any) => {
    e.stopPropagation?.();

    setIsLiked(!isLiked);
    setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));

    const success = await toggleLike(post.id, isLiked);
    if (!success) {
      setIsLiked(isLiked);
      setLikeCount(post.likeCount);
    }
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
          style, // This is where the ButtonModalTransitionBridge passes its animated style!
        ]}
      >
        <CommunityPostCardContent
          post={post}
          isOwnPost={isOwnPost}
          isLiked={isLiked}
          likeCount={likeCount}
          onLikePress={handleLike}
          actionLoading={actionLoading === `like-${post.id}`}
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
