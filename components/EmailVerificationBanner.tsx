// components/EmailVerificationBanner.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { resendVerificationEmail } from "@/lib/authHelpers";
import { auth } from "@/lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BANNER_DISMISSED_KEY = "email_verification_banner_dismissed_session";

type BannerState = "unverified" | "verified" | "hidden";

export function EmailVerificationBanner({ suppress = false }: { suppress?: boolean }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-200);
  const [bannerState, setBannerState] = useState<BannerState>("hidden");
  const [isDismissed, setIsDismissed] = useState(false);
  const [isResending, setIsResending] = useState(false);

  // Initial check on mount
  useEffect(() => {
    const checkVisibility = async () => {
      const user = auth.currentUser;

      // Reload user to get latest status
      if (user && !user.isAnonymous) {
        await user.reload();
      }

      // Don't show if no user, anonymous, verified, or dismissed
      if (!user || user.isAnonymous || user.emailVerified || isDismissed) {
        setBannerState("hidden");
        return;
      }

      // Check if dismissed this session
      const userDismissalKey = `${BANNER_DISMISSED_KEY}_${user.uid}`;
      const dismissed = await AsyncStorage.getItem(userDismissalKey);
      if (dismissed === "true") {
        setIsDismissed(true);
        setBannerState("hidden");
        return;
      }

      setBannerState("unverified");

      // Slide down animation
      translateY.value = withSpring(0, {
        damping: 50,
        stiffness: 300,
      });
    };

    checkVisibility();

    // Re-check when auth state changes
    const unsubscribe = auth.onAuthStateChanged(() => {
      checkVisibility();
    });

    return () => unsubscribe();
  }, [isDismissed]);

  // ✅ Poll ONLY when banner is showing (user is unverified)
  useEffect(() => {
    if (bannerState !== "unverified") return; // Don't poll if not showing unverified state

    const pollInterval = setInterval(async () => {
      const user = auth.currentUser;
      if (user && !user.isAnonymous) {
        await user.reload();

        if (user.emailVerified) {
          // ✅ Email verified! Show success state
          setBannerState("verified");

          // Auto-dismiss after 3 seconds
          setTimeout(() => {
            handleDismiss(true);
          }, 3000);
        }
      }
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [bannerState]);

  const handleDismiss = async (skipAnimation = false) => {
    const user = auth.currentUser;

    if (skipAnimation) {
      // Immediate dismiss for verified state
      translateY.value = withSpring(
        -200,
        {
          damping: 15,
          stiffness: 120,
        },
        (finished) => {
          if (finished) {
            runOnJS(setBannerState)("hidden");
            runOnJS(setIsDismissed)(true);
          }
        }
      );
    } else {
      // Normal dismiss animation
      translateY.value = withSpring(
        -200,
        {
          damping: 15,
          stiffness: 120,
        },
        (finished) => {
          if (finished) {
            runOnJS(setBannerState)("hidden");
            runOnJS(setIsDismissed)(true);
          }
        }
      );
    }

    // Remember dismissal for this session
    if (user) {
      const userDismissalKey = `${BANNER_DISMISSED_KEY}_${user.uid}`;
      await AsyncStorage.setItem(userDismissalKey, "true");
    }
  };

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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (bannerState === "hidden" || suppress) return null;

  // ✅ Verified state (success)
  if (bannerState === "verified") {
    return (
      <Animated.View
        style={[
          styles.container,
          {
            top: insets.top + 10,
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
          animatedStyle,
        ]}
      >
        <View style={styles.content}>
          <View style={styles.leftContent}>
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: colors.iconCircleSecondaryBackground },
              ]}
            >
              <IconSymbol
                name="checkmark.circle.fill"
                size={24}
                color={colors.tint}
              />
            </View>
            <View style={styles.textContent}>
              <ThemedText type="body" style={{ color: colors.text }}>
                Email Verified!
              </ThemedText>
              <ThemedText
                type="caption"
                style={[styles.subtitle, { color: colors.textSecondary }]}
              >
                Password recovery is now enabled
              </ThemedText>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  }

  // ✅ Unverified state (default)
  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        {/* Left: Icon + Text */}
        <View style={styles.leftContent}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.iconCircleSecondaryBackground },
            ]}
          >
            <IconSymbol
              name="envelope.badge"
              size={24}
              color={colors.textSecondary}
            />
          </View>
          <View style={styles.textContent}>
            <ThemedText type="body" style={{ color: colors.text }}>
              Verify Your Email
            </ThemedText>
            <ThemedText
              type="caption"
              style={[styles.subtitle, { color: colors.textSecondary }]}
            >
              Check your inbox to enable password recovery
            </ThemedText>
          </View>
        </View>

        {/* Right: Resend Button + Close */}
        <View style={styles.rightContent}>
          <TouchableOpacity
            style={[
              styles.resendButton,
              { backgroundColor: colors.cardBackground },
            ]}
            onPress={handleResend}
            disabled={isResending}
            activeOpacity={0.8}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <ThemedText
                type="captionMedium"
                style={[
                  styles.resendButtonText,
                  { color: colors.textSecondary },
                ]}
              >
                Resend
              </ThemedText>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => handleDismiss(false)}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol name="xmark" size={16} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10000,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    paddingRight: 8,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  subtitle: {
    opacity: 0.9,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  resendButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  resendButtonText: {
    fontSize: 13,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
