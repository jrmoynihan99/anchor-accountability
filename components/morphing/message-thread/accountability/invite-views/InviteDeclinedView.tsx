// components/morphing/message-thread/accountability/invite-views/InviteDeclinedView.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface InviteDeclinedViewProps {
  colors: any;
  otherUserId: string;
  threadName: string;
  onClose: () => void;
}

export function InviteDeclinedView({
  colors,
  otherUserId,
  threadName,
  onClose,
}: InviteDeclinedViewProps) {
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
            { backgroundColor: `${colors.textSecondary || "#8E8E93"}20` },
          ]}
        >
          <IconSymbol
            name="xmark.circle.fill"
            size={32}
            color={colors.textSecondary || "#8E8E93"}
          />
        </View>
        <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
          Invite Declined
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          {threadName} has declined your invitation to become your Anchor
          partner. You can send them a new invite anytime.
        </ThemedText>
      </View>

      {/* Info Card */}
      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: `${colors.tint}15`,
            borderColor: `${colors.tint}30`,
          },
        ]}
      >
        <View style={styles.infoHeader}>
          <IconSymbol name="info.circle.fill" size={20} color={colors.tint} />
          <ThemedText
            type="subtitleSemibold"
            style={[styles.infoTitle, { color: colors.text }]}
          >
            What's Next?
          </ThemedText>
        </View>
        <ThemedText
          type="body"
          style={[styles.infoText, { color: colors.textSecondary }]}
        >
          Feel free to continue your conversation with {threadName}. If you'd
          like to try again later, you can send another accountability invite at
          any time.
        </ThemedText>
      </View>

      {/* Got It Button */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          {
            backgroundColor: colors.tint,
          },
        ]}
        onPress={onClose}
        activeOpacity={0.8}
      >
        <ThemedText type="subtitleSemibold" style={{ color: colors.white }}>
          Got It
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
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
});
