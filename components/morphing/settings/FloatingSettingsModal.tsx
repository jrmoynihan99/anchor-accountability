// components/morphing/settings/FloatingSettingsModal.tsx
import { useTheme } from "@/hooks/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { BaseModal } from "../BaseModal";
import { AboutSection } from "./AboutSection";
import { AppearanceSection } from "./AppearanceSection";
import { NotificationsSection } from "./NotificationsSection";
import { PrivacySection } from "./PrivacySection";
import { SettingsHeader } from "./SettingsHeader";
import { SignOutButton } from "./SignOutButton";

interface FloatingSettingsModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
}

export function FloatingSettingsModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: FloatingSettingsModalProps) {
  const { colors, effectiveTheme } = useTheme();

  const handleSignOut = () => {
    // TODO: Implement sign out functionality
    console.log("Sign out pressed");
  };

  // Button content (the settings icon in its collapsed state)
  const buttonContent = (
    <BlurView
      intensity={80}
      tint={effectiveTheme === "dark" ? "dark" : "light"}
      style={styles.buttonBlur}
    >
      <View
        style={[
          styles.buttonContent,
          {
            borderColor: colors.navBorder,
            borderWidth: 1,
          },
        ]}
      >
        <Ionicons
          name="settings-sharp"
          size={24}
          color={colors.tabIconDefault}
        />
      </View>
    </BlurView>
  );

  // Modal content
  const modalContent = (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <SettingsHeader />

      <View style={styles.settingsSection}>
        <AppearanceSection />
        <NotificationsSection />
        <PrivacySection />
        <AboutSection />
        <SignOutButton onPress={handleSignOut} />
      </View>
    </ScrollView>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.cardBackground}
      buttonBackgroundColor="transparent"
      buttonContentPadding={0}
      buttonBorderRadius={20}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.2]}
    >
      {modalContent}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  buttonBlur: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 0,
  },
  settingsSection: {
    gap: 20,
  },
});
