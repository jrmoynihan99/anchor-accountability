import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { StyleSheet, View } from "react-native";

export function CarouselDots({
  currentIndex,
  total,
  maxVisible = 3,
}: {
  currentIndex: number;
  total: number;
  maxVisible?: number;
}) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(0, currentIndex - half);
  let end = Math.min(total, start + maxVisible);

  // Adjust if at the end
  if (end - start < maxVisible && start > 0) {
    start = Math.max(0, end - maxVisible);
  }

  const visible = Array.from({ length: end - start }, (_, i) => i + start);

  const showLeftFade = start > 0;
  const showRightFade = end < total;

  return (
    <View style={styles.container}>
      {showLeftFade && (
        <View
          style={[
            styles.dot,
            styles.fadeDot,
            { backgroundColor: colors.textSecondary },
          ]}
        />
      )}

      {visible.map((i) => {
        const isActive = i === currentIndex;
        return (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: isActive ? colors.tint : colors.textSecondary,
                opacity: isActive ? 1 : 0.4,
                transform: [{ scale: isActive ? 1.1 : 0.8 }],
              },
            ]}
          />
        );
      })}

      {showRightFade && (
        <View
          style={[
            styles.dot,
            styles.fadeDot,
            { backgroundColor: colors.textSecondary },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  fadeDot: {
    opacity: 0.2,
    transform: [{ scale: 0.6 }],
  },
});
