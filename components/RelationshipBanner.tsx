// components/RelationshipBanner.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { router } from "expo-router";
import React, { useEffect } from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type BannerType =
  | "accepted"
  | "ended-mentor"
  | "ended-mentee"
  | "declined"
  | "received";

interface RelationshipBannerProps {
  type: BannerType;
  personName: string;
  onDismiss: () => void;
  threadId?: string; // ✅ For declined "View" button navigation
}

export function RelationshipBanner({
  type,
  personName,
  onDismiss,
  threadId,
}: RelationshipBannerProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(-200);

  // Configure based on type
  const config = {
    accepted: {
      icon: "checkmark.circle.fill" as const,
      iconColor: colors.white,
      iconBackgroundColor: `${colors.white}20`,
      title: "Accountability Partner! 🎉",
      titleColor: colors.white,
      subtitle: `${personName} accepted your invite`,
      subtitleColor: colors.white,
      backgroundColor: colors.tint,
      borderColor: undefined,
      showViewButton: true,
      viewButtonBackground: colors.white,
      viewButtonTextColor: colors.tint,
    },
    "ended-mentor": {
      icon: "person.crop.circle.badge.xmark" as const,
      iconColor: colors.textSecondary,
      iconBackgroundColor: colors.iconCircleSecondaryBackground,
      title: "Partnership Ended",
      titleColor: colors.text,
      subtitle: `${personName} ended the partnership`,
      subtitleColor: colors.textSecondary,
      backgroundColor: colors.cardBackground,
      borderColor: colors.border,
      showViewButton: false,
      viewButtonBackground: undefined,
      viewButtonTextColor: undefined,
    },
    "ended-mentee": {
      icon: "person.crop.circle.badge.xmark" as const,
      iconColor: colors.textSecondary,
      iconBackgroundColor: colors.iconCircleSecondaryBackground,
      title: "Partnership Ended",
      titleColor: colors.text,
      subtitle: `${personName} ended the partnership`,
      subtitleColor: colors.textSecondary,
      backgroundColor: colors.cardBackground,
      borderColor: colors.border,
      showViewButton: false,
      viewButtonBackground: undefined,
      viewButtonTextColor: undefined,
    },
    declined: {
      icon: "xmark.circle.fill" as const,
      iconColor: colors.textSecondary,
      iconBackgroundColor: colors.iconCircleSecondaryBackground,
      title: "Invite Declined",
      titleColor: colors.text,
      subtitle: `${personName} declined your invite`,
      subtitleColor: colors.textSecondary,
      backgroundColor: colors.cardBackground,
      borderColor: colors.error, // ✅ Red border like DeclinedInviteItem
      showViewButton: true,
      viewButtonBackground: colors.cardBackground,
      viewButtonTextColor: colors.textSecondary,
    },
    received: {
      icon: "person.badge.plus" as const,
      iconColor: colors.white,
      iconBackgroundColor: `${colors.white}20`,
      title: "Accountability Invite! 🤝",
      titleColor: colors.white,
      subtitle: `${personName} wants you as their partner`,
      subtitleColor: colors.white,
      backgroundColor: colors.tint,
      borderColor: undefined,
      showViewButton: true,
      viewButtonBackground: colors.white,
      viewButtonTextColor: colors.tint,
    },
  };

  const currentConfig = config[type];

  useEffect(() => {
    // Slide down
    translateY.value = withSpring(0, {
      damping: 50,
      stiffness: 300,
    });

    // Auto-dismiss after 7 seconds
    const timer = setTimeout(() => {
      handleDismiss();
    }, 7000);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    translateY.value = withSpring(
      -200,
      {
        damping: 15,
        stiffness: 120,
      },
      (finished) => {
        if (finished) {
          runOnJS(onDismiss)();
        }
      }
    );
  };

  const handleViewPress = () => {
    handleDismiss();
    // Small delay to let animation start before navigation
    setTimeout(() => {
      if (type === "declined" && threadId) {
        // Navigate to thread with modal open
        router.push({
          pathname: "/message-thread",
          params: {
            threadId,
            openInviteModal: "true",
          },
        });
      } else {
        // Navigate to accountability tab for accepted/ended/received
        router.push("/(tabs)/accountability");
      }
    }, 100);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 10,
          backgroundColor: currentConfig.backgroundColor,
          borderColor: currentConfig.borderColor || "transparent",
          borderWidth: currentConfig.borderColor ? 1.5 : 0,
        },
        animatedStyle,
      ]}
    >
      <View style={styles.content}>
        {/* Left: Icon + Text */}
        <View style={styles.leftContent}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: currentConfig.iconBackgroundColor },
            ]}
          >
            <IconSymbol
              name={currentConfig.icon}
              size={24}
              color={currentConfig.iconColor}
            />
          </View>
          <View style={styles.textContent}>
            <ThemedText type="body" style={{ color: currentConfig.titleColor }}>
              {currentConfig.title}
            </ThemedText>
            <ThemedText
              type="caption"
              style={[styles.subtitle, { color: currentConfig.subtitleColor }]}
            >
              {currentConfig.subtitle}
            </ThemedText>
          </View>
        </View>

        {/* Right: View Button (conditional) + Close */}
        <View style={styles.rightContent}>
          {currentConfig.showViewButton && (
            <TouchableOpacity
              style={[
                styles.viewButton,
                {
                  backgroundColor: currentConfig.viewButtonBackground,
                },
              ]}
              onPress={handleViewPress}
              activeOpacity={0.8}
            >
              <ThemedText
                type="captionMedium"
                style={[
                  styles.viewButtonText,
                  { color: currentConfig.viewButtonTextColor },
                ]}
              >
                View
              </ThemedText>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleDismiss}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <IconSymbol
              name="xmark"
              size={16}
              color={currentConfig.titleColor}
            />
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 16,
    right: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 10000,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    paddingRight: 8,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContent: {
    flex: 1,
  },
  subtitle: {
    opacity: 0.9,
  },
  rightContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  viewButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewButtonText: {
    fontSize: 13,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
});
