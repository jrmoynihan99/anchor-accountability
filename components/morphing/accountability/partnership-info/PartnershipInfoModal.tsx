// components/morphing/message-thread/partnership-info/PartnershipInfoModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";

interface PartnershipInfoModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
}

export function PartnershipInfoModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: PartnershipInfoModalProps) {
  const { colors, effectiveTheme } = useTheme();

  // Button content (the info icon in its collapsed state)
  const buttonContent = (
    <View style={styles.buttonContent}>
      <IconSymbol name="info.circle" size={18} color={colors.textSecondary} />
    </View>
  );

  // Modal content
  const modalContent = (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View
          style={[styles.iconCircle, { backgroundColor: `${colors.icon}20` }]}
        >
          <IconSymbol name="link" size={32} color={colors.icon} />
        </View>
        <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
          How Anchor Partnerships Work
        </ThemedText>
      </View>

      {/* Introduction */}
      <View style={styles.introSection}>
        <ThemedText
          type="body"
          style={[styles.introText, { color: colors.textSecondary }]}
        >
          Anchor Partnerships are one-to-one relationships where one person
          provides steady support to another through recovery.
        </ThemedText>
      </View>

      {/* Get an Anchor Partner Section */}
      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.cardIconCircle,
              { backgroundColor: `${colors.tint}15` },
            ]}
          >
            <IconSymbol name="link" size={20} color={colors.icon} />
          </View>
          <ThemedText
            type="subtitleSemibold"
            style={[styles.cardTitle, { color: colors.text }]}
          >
            Get an Anchor Partner
          </ThemedText>
        </View>
        <ThemedText
          type="body"
          style={[styles.cardText, { color: colors.textSecondary }]}
        >
          Invite someone further along to support your journey. They'll see your
          daily check-ins and be there when you need them.{" "}
          <ThemedText type="bodyMedium" style={{ color: colors.text }}>
            You send the invite.
          </ThemedText>
        </ThemedText>
      </View>

      {/* Be an Anchor Partner Section */}
      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.cardIconCircle,
              { backgroundColor: `${colors.tint}15` },
            ]}
          >
            <IconSymbol name="person.2.fill" size={20} color={colors.icon} />
          </View>
          <ThemedText
            type="subtitleSemibold"
            style={[styles.cardTitle, { color: colors.text }]}
          >
            Be an Anchor Partner
          </ThemedText>
        </View>
        <ThemedText
          type="body"
          style={[styles.cardText, { color: colors.textSecondary }]}
        >
          Accept invites from others asking you to support their journey. You'll
          see their check-ins and help keep them accountable.{" "}
          <ThemedText type="bodyMedium" style={{ color: colors.text }}>
            They send you the invite.
          </ThemedText>
        </ThemedText>
      </View>

      {/* Important Note Section */}
      <View
        style={[
          styles.noteCard,
          {
            backgroundColor: `${colors.tint}60`,
            borderColor: `${colors.tint}30`,
          },
        ]}
      >
        <View style={styles.noteHeader}>
          <IconSymbol name="info.circle.fill" size={18} color={colors.icon} />
          <ThemedText
            type="bodyMedium"
            style={[styles.noteTitle, { color: colors.text }]}
          >
            Why It Works This Way
          </ThemedText>
        </View>
        <ThemedText
          type="body"
          style={[styles.noteText, { color: colors.textSecondary }]}
        >
          Only the person seeking support sends the invite. This keeps the power
          dynamic healthy and ensures both people are ready for the commitment.
        </ThemedText>
      </View>

      {/* Metaphor Explanation */}
      <View style={styles.metaphorSection}>
        <ThemedText
          type="caption"
          style={[styles.metaphorText, { color: colors.textSecondary }]}
        >
          <ThemedText type="captionMedium" style={{ color: colors.text }}>
            Why "Anchor"?
          </ThemedText>{" "}
          Just like an anchor keeps a ship steady in rough waters, an Anchor
          Partner helps keep you grounded during difficult moments in your
          recovery journey.
        </ThemedText>
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
      buttonBackgroundColor={colors.iconCircleSecondaryBackground}
      buttonContentPadding={0}
      buttonBorderRadius={12}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.2]}
    >
      {modalContent}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 4,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
    paddingHorizontal: 20,
  },
  introSection: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  introText: {
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.9,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  cardIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  cardTitle: {
    flex: 1,
  },
  cardText: {
    lineHeight: 20,
    opacity: 0.9,
  },
  noteCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 16,
  },
  noteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 8,
  },
  noteTitle: {
    flex: 1,
  },
  noteText: {
    lineHeight: 20,
    opacity: 0.9,
  },
  metaphorSection: {
    paddingHorizontal: 4,
  },
  metaphorText: {
    textAlign: "center",
    lineHeight: 18,
    opacity: 0.8,
  },
});
