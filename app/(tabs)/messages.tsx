// app/(tabs)/messages.tsx
import { MessageThreadsHeader } from "@/components/messages/MessageThreadsHeader";
import { MessageThreadsSection } from "@/components/messages/MessageThreadsSection";
import { useTheme } from "@/context/ThemeContext";
import { useThreads } from "@/hooks/useThreads";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MessagesScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { threads, loading, error } = useThreads();

  // Scroll animation values
  const scrollY = useSharedValue(0);

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
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
        <MessageThreadsSection scrollY={scrollY} onScroll={scrollHandler} />
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
