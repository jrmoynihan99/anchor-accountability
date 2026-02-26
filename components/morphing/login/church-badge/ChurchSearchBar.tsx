// components/onboarding/church-selection/ChurchSearchBar.tsx
import { useTheme } from "@/context/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TextInput, View } from "react-native";

interface ChurchSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
}

export function ChurchSearchBar({ value, onChangeText }: ChurchSearchBarProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[styles.searchBox, { backgroundColor: colors.inputBackground }]}
      >
        <Ionicons name="search" size={20} color={colors.textSecondary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search for your community"
          placeholderTextColor={colors.textSecondary}
          value={value}
          onChangeText={onChangeText}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    letterSpacing: 0,
  },
});
