// components/messages/chat/AccountabilityInviteModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { auth } from "@/lib/firebase";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";

interface AccountabilityInviteModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
  otherUserId: string;
  threadName: string;
}

export function AccountabilityInviteModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
  otherUserId,
  threadName,
}: AccountabilityInviteModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const currentUserId = auth.currentUser?.uid;

  const handleSendInvite = async () => {
    if (!currentUserId) return;

    setIsLoading(true);
    try {
      // TODO: Implement Firebase logic to create accountability invite
      console.log("Sending accountability invite to:", otherUserId);

      // Placeholder for now
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // After successful invite, close modal
      close();
    } catch (error) {
      console.error("Error sending invite:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Button content (the invite icon in its collapsed state)
  const buttonContent = (
    <View style={styles.buttonContent}>
      <IconSymbol
        name="person.badge.plus"
        size={24}
        color={colors.textSecondary}
      />
    </View>
  );

  // Modal content
  const modalContent = (
    <ScrollView
      style={styles.scrollContainer}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.headerSection}>
        <View
          style={[styles.iconCircle, { backgroundColor: `${colors.tint}20` }]}
        >
          <IconSymbol name="person.2.fill" size={32} color={colors.tint} />
        </View>
        <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
          Accountability Partner
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.subtitle, { color: colors.textSecondary }]}
        >
          Invite {threadName || "this user"} to be your accountability partner
        </ThemedText>
      </View>

      {/* What is this Section */}
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
            What is an Accountability Partner?
          </ThemedText>
        </View>
        <ThemedText
          type="body"
          style={[styles.infoText, { color: colors.textSecondary }]}
        >
          An accountability partner helps support you in your recovery journey.
          They can see your daily check-ins, encourage you, and be there when
          you need support.
        </ThemedText>
      </View>

      {/* Features Section */}
      <View style={styles.featuresSection}>
        <FeatureItem
          icon="checkmark.circle.fill"
          title="Daily Check-Ins"
          description="Share your daily status and progress"
          colors={colors}
        />
        <FeatureItem
          icon="bell.fill"
          title="Support Notifications"
          description="Get reminded when they need encouragement"
          colors={colors}
        />
        <FeatureItem
          icon="message.fill"
          title="Direct Communication"
          description="Stay connected through private messaging"
          colors={colors}
        />
        <FeatureItem
          icon="chart.bar.fill"
          title="Track Progress"
          description="See their recovery streak and milestones"
          colors={colors}
        />
      </View>

      {/* Action Button */}
      <TouchableOpacity
        style={[
          styles.inviteButton,
          {
            backgroundColor: colors.tint,
            opacity: isLoading ? 0.6 : 1,
          },
        ]}
        onPress={handleSendInvite}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <>
            <IconSymbol name="paperplane.fill" size={18} color={colors.white} />
            <ThemedText type="subtitleSemibold" style={{ color: colors.white }}>
              Send Invite
            </ThemedText>
          </>
        )}
      </TouchableOpacity>

      {/* Note */}
      <ThemedText
        type="caption"
        style={[styles.note, { color: colors.textSecondary }]}
      >
        They will receive a notification and can choose to accept or decline
        your invitation.
      </ThemedText>
    </ScrollView>
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={close}
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.cardBackground}
      buttonBackgroundColor={colors.iconCircleSecondaryBackground}
      buttonContentPadding={0}
      buttonBorderRadius={26}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.2]}
    >
      {modalContent}
    </BaseModal>
  );
}

// Feature Item Component
function FeatureItem({
  icon,
  title,
  description,
  colors,
}: {
  icon: string;
  title: string;
  description: string;
  colors: any;
}) {
  return (
    <View style={styles.featureItem}>
      <View
        style={[
          styles.featureIconCircle,
          { backgroundColor: `${colors.tint}15` },
        ]}
      >
        <IconSymbol name={icon} size={20} color={colors.tint} />
      </View>
      <View style={styles.featureText}>
        <ThemedText
          type="bodyMedium"
          style={[styles.featureTitle, { color: colors.text }]}
        >
          {title}
        </ThemedText>
        <ThemedText
          type="caption"
          style={[styles.featureDescription, { color: colors.textSecondary }]}
        >
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContent: {
    alignItems: "center",
    justifyContent: "center",
    width: 52,
    height: 52,
    borderRadius: 26,
  },
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
  featuresSection: {
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  featureIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  featureText: {
    flex: 1,
    paddingTop: 2,
  },
  featureTitle: {
    marginBottom: 2,
  },
  featureDescription: {
    lineHeight: 16,
    opacity: 0.8,
  },
  inviteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 12,
  },
  note: {
    textAlign: "center",
    opacity: 0.7,
    lineHeight: 18,
    paddingHorizontal: 20,
  },
});
