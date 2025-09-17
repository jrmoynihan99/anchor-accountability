import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import * as Haptics from "expo-haptics";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface GuidedPrayerContentProps {
  showButtons?: boolean;
  onBeginPrayer?: () => void;
}

export function GuidedPrayerContent({
  showButtons = true,
  onBeginPrayer,
}: GuidedPrayerContentProps) {
  const { colors } = useTheme();

  const handleBeginPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBeginPrayer?.();
  };

  const ExpandIcon = () => (
    <IconSymbol
      name="arrow.up.left.and.arrow.down.right"
      size={18}
      color={colors.textSecondary}
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
        <ThemedText
          type="button"
          style={[
            styles.buttonText,
            {
              color: colors.white,
              marginRight: 8,
            },
          ]}
        >
          Begin Prayer
        </ThemedText>
        <ThemedText
          type="button"
          style={[styles.arrow, { color: colors.white }]}
        >
          →
        </ThemedText>
      </TouchableOpacity>
    );
  };

  return (
    <View style={{ position: "relative" }}>
      <ExpandIcon />

      {/* Header */}
      <View style={styles.header}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.iconCircleBackground },
          ]}
        >
          <ThemedText style={[styles.iconText, { color: colors.fireColor }]}>
            🙏
          </ThemedText>
        </View>
        <View style={styles.titleContainer}>
          <ThemedText
            type="title"
            style={[styles.title, { color: colors.text }]}
          >
            Daily Guided Prayer
          </ThemedText>
          <ThemedText
            type="subtitle"
            style={[
              styles.subtitle,
              {
                color: colors.textSecondary,
                marginTop: 2,
                opacity: 0.8,
              },
            ]}
          >
            2-min Exercise
          </ThemedText>
        </View>
      </View>

      <ThemedText
        type="captionMedium"
        style={[
          styles.description,
          {
            color: colors.textSecondary,
            marginBottom: 18,
            opacity: 0.9,
          },
        ]}
      >
        Try this in times of temptation
      </ThemedText>

      <View pointerEvents="none">
        <BeginButton />
      </View>
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
    // Typography styles moved to Typography.styles.title
    lineHeight: 24,
  },
  subtitle: {
    // Typography styles moved to Typography.styles.subtitle + inline styles
  },
  description: {
    // Typography styles moved to Typography.styles.captionMedium + inline styles
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
    // Typography styles moved to Typography.styles.button + inline styles
  },
  arrow: {
    // Typography styles moved to Typography.styles.button
  },
  expandIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    opacity: 0.85,
  },
});
