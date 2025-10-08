// components/morphing/settings/DeleteAccountButton.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
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

  const handleDeleteAccount = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isAnonymous = isAnonymousUser();

    if (isAnonymous) {
      // Show warning for anonymous users
      Alert.alert(
        "Delete Account",
        "This will permanently delete your guest account and all associated data. This action cannot be undone.\n\nAre you sure you want to continue?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete Account",
            style: "destructive",
            onPress: performDeleteAccount,
          },
        ]
      );
    } else {
      // Show more detailed warning for email users
      Alert.alert(
        "Delete Account",
        "This will permanently delete your account, including:\n\n• Your email and login credentials\n• All your data and activity\n• Your message history\n\nThis action cannot be undone and you will not be able to recover your account.\n\nAre you absolutely sure?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete Account",
            style: "destructive",
            onPress: confirmDeleteAccount,
          },
        ]
      );
    }
  };

  // Second confirmation for email users
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
      ]
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
