// components/morphing/accountability/recent-check-ins/MonthNavigation.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { formatMonthYear } from "./calendarUtils";

interface MonthNavigationProps {
  currentMonth: Date;
  onPrevious: () => void;
  onNext: () => void;
}

export function MonthNavigation({
  currentMonth,
  onPrevious,
  onNext,
}: MonthNavigationProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.monthHeader}>
      <TouchableOpacity onPress={onPrevious} style={styles.monthButton}>
        <IconSymbol name="chevron.left" size={20} color={colors.text} />
      </TouchableOpacity>
      <ThemedText type="subtitleSemibold" style={{ color: colors.text }}>
        {formatMonthYear(currentMonth)}
      </ThemedText>
      <TouchableOpacity onPress={onNext} style={styles.monthButton}>
        <IconSymbol name="chevron.right" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  monthHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },
  monthButton: {
    padding: 8,
  },
});
