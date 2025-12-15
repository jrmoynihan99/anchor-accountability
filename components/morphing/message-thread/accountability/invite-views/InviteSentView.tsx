// components/morphing/message-thread/accountability/invite-views/InviteSentView.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface InviteSentViewProps {
  colors: any;
  otherUserId: string;
  threadName: string;
  onCancelInvite: () => Promise<void>;
  onClose: () => void;
}

export function InviteSentView({
  colors,
  otherUserId,
  threadName,
  onCancelInvite,
  onClose,
}: InviteSentViewProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleCancelInvite = () => {
    Alert.alert(
      "Cancel Invite",
      "Are you sure you want to cancel this invite?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            try {
              await onCancelInvite();
              Alert.alert(
                "Invite Cancelled",
                "Your invite has been cancelled."
              );
            } catch (error) {
              console.error("Error cancelling invite:", error);
              Alert.alert(
                "Error",
                "Failed to cancel invite. Please try again."
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${colors.warning || "#FF9500"}20` },
          ]}
        >
          <IconSymbol
            name="clock.fill"
            size={32}
            color={colors.warning || "#FF9500"}
          />
        </View>
        <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
          Invite Pending
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          You've invited {threadName} to be your accountability partner. They'll
          receive a notification to accept or decline your invite.
        </ThemedText>
      </View>

      {/* Info Card */}
      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: colors.background,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.infoHeader}>
          <IconSymbol name="info.circle.fill" size={20} color={colors.tint} />
          <ThemedText
            type="subtitleSemibold"
            style={[styles.infoTitle, { color: colors.text }]}
          >
            What happens next?
          </ThemedText>
        </View>
        <ThemedText
          type="body"
          style={[styles.infoText, { color: colors.textSecondary }]}
        >
          {threadName} will be notified of your request. Once they accept,
          you'll be able to see their check-in status and they'll be able to
          support your recovery journey.
        </ThemedText>
      </View>

      {/* Cancel Button */}
      <TouchableOpacity
        style={[
          styles.primaryButton,
          {
            backgroundColor: "#FF3B30",
            opacity: isLoading ? 0.6 : 1,
          },
        ]}
        onPress={handleCancelInvite}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <ThemedText type="subtitleSemibold" style={{ color: colors.white }}>
            Cancel Invite
          </ThemedText>
        )}
      </TouchableOpacity>

      {/* Close Button */}
      <TouchableOpacity
        style={[styles.secondaryButton, { borderColor: colors.border }]}
        onPress={onClose}
      >
        <ThemedText
          type="subtitleSemibold"
          style={{ color: colors.textSecondary }}
        >
          Close
        </ThemedText>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 32,
    paddingBottom: 32,
    paddingHorizontal: 4,
  },
  headerSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    opacity: 0.9,
    paddingHorizontal: 20,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  infoTitle: {
    flex: 1,
  },
  infoText: {
    lineHeight: 20,
    opacity: 0.9,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
});
