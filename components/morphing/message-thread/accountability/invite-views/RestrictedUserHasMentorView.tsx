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
          Already Have a Partner
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          You already have an accountability partner. You can only have one
          partner at a time.
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
            Why only one partner?
          </ThemedText>
        </View>
        <ThemedText
          type="body"
          style={[styles.infoText, { color: colors.textSecondary }]}
        >
          Having one dedicated accountability partner helps create a deeper,
          more meaningful support relationship. They can focus on your journey
          and provide consistent encouragement.
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
          Close
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
