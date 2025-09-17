import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { CarouselDots } from "../../../CarouselDots";

interface VerseCardContentProps {
  verse: string | null;
  reference: string | null;
  formattedDate: string;
  loading: boolean;
  index?: number;
  currentIndex?: number;
  total?: number;
  showCarouselDots?: boolean;
}

export function VerseCardContent({
  verse,
  reference,
  formattedDate,
  loading,
  index,
  currentIndex,
  total,
  showCarouselDots = true,
}: VerseCardContentProps) {
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.textSecondary} />
      </View>
    );
  }

  if (!verse) {
    return (
      <View style={styles.noContentContainer}>
        <ThemedText
          type="caption"
          style={{
            color: colors.textSecondary,
            textAlign: "center",
            opacity: 0.6,
          }}
        >
          No content available for {formattedDate}
        </ThemedText>
      </View>
    );
  }

  return (
    <>
      {/* Top-right icon */}
      <IconSymbol
        name="arrow.up.left.and.arrow.down.right"
        size={18}
        color={colors.icon}
        style={styles.topRightIcon}
      />

      {/* Bottom-left date */}
      <ThemedText
        type="captionMedium"
        style={[
          styles.bottomLeftDate,
          { color: colors.textSecondary, opacity: 0.6 },
        ]}
      >
        {formattedDate}
      </ThemedText>

      {/* Open quote mark */}
      <ThemedText
        type="quote"
        style={[
          styles.openQuote,
          { color: colors.textSecondary, opacity: 0.6 },
        ]}
      >
        ❝
      </ThemedText>

      {/* Main verse text, max 3 lines */}
      <ThemedText
        type="verse"
        numberOfLines={3}
        ellipsizeMode="tail"
        style={[
          styles.verseText,
          {
            color: colors.textSecondary,
            textAlign: "center",
            marginTop: 40,
            marginBottom: 32,
          },
        ]}
      >
        {verse}
      </ThemedText>

      {/* Reference */}
      <View style={styles.referenceContainer}>
        <ThemedText
          type="caption"
          style={[
            styles.reference,
            {
              color: colors.textSecondary,
              fontStyle: "italic",
              opacity: 0.8,
              maxWidth: 125, // adjust as needed!
            },
          ]}
          numberOfLines={1}
          ellipsizeMode="tail"
        >
          {reference}
        </ThemedText>
      </View>

      {/* Carousel Dots (bottom-center) */}
      {showCarouselDots &&
        typeof index === "number" &&
        typeof currentIndex === "number" &&
        typeof total === "number" && (
          <View style={styles.dotsContainer}>
            <CarouselDots currentIndex={currentIndex} total={total} />
          </View>
        )}
    </>
  );
}

const cardPadding = 24;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  noContentContainer: {
    flex: 1,
    padding: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  verseText: {},
  openQuote: {
    position: "absolute",
    top: cardPadding,
    left: cardPadding,
  },
  referenceContainer: {
    position: "absolute",
    bottom: cardPadding,
    right: cardPadding,
  },
  reference: {},
  topRightIcon: {
    position: "absolute",
    top: cardPadding,
    right: cardPadding,
    opacity: 0.85,
  },
  bottomLeftDate: {
    position: "absolute",
    bottom: cardPadding,
    left: cardPadding,
  },
  dotsContainer: {
    position: "absolute",
    bottom: cardPadding,
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
});
