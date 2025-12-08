import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React, { useEffect, useState } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import {
  formatDate,
  getStatusColor,
  getStatusIcon,
  getStatusLabel,
} from "./accountabilityUtils";

interface CheckInRecord {
  date: string;
  status: "great" | "struggling" | "support";
  note?: string;
}

interface MissingCheckIn {
  date: string;
  status: null;
  isMissing: true;
}

type TimelineItem = CheckInRecord | MissingCheckIn;

interface RecentCheckInsSectionProps {
  checkIns: TimelineItem[];
  onFillMissing?: (date: string) => void; // Optional callback for retroactive fill
  onSelectFilled?: () => void; // Optional callback when filled day is selected
}

export function RecentCheckInsSection({
  checkIns,
  onFillMissing,
  onSelectFilled,
}: RecentCheckInsSectionProps) {
  const { colors } = useTheme();
  const [selectedCheckIn, setSelectedCheckIn] = useState<TimelineItem | null>(
    null
  );

  // Sync selectedCheckIn with updated timeline data
  useEffect(() => {
    if (selectedCheckIn) {
      const updatedItem = checkIns.find(
        (item) => item.date === selectedCheckIn.date
      );
      if (updatedItem) {
        setSelectedCheckIn(updatedItem);
      }
    }
  }, [checkIns]);

  const isMissing = (item: TimelineItem): item is MissingCheckIn => {
    return "isMissing" in item && item.isMissing === true;
  };

  const handleItemClick = (item: TimelineItem) => {
    // Always update the selected item for visual feedback
    setSelectedCheckIn(item);

    // If it's a missing day and we have a callback, trigger it
    if (isMissing(item) && onFillMissing) {
      onFillMissing(item.date);
    } else if (!isMissing(item) && onSelectFilled) {
      // It's a filled day - trigger the filled callback
      onSelectFilled();
    }
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
          <IconSymbol name="chart.bar" size={16} color={colors.icon} />
        </View>
        <ThemedText type="subtitleSemibold" style={{ color: colors.text }}>
          Recent Check-Ins
        </ThemedText>
      </View>

      <View style={styles.historyRow}>
        {checkIns.map((item, i) => {
          const missing = isMissing(item);
          const isSelected = selectedCheckIn?.date === item.date;

          return (
            <TouchableOpacity
              key={i}
              style={[
                styles.historyDot,
                {
                  backgroundColor: missing
                    ? isSelected
                      ? `${colors.textSecondary}30`
                      : colors.cardBackground
                    : isSelected
                    ? `${getStatusColor(item.status, colors)}30`
                    : colors.cardBackground,
                  borderWidth: 2,
                  borderColor: missing
                    ? isSelected
                      ? colors.textSecondary
                      : colors.textSecondary
                    : isSelected
                    ? getStatusColor(item.status, colors)
                    : "transparent",
                  borderStyle: missing ? "dashed" : "solid",
                  opacity: missing && !isSelected ? 0.5 : 1,
                },
              ]}
              onPress={() => handleItemClick(item)}
            >
              {missing ? (
                <IconSymbol
                  name="xmark"
                  size={18}
                  color={colors.textSecondary}
                />
              ) : (
                <IconSymbol
                  name={getStatusIcon(item.status)}
                  size={18}
                  color={getStatusColor(item.status, colors)}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Selected Check-In Details */}
      {selectedCheckIn && !isMissing(selectedCheckIn) && (
        <View
          style={[
            styles.selectedCheckInDetails,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.detailsHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconSymbol
                name={getStatusIcon(selectedCheckIn.status)}
                size={20}
                color={getStatusColor(selectedCheckIn.status, colors)}
                style={{ marginRight: 8 }}
              />
              <ThemedText type="bodyMedium" style={{ color: colors.text }}>
                {getStatusLabel(selectedCheckIn.status)}
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => {
                setSelectedCheckIn(null);
                if (onSelectFilled) onSelectFilled();
              }}
            >
              <IconSymbol name="xmark" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ThemedText
            type="caption"
            style={{ color: colors.textSecondary, marginTop: 4 }}
          >
            {formatDate(selectedCheckIn.date)}
          </ThemedText>
          {selectedCheckIn.note && (
            <View style={styles.detailsNote}>
              <ThemedText
                type="caption"
                style={{ color: colors.textSecondary, marginBottom: 4 }}
              >
                Note:
              </ThemedText>
              <ThemedText type="body" style={{ color: colors.text }}>
                {selectedCheckIn.note}
              </ThemedText>
            </View>
          )}
        </View>
      )}

      {/* Missing Day Info */}
      {selectedCheckIn && isMissing(selectedCheckIn) && (
        <View
          style={[
            styles.selectedCheckInDetails,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <View style={styles.detailsHeader}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <IconSymbol
                name="exclamationmark.circle"
                size={20}
                color={colors.textSecondary}
                style={{ marginRight: 8 }}
              />
              <ThemedText type="bodyMedium" style={{ color: colors.text }}>
                No Check-In
              </ThemedText>
            </View>
            <TouchableOpacity
              onPress={() => {
                setSelectedCheckIn(null);
                if (onSelectFilled) onSelectFilled();
              }}
            >
              <IconSymbol name="xmark" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
          <ThemedText
            type="caption"
            style={{ color: colors.textSecondary, marginTop: 4 }}
          >
            {formatDate(selectedCheckIn.date)}
          </ThemedText>
          <View
            style={[
              styles.missingDayHint,
              { backgroundColor: `${colors.textSecondary}15` },
            ]}
          >
            <ThemedText
              type="caption"
              style={{
                color: colors.textSecondary,
                textAlign: "center",
              }}
            >
              {onFillMissing
                ? "Use the section above to add a check-in for this day"
                : "User did not check in on this day"}
            </ThemedText>
          </View>
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
  selectedCheckInDetails: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailsNote: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(128, 128, 128, 0.2)",
  },
  missingDayHint: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
});
