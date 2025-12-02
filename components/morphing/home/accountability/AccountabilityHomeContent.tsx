import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useAccountabilityRelationships } from "@/hooks/useAccountabilityRelationships";
import { StyleSheet, View } from "react-native";

interface AccountabilityHomeContentProps {
  showExpandIcon?: boolean;
}

export function AccountabilityHomeContent({
  showExpandIcon = true,
}: AccountabilityHomeContentProps) {
  const { colors } = useTheme();
  const { mentor, mentees, loading } = useAccountabilityRelationships();

  if (loading) {
    return (
      <View>
        <ThemedText type="subtitle" style={{ color: colors.textSecondary }}>
          Loading...
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
            Accountability
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

      {/* Partner Preview */}
      <View style={styles.previewContainer}>
        {mentor && (
          <View style={styles.partnerPreview}>
            <View
              style={[
                styles.previewBadge,
                { backgroundColor: colors.modalCardBackground },
              ]}
            >
              <ThemedText type="caption" style={{ fontSize: 16 }}>
                👤
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: colors.textSecondary, marginLeft: 8 }}
              >
                Mentor
              </ThemedText>
            </View>
            <View style={styles.streakPreview}>
              <ThemedText type="caption" style={{ fontSize: 14 }}>
                🔥
              </ThemedText>
              <ThemedText
                type="captionMedium"
                style={{ color: colors.text, marginLeft: 4 }}
              >
                {mentor.streak} days
              </ThemedText>
            </View>
          </View>
        )}

        {mentees.length > 0 && (
          <View style={styles.partnerPreview}>
            <View
              style={[
                styles.previewBadge,
                { backgroundColor: colors.modalCardBackground },
              ]}
            >
              <ThemedText type="caption" style={{ fontSize: 16 }}>
                👥
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: colors.textSecondary, marginLeft: 8 }}
              >
                {mentees.length} Mentee{mentees.length > 1 ? "s" : ""}
              </ThemedText>
            </View>
          </View>
        )}
      </View>

      <ThemedText
        type="captionMedium"
        style={[
          styles.description,
          {
            color: colors.textSecondary,
            marginTop: 12,
            opacity: 0.9,
          },
        ]}
      >
        Tap to view details and message
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
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
  previewContainer: {
    gap: 12,
  },
  partnerPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  previewBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  streakPreview: {
    flexDirection: "row",
    alignItems: "center",
  },
});
