// ReachOutRejectedScreen.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface ReachOutRejectedScreenProps {
  onClose: () => void;
  onRetry: () => void;
  originalMessage: string;
}

export function ReachOutRejectedScreen({
  onClose,
  onRetry,
  originalMessage,
}: ReachOutRejectedScreenProps) {
  const { colors, effectiveTheme } = useTheme();

  // Main color for icons/titles based on theme
  const mainTextColor = effectiveTheme === "dark" ? colors.text : colors.text;

  const handleRetryPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onRetry();
  };

  const handleClosePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
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
          color: colors.textMuted,
          lineHeight: 22,
          textAlign: "center",
          marginBottom: 32,
        }}
      >
        Your message couldn't be sent because it doesn't align with our
        community guidelines. Please try rephrasing your request.
      </ThemedText>

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
            styles.closeButton,
            {
              backgroundColor: colors.modalCardBackground,
              borderColor: colors.modalCardBorder,
            },
          ]}
          onPress={handleClosePress}
        >
          <ThemedText type="buttonLarge" style={{ color: colors.textMuted }}>
            Cancel
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
  closeButton: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
