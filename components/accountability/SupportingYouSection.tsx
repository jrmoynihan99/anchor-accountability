import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Extrapolation,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";

export function SupportingYouSection({
  scrollY,
}: {
  scrollY: SharedValue<number>;
}) {
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
            Supporting You
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.headerSubtitle, { color: colors.textSecondary }]}
          >
            Your accountability partner lead
          </ThemedText>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
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
});
