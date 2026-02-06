// components/messages/MessageThreadsHeader.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Constants for header transition
const HEADER_HEIGHT = 120;
const STICKY_HEADER_HEIGHT = 44;
const SCROLL_THRESHOLD = 40;

// --- Large Section Header (for ListHeaderComponent)
interface SectionHeaderProps {
  scrollY: SharedValue<number>;
  threadsCount: number;
  loading?: boolean;
  error?: string | null;
}

export function SectionHeader({
  scrollY,
  threadsCount,
  loading = false,
  error = null,
}: SectionHeaderProps) {
  const { colors } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 24, 48],
      [1, 0.4, 0],
      Extrapolation.CLAMP,
    );
    return { opacity };
  });

  const getSubtitleText = () => {
    if (loading) return "Loading conversations...";
    if (error) return "Error loading conversations";
    if (threadsCount > 0) {
      return `${threadsCount} ongoing conversation${
        threadsCount === 1 ? "" : "s"
      }`;
    }
    return "No conversations yet";
  };

  return (
    <Animated.View style={[styles.header, animatedStyle]}>
      <View style={styles.headerLeft}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.iconCircleBackground },
          ]}
        >
          <IconSymbol name="message" size={20} color={colors.icon} />
        </View>
        <View style={styles.headerText}>
          <ThemedText
            type="title"
            style={[styles.headerTitle, { color: colors.text }]}
          >
            Private Chats
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            {getSubtitleText()}
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

// --- Sticky Header Component
function StickyHeader({ animatedStyle }: { animatedStyle: any }) {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Animated.View
      style={[
        styles.stickyHeader,
        {
          paddingTop: insets.top,
          height: STICKY_HEADER_HEIGHT + insets.top,
        },
        animatedStyle,
      ]}
    >
      <BlurView
        intensity={Platform.OS === "android" ? 100 : 50}
        tint={effectiveTheme === "dark" ? "dark" : "light"}
        style={StyleSheet.absoluteFillObject}
      />
      {/* Add navBackground color overlay */}
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.navBackground,
            borderBottomWidth: 0,
            borderBottomColor: colors.navBorder,
          },
        ]}
      />
      <View style={styles.stickyHeaderContent}>
        <View style={styles.stickyHeaderLeft}>
          <View
            style={[
              styles.stickyIconCircle,
              { backgroundColor: colors.iconCircleBackground },
            ]}
          >
            <IconSymbol name="message" size={16} color={colors.icon} />
          </View>
          <ThemedText
            type="subtitleSemibold"
            style={[styles.stickyHeaderTitle, { color: colors.text }]}
          >
            Private Chats
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

// --- Main MessageThreadsHeader Component
interface MessageThreadsHeaderProps {
  scrollY: SharedValue<number>;
  threadsCount: number;
  loading?: boolean;
  error?: string | null;
}

export function MessageThreadsHeader({
  scrollY,
  threadsCount,
  loading = false,
  error = null,
}: MessageThreadsHeaderProps) {
  const visible = useSharedValue(0);

  useAnimatedReaction(
    () => scrollY.value > SCROLL_THRESHOLD,
    (isPast, wasPast) => {
      if (isPast !== wasPast) {
        visible.value = withTiming(isPast ? 1 : 0, {
          duration: 200,
        });
      }
    },
  );

  const stickyHeaderAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: visible.value,
      transform: [
        {
          translateY: interpolate(visible.value, [0, 1], [-20, 0]),
        },
      ],
    };
  });

  return <StickyHeader animatedStyle={stickyHeaderAnimatedStyle} />;
}

const styles = StyleSheet.create({
  // Large header styles
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

  // Sticky header styles
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  stickyHeaderContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
  },
  stickyHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  stickyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  stickyHeaderTitle: {
    fontSize: 17,
    fontWeight: "600",
  },
});

// Export constants for use in other components
export const MESSAGE_HEADER_CONSTANTS = {
  HEADER_HEIGHT,
  STICKY_HEADER_HEIGHT,
  SCROLL_THRESHOLD,
};
