import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/ThemeContext";
import { StyleSheet, View } from "react-native";

interface EmptyMenteeCardProps {
  position: number; // 1, 2, or 3
}

export function EmptyMenteeCard({ position }: EmptyMenteeCardProps) {
  const { colors } = useTheme();

  const getMessage = () => {
    return "You can be up to 3 people's accountability partner. Users who invite you via private chat will appear above";
  };

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
        {getMessage()}
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 8,
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
