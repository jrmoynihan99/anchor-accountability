// components/community/CommunityPostList.tsx
import { ThemedText } from "@/components/ThemedText";
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import { usePostActions } from "@/hooks/usePostActions";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import Animated, {
  FadeInDown,
  LinearTransition,
  SharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { COMMUNITY_HEADER_CONSTANTS, SectionHeader } from "./CommunityHeader";
import { CommunityPostCard } from "./CommunityPostCard";
import { ViewPostModal } from "./ViewPostModal";
import { CommunityPost } from "./types";

// --- Animation wrapper for post entry ---
function AnimatedPostItem({
  children,
  index,
}: {
  children: React.ReactNode;
  index: number;
}) {
  return (
    <Animated.View
      entering={FadeInDown}
      layout={LinearTransition.duration(250)}
      style={{ width: "100%" }}
    >
      {children}
    </Animated.View>
  );
}

interface CommunityPostListProps {
  scrollY: SharedValue<number>;
  onScroll: (event: any) => void;
}

export function CommunityPostList({
  scrollY,
  onScroll,
}: CommunityPostListProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { posts, loading, loadingMore, error, loadMore, refresh } =
    useCommunityPosts();
  const { toggleLike, actionLoading } = usePostActions();

  // Parent state for managing like states across card and modal
  const [postStates, setPostStates] = useState<
    Record<string, { isLiked: boolean; likeCount: number }>
  >({});

  // Initialize state when posts load
  useEffect(() => {
    const initialStates: Record<
      string,
      { isLiked: boolean; likeCount: number }
    > = {};
    posts.forEach((post) => {
      initialStates[post.id] = {
        isLiked: post.hasUserLiked ?? false,
        likeCount: post.likeCount ?? 0,
      };
    });
    setPostStates(initialStates);
  }, [posts]);

  // Like handler
  const handleLike = async (postId: string) => {
    const currentState = postStates[postId];
    if (!currentState) return;

    // Optimistic update
    setPostStates((prev) => ({
      ...prev,
      [postId]: {
        isLiked: !currentState.isLiked,
        likeCount: currentState.isLiked
          ? currentState.likeCount - 1
          : currentState.likeCount + 1,
      },
    }));

    // Call your existing toggleLike function
    const success = await toggleLike(postId, currentState.isLiked);

    // Revert on failure
    if (!success) {
      setPostStates((prev) => ({
        ...prev,
        [postId]: currentState,
      }));
    }
  };

  const renderPost = ({
    item,
    index,
  }: {
    item: CommunityPost;
    index: number;
  }) => (
    <AnimatedPostItem index={index}>
      <ButtonModalTransitionBridge
        buttonBorderRadius={16}
        modalBorderRadius={28}
        modalWidthPercent={0.95}
        modalHeightPercent={0.8}
      >
        {({
          open,
          close,
          isModalVisible,
          progress,
          buttonAnimatedStyle,
          modalAnimatedStyle,
          buttonRef,
          handlePressIn,
          handlePressOut,
        }) => (
          <>
            <CommunityPostCard
              post={item}
              buttonRef={buttonRef}
              style={buttonAnimatedStyle}
              onPress={open}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              isLiked={postStates[item.id]?.isLiked ?? item.hasUserLiked}
              likeCount={postStates[item.id]?.likeCount ?? item.likeCount}
              onLikePress={() => handleLike(item.id)}
              actionLoading={actionLoading === `like-${item.id}`}
            />
            <ViewPostModal
              isVisible={isModalVisible}
              progress={progress}
              modalAnimatedStyle={modalAnimatedStyle}
              close={close}
              post={item}
              isLiked={postStates[item.id]?.isLiked ?? item.hasUserLiked}
              likeCount={postStates[item.id]?.likeCount ?? item.likeCount}
              onLikePress={() => handleLike(item.id)}
              actionLoading={actionLoading === `like-${item.id}`}
            />
          </>
        )}
      </ButtonModalTransitionBridge>
    </AnimatedPostItem>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="clock"
            size={32}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <ThemedText
            type="captionMedium"
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            Loading posts...
          </ThemedText>
        </View>
      );
    }
    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={32}
            color={colors.textSecondary}
            style={styles.emptyIcon}
          />
          <ThemedText
            type="captionMedium"
            style={[styles.emptyText, { color: colors.textSecondary }]}
          >
            {error}
          </ThemedText>
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <IconSymbol
          name="bubble.left.and.bubble.right"
          size={32}
          color={colors.textSecondary}
          style={styles.emptyIcon}
        />
        <ThemedText
          type="captionMedium"
          style={[styles.emptyText, { color: colors.textSecondary }]}
        >
          No posts yet
        </ThemedText>
        <ThemedText
          type="caption"
          style={[styles.emptySubtext, { color: colors.textSecondary }]}
        >
          Be the first to share something with the community
        </ThemedText>
      </View>
    );
  };

  const renderFooter = () =>
    loadingMore ? (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.textSecondary} />
      </View>
    ) : null;

  return (
    <Animated.FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={() => <SectionHeader scrollY={scrollY} />}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 120,
          paddingHorizontal: 24,
        },
        posts.length === 0 && styles.emptyContentContainer,
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="always"
      keyboardDismissMode="interactive"
      onScroll={onScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl
          refreshing={loading && posts.length > 0}
          onRefresh={refresh}
          tintColor={colors.textSecondary}
          progressViewOffset={
            insets.top + COMMUNITY_HEADER_CONSTANTS.STICKY_HEADER_HEIGHT
          }
        />
      }
      onEndReached={loadMore}
      onEndReachedThreshold={0.3}
    />
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingHorizontal: 0,
  },
  emptyContentContainer: {
    flexGrow: 1,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 12,
    opacity: 0.6,
  },
  emptyText: {
    textAlign: "center",
    marginBottom: 4,
    opacity: 0.8,
  },
  emptySubtext: {
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 18,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
