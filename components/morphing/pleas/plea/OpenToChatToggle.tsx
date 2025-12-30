// components/messages/OpenToChatToggle.tsx
import { ThemedText } from "@/components/ThemedText";
import { ThemedToggle } from "@/components/ThemedToggle";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import React from "react";
import { StyleSheet, View } from "react-native";

interface OpenToChatToggleProps {
  isOpen: boolean;
  onToggle: (value: boolean) => void;
  user?: string; // Optional username prop
  context?: "encouragement" | "post"; // Context for different messaging
}

export function OpenToChatToggle({
  isOpen,
  onToggle,
  user,
  context = "encouragement",
}: OpenToChatToggleProps) {
  const { colors } = useTheme();

  const getSubtitleText = () => {
    if (context === "post") {
      return "Allow users who view this post to private message you";
    }
    // Default encouragement context
    return "Allow the recipient to start a chat with you for additional support";
  };

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
            <ThemedText type="caption" style={{ color: colors.textSecondary }}>
              {getSubtitleText()}
            </ThemedText>
          </View>
        </View>
        <View
          style={{ justifyContent: "center", alignItems: "center", height: 40 }}
        >
          <ThemedToggle value={isOpen} onValueChange={onToggle} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Layout and structural styles only - NO text styling
  container: {
    marginTop: 8,
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
