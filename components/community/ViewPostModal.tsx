// components/community/ViewPostModal.tsx
import { BaseModal } from "@/components/morphing/BaseModal";
import { useTheme } from "@/hooks/ThemeContext";
import { auth } from "@/lib/firebase";
import React from "react";
import { StyleSheet, View } from "react-native";
import { CommunityPostCardContent } from "./CommunityPostCardContent";
import { CommunityPost } from "./types";

interface ViewPostModalProps {
  isVisible: boolean;
  progress: any;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  post: CommunityPost | null;
}

export function ViewPostModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  post,
}: ViewPostModalProps) {
  const { colors, effectiveTheme } = useTheme();

  if (!post) return null;

  // Determine if the current user owns this post
  const isOwnPost = auth.currentUser?.uid === post.uid;

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
        // Use *real* card content for seamless return animation only
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
      {/* Modal content (only full post, NOT the whole card) */}
      <View style={styles.modalContent}>
        <View style={{ marginBottom: 18 }}>
          <CommunityPostCardContent
            post={post}
            isOwnPost={isOwnPost}
            isLiked={post.hasUserLiked}
            likeCount={post.likeCount}
            showReadMoreHint={false} // No "read more" hint in modal body
            onLikePress={undefined}
            actionLoading={false}
          />
        </View>
        {/* Render long post body, comments, etc here if needed */}
        <View>{/* ...comments or extra content */}</View>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    paddingTop: 56,
    paddingHorizontal: 4,
    width: "100%",
    alignItems: "flex-start",
  },
});
