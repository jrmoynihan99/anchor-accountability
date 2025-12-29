// components/morphing/message-thread/accountability/invite-views/MentorGuidelinesView.tsx
import { BackButton } from "@/components/BackButton";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTimezoneComparison } from "@/hooks/misc/useTimezoneComparison";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface MentorGuidelinesViewProps {
  colors: any;
  otherUserId: string;
  threadName: string;
  onBackPress: () => void;
  onAcceptInvite: () => Promise<void>;
  onDeclineInvite: () => Promise<void>;
  onClose: () => void;
}

export function MentorGuidelinesView({
  colors,
  otherUserId,
  threadName,
  onBackPress,
  onAcceptInvite,
  onDeclineInvite,
  onClose,
}: MentorGuidelinesViewProps) {
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Use timezone comparison hook
  const {
    shouldShowWarning: shouldShowTimezoneWarning,
    timeDifference,
    otherUserLocalTime,
  } = useTimezoneComparison(otherUserId);

  const handleAcceptInvite = async () => {
    if (!hasConfirmed) return;

    setIsLoading(true);
    try {
      await onAcceptInvite();
      // Modal will close automatically
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
      // Modal will close automatically
    } catch (error) {
      console.error("Error declining invite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <BackButton
          onPress={onBackPress}
          size={36}
          iconSize={18}
          backgroundColor={colors.buttonBackground}
        />

        <View style={{ flex: 1, alignItems: "center" }}>
          <ThemedText
            type="title"
            style={[styles.title, { color: colors.text }]}
          >
            Anchor Partnership Guidelines
          </ThemedText>
        </View>

        <View style={{ width: 36 }} />
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Introduction */}
        <View style={styles.introSection}>
          <ThemedText
            type="body"
            style={[styles.introText, { color: colors.text }]}
          >
            {threadName} has asked you to be their Anchor Partner. Before
            accepting, please read these guidelines carefully so you understand
            what you're committing to.
          </ThemedText>
        </View>

        {/* Section 1: What This Partnership Is */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${colors.tint}20` },
              ]}
            >
              <IconSymbol
                name="info.circle.fill"
                size={20}
                color={colors.tint}
              />
            </View>
            <ThemedText
              type="subtitleSemibold"
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              What This Partnership Is
            </ThemedText>
          </View>
          <ThemedText
            type="body"
            style={[styles.bodyText, { color: colors.textSecondary }]}
          >
            This is a peer accountability partnership where you serve as{" "}
            {threadName}'s Anchor Partner. You're agreeing to be a steady,
            grounding presence as they work toward freedom from pornography
          </ThemedText>
        </View>

        {/* Section 2: Your Responsibilities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${colors.tint}20` },
              ]}
            >
              <IconSymbol
                name="checkmark.circle.fill"
                size={20}
                color={colors.tint}
              />
            </View>
            <ThemedText
              type="subtitleSemibold"
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Your Role as Their Anchor Partner
            </ThemedText>
          </View>
          <View style={styles.bulletList}>
            <BulletPoint
              text="Review their daily check-ins and respond with encouragement"
              colors={colors}
            />
            <BulletPoint
              text="Be available when they reach out, especially during struggles"
              colors={colors}
            />
            <BulletPoint
              text="Respond with grace, empathy, and zero judgment"
              colors={colors}
              bold
            />
            <BulletPoint
              text="Celebrate their wins and support them through setbacks"
              colors={colors}
            />
            <BulletPoint
              text="Be honest and vulnerable about your own journey when appropriate"
              colors={colors}
            />
          </View>
        </View>

        {/* Section 3: Their Responsibilities */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${colors.tint}20` },
              ]}
            >
              <IconSymbol
                name="person.circle.fill"
                size={20}
                color={colors.tint}
              />
            </View>
            <ThemedText
              type="subtitleSemibold"
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              What They'll Do
            </ThemedText>
          </View>
          <View style={styles.bulletList}>
            <BulletPoint
              text="Submit daily check-ins honestly"
              colors={colors}
            />
            <BulletPoint
              text="Reach out when they're struggling or tempted"
              colors={colors}
            />
            <BulletPoint
              text="Be open about where they're really at"
              colors={colors}
            />
            <BulletPoint
              text="Stay communicative and respectful of your time"
              colors={colors}
            />
          </View>
        </View>

        {/* Section 4: Critical Guidelines */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${colors.warning || "#FF9500"}20` },
              ]}
            >
              <IconSymbol
                name="exclamationmark.triangle.fill"
                size={20}
                color={colors.warning || "#FF9500"}
              />
            </View>
            <ThemedText
              type="subtitleSemibold"
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Critical Guidelines
            </ThemedText>
          </View>
          <View style={styles.bulletList}>
            <BulletPoint
              text="Never shame them for relapses—shame drives people away from help"
              colors={colors}
              bold
            />
            <BulletPoint
              text="Their recovery is ultimately their responsibility, not yours"
              colors={colors}
              bold
            />
            <BulletPoint
              text="You're not their therapist—encourage professional help when needed"
              colors={colors}
            />
            <BulletPoint
              text="Either party can end the partnership anytime, no hard feelings"
              colors={colors}
            />
            <BulletPoint
              text="Maintain appropriate boundaries and confidentiality"
              colors={colors}
            />
          </View>
        </View>

        {/* Section 5: The Commitment */}
        <View style={[styles.section, styles.lastSection]}>
          <View style={styles.sectionHeader}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: `${colors.success || "#34C759"}20` },
              ]}
            >
              <IconSymbol
                name="heart.fill"
                size={20}
                color={colors.success || "#34C759"}
              />
            </View>
            <ThemedText
              type="subtitleSemibold"
              style={[styles.sectionTitle, { color: colors.text }]}
            >
              Are You Ready for This?
            </ThemedText>
          </View>
          <ThemedText
            type="body"
            style={[styles.bodyText, { color: colors.textSecondary }]}
          >
            Supporting someone in recovery requires consistent daily engagement
            and emotional availability. This is a meaningful commitment. If
            you're not in a place to take this on right now, that's completely
            okay!
          </ThemedText>
        </View>

        {/* Checkbox Confirmation */}
        <TouchableOpacity
          style={[
            styles.checkboxContainer,
            {
              backgroundColor: colors.background,
              borderColor: hasConfirmed ? colors.tint : colors.border,
            },
          ]}
          onPress={() => setHasConfirmed(!hasConfirmed)}
          activeOpacity={0.7}
        >
          <View
            style={[
              styles.checkbox,
              {
                backgroundColor: hasConfirmed ? colors.tint : "transparent",
                borderColor: hasConfirmed ? colors.tint : colors.border,
              },
            ]}
          >
            {hasConfirmed && (
              <IconSymbol name="checkmark" size={16} color={colors.white} />
            )}
          </View>
          <ThemedText
            type="body"
            style={[styles.checkboxText, { color: colors.text }]}
          >
            I understand this commitment and I'm ready to be {threadName}'s{" "}
            Anchor Partner with empathy, consistency, and without judgment.
          </ThemedText>
        </TouchableOpacity>

        {/* Timezone Warning Section (only show if checkbox is confirmed and significant difference) */}
        {hasConfirmed && shouldShowTimezoneWarning && (
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
              You may receive check-ins or messages from them at different times
              than you're typically available.
            </ThemedText>
          </View>
        )}

        {/* Accept Button */}
        <TouchableOpacity
          style={[
            styles.acceptButton,
            {
              backgroundColor: hasConfirmed
                ? colors.success || "#34C759"
                : colors.border,
              opacity: isLoading || !hasConfirmed ? 0.6 : 1,
            },
          ]}
          onPress={handleAcceptInvite}
          disabled={!hasConfirmed || isLoading}
          activeOpacity={0.8}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <ThemedText type="subtitleSemibold" style={{ color: colors.white }}>
              Accept Invite
            </ThemedText>
          )}
        </TouchableOpacity>

        {/* Decline Button */}
        {hasConfirmed && (
          <TouchableOpacity
            style={[styles.declineButton, { borderColor: colors.border }]}
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
      </ScrollView>
    </View>
  );
}

