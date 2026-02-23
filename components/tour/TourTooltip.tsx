// components/tour/TourTooltip.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import type { RenderProps } from "react-native-spotlight-tour";

interface TourTooltipProps extends RenderProps {
  title: string;
  description: string;
  totalSteps: number;
}

export function TourTooltip({
  title,
  description,
  totalSteps,
  current,
  isFirst,
  isLast,
  next,
  previous,
  stop,
}: TourTooltipProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.modalCardBorder,
          shadowColor: colors.shadow,
        },
      ]}
    >
      {/* Header row with title and close button */}
      <View style={styles.header}>
        <ThemedText type="subtitleSemibold" style={{ color: colors.text, flex: 1 }}>
          {title}
        </ThemedText>
        <TouchableOpacity onPress={stop} hitSlop={8} style={styles.closeButton}>
          <Ionicons name="close" size={18} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Description */}
      <ThemedText type="body" style={{ color: colors.textSecondary, marginBottom: 16 }}>
        {description}
      </ThemedText>

      {/* Footer: step counter + navigation buttons */}
      <View style={styles.footer}>
        <ThemedText type="caption" style={{ color: colors.textSecondary }}>
          {current + 1} of {totalSteps}
        </ThemedText>

        <View style={styles.buttons}>
          {!isFirst && (
            <TouchableOpacity
              onPress={previous}
              style={[styles.backButton, { borderColor: colors.tint }]}
            >
              <ThemedText type="button" style={{ color: colors.tint }}>
                Back
              </ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={next}
            style={[styles.nextButton, { backgroundColor: colors.tint }]}
          >
            <ThemedText type="button" style={{ color: colors.background }}>
              {isLast ? "Done" : "Next"}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 300,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  closeButton: {
    marginLeft: 8,
    padding: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  buttons: {
    flexDirection: "row",
    gap: 8,
  },
  backButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
  },
  nextButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
});
