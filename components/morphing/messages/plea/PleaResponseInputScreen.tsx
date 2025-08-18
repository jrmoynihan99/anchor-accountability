// components/messages/PleaResponseInputScreen.tsx
import { MessageInput } from "@/components/MessageInput";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { PleaData } from "./PleaCard";

interface PleaResponseInputScreenProps {
  plea: PleaData;
  now: Date;
  encouragementText: string;
  onChangeEncouragementText: (text: string) => void;
  isSending: boolean;
  onSend: () => void;
}

export function PleaResponseInputScreen({
  plea,
  now,
  encouragementText,
  onChangeEncouragementText,
  isSending,
  onSend,
}: PleaResponseInputScreenProps) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

  // Generate anonymous username from UID
  const anonymousUsername = `user-${plea.uid.substring(0, 5)}`;

  // Use parent-passed "now"!
  const timeAgo = getTimeAgo(plea.createdAt, now);
  const isUrgent =
    plea.encouragementCount === 0 && getHoursAgo(plea.createdAt, now) > 2;
  const hasResponded = plea.hasUserResponded || false;

  const getMessageColor = () => {
    if (isUrgent) return colors.error;
    if (hasResponded) return colors.success;
    return colors.textSecondary;
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {/* Plea Header */}
      <View style={styles.pleaHeader}>
        <View style={styles.userInfo}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: colors.iconCircleSecondaryBackground },
            ]}
          >
            <ThemedText
              type="subtitleSemibold"
              style={[styles.avatarText, { color: colors.icon }]}
            >
              {anonymousUsername[5].toUpperCase()}
            </ThemedText>
          </View>
          <View style={styles.userDetails}>
            <ThemedText
              type="subtitleSemibold"
              style={[styles.username, { color: colors.text }]}
            >
              {anonymousUsername}
            </ThemedText>
            <View style={styles.metaInfo}>
              <ThemedText
                type="caption"
                style={[
                  styles.timestamp,
                  { color: isUrgent ? colors.error : colors.textSecondary },
                ]}
              >
                {timeAgo}
              </ThemedText>
              {isUrgent && (
                <>
                  <View
                    style={[
                      styles.dot,
                      { backgroundColor: colors.textSecondary },
                    ]}
                  />
                  <ThemedText
                    type="captionMedium"
                    style={[styles.urgentText, { color: colors.error }]}
                  >
                    Needs attention
                  </ThemedText>
                </>
              )}
            </View>
          </View>
        </View>
        <View style={styles.encouragementStats}>
          <IconSymbol name="message.fill" size={18} color={getMessageColor()} />
          <ThemedText
            type="statValue"
            style={[styles.statNumber, { color: getMessageColor() }]}
          >
            {plea.encouragementCount}
          </ThemedText>
        </View>
      </View>

      {/* Context Section */}
      <View style={styles.contextSection}>
        {plea.message && plea.message.trim() ? (
          <>
            <ThemedText
              type="subtitleMedium"
              style={[styles.contextLabel, { color: colors.text }]}
            >
              Additional Context
            </ThemedText>
            <View
              style={[
                styles.contextMessageContainer,
                {
                  backgroundColor: colors.cardBackground,
                  borderLeftColor: colors.tint,
                },
              ]}
            >
              <ThemedText
                type="body"
                style={[styles.contextMessage, { color: colors.text }]}
              >
                "{plea.message}"
              </ThemedText>
            </View>
          </>
        ) : (
          <ThemedText
            type="body"
            style={[styles.generalContext, { color: colors.textSecondary }]}
          >
            This person is struggling and could use some encouragement and
            support.
          </ThemedText>
        )}
      </View>

      {/* Response Section */}
      <View style={styles.responseSection}>
        <ThemedText
          type="subtitleSemibold"
          style={[styles.responseTitle, { color: colors.text }]}
        >
          Send Encouragement
        </ThemedText>
        <ThemedText
          type="caption"
          style={[styles.responseSubtitle, { color: colors.textSecondary }]}
        >
          Your message will be sent anonymously
        </ThemedText>

        <MessageInput
          value={encouragementText}
          onChangeText={onChangeEncouragementText}
          placeholder="Type your encouragement here..."
          maxLength={500}
          minHeight={120}
        />
      </View>

      {/* Send Button */}
      <View style={styles.sendButtonContainer}>
        <TouchableOpacity
          style={[
            styles.sendButton,
            {
              backgroundColor: encouragementText.trim()
                ? colors.buttonBackground
                : colors.textSecondary,
            },
            isSending && styles.sendButtonDisabled,
          ]}
          onPress={onSend}
          disabled={!encouragementText.trim() || isSending}
          activeOpacity={0.8}
        >
          {isSending ? (
            <IconSymbol name="arrow.up" size={20} color={colors.white} />
          ) : (
            <>
              <IconSymbol name="heart.fill" size={18} color={colors.white} />
              <ThemedText
                type="button"
                style={[styles.sendButtonText, { color: colors.white }]}
              >
                Send Encouragement
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        {hasResponded && (
          <View style={styles.alreadyRespondedContainer}>
            <ThemedText
              type="caption"
              style={[
                styles.alreadyRespondedText,
                { color: colors.textSecondary },
              ]}
            >
              You've sent encouragement
            </ThemedText>
            <IconSymbol name="checkmark" size={12} color={colors.success} />
          </View>
        )}
      </View>
    </ScrollView>
  );
}

// ... All styles from your original modal for the inner content
const styles = StyleSheet.create({
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 24, paddingTop: 42, paddingBottom: 32 },
  pleaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  avatarText: {},
  userDetails: { flex: 1 },
  username: { lineHeight: 22 },
  metaInfo: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  timestamp: { opacity: 0.8 },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
    opacity: 0.5,
  },
  urgentText: {},
  encouragementStats: { flexDirection: "row", alignItems: "center", gap: 6 },
  statNumber: {},
  contextSection: { marginBottom: 32 },
  contextLabel: { marginBottom: 12, opacity: 0.9 },
  contextMessageContainer: {
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 3,
    backgroundColor: "rgba(255, 255, 255, 0.03)",
  },
  contextMessage: { lineHeight: 22, opacity: 0.9 },
  generalContext: {
    textAlign: "center",
    fontStyle: "italic",
    opacity: 0.7,
    lineHeight: 22,
  },
  responseSection: { marginBottom: 32 },
  responseTitle: { marginBottom: 6 },
  responseSubtitle: { marginBottom: 16, opacity: 0.8 },
  sendButtonContainer: { paddingTop: 16, backgroundColor: "transparent" },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sendButtonDisabled: { opacity: 0.6 },
  sendButtonText: {},
  alreadyRespondedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  alreadyRespondedText: { opacity: 0.6 },
});

// Helpers
function getTimeAgo(date: Date, now: Date): string {
  const diffInMinutes = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60)
  );
  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  const diffInWeeks = Math.floor(diffInDays / 7);
  return `${diffInWeeks}w ago`;
}
function getHoursAgo(date: Date, now: Date): number {
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60);
}
