// components/morphing/message-thread/accountability/invite-views/ReceivedInviteView.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTimezoneComparison } from "@/hooks/useTimezoneComparison";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface ReceivedInviteViewProps {
  colors: any;
  otherUserId: string;
  threadName: string;
  onAcceptInvite: () => Promise<void>;
  onDeclineInvite: () => Promise<void>;
  onClose: () => void;
  onNavigateToGuidelines: () => void;
  hasReadGuidelines: boolean;
}

export function ReceivedInviteView({
  colors,
  otherUserId,
  threadName,
  onAcceptInvite,
  onDeclineInvite,
  onClose,
  onNavigateToGuidelines,
  hasReadGuidelines,
}: ReceivedInviteViewProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Use timezone comparison hook
  const {
    shouldShowWarning: shouldShowTimezoneWarning,
    timeDifference,
    otherUserLocalTime,
  } = useTimezoneComparison(otherUserId);

  const handleAcceptInvite = async () => {
    setIsLoading(true);
    try {
      await onAcceptInvite();
    } catch (error) {
      console.error("Error accepting invite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeclineInvite = async () => {
    setIsLoading(true);
    try {
      await onDeclineInvite();
    } catch (error) {
      console.error("Error declining invite:", error);
    } finally {
      setIsLoading(false);
    }
  };

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
            { backgroundColor: `${colors.success || "#34C759"}20` },
          ]}
        >
          <IconSymbol
            name="bell.badge.fill"
            size={32}
            color={colors.success || "#34C759"}
          />
        </View>
        <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
          Accountability Invite
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          {threadName} has asked you to be their accountability partner
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
          {threadName} is asking you to walk alongside them in their recovery
          journey. You'll be a steady, supportive presence—reviewing their daily
          check-ins, offering encouragement, and being there when they need
          someone to talk to.
        </ThemedText>
      </View>

      {/* What You'll Do Section */}
      <View style={styles.featuresSection}>
        <ThemedText
          type="captionMedium"
          style={[styles.sectionTitle, { color: colors.textSecondary }]}
        >
          Your Responsibilities as Their Partner:
        </ThemedText>
        <FeatureItem
          icon="checkmark.circle.fill"
          title="Review Daily Check-Ins"
          description="See their status each day and respond with support"
          colors={colors}
        />
        <FeatureItem
          icon="message.fill"
          title="Be Available for Support"
          description="They can reach out when struggling or celebrating wins"
          colors={colors}
        />
        <FeatureItem
          icon="heart.fill"
          title="Respond with Grace"
          description="Support them without judgment, especially during setbacks"
          colors={colors}
        />
      </View>

      {/* Guidelines Required Section */}
      {!hasReadGuidelines && (
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
              Before You Accept
            </ThemedText>
          </View>
          <ThemedText
            type="body"
            style={[styles.guidelinesText, { color: colors.textSecondary }]}
          >
            Supporting someone in recovery is a meaningful commitment. Please
            read the partnership guidelines to understand what you're agreeing
            to—and what approaches actually help vs. harm.
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
              Partnership Guidelines
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}

      {/* Guidelines Completed Section */}
      {hasReadGuidelines && (
        <View
          style={[
            styles.guidelinesCompleted,
            {
              backgroundColor: `${colors.success || "#34C759"}10`,
              borderColor: `${colors.success || "#34C759"}30`,
            },
          ]}
        >
          <View style={styles.completedContent}>
            <View
              style={[
                styles.completedIcon,
                {
                  backgroundColor: `${colors.success || "#34C759"}20`,
                },
              ]}
            >
              <IconSymbol
                name="checkmark.circle.fill"
                size={24}
                color={colors.success || "#34C759"}
              />
            </View>
            <View style={styles.completedText}>
              <ThemedText
                type="bodyMedium"
                style={[styles.completedTitle, { color: colors.text }]}
              >
                Guidelines Confirmed
              </ThemedText>
              <ThemedText
                type="caption"
                style={[
                  styles.completedSubtitle,
                  { color: colors.textSecondary },
                ]}
              >
                You're ready to accept the invite
              </ThemedText>
            </View>
          </View>
        </View>
      )}

      {/* Timezone Warning Section (only show if significant difference and guidelines read) */}
      {hasReadGuidelines && shouldShowTimezoneWarning && (
        <View
          style={[
            styles.timezoneCard,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.timezoneHeader}>
            <IconSymbol
              name="clock.fill"
              size={18}
              color={colors.textSecondary}
            />
            <ThemedText
              type="bodyMedium"
              style={[styles.timezoneTitle, { color: colors.text }]}
            >
              Keep Their Timezone in Mind
            </ThemedText>
          </View>
          <ThemedText
            type="body"
            style={[styles.timezoneLabel, { color: colors.textSecondary }]}
          >
            {threadName}'s local time is:
          </ThemedText>
          <ThemedText
            type="subtitleSemibold"
            style={[styles.timezoneValue, { color: colors.text }]}
          >
            {otherUserLocalTime} (
            {timeDifference > 0
              ? `${timeDifference} ${
                  Math.abs(timeDifference) === 1 ? "hour" : "hours"
                } ahead`
              : `${Math.abs(timeDifference)} ${
                  Math.abs(timeDifference) === 1 ? "hour" : "hours"
                } behind`}
            )
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.timezoneNote, { color: colors.textSecondary }]}
          >
            You may receive check-ins or messages from them at different times
            than you're typically available.
          </ThemedText>
        </View>
      )}

      {/* Accept Button */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          {
            backgroundColor: hasReadGuidelines
              ? colors.success || "#34C759"
              : colors.border,
            opacity: isLoading || !hasReadGuidelines ? 0.6 : 1,
          },
        ]}
        onPress={handleAcceptInvite}
        disabled={isLoading || !hasReadGuidelines}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <ThemedText type="subtitleSemibold" style={{ color: colors.white }}>
            {hasReadGuidelines ? "Accept Invite" : "Read Guidelines First"}
          </ThemedText>
        )}
      </TouchableOpacity>

      {/* Decline Button */}
      {hasReadGuidelines && (
        <TouchableOpacity
          style={[styles.secondaryButton, { borderColor: colors.border }]}
          onPress={handleDeclineInvite}
          disabled={isLoading}
          activeOpacity={0.8}
        >
          <ThemedText
            type="subtitleSemibold"
            style={{ color: colors.textSecondary }}
          >
            Decline
          </ThemedText>
        </TouchableOpacity>
      )}

      {/* Note */}
      {!hasReadGuidelines && (
        <ThemedText
          type="caption"
          style={[styles.note, { color: colors.textSecondary }]}
        >
          Taking on this responsibility means committing to daily engagement and
          supportive responses.
        </ThemedText>
      )}
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
  guidelinesCompleted: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 24,
  },
  completedContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  completedIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  completedText: {
    flex: 1,
  },
  completedTitle: {
    marginBottom: 2,
  },
  completedSubtitle: {
    opacity: 0.8,
  },
  timezoneCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  timezoneHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  timezoneTitle: {
    flex: 1,
  },
  timezoneLabel: {
    lineHeight: 20,
    opacity: 0.9,
    marginBottom: 4,
  },
  timezoneValue: {
    lineHeight: 24,
    marginBottom: 8,
  },
  timezoneNote: {
    lineHeight: 18,
    opacity: 0.8,
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
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  note: {
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
