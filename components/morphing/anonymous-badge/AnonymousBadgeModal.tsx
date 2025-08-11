import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { StyleSheet, View } from "react-native";
import Animated from "react-native-reanimated";
import { BaseModal } from "../BaseModal";

interface AnonymousBadgeModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
}

export function AnonymousBadgeModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: AnonymousBadgeModalProps) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

  // Button content that shows during the transition (just icon + text)
  const buttonContent = (
    <View style={styles.badgeButtonContent}>
      <IconSymbol
        name="eye.slash"
        size={14}
        color={colors.textSecondary}
        style={{ marginRight: 6 }}
      />
      <ThemedText type="badge" style={{ color: colors.textSecondary }}>
        100% anonymous
      </ThemedText>
    </View>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={theme ?? "dark"}
      backgroundColor={colors.modalCardBackground}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.2]}
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
            The only difference: if you continue as a guest, your data won't be
            saved if you get a new phone.
          </ThemedText>
        </View>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  badgeButtonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  modalContentWrapper: {
    flex: 1,
    borderRadius: 28,
    margin: -24, // Counteract BaseModal's padding
    padding: 24,
  },
  modalContent: {
    marginTop: 80,
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
