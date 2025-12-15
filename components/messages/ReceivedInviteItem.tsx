// components/messages/ReceivedInviteItem.tsx
import { ThemedText } from "@/components/ThemedText";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface ReceivedInviteItemProps {
  userName: string;
  userId: string;
  threadId: string;
  inviteId: string;
  colors: any;
}

export function ReceivedInviteItem({
  userName,
  userId,
  threadId,
  inviteId,
  colors,
}: ReceivedInviteItemProps) {
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
          borderColor: colors.tint,
        },
      ]}
    >
      <View style={styles.inviteContent}>
        {/* Left side: Avatar + Info */}
        <View style={styles.leftContent}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colors.iconCircleSecondaryBackground },
            ]}
          >
            <ThemedText type="caption" style={{ color: colors.icon }}>
              {userName[0]?.toUpperCase() || "U"}
            </ThemedText>
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
              invited you to be their accountability partner
            </ThemedText>
          </View>
        </View>

        {/* Right side: View button */}
        <TouchableOpacity
          style={[styles.viewButton, { backgroundColor: colors.tint }]}
          onPress={handleViewInvite}
          activeOpacity={0.8}
        >
          <ThemedText
            type="captionMedium"
            style={[styles.viewButtonText, { color: colors.white }]}
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
  avatar: {
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
  },
  viewButtonText: {
    fontSize: 13,
  },
});
