// components/ui/ThemedToggle.tsx
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { Switch, SwitchProps } from "react-native";

interface ThemedToggleProps
  extends Omit<SwitchProps, "trackColor" | "thumbColor"> {
  value: boolean;
  onValueChange: (value: boolean) => void;
}

export function ThemedToggle({
  value,
  onValueChange,
  ...props
}: ThemedToggleProps) {
  const { colors } = useTheme();

  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      trackColor={{
        false: colors.tabIconDefault + "40",
        true: colors.tint,
      }}
      thumbColor={colors.background}
      {...props}
    />
  );
}
