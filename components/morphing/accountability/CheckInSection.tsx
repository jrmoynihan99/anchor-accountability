import { MessageInput } from "@/components/MessageInput";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React, { useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { CheckInStatus, formatDate } from "./accountabilityUtils";

type CheckInStatusType = "great" | "struggling" | "support" | null;

interface CheckInSectionProps {
  checkInStatus: CheckInStatus;
  onSubmit: (status: CheckInStatusType, note: string) => void;
  selectedDate?: string | null; // YYYY-MM-DD format for retroactive fill
}

export function CheckInSection({
  checkInStatus,
  onSubmit,
  selectedDate = null,
}: CheckInSectionProps) {
  const { colors } = useTheme();
  const [selectedStatus, setSelectedStatus] = useState<CheckInStatusType>(null);
  const [checkInNote, setCheckInNote] = useState("");

  // If we're filling retroactively, show different messaging
  const isRetroactive = selectedDate !== null;
  const displayDate = isRetroactive ? formatDate(selectedDate) : null;

  const handleSubmit = () => {
    onSubmit(selectedStatus, checkInNote);
    // Reset form
    setSelectedStatus(null);
    setCheckInNote("");
  };

  return (
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
          <IconSymbol name="checkmark.circle" size={16} color={colors.icon} />
        </View>
        <View style={styles.sectionHeaderText}>
          <ThemedText type="subtitleSemibold" style={{ color: colors.text }}>
            {isRetroactive ? "Add Check-In" : "Daily Check-In"}
          </ThemedText>
          <ThemedText type="caption" style={{ color: colors.textSecondary }}>
            {isRetroactive
              ? `Add a check-in for ${displayDate}`
              : checkInStatus.hasCheckedInToday
              ? "You've checked in today"
              : "How are you doing today?"}
          </ThemedText>
        </View>
      </View>

      {checkInStatus.hasCheckedInToday && !isRetroactive ? (
        /* Already Checked In State (only for today) */
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
              onPress={handleSubmit}
            >
              <ThemedText type="button" style={{ color: colors.white }}>
                {isRetroactive ? "Add Check-In" : "Submit Check-In"}
              </ThemedText>
            </TouchableOpacity>
          )}
        </>
      )}
    </View>
  );
}

/* ---------- Helper for Check-In Options ---------- */

function renderCheckOption(
  value: CheckInStatusType,
  label: string,
  icon: string,
  selectedStatus: CheckInStatusType,
  setSelectedStatus: (v: CheckInStatusType) => void,
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

const styles = StyleSheet.create({
  tile: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    marginBottom: 16,
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
});
