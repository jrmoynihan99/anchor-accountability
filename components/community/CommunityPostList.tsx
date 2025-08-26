// components/community/CommunityPostList.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useCommunityPosts } from "@/hooks/useCommunityPosts";
import React from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CommunityPostCard } from "./CommunityPostCard";
import { CommunityPost } from "./types";

export function CommunityPostList() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { posts, loading, loadingMore, error, hasMore, loadMore, refresh } =
    useCommunityPosts();

  const renderPost = ({ item }: { item: CommunityPost }) => (
    <CommunityPostCard post={item} />
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.iconCircleBackground },
          ]}
        >
          <IconSymbol name="person.2" size={20} color={colors.icon} />
        </View>
        <View style={styles.headerText}>
          <ThemedText
            type="title"
            style={[styles.headerTitle, { color: colors.text }]}
          >
            Community
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Share testimonies, resources, and support
          </ThemedText>
        </View>
      </View>
    </View>
  );

  const renderEmpty = () => {
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.textSecondary} />
          <ThemedText
            type="caption"
            style={[styles.loadingText, { color: colors.textSecondary }]}
          >
            Loading posts...
          </ThemedText>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <IconSymbol
            name="exclamationmark.triangle"
            size={32}
            color={colors.textSecondary}
          />
          <ThemedText
            type="body"
            style={[styles.errorText, { color: colors.textSecondary }]}
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
          size={48}
          color={colors.textSecondary}
          style={styles.emptyIcon}
        />
        <ThemedText
          type="subtitleSemibold"
          style={[styles.emptyTitle, { color: colors.text }]}
        >
          No posts yet
        </ThemedText>
        <ThemedText
          type="caption"
          style={[styles.emptyText, { color: colors.textSecondary }]}
        >
          Be the first to share something with the community
        </ThemedText>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.textSecondary} />
      </View>
    );
  };

  return (
    <FlatList
      data={posts}
      renderItem={renderPost}
      keyExtractor={(item) => item.id}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      contentContainerStyle={[
        styles.contentContainer,
        {
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 120,
        },
        posts.length === 0 && styles.emptyContentContainer,
      ]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={loading && posts.length > 0}
          onRefresh={refresh}
          tintColor={colors.textSecondary}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    lineHeight: 22,
  },
  headerSubtitle: {
    marginTop: 1,
    opacity: 0.8,
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    opacity: 0.8,
  },
  errorText: {
    textAlign: "center",
    marginTop: 8,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIcon: {
    marginBottom: 16,
    opacity: 0.4,
  },
  emptyTitle: {
    marginBottom: 8,
  },
  emptyText: {
    textAlign: "center",
    opacity: 0.6,
    lineHeight: 18,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
});
