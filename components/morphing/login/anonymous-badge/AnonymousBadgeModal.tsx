import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { AnonymousBadge } from "./AnonymousBadge";

interface AnonymousBadgeModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  // Optional customization for the collapsed badge appearance
  badgeText?: string;
  badgeIcon?: string;
  badgeIconColor?: string;
  badgeTextColor?: string;
  // Variant for different content
  variant?: "login" | "notifications";
}

export function AnonymousBadgeModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  badgeText = "What's the Difference?",
  badgeIcon = "questionmark.circle",
  badgeIconColor,
  badgeTextColor,
  variant = "login",
}: AnonymousBadgeModalProps) {
  const { colors, effectiveTheme } = useTheme();

  // Use the same badge component for morphing!
  const buttonContent = (
    <AnonymousBadge
      text={badgeText}
      icon={badgeIcon}
      iconColor={badgeIconColor || colors.textSecondary}
      textColor={badgeTextColor || colors.textSecondary}
      style={{ alignSelf: "center" }}
    />
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.modalCardBackground}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.2]}
      buttonContentPadding={0}
    >
      {/* Modal content with semi-transparent background */}
      <View
        style={[
          styles.modalContentWrapper,
          { backgroundColor: `${colors.cardBackground}B3` },
        ]}
      >
        <View style={styles.modalContent}>
          <ThemedText
            type="title"
            style={[styles.title, { color: colors.text }]}
          >
            100% Anonymous
          </ThemedText>

          {variant === "login" ? (
            <>
              <ThemedText
                type="body"
                style={[styles.bodyText, { color: colors.textSecondary }]}
              >
                Both creating an account and continuing as a guest are completely
                anonymous. Your identity or email address is NEVER shared.
              </ThemedText>

              <ThemedText
                type="body"
                style={[styles.bodyText, { color: colors.textSecondary }]}
              >
                If you continue as a guest, you will not have a login associated
                with your account, and your account will be completely deleted if
                you log out for any reason (uninstall app, new phone, etc). You can
                convert your guest account to a permanent account with an email &
                password for login at any time via in app settings.
              </ThemedText>
            </>
          ) : (
            <>
              <ThemedText
                type="body"
                style={[styles.bodyText, { color: colors.textSecondary }]}
              >
                When you reach out for help or encourage someone else, your
                identity is never revealed. No names, no emails — just support
                from real people who understand what you're going through.
              </ThemedText>

              <ThemedText
                type="body"
                style={[styles.bodyText, { color: colors.textSecondary }]}
              >
                This allows you to be honest about your struggles without fear
                of judgment. Everyone here is fighting the same battle.
              </ThemedText>
            </>
          )}
        </View>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modalContentWrapper: {
    flex: 1,
    borderRadius: 28,
    margin: -24, // Counteract BaseModal's padding
    padding: 24,
  },
  modalContent: {
    marginTop: 40,
  },
  title: {
    textAlign: "center",
    marginBottom: 16,
  },
  bodyText: {
    textAlign: "center",
    marginBottom: 12,
    lineHeight: 22,
  },
});
