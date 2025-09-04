// components/morphing/settings/sections/SignOutButton.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { isAnonymousUser, signOut } from "@/lib/auth";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";

interface SignOutButtonProps {
  onPress?: () => void;
}

export function SignOutButton({ onPress }: SignOutButtonProps) {
  const { colors } = useTheme();

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const isAnonymous = isAnonymousUser();

    if (isAnonymous) {
      // Show warning for anonymous users about data loss
      Alert.alert(
        "Sign Out",
        "Your account was created as a guest account. Signing out will cause you to lose all of your account data permanently. This cannot be undone.\n\nAre you sure you want to continue?",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Sign Out",
            style: "destructive",
            onPress: performSignOut,
          },
        ]
      );
    } else {
      // Show simple confirmation for email users
      Alert.alert(
        "Sign Out",
        "Are you sure you want to sign out? You can sign back in anytime with your email and password.",
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Sign Out",
            style: "default",
            onPress: performSignOut,
          },
        ]
      );
    }
  };

  const performSignOut = async () => {
    try {
      await signOut();
      // Manually navigate to onboarding after sign out completes
      router.replace("/onboarding/intro");
      onPress?.();
    } catch (error) {
      console.error("Sign out failed:", error);
      Alert.alert(
        "Error",
        "Something went wrong while signing out. Please try again."
      );
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.signOutButton,
        { backgroundColor: colors.error || colors.tint },
      ]}
      onPress={handleSignOut}
      activeOpacity={0.8}
    >
      <IconSymbol name="arrow.right.square" size={20} color={colors.white} />
      <ThemedText
        type="bodyMedium"
        lightColor={colors.white}
        darkColor={colors.white}
      >
        Sign Out
      </ThemedText>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  signOutButton: {
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
