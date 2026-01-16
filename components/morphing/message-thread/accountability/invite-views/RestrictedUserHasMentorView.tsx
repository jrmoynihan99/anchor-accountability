// components/morphing/message-thread/accountability/invite-views/RestrictedUserHasMentorView.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface RestrictedUserHasMentorViewProps {
  colors: any;
  otherUserId: string;
  threadName: string;
  onClose: () => void;
}

export function RestrictedUserHasMentorView({
  colors,
  otherUserId,
  threadName,
  onClose,
}: RestrictedUserHasMentorViewProps) {
  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${colors.textSecondary}20` },
          ]}
        >
          <IconSymbol
            name="person.2.fill"
            size={32}
            color={colors.textSecondary}
          />
        </View>

        <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
          You’re Already Supported
        </ThemedText>

        <ThemedText
          type="body"
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          You already have an Anchor Partner supporting you.
        </ThemedText>
      </View>

      {/* Info Card */}
      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.infoHeader}>
          <IconSymbol name="info.circle.fill" size={20} color={colors.tint} />
          <ThemedText
            type="subtitleSemibold"
            style={[styles.infoTitle, { color: colors.text }]}
          >
            How Anchor Accountability Works
          </ThemedText>
        </View>

        <ThemedText
          type="body"
          style={[styles.infoText, { color: colors.textSecondary }]}
        >
          Anchor is designed so that each person has{" "}
          <ThemedText type="bodyMedium" style={{ color: colors.text }}>
            one primary source of accountability (their Anchor Partner)
          </ThemedText>{" "}
          — someone who sees their daily check-ins and walks closely with them
          through recovery.
        </ThemedText>

        <ThemedText
          type="body"
          style={[styles.infoText, { color: colors.textSecondary }]}
        >
          This helps keep the relationship focused, consistent, and meaningful.
        </ThemedText>

        <ThemedText
          type="body"
          style={[styles.infoText, { color: colors.textSecondary }]}
        >
          While you can only have one Anchor Partner, you’re able to be{" "}
          <ThemedText type="bodyMedium" style={{ color: colors.text }}>
            up to three people's Anchor Partner. They can invite you via private
            chat.
          </ThemedText>
        </ThemedText>
      </View>

      {/* Close Button */}
      <TouchableOpacity
        style={[
          styles.secondaryButton,
          {
            borderColor: colors.border,
          },
        ]}
        onPress={onClose}
        activeOpacity={0.8}
      >
        <ThemedText
          type="subtitleSemibold"
          style={{ color: colors.textSecondary }}
        >
          Got it
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 4,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    flex: 1,
  },
  infoText: {
    lineHeight: 20,
    opacity: 0.9,
    marginBottom: 12,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
});
