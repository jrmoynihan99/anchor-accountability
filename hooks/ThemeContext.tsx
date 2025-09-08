import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";

export type ThemeMode = "system" | "light" | "dark";
export type ColorPalette = "palette1" | "palette2" | "palette3" | "palette4";

interface ThemePreferences {
  themeMode: ThemeMode;
  colorPalette: ColorPalette;
}

const defaultPreferences: ThemePreferences = {
  themeMode: "system",
  colorPalette: "palette1",
};

const ThemeContext = createContext<any>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [preferences, setPreferences] =
    useState<ThemePreferences>(defaultPreferences);

  const effectiveTheme =
    preferences.themeMode === "system"
      ? systemScheme ?? "light"
      : preferences.themeMode;

  const colors =
    Colors[preferences.colorPalette]?.[effectiveTheme] || Colors.palette1.light;

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem("@theme_preferences");
        if (stored) setPreferences(JSON.parse(stored));
      } catch (error) {
        console.error("ThemeProvider error:", error);
      }
    })();
  }, []);

  const setThemeMode = async (mode: ThemeMode) => {
    const newPreferences = { ...preferences, themeMode: mode };
    setPreferences(newPreferences);
    await AsyncStorage.setItem(
      "@theme_preferences",
      JSON.stringify(newPreferences)
    );
  };

  const setColorPalette = async (palette: ColorPalette) => {
    const newPreferences = { ...preferences, colorPalette: palette };
    setPreferences(newPreferences);
    await AsyncStorage.setItem(
      "@theme_preferences",
      JSON.stringify(newPreferences)
    );
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
        return "Forest & Sage";
      case "palette4":
        return "Navy & Bronze";
      default:
        return "Warm & Earthy";
    }
  };

  return (
    <ThemeContext.Provider
      value={{
        colors,
        effectiveTheme,
        themeMode: preferences.themeMode,
        colorPalette: preferences.colorPalette,
        setThemeMode,
        setColorPalette,
        getThemeDisplayText,
        getPaletteDisplayText,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
