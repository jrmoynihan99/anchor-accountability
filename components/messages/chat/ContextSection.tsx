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
  postTitle?: string | null;
  colors: any;
  currentUserId?: string | null;
  pleaOwnerUid?: string | null;
  encouragementOwnerUid?: string | null;
  postOwnerUid?: string | null;
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

function getPostLabel(
  currentUserId?: string | null,
  postOwnerUid?: string | null
) {
  if (!postOwnerUid || !currentUserId) return "Community post";
  if (postOwnerUid === currentUserId) return "Your community post";
  return `user-${postOwnerUid.substring(0, 5)}'s community post`;
}

export const ContextSection: React.FC<ContextSectionProps> = ({
  plea,
  encouragement,
  postTitle,
  colors,
  currentUserId,
  pleaOwnerUid,
  encouragementOwnerUid,
  postOwnerUid,
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

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  const onContentLayout = (event: any) => {
    const { height } = event.nativeEvent.layout;
    setContentHeight(height);
  };

  if (!loading && !plea && !encouragement && !postTitle) return null;

  const hasEncouragement = encouragement && encouragement.trim().length > 0;
  const hasPost = postTitle && postTitle.trim().length > 0;

  // ------------------------------------------------------------
  // SHARED CONTENT FOR BOTH ANDROID + IOS
  // ------------------------------------------------------------
  const renderContent = () => (
    <>
      {/* Header */}
      <TouchableOpacity
        style={styles.headerBar}
        onPress={toggleExpanded}
        activeOpacity={0.7}
      >
        <View style={styles.headerContent}>
          <View
            style={[styles.dot, { backgroundColor: colors.tint, opacity: 1 }]}
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

      {/* Expandable Content */}
      {!loading && (
        <Animated.View
          style={[styles.content, animatedContentStyle]}
          onLayout={onContentLayout}
        >
          {/* Post Context */}
          {hasPost && (
            <View
              style={[
                styles.section,
                (plea || hasEncouragement) && styles.sectionWithMargin,
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
                {getPostLabel(currentUserId, postOwnerUid)}
              </ThemedText>

              <ThemedText
                type="body"
                style={[
                  styles.sectionText,
                  { color: colors.text, ...Typography.styles.body },
                ]}
              >
                {postTitle}
              </ThemedText>
            </View>
          )}

          {/* Plea */}
          {plea && (
            <View
              style={[
                styles.section,
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

              {plea.trim().length > 0 ? (
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
          )}

          {/* Encouragement */}
          {hasEncouragement && (
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
        </Animated.View>
      )}
    </>
  );

  // ------------------------------------------------------------
  // RETURN
  // ------------------------------------------------------------
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
        {/* ANDROID — NO BLURVIEW */}
        {Platform.OS === "android" ? (
          <View
            style={[
              styles.blurContainer,
              {
                backgroundColor: colors.cardBackground,
              },
            ]}
          >
            {renderContent()}
          </View>
        ) : (
          /* iOS — BlurView */
          <BlurView
            intensity={50}
            tint={colorScheme === "dark" ? "dark" : "light"}
            style={[
              styles.blurContainer,
              {
                backgroundColor: `${colors.cardBackground}80`,
              },
            ]}
          >
            {renderContent()}
          </BlurView>
        )}
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
  section: {},
  sectionWithMargin: {
    marginBottom: 12,
  },
  sectionLabel: {
    marginBottom: 4,
    opacity: 0.75,
  },
  sectionText: {
    lineHeight: 20,
  },
});
