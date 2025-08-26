// components/messages/chat/ThreadInfoModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";

interface ThreadInfoModalProps {
  isVisible: boolean;
  progress: Animated.SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  threadName: string;
  otherUserId: string;
}

export function ThreadInfoModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  threadName,
  otherUserId,
}: ThreadInfoModalProps) {
  const { colors, effectiveTheme } = useTheme();

  // Button content (the info icon in its collapsed state)
  const buttonContent = (
    <View style={styles.buttonContent}>
      <IconSymbol name="info.circle" size={24} color={colors.textSecondary} />
    </View>
  );

  // Modal content
  const modalContent = (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <View
          style={[
            styles.largeAvatar,
            { backgroundColor: colors.iconCircleSecondaryBackground },
          ]}
        >
          <ThemedText type="title" style={{ color: colors.icon }}>
            {threadName
              ? threadName[5]?.toUpperCase() || threadName[0]?.toUpperCase()
              : "U"}
          </ThemedText>
        </View>

        <ThemedText
          type="title"
          style={[styles.userName, { color: colors.text }]}
        >
          {threadName || "Anonymous User"}
        </ThemedText>

        <ThemedText
          type="caption"
          style={[styles.userStatus, { color: colors.textSecondary }]}
        >
          Anonymous conversation
        </ThemedText>
      </View>

      {/* Thread Details Section */}
      <View style={styles.detailsSection}>
        {/* Unfiltered Chat Warning Card */}
        <View
          style={[styles.warningCard, { backgroundColor: colors.background }]}
        >
          <IconSymbol
            name="exclamationmark.triangle"
            size={24}
            color={colors.error || colors.tint}
            style={styles.warningIcon}
          />
          <ThemedText
            type="bodyMedium"
            style={[styles.warningTitle, { color: colors.text }]}
          >
            Unfiltered Conversations
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.warningText, { color: colors.textSecondary }]}
          >
            These private chats are completely unmoderated and unfiltered, and
            have no content restrictions. Be aware that you may encounter
            trolls, abusive behavior, or people misusing the app. If someone is
            harassing you or acting inappropriately, please report them
            immediately.
          </ThemedText>

          {/* Report User Button */}
          <TouchableOpacity
            style={[
              styles.reportButton,
              { backgroundColor: colors.error || colors.tint },
            ]}
            activeOpacity={0.8}
            onPress={() => {
              // TODO: Hook up report functionality
              console.log("Report user pressed");
            }}
          >
            <IconSymbol name="flag" size={16} color={colors.white} />
            <ThemedText
              type="caption"
              style={[styles.reportButtonText, { color: colors.white }]}
            >
              Report User
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Privacy Section */}
        <View style={styles.detailItem}>
          <View style={styles.detailHeader}>
            <IconSymbol
              name="lock.shield"
              size={20}
              color={colors.textSecondary}
            />
            <ThemedText
              type="bodyMedium"
              style={[styles.detailLabel, { color: colors.text }]}
            >
              Privacy & Security
            </ThemedText>
          </View>
          <ThemedText
            type="caption"
            style={[styles.detailValue, { color: colors.textSecondary }]}
          >
            Anonymous • Private
          </ThemedText>
        </View>
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
      buttonBorderRadius={16}
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
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 32,
    paddingBottom: 32,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 32,
  },
  largeAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  userName: {
    marginBottom: 4,
  },
  userStatus: {
    opacity: 0.8,
  },
  detailsSection: {
    marginBottom: 32,
  },
  warningCard: {
    padding: 20,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 24,
  },
  warningIcon: {
    marginBottom: 12,
  },
  warningTitle: {
    marginBottom: 12,
    textAlign: "center",
    fontWeight: "600",
  },
  warningText: {
    textAlign: "center",
    lineHeight: 20,
    opacity: 0.9,
    marginBottom: 16,
  },
  reportButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20, // Increased from 16
    paddingVertical: 14, // Increased from 10
    borderRadius: 10, // Slightly larger radius
    gap: 8, // Increased gap between icon and text
  },
  reportButtonText: {
    fontWeight: "600",
  },
  detailItem: {
    marginBottom: 20,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  detailLabel: {
    marginLeft: 8,
  },
  detailValue: {
    marginLeft: 28,
    opacity: 0.8,
    lineHeight: 18,
  },
});
