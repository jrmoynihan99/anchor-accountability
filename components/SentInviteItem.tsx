// components/messages/SentInviteItem.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface SentInviteItemProps {
  userName: string;
  userId: string;
  threadId: string;
  inviteId: string;
  colors: any;
}

export function SentInviteItem({
  userName,
  userId,
  threadId,
  inviteId,
  colors,
}: SentInviteItemProps) {
  const handleViewInvite = () => {
    router.push({
      pathname: "/message-thread",
      params: {
        threadId,
        threadName: userName,
        otherUserId: userId,
        isNewThread: "false",
        openInviteModal: "true", // ✅ Add this flag
      },
    });
  };

  return (
    <View
      style={[
        styles.inviteItem,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.textSecondary, // Muted color to show less urgency
        },
      ]}
    >
      <View style={styles.inviteContent}>
        {/* Left side: Clock icon + Info */}
        <View style={styles.leftContent}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: colors.iconCircleSecondaryBackground },
            ]}
          >
            <IconSymbol name="clock" size={18} color={colors.textSecondary} />
          </View>

          <View style={styles.textContent}>
            <ThemedText
              type="bodyMedium"
              style={[styles.userName, { color: colors.text }]}
            >
              {userName}
            </ThemedText>
            <ThemedText
              type="caption"
              style={[styles.inviteMessage, { color: colors.textSecondary }]}
            >
              waiting for response
            </ThemedText>
          </View>
        </View>

        {/* Right side: View button */}
        <TouchableOpacity
          style={[
            styles.viewButton,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.textSecondary,
            },
          ]}
          onPress={handleViewInvite}
          activeOpacity={0.8}
        >
          <ThemedText
            type="captionMedium"
            style={[styles.viewButtonText, { color: colors.textSecondary }]}
          >
            View
          </ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  inviteItem: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  inviteContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  textContent: {
    flex: 1,
  },
  userName: {
    marginBottom: 2,
  },
  inviteMessage: {
    fontSize: 13,
    lineHeight: 16,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  viewButtonText: {
    fontSize: 13,
  },
});
