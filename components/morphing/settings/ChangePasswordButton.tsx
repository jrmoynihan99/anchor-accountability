// components/morphing/settings/ChangePasswordButton.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { hasEmailPassword, isEmailVerified } from "@/lib/authHelpers";
import { auth } from "@/lib/firebase";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface ChangePasswordButtonProps {
  onPress: () => void;
  isModalOpen: boolean;
}

export function ChangePasswordButton({
  onPress,
  isModalOpen,
}: ChangePasswordButtonProps) {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const checkVisibility = () => {
      // Only show if user has email/password authentication AND email is verified
      const shouldShow = hasEmailPassword() && isEmailVerified();
      setIsVisible(shouldShow);
    };

    checkVisibility();

    // Re-check when auth state changes
    const unsubscribe = auth.onAuthStateChanged(() => {
      checkVisibility();
    });

    return () => unsubscribe();
  }, []);

  // ✅ Poll ONLY when modal is open (to detect when email becomes verified)
  useEffect(() => {
    if (!isModalOpen) return; // Don't poll if modal is closed

    const pollInterval = setInterval(async () => {
      const user = auth.currentUser;
      if (user && !user.isAnonymous && !user.emailVerified) {
        await user.reload();

        if (user.emailVerified) {
          // Email verified! Show button
          setIsVisible(hasEmailPassword() && isEmailVerified());
        }
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isModalOpen]);

  if (!isVisible) return null;

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.iconCircleSecondaryBackground },
          ]}
        >
          <IconSymbol name="key.fill" size={20} color={colors.textSecondary} />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="bodyMedium" style={{ color: colors.text }}>
            Change Password
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.description, { color: colors.textSecondary }]}
          >
            Update your account password
          </ThemedText>
        </View>
        <IconSymbol
          name="chevron.right"
          size={20}
          color={colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  textContainer: {
    flex: 1,
    gap: 2,
  },
  description: {
    opacity: 0.8,
  },
});
