import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { router } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../BaseModal";
import { MenteeCardContent } from "./MenteeCardContent";

interface MenteeModalProps {
  menteeUid: string;
  recoveryStreak: number;
  checkInStreak: number;
  lastCheckIn: string | null;
  relationshipId: string;
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
}

export function MenteeModal({
  menteeUid,
  recoveryStreak,
  checkInStreak,
  lastCheckIn,
  relationshipId,
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: MenteeModalProps) {
  const { colors, effectiveTheme } = useTheme();

  const handleRemind = () => {
    // TODO: Send reminder notification
    console.log("Send reminder to", menteeUid);
  };

  const handleEncourage = () => {
    // TODO: Send encouragement message
    console.log("Send encouragement to", menteeUid);
  };

  const handleMessage = () => {
    // TODO: Open DM
    console.log("Open DM with", menteeUid);
  };

  const buttonContent = (
    <View style={styles.buttonContent}>
      <MenteeCardContent
        menteeUid={menteeUid}
        recoveryStreak={recoveryStreak}
        checkInStreak={checkInStreak}
        lastCheckIn={lastCheckIn}
        showExpandIcon={true}
        onRemind={handleRemind}
        onMessage={handleMessage}
      />
    </View>
  );

  const modalContent = (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.modalHeader}>
        <ThemedText style={{ fontSize: 48, lineHeight: 48, marginBottom: 12 }}>
          👤
        </ThemedText>
        <ThemedText
          type="titleLarge"
          style={{ textAlign: "center", marginBottom: 4 }}
        >
          user-{menteeUid.slice(0, 5)}
        </ThemedText>
        <ThemedText
          type="subtitleMedium"
          lightColor={colors.textSecondary}
          darkColor={colors.textSecondary}
          style={{ textAlign: "center", opacity: 0.8 }}
        >
          Your Mentee
        </ThemedText>
      </View>

      {/* Their Streaks */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.modalCardBackground,
            borderColor: colors.modalCardBorder,
          },
        ]}
      >
        <ThemedText
          type="subtitleMedium"
          style={{ marginBottom: 16, color: colors.text }}
        >
          Their Progress
        </ThemedText>
        <View style={styles.streaksRow}>
          <View style={styles.streakItem}>
            <ThemedText style={{ fontSize: 32, marginBottom: 4 }}>
              🔥
            </ThemedText>
            <ThemedText type="title" style={{ color: colors.text }}>
              {recoveryStreak} days
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              Recovery
            </ThemedText>
          </View>
          <View style={styles.streakItem}>
            <ThemedText style={{ fontSize: 32, marginBottom: 4 }}>
              🤝
            </ThemedText>
            <ThemedText type="title" style={{ color: colors.text }}>
              {checkInStreak} days
            </ThemedText>
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              Check-ins
            </ThemedText>
          </View>
        </View>
        <View style={styles.successRate}>
          <ThemedText
            type="caption"
            style={{ color: colors.textSecondary, marginTop: 16 }}
          >
            Success Rate: 85% (last 30 days)
          </ThemedText>
        </View>
      </View>

      {/* Last Check-In */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.modalCardBackground,
            borderColor: colors.modalCardBorder,
          },
        ]}
      >
        <ThemedText
          type="subtitleMedium"
          style={{ marginBottom: 12, color: colors.text }}
        >
          Last Check-In
        </ThemedText>
        <View style={styles.checkInInfo}>
          <ThemedText style={{ fontSize: 32, marginBottom: 8 }}>✅</ThemedText>
          <ThemedText type="bodyMedium" style={{ color: colors.text }}>
            Stayed clean - 3 hours ago
          </ThemedText>
          <ThemedText
            type="caption"
            style={{ color: colors.textSecondary, marginTop: 4 }}
          >
            "Feeling strong today, thanks for your support!"
          </ThemedText>
        </View>
      </View>

      {/* Recent Check-Ins */}
      <View
        style={[
          styles.section,
          {
            backgroundColor: colors.modalCardBackground,
            borderColor: colors.modalCardBorder,
          },
        ]}
      >
        <ThemedText
          type="subtitleMedium"
          style={{ marginBottom: 16, color: colors.text }}
        >
          Recent Check-Ins (Last 7 Days)
        </ThemedText>
        <View style={styles.checkInHistory}>
          {["✅", "✅", "✅", "⚠️", "✅", "✅", "✅"].map((status, i) => (
            <View
              key={i}
              style={[
                styles.historyDot,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <ThemedText style={{ fontSize: 20 }}>{status}</ThemedText>
            </View>
          ))}
        </View>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => {
            close();
            router.push({
              pathname: "/accountability-dashboard",
              params: {
                relationshipId,
                role: "mentee",
              },
            });
          }}
        >
          <ThemedText
            type="captionMedium"
            style={{ color: colors.textSecondary }}
          >
            View full history
          </ThemedText>
          <IconSymbol
            name="chevron.right"
            size={16}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.buttonBackground,
            },
          ]}
          onPress={handleEncourage}
        >
          <IconSymbol
            name="hand.thumbsup"
            size={20}
            color={colors.white}
            style={{ marginRight: 8 }}
          />
          <ThemedText type="bodyMedium" style={{ color: colors.white }}>
            Send Encouragement
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
          onPress={handleRemind}
        >
          <IconSymbol
            name="bell"
            size={20}
            color={colors.text}
            style={{ marginRight: 8 }}
          />
          <ThemedText type="bodyMedium" style={{ color: colors.text }}>
            Send Check-In Reminder
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
              borderWidth: 1,
            },
          ]}
          onPress={handleMessage}
        >
          <IconSymbol
            name="message"
            size={20}
            color={colors.text}
            style={{ marginRight: 8 }}
          />
          <ThemedText type="bodyMedium" style={{ color: colors.text }}>
            Message Them
          </ThemedText>
        </TouchableOpacity>
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
      buttonContent={buttonContent}
    >
      {modalContent}
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  buttonContent: {
    alignItems: "stretch",
  },
  modalHeader: {
    alignItems: "center",
    marginTop: 60,
    marginBottom: 32,
  },
  section: {
    borderWidth: 1,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  streaksRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  streakItem: {
    alignItems: "center",
  },
  successRate: {
    alignItems: "center",
  },
  checkInInfo: {
    alignItems: "center",
  },
  checkInHistory: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  historyDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
  },
});
