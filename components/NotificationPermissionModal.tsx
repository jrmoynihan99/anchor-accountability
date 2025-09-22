// components/modals/NotificationPermissionModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import * as Haptics from "expo-haptics";
import * as Notifications from "expo-notifications";
import { Linking } from "react-native";
import React, { useEffect, useState, useRef } from "react";
import { Modal, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface NotificationPermissionModalProps {
  isVisible: boolean;
  onClose: () => void;
  onPermissionResult: (granted: boolean) => void;
}

export function NotificationPermissionModal({
  isVisible,
  onClose,
  onPermissionResult,
}: NotificationPermissionModalProps) {
  const { colors } = useTheme();
  const { enableNotifications, loading } = useNotificationPreferences();
  const translateY = useSharedValue(1000);
  const [permissionStatus, setPermissionStatus] =
    useState<string>("undetermined");
  const [isAnimating, setIsAnimating] = useState(false);
  const pendingCallback = useRef<(() => void) | null>(null);

  // Check permission status when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      checkPermissionStatus();
    }
  }, [isVisible]);

  const checkPermissionStatus = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status);
  };

  // Handle show animation
  React.useEffect(() => {
    if (isVisible) {
      setIsAnimating(false);
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [isVisible]);

  // Handle hide animation completion
  React.useEffect(() => {
    if (isAnimating) {
      const timer = setTimeout(() => {
        if (pendingCallback.current) {
          pendingCallback.current();
          pendingCallback.current = null;
        }
        setIsAnimating(false);
      }, 300); // Match animation duration

      return () => clearTimeout(timer);
    }
  }, [isAnimating]);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [1000, 0], [0, 0.4]),
  }));

  // Animated close function that starts animation and sets up callback
  const animatedClose = (callback: () => void) => {
    if (isAnimating) return; // Prevent multiple animations

    setIsAnimating(true);
    pendingCallback.current = callback;

    translateY.value = withTiming(1000, {
      duration: 250,
      easing: Easing.in(Easing.quad),
    });
  };

  const handleEnableNotifications = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (permissionStatus === "denied") {
      // Guide to settings instead of trying to enable
      Linking.openSettings();
      // Wait a bit for the settings to open, then close with animation
      setTimeout(() => {
        animatedClose(() => {
          onPermissionResult(false);
          onClose();
        });
      }, 500);
      return;
    }

    const success = await enableNotifications();

    // Close with animation regardless of success/failure
    animatedClose(() => {
      onPermissionResult(success);
      onClose();
    });
  };

  const handleNotNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animatedClose(() => {
      onPermissionResult(false);
      onClose();
    });
  };

  const handleOverlayPress = () => {
    animatedClose(() => {
      onPermissionResult(false);
      onClose();
    });
  };

  // Don't render if not visible and not animating
  if (!isVisible && !isAnimating) return null;

  // Determine content based on permission status
  const isDenied = permissionStatus === "denied";
  const buttonText = isDenied ? "Open Settings" : "Enable Notifications";
  const buttonIcon = isDenied ? "gear" : "bell.badge";
  const noteText = isDenied
    ? "Notifications are currently disabled for this app. Tap below to open Settings and enable them manually."
    : "Without notifications, you won't know when someone needs your support, or when you've received encouragement from others!";

  return (
    <Modal
      visible={true}
      transparent
      statusBarTranslucent
      animationType="none"
      onRequestClose={handleNotNow}
    >
      {/* Overlay */}
      <Animated.View
        style={[
          styles.overlay,
          { backgroundColor: colors.shadow },
          overlayStyle,
        ]}
        pointerEvents="auto"
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleOverlayPress}
          activeOpacity={1}
        />
      </Animated.View>

      {/* Modal */}
      <View style={styles.container} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.modal,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.modalCardBorder,
            },
            modalStyle,
          ]}
          pointerEvents="auto"
        >
          {/* Close button */}
          <TouchableOpacity
            onPress={handleNotNow}
            style={[
              styles.closeButton,
              { backgroundColor: colors.closeButtonBackground },
            ]}
            hitSlop={16}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="xmark"
              size={18}
              weight="light"
              color={colors.closeButtonText}
            />
          </TouchableOpacity>

          {/* Header Icon */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.tint + "20" },
            ]}
          >
            <IconSymbol
              name={isDenied ? "bell.slash" : "bell"}
              size={32}
              color={colors.tint}
              weight="medium"
            />
          </View>

          {/* Title */}
          <ThemedText type="title" style={styles.title}>
            {isDenied
              ? "Notifications Are Disabled"
              : "Enable Notifications To Help"}
          </ThemedText>

          {/* Description */}
          <ThemedText
            type="body"
            style={[styles.description, { color: colors.textSecondary }]}
          >
            This app works by connecting people who need help with those ready
            to offer support.
          </ThemedText>

          {/* Important Note */}
          <View
            style={[
              styles.importantNote,
              { backgroundColor: colors.tint + "15", borderColor: colors.tint },
            ]}
          >
            <IconSymbol
              name={isDenied ? "gear" : "exclamationmark.triangle"}
              size={16}
              color={colors.tint}
              style={styles.warningIcon}
            />
            <ThemedText
              type="caption"
              style={[styles.noteText, { color: colors.textSecondary }]}
            >
              {noteText}
            </ThemedText>
          </View>

          {/* Customization Note - only show if not denied */}
          {!isDenied && (
            <ThemedText
              type="caption"
              style={[styles.customizeText, { color: colors.textSecondary }]}
            >
              You can change which types of notifications you receive after
              enabling.
            </ThemedText>
          )}

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.enableButton,
                { backgroundColor: colors.tint },
                loading && styles.disabledButton,
              ]}
              onPress={handleEnableNotifications}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ThemedText
                  type="button"
                  style={[styles.enableButtonText, { color: colors.white }]}
                >
                  {isDenied ? "Opening..." : "Enabling..."}
                </ThemedText>
              ) : (
                <>
                  <IconSymbol
                    name={buttonIcon}
                    size={18}
                    color={colors.white}
                    style={styles.buttonIcon}
                  />
                  <ThemedText
                    type="button"
                    style={[styles.enableButtonText, { color: colors.white }]}
                  >
                    {buttonText}
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.laterButton}
              onPress={handleNotNow}
              activeOpacity={0.7}
            >
              <ThemedText
                type="bodyMedium"
                style={[
                  styles.laterButtonText,
                  { color: colors.textSecondary },
                ]}
              >
                Ask Me Later
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  container: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
  },
  modal: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 30,
    borderRadius: 18,
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 12,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
    fontWeight: "600",
  },
  description: {
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 16,
  },
  importantNote: {
    flexDirection: "row",
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    alignItems: "flex-start",
  },
  warningIcon: {
    marginTop: 1,
    marginRight: 8,
  },
  noteText: {
    flex: 1,
    lineHeight: 18,
    fontWeight: "500",
  },
  customizeText: {
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 24,
    opacity: 0.8,
  },
  buttonContainer: {
    width: "100%",
    gap: 12,
  },
  enableButton: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  enableButtonText: {
    fontWeight: "600",
  },
  laterButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  laterButtonText: {
    textDecorationLine: "underline",
  },
});
