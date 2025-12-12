// components/messages/chat/AccountabilityReceivedInviteBanner.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { BlurView } from "expo-blur";
import React, { useEffect } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface AccountabilityReceivedInviteBannerProps {
  threadName: string;
  onLearnMore: () => void;
  onDismiss: () => void;
  colors: any;
  colorScheme?: "light" | "dark";
}

export function AccountabilityReceivedInviteBanner({
  threadName,
  onLearnMore,
  onDismiss,
  colors,
  colorScheme = "light",
}: AccountabilityReceivedInviteBannerProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Small delay to ensure positioning is set before fading in
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, {
        duration: 300,
        easing: Easing.ease,
      });
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handleDismiss = () => {
    // Animate out then call onDismiss
    opacity.value = withTiming(
      0,
      {
        duration: 200,
        easing: Easing.ease,
      },
      (finished) => {
        if (finished) {
          runOnJS(onDismiss)();
        }
      }
    );
  };

  const renderContent = () => (
    <View style={styles.content}>
      {/* Icon and Text */}
      <View style={styles.mainContent}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: `${colors.success || "#34C759"}20` },
          ]}
        >
          <IconSymbol
            name="bell.badge.fill"
            size={20}
            color={colors.success || "#34C759"}
          />
        </View>

        <View style={styles.textContainer}>
          <ThemedText
            type="bodyMedium"
            style={[styles.title, { color: colors.text }]}
          >
            {threadName} invited you to be accountability partners
          </ThemedText>
          <ThemedText
            type="caption"
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            They want to support your recovery journey
          </ThemedText>
        </View>

        {/* Dismiss X button */}
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="xmark" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* Learn More Button */}
      <TouchableOpacity
        style={[
          styles.learnMoreButton,
          {
            backgroundColor: `${colors.success || "#34C759"}20`,
            borderColor: colors.success || "#34C759",
          },
        ]}
        onPress={onLearnMore}
        activeOpacity={0.7}
      >
        <ThemedText
          type="button"
          style={[styles.learnMoreText, { color: colors.success || "#34C759" }]}
        >
          View Invite
        </ThemedText>
        <IconSymbol
          name="arrow.right"
          size={14}
          color={colors.success || "#34C759"}
          style={{ marginLeft: 4 }}
        />
      </TouchableOpacity>
    </View>
  );

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <View
        style={[
          styles.bannerWrapper,
          {
            borderColor: colors.success || "#34C759",
            shadowColor: "#000",
          },
        ]}
      >
        {Platform.OS === "android" ? (
          <View
            style={[
              styles.blurContainer,
              { backgroundColor: colors.cardBackground },
            ]}
          >
            {renderContent()}
          </View>
        ) : (
          <BlurView
            intensity={50}
            tint={colorScheme === "dark" ? "dark" : "light"}
            style={[
              styles.blurContainer,
              { backgroundColor: `${colors.cardBackground}80` },
            ]}
          >
            {renderContent()}
          </BlurView>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  bannerWrapper: {
    borderRadius: 16,
    borderWidth: 2,
    overflow: "hidden",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  blurContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  mainContent: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
    paddingTop: 2,
  },
  title: {
    marginBottom: 2,
    lineHeight: 20,
  },
  subtitle: {
    opacity: 0.8,
    lineHeight: 16,
  },
  dismissButton: {
    padding: 4,
    marginLeft: 8,
  },
  learnMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
  },
  learnMoreText: {
    fontWeight: "600",
  },
});
