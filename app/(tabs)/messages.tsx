// app/(tabs)/messages.tsx
import { MessageThreadsHeader } from "@/components/messages/MessageThreadsHeader";
import { MessageThreadsSection } from "@/components/messages/MessageThreadsSection";
import { useAccountability } from "@/context/AccountabilityContext";
import { useTheme } from "@/context/ThemeContext";
import { useThreads } from "@/hooks/messages/useThreads";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MessagesScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { mentor, mentees } = useAccountability();

  const accountabilityUserIds = useMemo(() => {
    const ids: string[] = [];
    if (mentor?.mentorUid) ids.push(mentor.mentorUid);
    mentees.forEach((m) => {
      if (m.menteeUid) ids.push(m.menteeUid);
    });
    return ids;
  }, [mentor?.mentorUid, mentees]);

  const { threads, loading, loadingMore, hasMore, error, loadMore } =
    useThreads(accountabilityUserIds);

  // Stable ref for load-more to avoid stale closures in the worklet
  const loadMoreRef = useRef<() => void>(() => {});
  useEffect(() => {
    loadMoreRef.current = () => {
      if (hasMore && !loadingMore && !loading) {
        loadMore();
      }
    };
  }, [hasMore, loadingMore, loading, loadMore]);

  const triggerLoadMore = useCallback(() => {
    loadMoreRef.current();
  }, []);

  // Scroll animation values
  const scrollY = useSharedValue(0);

  // Scroll handler with infinite scroll detection
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;

      const paddingToBottom = 200;
      const isCloseToBottom =
        event.layoutMeasurement.height + event.contentOffset.y >=
        event.contentSize.height - paddingToBottom;

      if (isCloseToBottom) {
        runOnJS(triggerLoadMore)();
      }
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />

      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + 20,
            paddingBottom: insets.bottom + 120,
          },
        ]}
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        {/* Message Threads Section */}
        <MessageThreadsSection
          scrollY={scrollY}
          threads={threads}
          loading={loading}
          loadingMore={loadingMore}
          hasMore={hasMore}
          error={error}
        />
      </Animated.ScrollView>

      {/* Sticky Header */}
      <MessageThreadsHeader
        scrollY={scrollY}
        threadsCount={threads.length}
        loading={loading}
        error={error}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
});
