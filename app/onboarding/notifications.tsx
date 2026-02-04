// app/onboarding/notifications.tsx
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { AnonymousBadge } from "@/components/morphing/login/anonymous-badge/AnonymousBadge";
import { AnonymousBadgeModal } from "@/components/morphing/login/anonymous-badge/AnonymousBadgeModal";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { useNotificationPreferences } from "@/hooks/notification/useNotificationPreferences";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { getAuth } from "firebase/auth";
import React, { useState } from "react";
import {
  StatusBar,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

const NOTIFICATION_ONBOARDING_KEY = "hasSeenNotificationOnboarding";
const NOTIFICATION_DISMISSED_KEY = "notificationPromptDismissedAt";

export default function NotificationsScreen() {
  const { colors } = useTheme();
  const { enableNotifications } = useNotificationPreferences();
  const [isLoading, setIsLoading] = useState(false);
  const auth = getAuth();

  const markOnboardingSeen = async (setDismissedTimestamp: boolean = false) => {
    const uid = auth.currentUser?.uid || "anonymous";
    await AsyncStorage.setItem(`${NOTIFICATION_ONBOARDING_KEY}_${uid}`, "true");

    // If user declined, also set the dismissed timestamp for 3-day re-prompt logic
    if (setDismissedTimestamp) {
      await AsyncStorage.setItem(
        `${NOTIFICATION_DISMISSED_KEY}_${uid}`,
        new Date().toISOString()
      );
    }
  };

  const handleEnableNotifications = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      await enableNotifications();
      await markOnboardingSeen();
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error enabling notifications:", error);
      // Still navigate even if there's an error
      await markOnboardingSeen();
      router.replace("/(tabs)");
    }
  };

  const handleNotNow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Set dismissed timestamp so 3-day re-prompt logic works
    await markOnboardingSeen(true);
    router.replace("/(tabs)");
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.cardBackground }]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={[colors.cardBackground, colors.tint]}
        style={styles.gradient}
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Main Card */}
          <View style={[styles.mainCardShadow, { shadowColor: colors.shadow }]}>
            <BlurView
              intensity={20}
              tint="light"
              style={[
                styles.mainCard,
                { borderColor: colors.modalCardBorder },
              ]}
            >
              {/* Icon */}
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: colors.tint + "20" },
                ]}
              >
                <IconSymbol
                  name="bell"
                  size={48}
                  color={colors.tint}
                  weight="medium"
                />
              </View>

              {/* Title */}
              <ThemedText type="title" style={styles.title}>
                Be There For Others
              </ThemedText>

              {/* Description */}
              <ThemedText
                type="body"
                style={[styles.description, { color: colors.textSecondary }]}
              >
                Anchor works because people show up for each other. When someone
                is struggling, they can reach out — and you can be the one who
                responds.
              </ThemedText>

              <ThemedText
                type="body"
                style={[styles.description, { color: colors.textSecondary }]}
              >
                Enable notifications so you'll know when someone needs
                encouragement.
              </ThemedText>

              {/* Anonymous Badge */}
              <ButtonModalTransitionBridge
                modalWidthPercent={0.8}
                modalHeightPercent={0.6}
              >
                {({
                  open,
                  close,
                  isModalVisible,
                  progress,
                  modalAnimatedStyle,
                  buttonAnimatedStyle,
                  buttonRef,
                  handlePressIn,
                  handlePressOut,
                }) => (
                  <>
                    <AnonymousBadge
                      buttonRef={buttonRef}
                      style={buttonAnimatedStyle}
                      onPress={open}
                      onPressIn={handlePressIn}
                      onPressOut={handlePressOut}
                      text="100% Anonymous"
                      icon="eye.slash"
                      iconColor={colors.tint}
                      textColor={colors.tint}
                    />
                    <AnonymousBadgeModal
                      isVisible={isModalVisible}
                      progress={progress}
                      modalAnimatedStyle={modalAnimatedStyle}
                      close={close}
                      badgeText="100% Anonymous"
                      badgeIcon="eye.slash"
                      badgeIconColor={colors.tint}
                      badgeTextColor={colors.tint}
                      variant="notifications"
                    />
                  </>
                )}
              </ButtonModalTransitionBridge>
            </BlurView>
          </View>

          {/* Customization Note */}
          <View style={styles.noteContainer}>
            <IconSymbol
              name="gear"
              size={14}
              color={colors.textSecondary}
              style={styles.noteIcon}
            />
            <ThemedText
              type="caption"
              style={[styles.noteText, { color: colors.textSecondary }]}
            >
              You can customize notifications anytime in Settings
            </ThemedText>
          </View>
        </View>

        {/* Bottom Buttons */}
        <View style={styles.buttonArea}>
          <View style={[styles.buttonShadow, { shadowColor: colors.shadow }]}>
            <BlurView
              intensity={15}
              tint="light"
              style={[
                styles.buttonContainer,
                { borderColor: colors.modalCardBorder },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: colors.buttonBackground },
                  isLoading && styles.disabledButton,
                ]}
                onPress={handleEnableNotifications}
                activeOpacity={0.8}
                disabled={isLoading}
              >
                <IconSymbol
                  name="bell.badge"
                  size={20}
                  color={colors.white}
                  style={styles.buttonIcon}
                />
                <ThemedText
                  type="buttonLarge"
                  style={[styles.buttonText, { color: colors.white }]}
                >
                  {isLoading ? "Enabling..." : "I'll Be There"}
                </ThemedText>
              </TouchableOpacity>
            </BlurView>
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleNotNow}
            activeOpacity={0.7}
            disabled={isLoading}
          >
            <ThemedText
              type="bodyMedium"
              style={[styles.secondaryButtonText, { color: colors.textSecondary }]}
            >
              Not right now
            </ThemedText>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "center",
    paddingVertical: 20,
  },
  mainCardShadow: {
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  mainCard: {
    borderRadius: 24,
    padding: 32,
    borderWidth: 0,
    overflow: "hidden",
    alignItems: "center",
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "600",
  },
  description: {
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 16,
  },
  noteContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    opacity: 0.8,
  },
  noteIcon: {
    marginRight: 6,
  },
  noteText: {
    fontStyle: "italic",
  },
  buttonArea: {
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  buttonShadow: {
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  buttonContainer: {
    borderRadius: 20,
    borderWidth: 0,
    overflow: "hidden",
  },
  primaryButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 4,
  },
  buttonText: {
    fontWeight: "600",
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: "center",
  },
  secondaryButtonText: {
    textDecorationLine: "underline",
  },
});
