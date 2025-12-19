// ReachOutRejectedScreen.tsx
import { ThemedText } from "@/components/ThemedText";
import { useModalIntent } from "@/context/ModalIntentContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface ReachOutRejectedScreenProps {
  onClose: () => void;
  onRetry: () => void;
  originalMessage: string;
  rejectionReason?: string;
}

export function ReachOutRejectedScreen({
  onClose,
  onRetry,
  originalMessage,
  rejectionReason,
}: ReachOutRejectedScreenProps) {
  const { colors, effectiveTheme } = useTheme();
  const { setModalIntent } = useModalIntent();

  // Main color for icons/titles based on theme
  const mainTextColor = effectiveTheme === "dark" ? colors.text : colors.text;

  const handleRetryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRetry();
  };

  const handleViewGuidelinesPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Close current modal and trigger settings guidelines intent
    onClose();
    setTimeout(() => {
      setModalIntent("settingsGuidelines");
    }, 100); // Small delay to ensure current modal closes first
  };

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.scrollContent}
    >
      {/* Header with Icon */}
      <View style={styles.modalHeader}>
        <Ionicons name="close-circle" size={40} color={colors.text} />
        <ThemedText
          type="titleLarge"
          style={{
            color: mainTextColor,
            marginTop: 12,
            textAlign: "center",
          }}
        >
          Unable to Send
        </ThemedText>
      </View>

      <ThemedText
        type="body"
        style={{
          color: colors.text,
          lineHeight: 22,
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        Your message couldn't be sent because it doesn't align with our
        community guidelines.
      </ThemedText>

      {/* Show rejection reason if available */}
      {rejectionReason && (
        <View
          style={[
            styles.rejectionReasonContainer,
            {
              backgroundColor: colors.modalCardBackground,
              borderColor: colors.modalCardBorder,
            },
          ]}
        >
          <View style={styles.reasonHeader}>
            <Ionicons
              name="information-circle-outline"
              size={16}
              color={colors.textMuted}
              style={{ marginRight: 6 }}
            />
            <ThemedText
              type="captionMedium"
              style={{
                color: colors.textMuted,
              }}
            >
              Reason:
            </ThemedText>
          </View>
          <ThemedText
            type="body"
            style={{
              color: colors.text,
              textAlign: "center",
              lineHeight: 20,
              marginTop: 8,
            }}
          >
            {rejectionReason}
          </ThemedText>
        </View>
      )}

      {/* Show original message if it exists */}
      {originalMessage.trim() && (
        <View
          style={[
            styles.originalMessageContainer,
            {
              backgroundColor: colors.modalCardBackground,
              borderColor: colors.modalCardBorder,
            },
          ]}
        >
          <ThemedText
            type="captionMedium"
            style={{
              color: colors.textMuted,
              marginBottom: 8,
              textAlign: "center",
            }}
          >
            Your original message:
          </ThemedText>
          <ThemedText
            type="body"
            style={{
              color: colors.text,
              fontStyle: "italic",
              textAlign: "center",
              lineHeight: 20,
            }}
          >
            "{originalMessage}"
          </ThemedText>
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: colors.secondaryButtonBackground },
          ]}
          onPress={handleRetryPress}
        >
          <Ionicons
            name="refresh"
            size={18}
            color={colors.background}
            style={{ marginRight: 8 }}
          />
          <ThemedText type="buttonLarge" style={{ color: colors.background }}>
            Try Again
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.guidelinesButton,
            {
              backgroundColor: colors.modalCardBackground,
              borderColor: colors.modalCardBorder,
            },
          ]}
          onPress={handleViewGuidelinesPress}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={colors.textSecondary}
            style={{ marginRight: 8 }}
          />
          <ThemedText
            type="buttonLarge"
            style={{ color: colors.textSecondary }}
          >
            View Guidelines
          </ThemedText>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 16,
    alignItems: "center",
  },
  modalHeader: {
    alignItems: "center",
    marginTop: 0,
    marginBottom: 16,
  },
  rejectionReasonContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 16,
    alignItems: "center",
  },
  reasonHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  originalMessageContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 16,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  retryButton: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  guidelinesButton: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
