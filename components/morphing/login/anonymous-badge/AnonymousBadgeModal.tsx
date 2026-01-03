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
}

export function AnonymousBadgeModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: AnonymousBadgeModalProps) {
  const { colors, effectiveTheme } = useTheme();

  // Use the same badge component for morphing!
  const buttonContent = (
    <AnonymousBadge
      text="What's the Difference?"
      icon="questionmark.circle"
      iconColor={colors.textSecondary}
      textColor={colors.textSecondary}
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

          <ThemedText
            type="body"
            style={[styles.bodyText, { color: colors.textSecondary }]}
          >
            Both creating an account and continuing as a guest are completely
            anonymous. Your identity is never shared.
          </ThemedText>

          <ThemedText
            type="body"
            style={[styles.bodyText, { color: colors.textSecondary }]}
          >
            If you continue as a guest, you will not have an email address
            associated with your account, and your account will be completely
            deleted if you log out or get a new phone. You can convert your
            guest account to a permanent account with an email & password for
            login at any time via in app settings.
          </ThemedText>
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
