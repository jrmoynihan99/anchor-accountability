// components/morphing/settings/SupportSection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { isDonationAvailable, useDonation } from "@/hooks/misc/useDonation";
import { useReviewPrompt } from "@/hooks/misc/useReviewPrompt";
import * as Haptics from "expo-haptics";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export function SupportSection() {
  const { colors } = useTheme();
  const { openDonationPage } = useDonation();
  const { triggerReview } = useReviewPrompt();

  const handleSupportPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    openDonationPage();
  };

  const handleRatePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    triggerReview();
  };

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <IconSymbol name="heart" size={20} color={colors.textSecondary} />
        <ThemedText type="bodyMedium" style={styles.sectionTitle}>
          Support
        </ThemedText>
      </View>

      {/* Tip / Support Section — only shown where external payments are allowed */}
      {isDonationAvailable && (
        <View style={styles.buttonSection}>
          <ThemedText
            type="caption"
            style={[styles.description, { color: colors.textSecondary }]}
          >
            Support the project to keep it free and growing
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: colors.tint,
              },
            ]}
            onPress={handleSupportPress}
            activeOpacity={0.8}
          >
            <IconSymbol name="heart.fill" size={18} color="#FFFFFF" />
            <ThemedText type="bodyMedium" style={styles.buttonText}>
              Support
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Review Section */}
      <View style={[styles.buttonSection, styles.lastSection]}>
        <ThemedText
          type="caption"
          style={[styles.description, { color: colors.textSecondary }]}
        >
          Help others who are struggling find this app
        </ThemedText>
        <TouchableOpacity
          style={[
            styles.button,
            styles.secondaryButton,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.cardBorder,
            },
          ]}
          onPress={handleRatePress}
          activeOpacity={0.8}
        >
          <IconSymbol name="star.fill" size={18} color={colors.tint} />
          <ThemedText
            type="bodyMedium"
            style={[styles.buttonText, { color: colors.text }]}
          >
            Leave a Review
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  sectionTitle: {
    marginLeft: 8,
  },
  buttonSection: {
    marginBottom: 20,
  },
  lastSection: {
    marginBottom: 0,
  },
  description: {
    marginBottom: 10,
    lineHeight: 18,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    borderWidth: 1,
  },
  buttonText: {
    color: "#FFFFFF",
  },
});
