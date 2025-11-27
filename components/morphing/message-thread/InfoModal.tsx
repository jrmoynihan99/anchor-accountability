// components/messages/chat/ThreadInfoModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useBlockCheck } from "@/hooks/useBlockCheck";
import { useBlockUser } from "@/hooks/useBlockUser";
import { useReportCheck } from "@/hooks/useReportCheck";
import { auth, db } from "@/lib/firebase";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../BaseModal";

interface ThreadInfoModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
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
  const { hasReported, isLoading: reportLoading } = useReportCheck(otherUserId);
  const { hasBlocked, isLoading: blockCheckLoading } =
    useBlockCheck(otherUserId);
  const { blockUser, loading: blockLoading } = useBlockUser();

  const handleReportUser = async () => {
    const currentUserId = auth.currentUser?.uid;
    if (!currentUserId) {
      Alert.alert("Error", "You must be signed in to report users");
      return;
    }

    if (hasReported) {
      Alert.alert(
        "Already Reported",
        "You have already reported this user recently."
      );
      return;
    }

    try {
      await addDoc(collection(db, "reports"), {
        reportedUserId: otherUserId,
        reporterUserId: currentUserId,
        timestamp: serverTimestamp(),
      });
      Alert.alert("Report Submitted", "Thank you for your report.");
    } catch (error) {
      Alert.alert("Error", "Failed to submit report. Please try again.");
    }
  };

  const handleBlockUser = () => {
    if (hasBlocked) {
      Alert.alert(
        "Already Blocked",
        "You have already blocked this user. You can unblock them from Settings → Block List."
      );
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      "Block User?",
      "You will no longer see anything from this user and they will not be able to interact with you. You can unblock them from Settings → Block List.",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Block",
          style: "destructive",
          onPress: async () => {
            const success = await blockUser(otherUserId);
            if (success) {
              Haptics.notificationAsync(
                Haptics.NotificationFeedbackType.Success
              );
              Alert.alert(
                "User Blocked",
                "You have successfully blocked this user. This conversation will be hidden.",
                [
                  {
                    text: "OK",
                    onPress: () => {
                      close();
                      router.replace("/(tabs)/messages");
                    },
                  },
                ]
              );
            } else {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
              Alert.alert("Error", "Failed to block user. Please try again.");
            }
          },
        },
      ]
    );
  };

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

          {/* Action Buttons Row */}
          <View style={styles.actionButtonsRow}>
            {/* Report User Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: hasReported
                    ? colors.textSecondary
                    : colors.error || colors.tint,
                  opacity: hasReported || reportLoading ? 0.6 : 1,
                },
              ]}
              activeOpacity={0.8}
              onPress={handleReportUser}
              disabled={hasReported || reportLoading}
            >
              <IconSymbol
                name={hasReported ? "checkmark" : "flag"}
                size={16}
                color={colors.white}
              />
              <ThemedText
                type="caption"
                style={[styles.actionButtonText, { color: colors.white }]}
              >
                {hasReported ? "Reported" : "Report"}
              </ThemedText>
            </TouchableOpacity>

            {/* Block User Button */}
            <TouchableOpacity
              style={[
                styles.actionButton,
                {
                  backgroundColor: hasBlocked
                    ? colors.textSecondary
                    : colors.error || colors.tint,
                  opacity:
                    hasBlocked || blockLoading || blockCheckLoading ? 0.6 : 1,
                },
              ]}
              activeOpacity={0.8}
              onPress={handleBlockUser}
              disabled={hasBlocked || blockLoading || blockCheckLoading}
            >
              {blockLoading || blockCheckLoading ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <IconSymbol
                    name={hasBlocked ? "checkmark" : "hand.raised.slash"}
                    size={16}
                    color={colors.white}
                  />
                  <ThemedText
                    type="caption"
                    style={[styles.actionButtonText, { color: colors.white }]}
                  >
                    {hasBlocked ? "Blocked" : "Block"}
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>
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
  actionButtonsRow: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  actionButtonText: {
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