// Bullet Point Component
function BulletPoint({
  text,
  colors,
  bold = false,
}: {
  text: string;
  colors: any;
  bold?: boolean;
}) {
  return (
    <View style={styles.bulletPoint}>
      <View style={styles.bulletDot}>
        <View style={[styles.dot, { backgroundColor: colors.textSecondary }]} />
      </View>
      <ThemedText
        type={bold ? "bodyMedium" : "body"}
        style={[
          styles.bulletText,
          { color: colors.textSecondary },
          bold && { fontWeight: "600" },
        ]}
      >
        {text}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  introSection: {
    marginBottom: 24,
  },
  introText: {
    lineHeight: 22,
    opacity: 0.9,
  },
  section: {
    marginBottom: 24,
  },
  lastSection: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  sectionTitle: {
    flex: 1,
  },
  bodyText: {
    lineHeight: 22,
    opacity: 0.9,
  },
  bulletList: {
    gap: 12,
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  bulletDot: {
    width: 20,
    paddingTop: 8,
    alignItems: "center",
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  bulletText: {
    flex: 1,
    lineHeight: 22,
    opacity: 0.9,
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    marginTop: 2,
  },
  checkboxText: {
    flex: 1,
    lineHeight: 22,
  },
  timezoneCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
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
  acceptButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  declineButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
});
