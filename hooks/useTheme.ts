// hooks/useTheme.ts
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export type ThemeMode = "system" | "light" | "dark";
export type ColorPalette = "palette1" | "palette2" | "palette3";

interface ThemePreferences {
  themeMode: ThemeMode;
  colorPalette: ColorPalette;
}

const THEME_STORAGE_KEY = "@theme_preferences";

const defaultPreferences: ThemePreferences = {
  themeMode: "system",
  colorPalette: "palette1",
};

export function useTheme() {
  const systemScheme = useColorScheme();
  const [preferences, setPreferences] =
    useState<ThemePreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  // Calculate the effective theme based on user preference
  const effectiveTheme =
    preferences.themeMode === "system"
      ? systemScheme ?? "light"
      : preferences.themeMode;

  // Get the current colors based on palette and effective theme with fallback
  const colors =
    Colors[preferences.colorPalette]?.[effectiveTheme] || Colors.palette1.light;

  // Load preferences from storage on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const stored = await AsyncStorage.getItem(THEME_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ThemePreferences;
        setPreferences(parsed);
      }
    } catch (error) {
      console.error("Error loading theme preferences:", error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async (newPreferences: ThemePreferences) => {
    try {
      await AsyncStorage.setItem(
        THEME_STORAGE_KEY,
        JSON.stringify(newPreferences)
      );
      setPreferences(newPreferences);
    } catch (error) {
      console.error("Error saving theme preferences:", error);
    }
  };

  const setThemeMode = async (mode: ThemeMode) => {
    const newPreferences = { ...preferences, themeMode: mode };
    await savePreferences(newPreferences);
  };

  const setColorPalette = async (palette: ColorPalette) => {
    const newPreferences = { ...preferences, colorPalette: palette };
    await savePreferences(newPreferences);
  };

  const getThemeDisplayText = () => {
    switch (preferences.themeMode) {
      case "system":
        return `System (${effectiveTheme === "dark" ? "Dark" : "Light"})`;
      case "light":
        return "Light";
      case "dark":
        return "Dark";
      default:
        return "System";
    }
  };

  const getPaletteDisplayText = () => {
    switch (preferences.colorPalette) {
      case "palette1":
        return "Warm & Earthy";
      case "palette2":
        return "Cool & Oceanic";
      case "palette3":
        return "Elegant & Purple";
      default:
        return "Warm & Earthy";
    }
  };

  return {
    // Current state
    colors,
    effectiveTheme,
    themeMode: preferences.themeMode,
    colorPalette: preferences.colorPalette,
    loading,

    // Actions
    setThemeMode,
    setColorPalette,

    // Helpers
    getThemeDisplayText,
    getPaletteDisplayText,

    // For backwards compatibility with your existing useColorScheme usage
    colorScheme: effectiveTheme,
  };
}
