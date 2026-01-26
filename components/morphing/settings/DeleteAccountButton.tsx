// components/morphing/settings/DeleteAccountButton.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useAccountability } from "@/context/AccountabilityContext";
import { useTheme } from "@/context/ThemeContext";
import { deleteAccount, isAnonymousUser } from "@/lib/auth";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";

interface DeleteAccountButtonProps {
  onPress?: () => void;
}

export function DeleteAccountButton({ onPress }: DeleteAccountButtonProps) {
  const { colors } = useTheme();
  const { mentor, mentees } = useAccountability();

  // Calculate total accountability partnerships
  const partnershipCount = (mentor ? 1 : 0) + mentees.length;
  const hasPartnerships = partnershipCount > 0;

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isAnonymous = isAnonymousUser();
    const accountType = isAnonymous ? "guest account" : "account";

    // Build the warning message
    let message = `This will permanently delete your ${accountType} and all associated data, including:\n\n• All your messages and activity\n• Your recovery progress and check-ins`;

    // Add accountability partnerships if they exist
    if (hasPartnerships) {
      message += `\n• ${partnershipCount} active accountability partnership${
        partnershipCount > 1 ? "s" : ""
      }`;
    }

    // Add suggestion to message partners if they have any
    if (hasPartnerships) {
      message += `\n\nConsider messaging your partner${
        partnershipCount > 1 ? "s" : ""
      } before deleting.`;
    }

    message += `\n\nAre you absolutely sure?`;

    Alert.alert("Delete Account", message, [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete Account",
        style: "destructive",
        onPress: confirmDeleteAccount,
      },
    ]);
  };

  // Second confirmation
  const confirmDeleteAccount = () => {
    Alert.alert(
      "Final Confirmation",
      "This is your last chance. Your account will be permanently deleted and cannot be recovered.\n\nDelete account?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes, Delete Forever",
          style: "destructive",
          onPress: performDeleteAccount,
        },
      ],
    );
  };

  const performDeleteAccount = async () => {
    try {
      await deleteAccount();

      // Navigate to onboarding after successful deletion
      router.replace("/onboarding/intro");
      onPress?.();
    } catch (error: any) {
      console.error("Account deletion failed:", error);

      // Show appropriate error message
      const errorMessage =
        error.message ||
        "Something went wrong while deleting your account. Please try again.";

      Alert.alert("Error", errorMessage, [{ text: "OK", style: "default" }]);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.deleteButton,
        {
          backgroundColor: colors.errorBackground || `${colors.error}20`,
          borderColor: colors.error || colors.tint,
          borderWidth: 1,
        },
      ]}
      onPress={handleDeleteAccount}
      activeOpacity={0.8}
    >
      <IconSymbol name="trash" size={20} color={colors.error || colors.tint} />
      <ThemedText
        type="bodyMedium"
        style={{ color: colors.error || colors.tint }}
      >
        Delete Account
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 0,
    gap: 8,
  },
});
