import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { useLegalContent } from "@/hooks/useLegalContent";
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { PrivacyPolicyBadge } from "./PrivacyPolicyBadge";

interface PrivacyPolicyModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
}

export function PrivacyPolicyModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: PrivacyPolicyModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const { privacyPolicy, loading } = useLegalContent();

  // Use the same badge component for morphing!
  const buttonContent = <PrivacyPolicyBadge style={{ alignSelf: "center" }} />;

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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
        >
          <ThemedText
            type="title"
            style={[styles.title, { color: colors.text }]}
          >
            Privacy Policy
          </ThemedText>

          <ThemedText
            type="small"
            style={[styles.lastUpdated, { color: colors.textSecondary }]}
          >
            Last Updated: October 8, 2025
          </ThemedText>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.tint} />
            </View>
          ) : (
            <ThemedText
              type="body"
              style={[styles.bodyText, { color: colors.textSecondary }]}
            >
              {privacyPolicy}
            </ThemedText>
          )}
        </ScrollView>
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
  scrollView: {
    flex: 1,
  },
  modalContent: {
    marginTop: 60,
    paddingBottom: 40,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  lastUpdated: {
    textAlign: "center",
    marginBottom: 24,
    fontStyle: "italic",
  },
  sectionTitle: {
    marginTop: 20,
    marginBottom: 8,
  },
  bodyText: {
    marginBottom: 12,
    lineHeight: 22,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },
});
