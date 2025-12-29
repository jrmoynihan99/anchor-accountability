// components/morphing/settings/EmailVerificationSection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { resendVerificationEmail } from "@/lib/authHelpers";
import { auth } from "@/lib/firebase";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface EmailVerificationSectionProps {
  isModalOpen: boolean;
}

export function EmailVerificationSection({
  isModalOpen,
}: EmailVerificationSectionProps) {
  const { colors } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const checkVerification = async () => {
      const user = auth.currentUser;

      // Force reload user to get latest emailVerified status
      if (user && !user.isAnonymous) {
        await user.reload();
      }

      // Only show if:
      // - User is logged in
      // - User is NOT anonymous
      // - Email is NOT verified
      if (user && !user.isAnonymous && !user.emailVerified) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    checkVerification();

    // Re-check when auth state changes
    const unsubscribe = auth.onAuthStateChanged(() => {
      checkVerification();
    });

    return () => unsubscribe();
  }, []);

  // ✅ Poll ONLY when modal is open AND section is visible (user is unverified)
  useEffect(() => {
    if (!isModalOpen || !isVisible) return; // Don't poll if modal closed or section hidden

    const pollInterval = setInterval(async () => {
      const user = auth.currentUser;
      if (user && !user.isAnonymous) {
        await user.reload();

        if (user.emailVerified) {
          // Email verified! Hide section
          setIsVisible(false);
        }
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [isModalOpen, isVisible]);

  const handleResend = async () => {
    setIsResending(true);
    try {
      await resendVerificationEmail();
      Alert.alert(
        "Email Sent",
        "Verification email has been sent. Please check your inbox."
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to send verification email"
      );
    } finally {
      setIsResending(false);
    }
  };

  if (!isVisible) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.header}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.iconCircleSecondaryBackground },
          ]}
        >
          <IconSymbol
            name="envelope.badge"
            size={20}
            color={colors.textSecondary}
          />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="bodyMedium" style={{ color: colors.text }}>
            Email Not Verified
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.description, { color: colors.textSecondary }]}
          >
            Verify your email to enable password recovery
          </ThemedText>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.tint },
          isResending && styles.disabledButton,
        ]}
        onPress={handleResend}
        disabled={isResending}
        activeOpacity={0.8}
      >
        {isResending ? (
          <ActivityIndicator color={colors.background} size="small" />
        ) : (
          <ThemedText
            type="bodyMedium"
            style={[styles.buttonText, { color: colors.background }]}
          >
            Resend Verification Email
          </ThemedText>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 16,
  },
  header: {
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
    gap: 4,
  },
  description: {
    opacity: 0.9,
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
  },
  disabledButton: {
    opacity: 0.6,
  },
});
