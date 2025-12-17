// components/messages/DeclinedInviteItem.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";

interface DeclinedInviteItemProps {
  userName: string;
  userId: string;
  threadId: string;
  inviteId: string;
  colors: any;
}

export function DeclinedInviteItem({
  userName,
  userId,
  threadId,
  inviteId,
  colors,
}: DeclinedInviteItemProps) {
  const handleViewInvite = () => {
    router.push({
      pathname: "/message-thread",
      params: {
        threadId,
        threadName: userName,
        otherUserId: userId,
        isNewThread: "false",
        openInviteModal: "true", // ✅ Opens modal to show declined view
      },
    });
  };

  return (
    <View
      style={[
        styles.inviteItem,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.error, // ✅ Red error border
        },
      ]}
    >
      <View style={styles.inviteContent}>
        {/* Left side: X icon + Info */}
        <View style={styles.leftContent}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: `${colors.textSecondary}15`, // Very subtle background
              },
            ]}
          >
            <IconSymbol
              name="xmark.circle.fill"
              size={20}
              color={colors.error}
            />
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
              declined your invite
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
    opacity: 0.8,
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
