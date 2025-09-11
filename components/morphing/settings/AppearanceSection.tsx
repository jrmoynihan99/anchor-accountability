import { ThemedText } from "@/components/ThemedText";
import { ThemedToggle } from "@/components/ThemedToggle";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useStreakVisibility } from "@/hooks/useStreakVisibility";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

const themeOptions = [
  { label: "System Default", value: "system", icon: "laptop-outline" },
  { label: "Light", value: "light", icon: "sunny-outline" },
  { label: "Dark", value: "dark", icon: "moon-outline" },
];

const paletteOptions = [
  { label: "Warm & Earthy", value: "palette1" },
  { label: "Cool & Oceanic", value: "palette2" },
  { label: "Forest & Sage", value: "palette3" },
  { label: "Navy & Bronze", value: "palette4" },
];

// Hardcoded swatch for each palette
const paletteSwatches: Record<string, string> = {
  palette1: "#CBAD8D", // Warm & Earthy
  palette2: "#3498DB", // Cool & Oceanic
  palette3: "#7A9471", // Forest & Sage
  palette4: "#B45309", // Navy & Bronze
};

export function AppearanceSection() {
  const {
    colors,
    effectiveTheme,
    themeMode,
    colorPalette,
    setThemeMode,
    setColorPalette,
  } = useTheme();

  const {
    streakVisible,
    setStreakVisible,
    loading: streakLoading,
  } = useStreakVisibility();

  // Use textSecondary for all radio borders unless selected
  const getRadioBorderColor = (selected: boolean) =>
    selected ? colors.tint : colors.textSecondary;

  return (
    <View style={styles.sectionCard}>
      {/* Header */}
      <View style={styles.sectionHeader}>
        <IconSymbol name="paintbrush" size={20} color={colors.textSecondary} />
        <ThemedText type="bodyMedium" style={styles.sectionTitle}>
          Appearance
        </ThemedText>
      </View>

      {/* Theme */}
      <ThemedText type="bodyMedium" style={styles.settingTitle}>
        Theme
      </ThemedText>
      {themeOptions.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={styles.radioRow}
          activeOpacity={0.7}
          onPress={() => setThemeMode(opt.value)}
        >
          {/* Icon (left) */}
          <Ionicons
            name={opt.icon as any}
            size={20}
            color={colors.textSecondary}
            style={{ marginRight: 12, marginLeft: 1 }}
          />
          {/* Label */}
          <ThemedText
            type="body"
            style={{
              color:
                themeMode === opt.value ? colors.text : colors.textSecondary,
            }}
          >
            {opt.label}
          </ThemedText>
          <View style={{ flex: 1 }} />
          {/* Radio (right) */}
          <View
            style={[
              styles.radioOuter,
              {
                borderColor: getRadioBorderColor(themeMode === opt.value),
              },
            ]}
          >
            {themeMode === opt.value && (
              <View
                style={[styles.radioInner, { backgroundColor: colors.tint }]}
              />
            )}
          </View>
        </TouchableOpacity>
      ))}

      {/* Palette */}
      <ThemedText
        type="bodyMedium"
        style={[styles.settingTitle, { marginTop: 20 }]}
      >
        Color Palette
      </ThemedText>
      {paletteOptions.map((opt) => (
        <TouchableOpacity
          key={opt.value}
          style={styles.radioRow}
          activeOpacity={0.7}
          onPress={() => setColorPalette(opt.value)}
        >
          {/* Swatch (left) */}
          <View
            style={[
              styles.swatch,
              {
                backgroundColor: paletteSwatches[opt.value],
                borderColor:
                  colorPalette === opt.value
                    ? colors.tint
                    : colors.textSecondary,
              },
            ]}
          />
          {/* Label */}
          <ThemedText
            type="body"
            style={{
              color:
                colorPalette === opt.value ? colors.text : colors.textSecondary,
            }}
          >
            {opt.label}
          </ThemedText>
          <View style={{ flex: 1 }} />
          {/* Radio (right) */}
          <View
            style={[
              styles.radioOuter,
              {
                borderColor:
                  colorPalette === opt.value
                    ? colors.tint
                    : colors.textSecondary,
              },
            ]}
          >
            {colorPalette === opt.value && (
              <View
                style={[
                  styles.radioInner,
                  { backgroundColor: paletteSwatches[opt.value] },
                ]}
              />
            )}
          </View>
        </TouchableOpacity>
      ))}

      {/* Streak Visibility */}
      <ThemedText
        type="bodyMedium"
        style={[styles.settingTitle, { marginTop: 20 }]}
      >
        Privacy
      </ThemedText>

      <View style={styles.settingItem}>
        <View style={styles.settingContent}>
          <View style={styles.settingTextContainer}>
            <View style={styles.settingLabelWithIcon}>
              <Ionicons
                name="trophy-outline"
                size={16}
                color={colors.text}
                style={{ marginRight: 8 }}
              />
              <ThemedText type="body" style={styles.settingLabel}>
                Show my streak to others
              </ThemedText>
            </View>
            <ThemedText
              type="caption"
              lightColor={colors.textSecondary}
              darkColor={colors.textSecondary}
              style={styles.settingDescription}
            >
              Other users can see your streak badge
            </ThemedText>
          </View>
          <ThemedToggle
            value={streakVisible}
            onValueChange={(value) => !streakLoading && setStreakVisible(value)}
            disabled={streakLoading}
          />
        </View>
      </View>
    </View>
  );
}

const RADIO_SIZE = 26;
const RADIO_INNER_SIZE = 16;

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
  },
  settingTitle: {
    marginBottom: 8,
    marginTop: 10,
  },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    paddingVertical: 4,
  },
  radioOuter: {
    width: RADIO_SIZE,
    height: RADIO_SIZE,
    borderRadius: RADIO_SIZE / 2,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
    marginRight: 0,
  },
  radioInner: {
    width: RADIO_INNER_SIZE,
    height: RADIO_INNER_SIZE,
    borderRadius: RADIO_INNER_SIZE / 2,
  },
  swatch: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 12,
    marginLeft: 1,
    borderWidth: 1,
  },
  settingItem: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    marginBottom: 2,
  },
  settingDescription: {
    opacity: 0.8,
    lineHeight: 16,
  },
  settingLabelWithIcon: {
    flexDirection: "row",
    alignItems: "center",
  },
});
