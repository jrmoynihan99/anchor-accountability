// CreatePostPendingScreen.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

export function CreatePostPendingScreen() {
  const { colors, effectiveTheme } = useTheme();
  const spinValue = useRef(new Animated.Value(0)).current;

  // Main color for icons/titles based on theme
  const mainTextColor = effectiveTheme === "dark" ? colors.text : colors.text;

  // Spinning animation for the loader
  useEffect(() => {
    const spin = () => {
      spinValue.setValue(0);
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }).start(() => spin());
    };
    spin();
  }, [spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        {/* Animated Loading Spinner */}
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Ionicons name="sync" size={40} color={mainTextColor} />
        </Animated.View>

        <ThemedText
          type="titleLarge"
          style={[
            styles.title,
            {
              color: mainTextColor,
              marginTop: 20,
              textAlign: "center",
            },
          ]}
        >
          Reviewing Post
        </ThemedText>

        <ThemedText
          type="body"
          style={[
            styles.description,
            {
              color: colors.textMuted,
              lineHeight: 22,
              textAlign: "center",
              marginTop: 12,
            },
          ]}
        >
          We're reviewing your post. This only takes a moment.
        </ThemedText>

        {/* Progress dots */}
        <View style={styles.dotsContainer}>
          {[0, 1, 2].map((index) => (
            <View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor: colors.textMuted,
                  opacity: 0.4,
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  content: {
    alignItems: "center",
    maxWidth: 320,
  },
  title: {
    // Typography styles moved to Typography.styles.titleLarge + inline styles
  },
  description: {
    // Typography styles moved to Typography.styles.body + inline styles
  },
  dotsContainer: {
    flexDirection: "row",
    marginTop: 24,
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
