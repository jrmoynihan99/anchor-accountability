import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { Typography } from "@/constants/Typography";

interface ContextCardProps {
  plea?: string | null;
  encouragement?: string | null;
  colors: any;
  currentUserId?: string | null;
  pleaOwnerUid?: string | null;
  encouragementOwnerUid?: string | null;
  loading?: boolean;
}

function getPleaLabel(
  currentUserId?: string | null,
  pleaOwnerUid?: string | null
) {
  if (!pleaOwnerUid || !currentUserId) return "Plea for support";
  if (pleaOwnerUid === currentUserId) return "Your plea for support";
  return `user-${pleaOwnerUid.substring(0, 5)}'s plea for support`;
}
function getEncLabel(
  currentUserId?: string | null,
  encouragementOwnerUid?: string | null
) {
  if (!encouragementOwnerUid || !currentUserId) return "Encouragement";
  if (encouragementOwnerUid === currentUserId) return "Your encouragement";
  return `user-${encouragementOwnerUid.substring(0, 5)}'s encouragement`;
}

export const ContextCard: React.FC<ContextCardProps> = ({
  plea,
  encouragement,
  colors,
  currentUserId,
  pleaOwnerUid,
  encouragementOwnerUid,
  loading,
}) => {
  // Always render the card; show spinner if loading or loading is undefined
  if (loading === true || loading === undefined) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.cardBackground,
            borderColor: colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <View
            style={[
              styles.dot,
              { backgroundColor: colors.tint, opacity: 0.75 },
            ]}
          />
          <ThemedText
            type="captionMedium"
            style={[
              styles.header,
              { color: colors.text, ...Typography.styles.captionMedium },
            ]}
          >
            Conversation Context
          </ThemedText>
        </View>
        <View style={styles.spinnerRow}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
        </View>
      </View>
    );
  }

  // Only show content if loading === false
  if (!plea && !encouragement) return null;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
          shadowColor: colors.shadow,
        },
      ]}
    >
      <View style={styles.headerRow}>
        <View
          style={[styles.dot, { backgroundColor: colors.tint, opacity: 0.75 }]}
        />
        <ThemedText
          type="captionMedium"
          style={[
            styles.header,
            { color: colors.text, ...Typography.styles.captionMedium },
          ]}
        >
          Conversation Context
        </ThemedText>
      </View>

      {/* Plea section */}
      <View style={styles.section}>
        <ThemedText
          type="caption"
          style={[
            styles.sectionLabel,
            { color: colors.textSecondary, ...Typography.styles.caption },
          ]}
        >
          {getPleaLabel(currentUserId, pleaOwnerUid)}
        </ThemedText>
        {plea && plea.trim().length > 0 ? (
          <ThemedText
            type="body"
            style={[
              styles.sectionText,
              { color: colors.text, ...Typography.styles.body },
            ]}
          >
            {plea}
          </ThemedText>
        ) : (
          <ThemedText
            type="body"
            style={[
              styles.sectionText,
              {
                color: colors.textSecondary,
                fontStyle: "italic",
                ...Typography.styles.body,
              },
            ]}
          >
            No additional context provided.
          </ThemedText>
        )}
      </View>

      {/* Encouragement section */}
      {encouragement && encouragement.trim().length > 0 && (
        <View style={styles.section}>
          <ThemedText
            type="caption"
            style={[
              styles.sectionLabel,
              { color: colors.textSecondary, ...Typography.styles.caption },
            ]}
          >
            {getEncLabel(currentUserId, encouragementOwnerUid)}
          </ThemedText>
          <ThemedText
            type="body"
            style={[
              styles.sectionText,
              { color: colors.text, ...Typography.styles.body },
            ]}
          >
            {encouragement}
          </ThemedText>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  header: {
    letterSpacing: 0.1,
  },
  section: {
    marginTop: 10,
    marginBottom: 0,
  },
  sectionLabel: {
    marginBottom: 2,
    opacity: 0.75,
  },
  sectionText: {
    marginBottom: 0,
  },
  spinnerRow: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 22,
  },
});
