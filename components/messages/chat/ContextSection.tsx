// components/messages/chat/ContextSection.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { Typography } from "@/constants/Typography";
import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ContextSectionProps {
  plea?: string | null;
  encouragement?: string | null;
  colors: any;
  currentUserId?: string | null;
  pleaOwnerUid?: string | null;
  encouragementOwnerUid?: string | null;
  loading?: boolean;
  isNewThread?: boolean;
  colorScheme?: "light" | "dark";
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

export const ContextSection: React.FC<ContextSectionProps> = ({
  plea,
  encouragement,
  colors,
  currentUserId,
  pleaOwnerUid,
  encouragementOwnerUid,
  loading,
  isNewThread = false,
  colorScheme = "light",
}) => {
  const insets = useSafeAreaInsets();
  const [isExpanded, setIsExpanded] = useState(isNewThread);
  const [contentHeight, setContentHeight] = useState(0);
  const animatedHeight = useSharedValue(isNewThread ? 1 : 0);
  const rotateValue = useSharedValue(isNewThread ? 1 : 0);

  const HEADER_CONTENT_HEIGHT = 60;
  const DESIRED_GAP = 12;
  const topOffset = insets.top + HEADER_CONTENT_HEIGHT + DESIRED_GAP;
  const HEADER_HEIGHT = 48;

  // Update animation when expanded state changes
  useEffect(() => {
    animatedHeight.value = withTiming(isExpanded ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
    rotateValue.value = withTiming(isExpanded ? 1 : 0, {
      duration: 300,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [isExpanded]);

  const animatedContainerStyle = useAnimatedStyle(() => {
    // Use actual content height instead of hardcoded max
    const targetHeight = HEADER_HEIGHT + (contentHeight || 0);
    return {
      height: interpolate(
        animatedHeight.value,
        [0, 1],
        [HEADER_HEIGHT, targetHeight]
      ),
      opacity: interpolate(animatedHeight.value, [0, 0.3, 1], [1, 1, 1]),
    };
  });

  const animatedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(animatedHeight.value, [0, 0.3, 1], [0, 0, 1]),
      transform: [
        {
          translateY: interpolate(animatedHeight.value, [0, 1], [10, 0]),
        },
      ],
    };
  });

  const animatedChevronStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          rotate: `${interpolate(rotateValue.value, [0, 1], [0, 180])}deg`,
        },
      ],
    };
  });

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Measure content height
  const onContentLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setContentHeight(height);
  };

  // Don't render if no context and not loading
  if (!loading && !plea && !encouragement) {
    return null;
  }

  const hasEncouragement = encouragement && encouragement.trim().length > 0;

  return (
    <View style={[styles.wrapper, { marginTop: topOffset }]}>
      <Animated.View
        style={[
          animatedContainerStyle,
          {
            borderRadius: 20,
            borderWidth: 1,
            borderColor: colors.border,
            overflow: "hidden",
            shadowOpacity: 0.2,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 8,
            elevation: 5,
            shadowColor: "#000",
          },
        ]}
      >
        <BlurView
          intensity={Platform.OS === "android" ? 100 : 50}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={[
            styles.blurContainer,
            {
              backgroundColor: `${colors.cardBackground}80`, // Add 80% opacity
            },
          ]}
        >
          {/* Header bar - always visible */}
          <TouchableOpacity
            style={styles.headerBar}
            onPress={toggleExpanded}
            activeOpacity={0.7}
          >
            <View style={styles.headerContent}>
              <View
                style={[
                  styles.dot,
                  { backgroundColor: colors.tint, opacity: 1 },
                ]}
              />
              <ThemedText
                type="captionMedium"
                style={[
                  styles.headerText,
                  { color: colors.text, ...Typography.styles.captionMedium },
                ]}
              >
                Conversation Context
              </ThemedText>
            </View>

            {loading ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <Animated.View style={animatedChevronStyle}>
                <IconSymbol
                  name="chevron.down"
                  size={20}
                  color={colors.textSecondary}
                />
              </Animated.View>
            )}
          </TouchableOpacity>

          {/* Expandable content */}
          {!loading && (
            <Animated.View
              style={[styles.content, animatedContentStyle]}
              onLayout={onContentLayout}
            >
              {/* Plea section */}
              <View
                style={[
                  styles.section,
                  // Only add bottom margin if there's encouragement after it
                  hasEncouragement && styles.sectionWithMargin,
                ]}
              >
                <ThemedText
                  type="caption"
                  style={[
                    styles.sectionLabel,
                    {
                      color: colors.textSecondary,
                      ...Typography.styles.caption,
                    },
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
              {hasEncouragement && (
                <View style={styles.section}>
                  <ThemedText
                    type="caption"
                    style={[
                      styles.sectionLabel,
                      {
                        color: colors.textSecondary,
                        ...Typography.styles.caption,
                      },
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
            </Animated.View>
          )}
        </BlurView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    paddingHorizontal: 16,
  },
  blurContainer: {
    flex: 1,
  },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 48,
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  headerText: {
    letterSpacing: 0.1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 0,
    paddingBottom: 12,
  },
  section: {
    // Remove default margin bottom
  },
  sectionWithMargin: {
    marginBottom: 12, // Only add margin when there's content after
  },
  sectionLabel: {
    marginBottom: 4,
    opacity: 0.75,
  },
  sectionText: {
    lineHeight: 20,
  },
});
