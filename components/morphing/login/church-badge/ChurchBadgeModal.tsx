// components/onboarding/church-selection/church-badge/ChurchBadgeModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../../../morphing/BaseModal";

interface ChurchBadgeModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  churchName: string;
  mission: string;
}

export function ChurchBadgeModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  churchName,
  mission,
}: ChurchBadgeModalProps) {
  const { colors, effectiveTheme } = useTheme();

  // Badge content for morphing
  const buttonContent = (
    <View
      style={[
        styles.churchBadge,
        {
          backgroundColor: colors.cardBackground,
        },
      ]}
    >
      <IconSymbol name="building.2" size={20} color={colors.icon} />
      <ThemedText type="bodyMedium" style={{ color: colors.text }}>
        {churchName}
      </ThemedText>
    </View>
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
      {/* Modal content */}
      <View
        style={[
          styles.modalContentWrapper,
          { backgroundColor: `${colors.cardBackground}B3` },
        ]}
      >
        <View style={styles.modalContent}>
          <View style={styles.headerSection}>
            <IconSymbol name="building.2" size={32} color={colors.icon} />
            <ThemedText
              type="title"
              style={[styles.title, { color: colors.text }]}
            >
              {churchName}
            </ThemedText>
          </View>

          {mission && (
            <>
              <ThemedText
                type="subtitle"
                style={[styles.sectionTitle, { color: colors.text }]}
              >
                Mission
              </ThemedText>
              <ThemedText
                type="body"
                style={[styles.bodyText, { color: colors.textSecondary }]}
              >
                {mission}
              </ThemedText>
            </>
          )}
        </View>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  churchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    alignSelf: "center",
  },
  modalContentWrapper: {
    flex: 1,
    borderRadius: 28,
    margin: -24,
    padding: 24,
  },
  modalContent: {
    marginTop: 80,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
    gap: 12,
  },
  title: {
    textAlign: "center",
  },
  sectionTitle: {
    textAlign: "center",
    marginBottom: 12,
    fontWeight: "600",
  },
  bodyText: {
    textAlign: "center",
    lineHeight: 22,
  },
});
