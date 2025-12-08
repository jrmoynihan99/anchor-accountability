// components/morphing/accountability/recent-check-ins/CompactTimeline.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { getStatusColor, getStatusIcon } from "../accountabilityUtils";

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

interface CompactTimelineProps {
  checkIns: TimelineItem[];
  selectedDate: string | null;
  onSelectItem: (item: TimelineItem) => void;
}

export function CompactTimeline({
  checkIns,
  selectedDate,
  onSelectItem,
}: CompactTimelineProps) {
  const { colors } = useTheme();

  const isMissing = (item: TimelineItem): item is MissingCheckIn => {
    return "isMissing" in item && item.isMissing === true;
  };

  return (
    <View style={styles.historyRow}>
      {checkIns.map((item, i) => {
        const missing = isMissing(item);
        const isSelected = selectedDate === item.date;

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
            onPress={() => onSelectItem(item)}
          >
            {missing ? (
              <IconSymbol name="xmark" size={18} color={colors.textSecondary} />
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
  );
}

const styles = StyleSheet.create({
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
});
