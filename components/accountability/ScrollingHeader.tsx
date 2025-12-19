// components/accountability/AccountabilityHeader.tsx
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
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const HEADER_HEIGHT = 120;
const STICKY_HEADER_HEIGHT = 44;
const SCROLL_THRESHOLD = 80;

export function SectionHeader({ scrollY }: { scrollY: SharedValue<number> }) {
  const { colors } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 24, 48],
      [1, 0.4, 0],
      Extrapolation.CLAMP
    );
    return { opacity };
  });

  return (
    <Animated.View style={[styles.header, animatedStyle]}>
      <View style={styles.headerLeft}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.iconCircleBackground },
          ]}
        >
          <IconSymbol
            name="person.crop.circle.badge.checkmark"
            size={20}
            color={colors.icon}
          />
        </View>
        <View style={styles.headerText}>
          <ThemedText
            type="title"
            style={[styles.headerTitle, { color: colors.text }]}
          >
            Accountability
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Your mentor & the men you're supporting
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

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
      <View
        style={[
          StyleSheet.absoluteFillObject,
          {
            backgroundColor: colors.navBackground,
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
            <IconSymbol
              name="person.crop.circle.badge.checkmark"
              size={16}
              color={colors.icon}
            />
          </View>
          <ThemedText
            type="subtitleSemibold"
            style={[styles.stickyHeaderTitle, { color: colors.text }]}
          >
            Accountability
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

export function ScrollingHeader({ scrollY }: { scrollY: SharedValue<number> }) {
  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [0, 1],
      Extrapolation.CLAMP
    );

    const translateY = interpolate(
      scrollY.value,
      [0, SCROLL_THRESHOLD],
      [-20, 0],
      Extrapolation.CLAMP
    );

    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  return <StickyHeader animatedStyle={animatedStyle} />;
}

const styles = StyleSheet.create({
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
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  stickyHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    width: "100%",
    height: STICKY_HEADER_HEIGHT,
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

export const ACCOUNTABILITY_HEADER_CONSTANTS = {
  HEADER_HEIGHT,
  STICKY_HEADER_HEIGHT,
  SCROLL_THRESHOLD,
};
