// components/modals/NotificationPermissionModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import * as Haptics from "expo-haptics";
import React from "react";
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

  React.useEffect(() => {
    if (isVisible) {
      translateY.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    } else {
      translateY.value = withTiming(1000, {
        duration: 250,
        easing: Easing.in(Easing.quad),
      });
    }
  }, [isVisible]);

  const modalStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [1000, 0], [0, 0.4]),
  }));

  const handleEnableNotifications = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const success = await enableNotifications();
    onPermissionResult(success);

    if (success) {
      onClose();
    }
  };

  const handleNotNow = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Start the close animation
    translateY.value = withTiming(1000, {
      duration: 250,
      easing: Easing.in(Easing.quad),
    });
  };

  if (!isVisible) return null;

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
          onPress={handleNotNow}
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
              name="bell"
              size={32}
              color={colors.tint}
              weight="medium"
            />
          </View>

          {/* Title */}
          <ThemedText type="title" style={styles.title}>
            Enable Notifications To Help
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
              name="exclamationmark.triangle"
              size={16}
              color={colors.tint}
              style={styles.warningIcon}
            />
            <ThemedText
              type="caption"
              style={[styles.noteText, { color: colors.textSecondary }]}
            >
              Without notifications, you won't know when someone needs your
              support, or when you've recieved encouragement from others!
            </ThemedText>
          </View>

          {/* Customization Note */}
          <ThemedText
            type="caption"
            style={[styles.customizeText, { color: colors.textSecondary }]}
          >
            You can change which types of notifications you receive after
            enabling.
          </ThemedText>

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
                  Enabling...
                </ThemedText>
              ) : (
                <>
                  <IconSymbol
                    name="bell.badge"
                    size={18}
                    color={colors.white}
                    style={styles.buttonIcon}
                  />
                  <ThemedText
                    type="button"
                    style={[styles.enableButtonText, { color: colors.white }]}
                  >
                    Enable Notifications
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

          {/* Bottom drag indicator */}
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
    paddingBottom: 50,
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
