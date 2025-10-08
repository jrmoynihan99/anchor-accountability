// components/messages/PleaResponseInputScreen.tsx
import { BlockUserIcon } from "@/components/BlockUserIcon";
import { MessageInput } from "@/components/MessageInput";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UserStreakDisplay } from "@/components/UserStreakDisplay";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { OpenToChatToggle } from "./OpenToChatToggle";
import { PleaData } from "./PleaCard";

interface PleaResponseInputScreenProps {
  plea: PleaData;
  now: Date;
  encouragementText: string;
  onChangeEncouragementText: (text: string) => void;
  isSending: boolean;
  onSend: () => void;
  isOpenToChat: boolean;
  onToggleOpenToChat: (value: boolean) => void;
}

export function PleaResponseInputScreen({
  plea,
  now,
  encouragementText,
  onChangeEncouragementText,
  isSending,
  onSend,
  isOpenToChat,
  onToggleOpenToChat,
}: PleaResponseInputScreenProps) {
  const { colors } = useTheme();

  // Generate anonymous username from UID
  const anonymousUsername = `user-${plea.uid.substring(0, 5)}`;

  // Use parent-passed "now"!
  const timeAgo = getTimeAgo(plea.createdAt, now);
  const isUrgent = plea.encouragementCount === 0;

  const hasResponded = plea.hasUserResponded || false;

  const getMessageColor = () => {
    if (isUrgent) return colors.error;
    if (hasResponded) return colors.success;
    return colors.textSecondary;
  };

  const isButtonDisabled = !encouragementText.trim() || isSending;

  const handleSendPress = () => {
    if (isButtonDisabled) {
      // Show popup when button is disabled
      Alert.alert(
        "Message Required",
        "Please add your support message before sending.",
        [{ text: "OK" }]
      );
      return;
    }

    Keyboard.dismiss();
    onSend();
  };

  // Create a muted version of the active color (reduce opacity)
  const getButtonBackgroundColor = () => {
    if (isButtonDisabled) {
      return `${colors.buttonBackground}40`; // 25% opacity for muted effect
    }
    return colors.buttonBackground;
  };

  const getButtonTextColor = () => {
    if (isButtonDisabled) {
      return `${colors.white}80`; // Slightly muted white text
    }
    return colors.white;
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
    >
      {/* Combined Header and Context Card */}
      <View
        style={[
          styles.headerCard,
          {
            backgroundColor: colors.modalCardBackground,
            borderColor: colors.modalCardBorder,
            shadowColor: colors.shadow,
          },
        ]}
      >
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
                style={{ color: colors.icon }}
              >
                {anonymousUsername[5].toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.userDetails}>
              <View style={styles.usernameRow}>
                <ThemedText
                  type="subtitleSemibold"
                  style={{ color: colors.text }}
                >
                  {anonymousUsername}
                </ThemedText>
                <UserStreakDisplay userId={plea.uid} size="small" />
                <BlockUserIcon userIdToBlock={plea.uid} />
              </View>
              <View style={styles.metaInfo}>
                <ThemedText
                  type="caption"
                  style={{
                    color: isUrgent ? colors.error : colors.textSecondary,
                  }}
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
                      style={{ color: colors.error }}
                    >
                      Needs attention
                    </ThemedText>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Stats Section - Similar to streak modal stat cards */}
          <View
            style={[
              styles.statsSection,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.modalCardBorder,
              },
            ]}
          >
            <View style={styles.statContent}>
              <View
                style={[
                  styles.statIconCircle,
                  { backgroundColor: `${getMessageColor()}33` }, // 20% opacity
                ]}
              >
                <IconSymbol
                  name="message.fill"
                  size={16}
                  color={getMessageColor()}
                />
              </View>
              <ThemedText type="statValue" style={{ color: getMessageColor() }}>
                {plea.encouragementCount}
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Context Section - Now inside the same card */}
        <View style={styles.contextDivider} />
        {plea.message && plea.message.trim() ? (
          <View
            style={[
              styles.contextMessageContainer,
              {
                backgroundColor: colors.modalCardBackground,
                borderColor: colors.modalCardBorder,
              },
            ]}
          >
            <ThemedText
              type="body"
              style={{ color: colors.text, fontStyle: "italic" }}
            >
              "{plea.message}"
            </ThemedText>
          </View>
        ) : (
          <View style={styles.contextHeader}>
            <View
              style={[
                styles.contextIconCircle,
                { backgroundColor: `${colors.iconCircleBackground}50` },
              ]}
            >
              <IconSymbol name="heart" size={16} color={colors.icon} />
            </View>
            <ThemedText type="subtitleMedium" style={{ color: colors.text }}>
              Support Needed
            </ThemedText>
          </View>
        )}
      </View>

      {/* Response Section - No card styling */}
      <View
        style={[
          styles.replyCard,
          {
            backgroundColor: colors.modalCardBackground,
            borderColor: colors.modalCardBorder,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View style={styles.responseSection}>
          <View style={styles.responseHeader}>
            <View
              style={[
                styles.responseIconCircle,
                { backgroundColor: `${colors.iconCircleBackground}50` },
              ]}
            >
              <IconSymbol name="paperplane" size={16} color={colors.icon} />
            </View>
            <View style={styles.responseHeaderText}>
              <ThemedText
                type="subtitleSemibold"
                style={{ color: colors.text }}
              >
                Send Encouragement
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: colors.textSecondary }}
              >
                Your message will be sent anonymously
              </ThemedText>
            </View>
          </View>

          <MessageInput
            value={encouragementText}
            onChangeText={onChangeEncouragementText}
            placeholder="Type your message here..."
            maxLength={500}
            minHeight={80}
            showBorder={false}
          />

          <OpenToChatToggle
            isOpen={isOpenToChat}
            onToggle={onToggleOpenToChat}
            user={anonymousUsername}
          />

          {/* Send Button */}
          <View style={styles.sendButtonContainer}>
            <TouchableOpacity
              style={[
                styles.sendButton,
                {
                  backgroundColor: getButtonBackgroundColor(),
                },
              ]}
              onPress={handleSendPress}
              activeOpacity={0.8}
            >
              {isSending ? (
                <IconSymbol name="arrow.up" size={20} color={colors.white} />
              ) : (
                <>
                  <IconSymbol
                    name="heart.fill"
                    size={18}
                    color={getButtonTextColor()}
                  />
                  <ThemedText
                    type="button"
                    style={{ color: getButtonTextColor() }}
                  >
                    {isButtonDisabled
                      ? "Type your message"
                      : "Send Encouragement"}
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>

            {hasResponded && (
              <View style={styles.alreadyRespondedContainer}>
                <IconSymbol name="checkmark" size={12} color={colors.success} />
                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary }}
                >
                  You've already sent encouragement
                </ThemedText>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  // Layout and structural styles only - NO text styling
  scrollContainer: { flex: 1 },
  scrollContent: { padding: 0, paddingTop: 42, paddingBottom: 32 },

  // Header Card Styles
  headerCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    marginBottom: 20,
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  pleaHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
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
  userDetails: { flex: 1 },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  metaInfo: { flexDirection: "row", alignItems: "center", marginTop: 2 },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
  },

  // Stats section
  statsSection: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
  },
  statContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  statIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },

  // Context Section
  contextDivider: {
    height: 1,
    marginVertical: 8,
  },
  contextHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  contextIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contextMessageContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    marginTop: 0,
  },

  // Response Section - No card styling
  responseSection: {
    marginBottom: 20,
  },
  responseHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  responseIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  responseHeaderText: {
    flex: 1,
  },

  // Send Button Styles
  sendButtonContainer: {
    marginTop: 24,
    marginBottom: 0,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  alreadyRespondedContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 12,
  },
  replyCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: 12,
    paddingBottom: 0,
    marginBottom: 8,
    marginTop: 0, // Or 20 if you want some separation from the top card
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
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
