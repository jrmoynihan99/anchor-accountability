// components/community/CommentInput.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import React, {
  forwardRef,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PostComment } from "./types";

interface CommentInputProps {
  onSubmit: (content: string) => Promise<boolean>;
  posting: boolean;
  replyingTo: string | null;
  replyingToComment?: PostComment;
  onCancelReply: () => void;
}

export interface CommentInputRef {
  focus: () => void;
}

export const CommentInput = forwardRef<CommentInputRef, CommentInputProps>(
  (
    { onSubmit, posting, replyingTo, replyingToComment, onCancelReply },
    ref
  ) => {
    const { colors, effectiveTheme } = useTheme();
    const insets = useSafeAreaInsets();
    const [comment, setComment] = useState("");
    const inputRef = useRef<TextInput>(null);

    const canSend = comment.trim().length > 0 && !posting;

    useImperativeHandle(ref, () => ({
      focus: () => {
        inputRef.current?.focus();
      },
    }));

    const handleSubmit = async () => {
      if (!canSend) return;

      const success = await onSubmit(comment.trim());
      if (success) {
        setComment("");
        inputRef.current?.blur();
      }
    };

    return (
      <View style={styles.inputContainer}>
        <View style={styles.container}>
          <View
            style={[
              styles.inputContent,
              {
                borderTopColor: colors.border,
                paddingBottom: 8, // Removed insets.bottom + removed background color
              },
            ]}
          >
            {/* Reply Indicator */}
            {replyingTo && replyingToComment && (
              <View
                style={[
                  styles.replyIndicator,
                  {
                    backgroundColor:
                      colors.inputBackground || colors.background,
                  },
                ]}
              >
                <View style={styles.replyIndicatorContent}>
                  <IconSymbol
                    name="arrowshape.turn.up.left"
                    size={14}
                    color={colors.tint}
                  />
                  <ThemedText
                    type="caption"
                    style={[styles.replyingToText, { color: colors.tint }]}
                  >
                    Replying to {replyingToComment.authorUsername}
                  </ThemedText>
                </View>
                <TouchableOpacity
                  style={styles.cancelReplyButton}
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
  replyIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  replyIndicatorContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  replyingToText: {
    fontSize: 12,
    fontWeight: "500",
  },
  cancelReplyButton: {
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
    paddingVertical: 6,
  },
  sendButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
});
