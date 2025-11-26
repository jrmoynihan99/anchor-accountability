// components/community/CommentInput.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostComment } from "../../community/types";

interface UserCommentStatus {
  status: "pending" | "approved" | "rejected";
  commentId: string;
  createdAt: Date;
}

interface CommentInputProps {
  onSubmit: (content: string) => Promise<boolean>;
  posting: boolean;
  replyingTo: string | null;
  replyingToComment?: PostComment;
  onCancelReply: () => void;
  userCommentStatus?: UserCommentStatus | null;
  onDismissCommentStatus?: () => void;
}

export interface CommentInputRef {
  focus: () => void;
}

export const CommentInput = forwardRef<CommentInputRef, CommentInputProps>(
  (
    {
      onSubmit,
      posting,
      replyingTo,
      replyingToComment,
      onCancelReply,
      userCommentStatus,
      onDismissCommentStatus,
    },
    ref
  ) => {
    const { colors, effectiveTheme } = useTheme();
    const insets = useSafeAreaInsets();
    const [comment, setComment] = useState("");
    const inputRef = useRef<TextInput>(null);

    // Animation values
    const indicatorHeight = useSharedValue(0);
    const indicatorOpacity = useSharedValue(0);

    const canSend = comment.trim().length > 0 && !posting;

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    // Determine what should be shown
    const shouldShowReply = replyingTo && replyingToComment;
    const shouldShowStatus = userCommentStatus && !shouldShowReply;
    const shouldShowAnyIndicator = shouldShowReply || shouldShowStatus;

    // Animate indicator visibility
    useEffect(() => {
      if (shouldShowAnyIndicator) {
        indicatorHeight.value = withSpring(40, {
          damping: 60,
          stiffness: 600,
        });
        indicatorOpacity.value = withTiming(1, { duration: 200 });
      } else {
        indicatorHeight.value = withSpring(0, {
          damping: 15,
          stiffness: 150,
        });
        indicatorOpacity.value = withTiming(0, { duration: 200 });
      }
    }, [shouldShowReply, shouldShowStatus]);

    // Animated style for the indicator container
    const indicatorAnimatedStyle = useAnimatedStyle(() => ({
      height: indicatorHeight.value,
      opacity: indicatorOpacity.value,
      overflow: "hidden",
    }));

    const handleSubmit = async () => {
      if (!canSend) return;

      const success = await onSubmit(comment.trim());
      if (success) {
        setComment("");
        inputRef.current?.blur();
      }
    };

    const getStatusContent = () => {
      if (!userCommentStatus) return null;

      switch (userCommentStatus.status) {
        case "pending":
          return {
            icon: "clock.fill" as const,
            text: "Your comment is pending",
            color: colors.achievement,
            showSpinner: true,
          };
        case "approved":
          return {
            icon: "checkmark.circle.fill" as const,
            text: "Your comment is posted",
            color: colors.success,
            showSpinner: false,
          };
        case "rejected":
          return {
            icon: "exclamationmark.triangle.fill" as const,
            text: "Your comment was rejected",
            color: colors.error,
            showSpinner: false,
          };
        default:
          return null;
      }
    };

    const statusContent = getStatusContent();

    return (
      <View style={styles.inputContainer}>
        <View style={styles.container}>
          <View
            style={[
              styles.inputContent,
              {
                borderTopColor: colors.border,
                paddingBottom: 8,
              },
            ]}
          >
            {/* Animated Indicator Container - always rendered for smooth animations */}
            <Animated.View style={indicatorAnimatedStyle}>
              {shouldShowReply && (
                <View
                  style={[
                    styles.indicator,
                    {
                      backgroundColor:
                        colors.inputBackground || colors.background,
                    },
                  ]}
                >
                  <View style={styles.indicatorContent}>
                    <IconSymbol
                      name="arrowshape.turn.up.left"
                      size={14}
                      color={colors.tint}
                    />
                    <ThemedText
                      type="caption"
                      style={[styles.indicatorText, { color: colors.tint }]}
                    >
                      Replying to {replyingToComment.authorUsername}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onCancelReply}
                    hitSlop={8}
                  >
                    <IconSymbol
                      name="xmark"
                      size={12}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              )}

              {shouldShowStatus && statusContent && (
                <View
                  style={[
                    styles.indicator,
                    {
                      backgroundColor:
                        colors.inputBackground || colors.background,
                    },
                  ]}
                >
                  <View style={styles.indicatorContent}>
                    {statusContent.showSpinner ? (
                      <ActivityIndicator
                        size="small"
                        color={statusContent.color}
                        style={{ width: 14, height: 14 }}
                      />
                    ) : (
                      <IconSymbol
                        name={statusContent.icon}
                        size={14}
                        color={statusContent.color}
                      />
                    )}
                    <ThemedText
                      type="caption"
                      style={[
                        styles.indicatorText,
                        { color: statusContent.color },
                      ]}
                    >
                      {statusContent.text}
                    </ThemedText>
                  </View>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={onDismissCommentStatus}
                    hitSlop={8}
                  >
                    <IconSymbol
                      name="xmark"
                      size={12}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              )}
            </Animated.View>

            {/* Input Wrapper */}
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor:
                    colors.textInputBackground ||
                    colors.inputBackground ||
                    colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <TextInput
                ref={inputRef}
                style={[styles.textInput, { color: colors.text }]}
                placeholder={
                  replyingTo
                    ? `Reply to ${replyingToComment?.authorUsername}...`
                    : "Add a comment..."
                }
                placeholderTextColor={colors.textSecondary}
                value={comment}
                onChangeText={setComment}
                multiline
                maxLength={500}
                submitBehavior="newline"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: canSend ? colors.tint : colors.border,
                  },
                ]}
                onPress={handleSubmit}
                disabled={!canSend}
                activeOpacity={0.8}
              >
                {posting ? (
                  <ActivityIndicator
                    size="small"
                    color={canSend ? colors.white : colors.textSecondary}
                  />
                ) : (
                  <IconSymbol
                    name="arrow.up"
                    size={16}
                    color={canSend ? colors.white : colors.textSecondary}
                  />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  }
);

const styles = StyleSheet.create({
  inputContainer: {
    // No absolute positioning - now part of flex layout
  },
  container: {
    // Transparent container to replace BlurView
  },
  inputContent: {
    paddingHorizontal: 0,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  indicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  indicatorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  indicatorText: {
    // Remove custom styles - ThemedText will handle typography
  },
  cancelButton: {
    padding: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 20,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    minHeight: 40,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 20,
    maxHeight: 80,
    paddingBottom: 6,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
});
