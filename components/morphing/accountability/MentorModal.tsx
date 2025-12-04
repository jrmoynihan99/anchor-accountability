import { MessageInput } from "@/components/MessageInput";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UserStreakDisplay } from "@/components/UserStreakDisplay";
import { useTheme } from "@/hooks/ThemeContext";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../BaseModal";
import { MentorCardContent } from "./MentorCardContent";

interface MentorModalProps {
  mentorUid: string;
  streak: number;
  lastCheckIn: string | null;
  relationshipId: string;
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
}

type CheckInStatus = "great" | "struggling" | "support" | null;

export function MentorModal({
  mentorUid,
  streak,
  lastCheckIn,
  relationshipId,
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: MentorModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState<CheckInStatus>(null);
  const [checkInNote, setCheckInNote] = useState("");

  const anonymousUsername = `user-${mentorUid.slice(0, 5)}`;

  // Check if user has already checked in today
  const hasCheckedInToday = lastCheckIn ? isToday(lastCheckIn) : false;

  const buttonContent = (
    <View style={styles.buttonContent}>
      <MentorCardContent
        mentorUid={mentorUid}
        streak={streak}
        lastCheckIn={lastCheckIn}
        showExpandIcon={true}
      />
    </View>
  );

  const modalContent = (
    <View style={styles.screenContainer}>
      <View style={[styles.screenWrapper, styles.screenBackground]}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: 42, paddingBottom: 40 }}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          {/* ----------- TOP USER HEADER TILE ----------- */}
          <View
            style={[
              styles.tile,
              {
                backgroundColor: colors.modalCardBackground,
                borderColor: colors.modalCardBorder,
              },
            ]}
          >
            {/* The inline header row */}
            <View style={styles.headerRow}>
              <View
                style={[
                  styles.avatarCircle,
                  { backgroundColor: colors.iconCircleSecondaryBackground },
                ]}
              >
                <ThemedText
                  type="subtitleSemibold"
                  style={{ color: colors.icon }}
                >
                  {anonymousUsername[5]?.toUpperCase()}
                </ThemedText>
              </View>

              <View style={styles.headerUserInfo}>
                <ThemedText
                  type="subtitleSemibold"
                  style={{ color: colors.text, marginRight: 8 }}
                >
                  {anonymousUsername}
                </ThemedText>

                <UserStreakDisplay userId={mentorUid} size="small" />
              </View>
            </View>

            {/* Quick Actions */}
            <View style={{ flexDirection: "row", gap: 12, marginTop: 16 }}>
              <TouchableOpacity
                style={[
                  styles.quickButton,
                  {
                    backgroundColor: `${colors.buttonBackground}30`,
                    borderWidth: 1,
                    borderColor: colors.buttonBackground,
                  },
                ]}
                onPress={() => {
                  console.log("Open DM with mentor");
                }}
              >
                <IconSymbol
                  name="message.fill"
                  size={18}
                  color={colors.buttonBackground}
                />
                <ThemedText
                  type="button"
                  style={{ color: colors.buttonBackground }}
                >
                  Message
                </ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {/* ----------- CHECK-IN TILE ----------- */}
          <View
            style={[
              styles.tile,
              {
                backgroundColor: colors.modalCardBackground,
                borderColor: colors.modalCardBorder,
              },
            ]}
          >
            {/* Section Header with Icon */}
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconCircle,
                  { backgroundColor: `${colors.iconCircleBackground}50` },
                ]}
              >
                <IconSymbol
                  name="checkmark.circle"
                  size={16}
                  color={colors.icon}
                />
              </View>
              <View style={styles.sectionHeaderText}>
                <ThemedText
                  type="subtitleSemibold"
                  style={{ color: colors.text }}
                >
                  Daily Check-In
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary }}
                >
                  {hasCheckedInToday
                    ? "You've checked in today"
                    : "How are you doing today?"}
                </ThemedText>
              </View>
            </View>

            {hasCheckedInToday ? (
              /* Already Checked In State */
              <View style={styles.checkedInContainer}>
                <View
                  style={[
                    styles.checkedInBadge,
                    { backgroundColor: `${colors.success}20` },
                  ]}
                >
                  <IconSymbol
                    name="checkmark.circle.fill"
                    size={48}
                    color={colors.success}
                  />
                </View>
                <ThemedText
                  type="subtitleMedium"
                  style={{ color: colors.text, textAlign: "center" }}
                >
                  Check-in complete!
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={{
                    color: colors.textSecondary,
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  Come back tomorrow for your next check-in
                </ThemedText>
              </View>
            ) : (
              <>
                {/* Status Options */}
                <View style={{ marginTop: 16 }}>
                  {renderCheckOption(
                    "great",
                    "Doing Great!",
                    "checkmark.circle.fill",
                    selectedStatus,
                    setSelectedStatus,
                    colors
                  )}
                  {renderCheckOption(
                    "struggling",
                    "Struggling",
                    "exclamationmark.triangle.fill",
                    selectedStatus,
                    setSelectedStatus,
                    colors
                  )}
                  {renderCheckOption(
                    "support",
                    "Need Support",
                    "xmark.circle.fill",
                    selectedStatus,
                    setSelectedStatus,
                    colors
                  )}
                </View>

                {/* Optional Note Input */}
                {selectedStatus && (
                  <View style={{ marginTop: 16 }}>
                    <MessageInput
                      value={checkInNote}
                      onChangeText={setCheckInNote}
                      placeholder="Add a note (optional)..."
                      maxLength={200}
                      minHeight={60}
                      showBorder={false}
                    />
                  </View>
                )}

                {selectedStatus && (
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      { backgroundColor: colors.buttonBackground },
                    ]}
                    onPress={() => {
                      console.log(
                        "Submit check-in",
                        selectedStatus,
                        checkInNote
                      );
                      close();
                    }}
                  >
                    <ThemedText type="button" style={{ color: colors.white }}>
                      Submit Check-In
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>

          {/* ----------- CHECK-IN HISTORY TILE ----------- */}
          <View
            style={[
              styles.tile,
              {
                backgroundColor: colors.modalCardBackground,
                borderColor: colors.modalCardBorder,
              },
            ]}
          >
            {/* Section Header with Icon */}
            <View style={styles.sectionHeader}>
              <View
                style={[
                  styles.sectionIconCircle,
                  { backgroundColor: `${colors.iconCircleBackground}50` },
                ]}
              >
                <IconSymbol name="chart.bar" size={16} color={colors.icon} />
              </View>
              <ThemedText
                type="subtitleSemibold"
                style={{ color: colors.text }}
              >
                Recent Check-Ins
              </ThemedText>
            </View>

            <View style={styles.historyRow}>
              {[
                "great",
                "great",
                "struggling",
                "great",
                "support",
                "great",
                "struggling",
              ].map((status, i) => (
                <View
                  key={i}
                  style={[
                    styles.historyDot,
                    { backgroundColor: colors.cardBackground },
                  ]}
                >
                  <IconSymbol
                    name={
                      status === "great"
                        ? "checkmark.circle.fill"
                        : status === "struggling"
                        ? "exclamationmark.triangle.fill"
                        : "xmark.circle.fill"
                    }
                    size={18}
                    color={
                      status === "great"
                        ? colors.success
                        : status === "struggling"
                        ? colors.textSecondary
                        : colors.error
                    }
                  />
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
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

/* ---------- Helper Functions ---------- */

function isToday(dateInput: Date | string): boolean {
  const today = new Date();
  let checkDate: Date;

  // If it's a string in YYYY-MM-DD format, parse it carefully
  if (typeof dateInput === "string") {
    const [year, month, day] = dateInput.split("-").map(Number);
    checkDate = new Date(year, month - 1, day); // month is 0-indexed
  } else {
    checkDate = dateInput;
  }

  return (
    checkDate.getDate() === today.getDate() &&
    checkDate.getMonth() === today.getMonth() &&
    checkDate.getFullYear() === today.getFullYear()
  );
}

/* ---------- Helper for Check-In Options ---------- */

function renderCheckOption(
  value: CheckInStatus,
  label: string,
  icon: string,
  selectedStatus: CheckInStatus,
  setSelectedStatus: (v: CheckInStatus) => void,
  colors: any
) {
  const isSelected = selectedStatus === value;

  return (
    <TouchableOpacity
      style={[
        styles.statusOption,
        {
          backgroundColor: isSelected
            ? colors.buttonBackground
            : colors.cardBackground,
          borderColor: colors.border,
        },
      ]}
      onPress={() => setSelectedStatus(value)}
    >
      <IconSymbol
        name={icon}
        size={22}
        color={isSelected ? colors.white : colors.text}
        style={{ marginRight: 12 }}
      />
      <ThemedText
        type="bodyMedium"
        style={{
          color: isSelected ? colors.white : colors.text,
        }}
      >
        {label}
      </ThemedText>
    </TouchableOpacity>
  );
}

/* ---------- Styles ---------- */

const styles = StyleSheet.create({
  buttonContent: {
    padding: 0,
  },
  screenContainer: {
    flex: 1,
    position: "relative",
  },
  screenWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  screenBackground: {
    backgroundColor: "transparent",
    borderRadius: 28,
    overflow: "hidden",
  },
  tile: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerUserInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  sectionIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sectionHeaderText: {
    flex: 1,
  },
  quickButton: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  submitButton: {
    marginTop: 16,
    padding: 14,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkedInContainer: {
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  checkedInBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  historyRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 12,
    marginBottom: 16,
  },
  historyDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  viewAllButton: {
    flexDirection: "row",
    gap: 6,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 8,
  },
});
