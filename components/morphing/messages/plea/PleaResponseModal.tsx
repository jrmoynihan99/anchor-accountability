// components/messages/PleaResponseModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { PleaData } from "./PleaCard";
import { PleaCardContent } from "./PleaCardContent";

interface PleaResponseModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  plea: PleaData | null;
}

export function PleaResponseModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  plea,
}: PleaResponseModalProps) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];
  const [encouragementText, setEncouragementText] = useState("");
  const [isSending, setIsSending] = useState(false);

  if (!plea) return null;

  // Generate anonymous username from UID
  const anonymousUsername = `user-${plea.uid.substring(0, 5)}`;

  // Format time ago
  const timeAgo = getTimeAgo(plea.createdAt);

  // Determine urgency based on encouragement count and time
  const isUrgent =
    plea.encouragementCount === 0 && getHoursAgo(plea.createdAt) > 2;

  const handleSendEncouragement = async () => {
    if (!encouragementText.trim()) return;

    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // TODO: Implement sending encouragement to Firestore
      console.log("Sending encouragement:", {
        pleaId: plea.id,
        message: encouragementText.trim(),
      });

      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Close modal after successful send
      setEncouragementText("");
      close();
    } catch (error) {
      console.error("Error sending encouragement:", error);
      // TODO: Show error message to user
    } finally {
      setIsSending(false);
    }
  };

  // Button content (shows the plea card in collapsed state)
  const buttonContent = <PleaCardContent plea={plea} />;

  // Modal content
  const modalContent = (
    <KeyboardAvoidingView
      style={styles.modalContainer}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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
                type="title"
                style={[styles.avatarText, { color: colors.icon }]}
              >
                {anonymousUsername[5].toUpperCase()}
              </ThemedText>
            </View>
            <View style={styles.userDetails}>
              <ThemedText
                type="title"
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
                      type="caption"
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
            <IconSymbol
              name="message.fill"
              size={18}
              color={
                plea.encouragementCount > 0
                  ? colors.success
                  : colors.textSecondary
              }
            />
            <ThemedText
              type="captionMedium"
              style={[
                styles.statNumber,
                {
                  color:
                    plea.encouragementCount > 0
                      ? colors.success
                      : colors.textSecondary,
                },
              ]}
            >
              {plea.encouragementCount}
            </ThemedText>
          </View>
        </View>

        {/* Plea Message */}
        {plea.message && plea.message.trim() && (
          <View
            style={[
              styles.messageContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <ThemedText
              type="body"
              style={[styles.pleaMessage, { color: colors.text }]}
            >
              "{plea.message}"
            </ThemedText>
          </View>
        )}

        {/* Response Section */}
        <View style={styles.responseSection}>
          <ThemedText
            type="title"
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

          <View
            style={[
              styles.textInputContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                },
              ]}
              value={encouragementText}
              onChangeText={setEncouragementText}
              placeholder="Type your encouragement here..."
              placeholderTextColor={colors.textSecondary}
              multiline
              textAlignVertical="top"
              maxLength={500}
            />
          </View>

          <View style={styles.characterCount}>
            <ThemedText
              type="caption"
              style={[
                styles.characterCountText,
                { color: colors.textSecondary },
              ]}
            >
              {encouragementText.length}/500
            </ThemedText>
          </View>
        </View>
      </ScrollView>

      {/* Send Button */}
      <View
        style={[
          styles.sendButtonContainer,
          { backgroundColor: colors.cardBackground },
        ]}
      >
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
          onPress={handleSendEncouragement}
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
      </View>
    </KeyboardAvoidingView>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={theme ?? "dark"}
      backgroundColor={colors.cardBackground} // Modal background
      buttonBackgroundColor={colors.background} // PleaCard uses background, not cardBackground
      buttonContentPadding={16} // PleaCard uses 16px padding, not 20px
      buttonBorderWidth={isUrgent ? 1.5 : 1} // Match PleaCard border width
      buttonBorderColor={isUrgent ? colors.error : "transparent"} // Match PleaCard border color
      buttonBorderRadius={16} // Match PleaCard border radius
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.15]}
    >
      {modalContent}
    </BaseModal>
  );
}

// Helper functions
function getTimeAgo(date: Date): string {
  const now = new Date();
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

function getHoursAgo(date: Date): number {
  const now = new Date();
  const diffInMilliseconds = now.getTime() - date.getTime();
  return diffInMilliseconds / (1000 * 60 * 60);
}

const styles = StyleSheet.create({
  // Modal content styles
  modalContainer: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 32,
  },
  pleaHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
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
  avatarText: {
    fontWeight: "600",
  },
  userDetails: {
    flex: 1,
  },
  username: {
    lineHeight: 22,
  },
  metaInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  timestamp: {
    opacity: 0.8,
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 8,
    opacity: 0.5,
  },
  urgentText: {
    fontWeight: "500",
  },
  encouragementStats: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statNumber: {
    fontWeight: "600",
  },
  messageContainer: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
  },
  pleaMessage: {
    fontStyle: "italic",
    lineHeight: 22,
  },
  responseSection: {
    marginBottom: 24,
  },
  responseTitle: {
    marginBottom: 4,
  },
  responseSubtitle: {
    marginBottom: 16,
    opacity: 0.8,
  },
  textInputContainer: {
    borderRadius: 16,
    padding: 16,
    minHeight: 120,
  },
  textInput: {
    fontSize: 16,
    lineHeight: 22,
    textAlignVertical: "top",
    minHeight: 88,
  },
  characterCount: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  characterCountText: {
    opacity: 0.6,
  },
  sendButtonContainer: {
    padding: 24,
    paddingTop: 16,
  },
  sendButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },
  sendButtonDisabled: {
    opacity: 0.6,
  },
  sendButtonText: {
    fontWeight: "600",
  },
});
