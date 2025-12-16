import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { StyleSheet, TouchableOpacity, View } from "react-native";

export function CommunityCard() {
  const { colors } = useTheme();

  const handleViewCommunity = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/community");
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
    >
      <View style={{ position: "relative" }}>
        {/* Header */}
        <View style={styles.header}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.iconCircleBackground },
            ]}
          >
            <IconSymbol
              name="person.3.fill"
              size={32}
              color={colors.buttonBackground}
            />
          </View>
          <View style={styles.titleContainer}>
            <ThemedText
              type="title"
              style={[styles.title, { color: colors.text }]}
            >
              Community Posts
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
              View and create community posts
            </ThemedText>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.buttonBackground }]}
          onPress={handleViewCommunity}
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
            View Community
          </ThemedText>
          <ThemedText
            type="button"
            style={[styles.arrow, { color: colors.white }]}
          >
            →
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    borderRadius: 20,
    marginTop: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    lineHeight: 24,
  },
  subtitle: {
    // Typography handled by ThemedText
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
    // Typography handled by ThemedText
  },
  arrow: {
    // Typography handled by ThemedText
  },
});
