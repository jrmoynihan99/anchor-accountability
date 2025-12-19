// CreatePostRejectedScreen.tsx
import { ThemedText } from "@/components/ThemedText";
import { useModalIntent } from "@/context/ModalIntentContext";
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface CreatePostRejectedScreenProps {
  onClose: () => void;
  onRetry: () => void;
  originalTitle: string;
  originalContent: string;
  rejectionReason?: string;
}

export function CreatePostRejectedScreen({
  onClose,
  onRetry,
  originalTitle,
  originalContent,
  rejectionReason,
}: CreatePostRejectedScreenProps) {
  const { colors, effectiveTheme } = useTheme();
  const { setModalIntent } = useModalIntent();

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

  const handleViewGuidelinesPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // Close current modal and trigger settings guidelines intent
    onClose();
    setTimeout(() => {
      setModalIntent("settingsGuidelines");
    }, 300); // Small delay to ensure current modal closes first
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
          Post Not Approved
        </ThemedText>
      </View>

      <ThemedText
        type="body"
        style={{
          color: colors.text,
          lineHeight: 22,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        Your post couldn't be published because it doesn't meet our community
        guidelines. Please review and try again.
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

      {/* Show original content if it exists */}
      {(originalTitle.trim() || originalContent.trim()) && (
        <View
          style={[
            styles.originalContentContainer,
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
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Your original post:
          </ThemedText>

          {originalTitle.trim() && (
            <>
              <ThemedText
                type="bodyMedium"
                style={{
                  color: mainTextColor,
                  fontWeight: "600",
                  marginBottom: 8,
                }}
              >
                "{originalTitle}"
              </ThemedText>
            </>
          )}

          {originalContent.trim() && (
            <ThemedText
              type="body"
              style={{
                color: colors.text,
                fontStyle: "italic",
                lineHeight: 20,
              }}
            >
              "{originalContent}"
            </ThemedText>
          )}
        </View>
      )}

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.retryButton,
            { backgroundColor: colors.buttonBackground },
          ]}
          onPress={handleRetryPress}
        >
          <Ionicons
            name="pencil"
            size={18}
            color={colors.white}
            style={{ marginRight: 8 }}
          />
          <ThemedText type="buttonLarge" style={{ color: colors.white }}>
            Edit & Retry
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
  originalContentContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 32,
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
