import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React, { useMemo } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  formatCheckInTime,
  getStatusColor,
  getStatusIcon,
  getStatusLabel,
} from "./accountabilityUtils";

interface CheckInRecord {
  date: string;
  status: "great" | "struggling" | "support";
  note?: string;
}

interface LatestCheckInSectionProps {
  latestCheckIn?: CheckInRecord;
  onMessage: () => void;
  userTimezone?: string | null;
}

export function LatestCheckInSection({
  latestCheckIn,
  onMessage,
  userTimezone,
}: LatestCheckInSectionProps) {
  const { colors } = useTheme();

  // Calculate check-in status from the actual latest check-in (real-time!)
  const checkInStatus = useMemo(() => {
    if (!latestCheckIn) {
      return {
        hasCheckedInToday: false,
        isOverdue: false,
        overdueText: null,
      };
    }

    // Get today's date in the user's timezone
    let todayString: string;
    if (userTimezone) {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: userTimezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const parts = formatter.formatToParts(new Date());
      const year = parts.find((p) => p.type === "year")?.value;
      const month = parts.find((p) => p.type === "month")?.value;
      const day = parts.find((p) => p.type === "day")?.value;
      todayString = `${year}-${month}-${day}`;
    } else {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      todayString = `${year}-${month}-${day}`;
    }

    const isToday = latestCheckIn.date === todayString;

    if (isToday) {
      return {
        hasCheckedInToday: true,
        isOverdue: false,
        overdueText: null,
      };
    }

    // Calculate days overdue
    const lastDate = new Date(latestCheckIn.date);
    const today = new Date(todayString);
    const diffMs = today.getTime() - lastDate.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return {
      hasCheckedInToday: false,
      isOverdue: diffDays > 0,
      overdueText: diffDays === 1 ? "1d ago" : `${diffDays}d ago`,
    };
  }, [latestCheckIn, userTimezone]);

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
            Latest Check-In
          </ThemedText>
          <ThemedText
            type="caption"
            style={{
              color: checkInStatus.isOverdue
                ? colors.error
                : colors.textSecondary,
            }}
          >
            {checkInStatus.hasCheckedInToday
              ? "Checked in today"
              : checkInStatus.isOverdue && checkInStatus.overdueText
              ? `Overdue (${checkInStatus.overdueText})`
              : "Waiting for check-in"}
          </ThemedText>
        </View>
      </View>

      {checkInStatus.hasCheckedInToday && latestCheckIn ? (
        /* They've Checked In */
        <View style={styles.latestCheckInContainer}>
          <View style={styles.statusBadge}>
            <IconSymbol
              name={getStatusIcon(latestCheckIn.status)}
              size={32}
              color={getStatusColor(latestCheckIn.status, colors)}
            />
          </View>
          <ThemedText
            type="subtitleMedium"
            style={{
              color: colors.text,
              textAlign: "center",
              marginTop: 12,
            }}
          >
            {getStatusLabel(latestCheckIn.status)}
          </ThemedText>
          {latestCheckIn.note && (
            <View
              style={[
                styles.noteContainer,
                { backgroundColor: colors.cardBackground },
              ]}
            >
              <ThemedText
                type="body"
                style={{ color: colors.text, fontStyle: "italic" }}
              >
                "{latestCheckIn.note}"
              </ThemedText>
            </View>
          )}
          <ThemedText
            type="caption"
            style={{
              color: colors.textSecondary,
              textAlign: "center",
              marginTop: 8,
            }}
          >
            {formatCheckInTime(latestCheckIn.date)}
          </ThemedText>
        </View>
      ) : (
        /* Haven't Checked In Yet */
        <View style={styles.notCheckedInContainer}>
          <View
            style={[
              styles.notCheckedInBadge,
              {
                backgroundColor: checkInStatus.isOverdue
                  ? `${colors.error}20`
                  : `${colors.textSecondary}20`,
              },
            ]}
          >
            <IconSymbol
              name={
                checkInStatus.isOverdue
                  ? "exclamationmark.circle.fill"
                  : "clock.fill"
              }
              size={48}
              color={
                checkInStatus.isOverdue ? colors.error : colors.textSecondary
              }
            />
          </View>
          <ThemedText
            type="subtitleMedium"
            style={{ color: colors.text, textAlign: "center" }}
          >
            No check-in yet today
          </ThemedText>
          {checkInStatus.isOverdue && checkInStatus.overdueText && (
            <View
              style={[
                styles.overdueTag,
                { backgroundColor: `${colors.error}20` },
              ]}
            >
              <IconSymbol
                name="exclamationmark.triangle.fill"
                size={14}
                color={colors.error}
                style={{ marginRight: 4 }}
              />
              <ThemedText
                type="caption"
                style={{ color: colors.error, fontWeight: "600" }}
              >
                Overdue ({checkInStatus.overdueText})
              </ThemedText>
            </View>
          )}
          <TouchableOpacity
            style={[
              styles.messageButton,
              {
                backgroundColor: `${colors.buttonBackground}30`,
                borderWidth: 1,
                borderColor: colors.buttonBackground,
                marginTop: 16,
              },
            ]}
            onPress={onMessage}
            activeOpacity={0.85}
          >
            <IconSymbol
              name="message.fill"
              color={colors.buttonBackground}
              size={18}
              style={{ marginRight: 6 }}
            />
            <ThemedText
              type="button"
              style={{ color: colors.buttonBackground }}
            >
              Message Partner
            </ThemedText>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
  latestCheckInContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  statusBadge: {
    alignItems: "center",
    justifyContent: "center",
  },
  noteContainer: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
    width: "100%",
  },
  notCheckedInContainer: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    marginTop: 16,
  },
  notCheckedInBadge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  overdueTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  messageButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
});
