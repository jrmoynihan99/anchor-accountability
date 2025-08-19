// components/messages/OpenToChatToggle.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import React from "react";
import { StyleSheet, Switch, View } from "react-native";

interface OpenToChatToggleProps {
  isOpen: boolean;
  onToggle: (value: boolean) => void;
  user?: string; // Optional username prop
}

export function OpenToChatToggle({
  isOpen,
  onToggle,
  user,
}: OpenToChatToggleProps) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${colors.iconCircleBackground}50` },
          ]}
        >
          <IconSymbol name="message.badge" size={16} color={colors.icon} />
        </View>
        <View style={styles.textContainer}>
          <ThemedText type="subtitleMedium" style={{ color: colors.text }}>
            Open to Chat?
          </ThemedText>
          <View style={styles.subtitleContainer}>
            {user ? (
              <ThemedText
                type="caption"
                style={{ color: colors.textSecondary }}
              >
                Give{" "}
                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary, fontWeight: "bold" }}
                >
                  {user}
                </ThemedText>{" "}
                permission to start an anonymous chat with you for additional
                support
              </ThemedText>
            ) : (
              <ThemedText
                type="caption"
                style={{ color: colors.textSecondary }}
              >
                Give permission for the recipient to start an anonymous chat
                with you for additional support
              </ThemedText>
            )}
          </View>
        </View>
        <Switch
          value={isOpen}
          onValueChange={onToggle}
          trackColor={{
            false: colors.textSecondary + "40", // 25% opacity
            true: colors.tint + "80", // 50% opacity
          }}
          thumbColor={isOpen ? colors.tint : colors.textSecondary}
          ios_backgroundColor={colors.textSecondary + "40"}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout and structural styles only - NO text styling
  container: {
    marginTop: 16,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    marginRight: 12,
  },
  subtitleContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 2,
  },
});
