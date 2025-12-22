// components/morphing/message-thread/accountability/invite-views/DefaultInviteView.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface DefaultInviteViewProps {
  colors: any;
  otherUserId: string;
  threadName: string;
  onClose: () => void;
  onTransitionToRestricted: (type: "hasMentor" | "maxMentees") => void;
  onNavigateToGuidelines: () => void;
}

export function DefaultInviteView({
  colors,
  otherUserId,
  threadName,
  onClose,
  onTransitionToRestricted,
  onNavigateToGuidelines,
}: DefaultInviteViewProps) {
  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View
          style={[styles.iconCircle, { backgroundColor: `${colors.tint}20` }]}
        >
          <IconSymbol name="person.2.fill" size={32} color={colors.tint} />
        </View>
        <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
          Request Anchor Partner
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          Ask {threadName || "this user"} to support your recovery journey
        </ThemedText>
      </View>

      {/* How This Works Section */}
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
          <IconSymbol
            name="arrow.right.circle.fill"
            size={20}
            color={colors.tint}
          />
          <ThemedText
            type="subtitleSemibold"
            style={[styles.infoTitle, { color: colors.text }]}
          >
            How This Works
          </ThemedText>
        </View>
        <ThemedText
          type="body"
          style={[styles.infoText, { color: colors.textSecondary }]}
        >
          You're inviting {threadName || "them"} to be a steady, safe presence
          in your recovery. They'll see your daily check-ins and be there to
          encourage you, challenge you when needed, and remind you that you're
          not alone.
        </ThemedText>
      </View>

      {/* What You'll Do Section */}
      <View style={styles.featuresSection}>
        <ThemedText
          type="captionMedium"
          style={[styles.sectionTitle, { color: colors.textSecondary }]}
        >
          What This Partnership Looks Like:
        </ThemedText>
        <FeatureItem
          icon="checkmark.circle.fill"
          title="Submit Daily Check-Ins"
          description="Share your status with them each day"
          colors={colors}
        />
        <FeatureItem
          icon="message.fill"
          title="Message Them Anytime"
          description="Reach out when you need support or encouragement"
          colors={colors}
        />
      </View>

      {/* Guidelines Required Section */}
      <View
        style={[
          styles.guidelinesRequired,
          {
            backgroundColor: `${colors.warning || "#FF9500"}10`,
            borderColor: `${colors.warning || "#FF9500"}30`,
          },
        ]}
      >
        <View style={styles.guidelinesHeader}>
          <IconSymbol
            name="doc.text.fill"
            size={20}
            color={colors.warning || "#FF9500"}
          />
          <ThemedText
            type="subtitleSemibold"
            style={[styles.guidelinesTitle, { color: colors.text }]}
          >
            Before You Send the Invite
          </ThemedText>
        </View>
        <ThemedText
          type="body"
          style={[styles.guidelinesText, { color: colors.textSecondary }]}
        >
          This partnership works best when both people understand the
          commitment. Please take a moment to read the guidelines so you and{" "}
          {threadName} are aligned on what this is — and what it isn't.
        </ThemedText>
        <TouchableOpacity
          style={[
            styles.guidelinesButton,
            {
              backgroundColor: colors.tint,
            },
          ]}
          onPress={onNavigateToGuidelines}
          activeOpacity={0.8}
        >
          <IconSymbol name="book.fill" size={18} color={colors.white} />
          <ThemedText type="subtitleSemibold" style={{ color: colors.white }}>
            Read Guidelines
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Feature Item Component
function FeatureItem({
  icon,
  title,
  description,
  colors,
}: {
  icon: string;
  title: string;
  description: string;
  colors: any;
}) {
  return (
    <View style={styles.featureItem}>
      <View
        style={[
          styles.featureIconCircle,
          { backgroundColor: `${colors.tint}15` },
        ]}
      >
        <IconSymbol name={icon} size={20} color={colors.tint} />
      </View>
      <View style={styles.featureText}>
        <ThemedText
          type="bodyMedium"
          style={[styles.featureTitle, { color: colors.text }]}
        >
          {title}
        </ThemedText>
        <ThemedText
          type="caption"
          style={[styles.featureDescription, { color: colors.textSecondary }]}
        >
          {description}
        </ThemedText>
      </View>
    </View>
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
  featuresSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    marginBottom: 12,
    marginLeft: 4,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  featureIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    marginBottom: 2,
  },
  featureDescription: {
    lineHeight: 16,
    opacity: 0.8,
  },
  guidelinesRequired: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
  },
  guidelinesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  guidelinesTitle: {
    flex: 1,
  },
  guidelinesText: {
    lineHeight: 20,
    opacity: 0.9,
    marginBottom: 16,
  },
  guidelinesButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
});
