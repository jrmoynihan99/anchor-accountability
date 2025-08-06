import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GuidedPrayerProps {
  onPress: () => void;
}

export function GuidedPrayer({ onPress }: GuidedPrayerProps) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          // Removed borderColor and borderWidth
          shadowColor: "#000", // Always use black for best shadow
        },
      ]}
    >
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: colors.tint }]}>
          <Text style={[styles.iconText, { color: colors.background }]}>
            🙏
          </Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>
            Guided Prayer
          </Text>
          <Text style={[styles.subtitle, { color: colors.icon }]}>
            5-minute reflection
          </Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.icon }]}>
        Start your day with a moment of guided prayer and reflection
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          {
            backgroundColor: colors.buttonBackground,
            // Removed borderColor and borderWidth
          },
        ]}
        onPress={onPress}
      >
        <Text style={[styles.buttonText, { color: "#fff" }]}>Begin Prayer</Text>
        <Text style={[styles.arrow, { color: "#fff" }]}>→</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 16,
    // --- Remove borderWidth ---
    // borderWidth: 1,
    // --- Add shadow to match VerseCard ---
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  iconText: {
    fontSize: 20,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
    opacity: 0.8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 18,
    opacity: 0.9,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 16,
    // borderWidth: 1, // Remove border from button too
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  arrow: {
    fontSize: 16,
    fontWeight: "600",
  },
});
