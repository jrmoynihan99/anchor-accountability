import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { StyleSheet, View } from "react-native";

export function EmptyMentorCard() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: colors.border,
        },
      ]}
    >
      <ThemedText
        type="caption"
        style={[
          styles.message,
          {
            color: colors.textSecondary,
          },
        ]}
      >
        Invite somebody to be your accountability partner via private chat
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    minHeight: 120,
    alignItems: "center",
    justifyContent: "center",
  },
  message: {
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 22,
  },
});
