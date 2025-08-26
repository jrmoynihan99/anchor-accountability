import { useTheme } from "@/hooks/ThemeContext"; // update path if needed
import { View, type ViewProps } from "react-native";

export type ThemedViewProps = ViewProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedView({
  style,
  lightColor,
  darkColor,
  ...otherProps
}: ThemedViewProps) {
  const { colors, effectiveTheme } = useTheme();
  // Allow override if provided, else use theme palette background color
  const backgroundColor =
    (effectiveTheme === "light" && lightColor) ||
    (effectiveTheme === "dark" && darkColor) ||
    colors.background;

  return <View style={[{ backgroundColor }, style]} {...otherProps} />;
}
