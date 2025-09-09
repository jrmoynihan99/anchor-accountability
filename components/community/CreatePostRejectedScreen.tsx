// CreatePostRejectedScreen.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";

interface CreatePostRejectedScreenProps {
  onClose: () => void;
  onRetry: () => void;
  originalTitle: string;
  originalContent: string;
}

export function CreatePostRejectedScreen({
  onClose,
  onRetry,
  originalTitle,
  originalContent,
}: CreatePostRejectedScreenProps) {
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
          Post Not Approved
        </ThemedText>
      </View>

      <ThemedText
        type="body"
        style={{
          color: colors.textMuted,
          lineHeight: 22,
          textAlign: "center",
          marginBottom: 24,
        }}
      >
        Your post couldn't be published because it doesn't meet our community
        guidelines. Please review and try again.
      </ThemedText>

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
            styles.closeButton,
            {
              backgroundColor: colors.modalCardBackground,
              borderColor: colors.modalCardBorder,
            },
          ]}
          onPress={handleClosePress}
        >
          <ThemedText type="buttonLarge" style={{ color: colors.text }}>
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
  closeButton: {
    borderRadius: 16,
    padding: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
