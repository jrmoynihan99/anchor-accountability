// components/morphing/message-thread/accountability/invite-views/DefaultInviteView.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTimezoneComparison } from "@/hooks/useTimezoneComparison";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface DefaultInviteViewProps {
  colors: any;
  otherUserId: string;
  threadName: string;
  onSendInvite: () => Promise<void>;
  onClose: () => void;
  onTransitionToRestricted: (type: "hasMentor" | "maxMentees") => void;
  onNavigateToGuidelines: () => void;
  hasReadGuidelines: boolean;
}

export function DefaultInviteView({
  colors,
  otherUserId,
  threadName,
  onSendInvite,
  onClose,
  onTransitionToRestricted,
  onNavigateToGuidelines,
  hasReadGuidelines,
}: DefaultInviteViewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [otherUserMenteeCount, setOtherUserMenteeCount] = useState<
    number | null
  >(null);
  const [loadingMenteeCount, setLoadingMenteeCount] = useState(true);

  // Use timezone comparison hook
  const {
    shouldShowWarning: shouldShowTimezoneWarning,
    timeDifference,
    otherUserLocalTime,
  } = useTimezoneComparison(otherUserId);

  const otherUserHasMaxMentees =
    otherUserMenteeCount !== null && otherUserMenteeCount >= 3;

  // Load OTHER user's mentee count from their user document
  useEffect(() => {
    const fetchMenteeCount = async () => {
      if (!otherUserId) return;

      setLoadingMenteeCount(true);
      try {
        const userDoc = await getDoc(doc(db, "users", otherUserId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setOtherUserMenteeCount(userData.menteeCount ?? 0);
        } else {
          setOtherUserMenteeCount(0);
        }
      } catch (error) {
        console.error("Error fetching mentee count:", error);
        setOtherUserMenteeCount(0);
      } finally {
        setLoadingMenteeCount(false);
      }
    };

    fetchMenteeCount();
  }, [otherUserId]);

  // Check if we should transition to restricted view
  useEffect(() => {
    if (!loadingMenteeCount && otherUserHasMaxMentees) {
      onTransitionToRestricted("maxMentees");
    }
  }, [loadingMenteeCount, otherUserHasMaxMentees]);

  const handleSendInvite = async () => {
    setIsLoading(true);
    try {
      await onSendInvite();
    } catch (error) {
      console.error("Error sending invite:", error);
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
          style={[styles.iconCircle, { backgroundColor: `${colors.tint}20` }]}
        >
          <IconSymbol name="person.2.fill" size={32} color={colors.tint} />
        </View>
        <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
          Request Accountability Partner
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
                You're ready to send your invite
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
            type="body"
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
            They may not be available to respond immediately depending on their
            schedule.
          </ThemedText>
        </View>
      )}

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          {
            backgroundColor: hasReadGuidelines ? colors.tint : colors.border,
            opacity:
              isLoading || loadingMenteeCount || !hasReadGuidelines ? 0.6 : 1,
          },
        ]}
        onPress={handleSendInvite}
        disabled={isLoading || loadingMenteeCount || !hasReadGuidelines}
        activeOpacity={0.8}
      >
        {isLoading || loadingMenteeCount ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <IconSymbol name="paperplane.fill" size={18} color={colors.white} />
            <ThemedText type="subtitleSemibold" style={{ color: colors.white }}>
              {hasReadGuidelines ? "Send Invite" : "Read Guidelines First"}
            </ThemedText>
          </>
        )}
      </TouchableOpacity>

      {/* Note */}
      {hasReadGuidelines && (
        <ThemedText
          type="caption"
          style={[styles.note, { color: colors.textSecondary }]}
        >
          They'll receive a notification and can choose to accept or decline.
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
  note: {
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
