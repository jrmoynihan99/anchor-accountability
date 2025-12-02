import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useAccountabilityRelationships } from "@/hooks/useAccountabilityRelationships";
import { StyleSheet, View } from "react-native";

interface AccountabilityMessagesContentProps {
  showExpandIcon?: boolean;
}

export function AccountabilityMessagesContent({
  showExpandIcon = true,
}: AccountabilityMessagesContentProps) {
  const { colors } = useTheme();
  const { mentor, mentees, loading } = useAccountabilityRelationships();

  if (loading) {
    return (
      <View>
        <ThemedText type="subtitle" style={{ color: colors.textSecondary }}>
          Loading accountability partners...
        </ThemedText>
      </View>
    );
  }

  const totalPartners = (mentor ? 1 : 0) + mentees.length;

  const ExpandIcon = () => {
    if (!showExpandIcon) return null;
    return (
      <IconSymbol
        name="arrow.up.left.and.arrow.down.right"
        size={18}
        color={colors.textSecondary}
        style={styles.expandIcon}
      />
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
            🤝
          </ThemedText>
        </View>
        <View style={styles.titleContainer}>
          <ThemedText
            type="title"
            style={[styles.title, { color: colors.text }]}
          >
            Accountability Partners
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
            {totalPartners} {totalPartners === 1 ? "partner" : "partners"}
          </ThemedText>
        </View>
      </View>

      <ThemedText
        type="captionMedium"
        style={[
          styles.description,
          {
            color: colors.textSecondary,
            opacity: 0.9,
          },
        ]}
      >
        Track streaks and support each other
      </ThemedText>
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
    lineHeight: 24,
  },
  subtitle: {},
  description: {},
  expandIcon: {
    position: "absolute",
    top: 6,
    right: 6,
    opacity: 0.85,
  },
});
