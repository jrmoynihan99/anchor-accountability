import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";

export function VerseCard({ offsetDays = 0 }: { offsetDays?: number }) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];
  const router = useRouter();

  const today = new Date();
  const date = new Date(today);
  date.setDate(today.getDate() + offsetDays);

  const formattedDate = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });

  // Animation
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scale, {
      toValue: 0.97,
      speed: 30,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.spring(scale, {
      toValue: 1,
      speed: 30,
      bounciness: 8,
      useNativeDriver: true,
    }).start();
  };

  const handlePress = () => {
    const params = new URLSearchParams({
      date: formattedDate,
      verseText: "No temptation has overtaken you that is not common to man.",
      reference: "1 Corinthians 10:13",
      offsetDays: offsetDays.toString(),
    });
    router.push(`/modal?${params.toString()}`);
  };

  return (
    <Pressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      style={{ flex: 1 }}
    >
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.cardBackground,
            shadowColor: colors.shadow,
            transform: [{ scale }],
          },
        ]}
      >
        <ThemedText
          type="captionMedium"
          style={[
            styles.date,
            {
              color: colors.textSecondary,
              opacity: 0.6,
            },
          ]}
        >
          {formattedDate}
        </ThemedText>
        <ThemedText
          type="quote"
          style={[
            styles.openQuote,
            {
              color: colors.textSecondary,
              opacity: 0.6,
            },
          ]}
        >
          ❝
        </ThemedText>
        <ThemedText
          type="verse"
          style={[
            styles.verseText,
            {
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 40,
              marginBottom: 8,
            },
          ]}
        >
          No temptation has overtaken you that is not common to man.
        </ThemedText>
        <View style={styles.referenceContainer}>
          <ThemedText
            type="caption"
            style={[
              styles.reference,
              {
                color: colors.textSecondary,
                fontStyle: "italic",
                opacity: 0.8,
              },
            ]}
          >
            1 Corinthians 10:13
          </ThemedText>
        </View>
        <IconSymbol
          name="arrow.left.arrow.right"
          size={18}
          color={colors.icon}
          style={styles.expandIcon}
        />
      </Animated.View>
    </Pressable>
  );
}

const cardPadding = 24;

const styles = StyleSheet.create({
  card: {
    padding: cardPadding,
    borderRadius: 20,
    marginTop: 24,
    marginBottom: 16,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
  date: {
    position: "absolute",
    top: cardPadding,
    right: cardPadding,
  },
  openQuote: {
    position: "absolute",
    top: cardPadding,
    left: cardPadding,
  },
  verseText: {
    // All typography styles moved to Typography.styles.verse
  },
  referenceContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  reference: {
    // Typography styles moved to Typography.styles.caption + inline styles
  },
  expandIcon: {
    position: "absolute",
    bottom: cardPadding,
    left: cardPadding,
    opacity: 0.85,
  },
});
