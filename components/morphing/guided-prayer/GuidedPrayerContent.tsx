import { IconSymbol } from "@/components/ui/IconSymbol";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import * as Haptics from "expo-haptics";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface GuidedPrayerContentProps {
  showButtons?: boolean;
  onBeginPrayer?: () => void;
}

export function GuidedPrayerContent({
  showButtons = true,
  onBeginPrayer,
}: GuidedPrayerContentProps) {
  const theme = useColorScheme();
  const colors = Colors[theme ?? "dark"];
  const mainTextColor = "#3A2D28";
  const prayerBg = "#FFF3E0";
  const prayerColor = "#8B6914";

  const handleBeginPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBeginPrayer?.();
  };

  const ExpandIcon = () => (
    <IconSymbol
      name="arrow.up.left.and.arrow.down.right"
      size={18}
      color="#8D7963"
      style={styles.expandIcon}
    />
  );

  const BeginButton = () => {
    if (!showButtons) return null;

    return (
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.buttonBackground }]}
        onPress={handleBeginPress}
        activeOpacity={0.85}
      >
        <Text style={[styles.buttonText, { color: "#fff" }]}>Begin Prayer</Text>
        <Text style={[styles.arrow, { color: "#fff" }]}>→</Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ position: "relative" }}>
      <ExpandIcon />

      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconCircle, { backgroundColor: prayerBg }]}>
          <Text style={[styles.iconText, { color: prayerColor }]}>🙏</Text>
        </View>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: mainTextColor }]}>
            Daily Guided Prayer
          </Text>
          <Text style={[styles.subtitle, { color: "#8D7963" }]}>
            2-min Exercise
          </Text>
        </View>
      </View>

      <Text style={[styles.description, { color: colors.icon }]}>
        Try this in times of temptation
      </Text>

      <BeginButton />
    </View>
  );
}

const styles = StyleSheet.create({
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
    fontWeight: "600",
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
  expandIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    opacity: 0.85,
  },
});
