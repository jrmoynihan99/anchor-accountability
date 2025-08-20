// components/messages/MessageInput.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import { BlurView } from "expo-blur";
import React, { forwardRef } from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MessageInputProps } from "./types";

export const MessageInput = forwardRef<
  TextInput,
  MessageInputProps & { colorScheme?: "light" | "dark" }
>(
  (
    {
      inputText,
      onInputChange,
      onSend,
      onFocus,
      colors,
      disabled = false,
      colorScheme = "light",
    },
    ref
  ) => {
    const insets = useSafeAreaInsets();

    return (
      <View style={styles.inputContainer}>
        <BlurView
          intensity={80}
          tint={colorScheme === "dark" ? "dark" : "light"}
          style={styles.blurContainer}
        >
          <View
            style={[
              styles.inputContent,
              {
                backgroundColor: colors.navBackground,
                borderTopColor: colors.navBorder,
                paddingBottom: insets.bottom + 8,
              },
            ]}
          >
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.textInputBackground,
                  borderColor: colors.border, // More visible border
                },
              ]}
            >
              <TextInput
                ref={ref}
                style={[styles.textInput, { color: colors.text }]}
                placeholder="Message..."
                placeholderTextColor={colors.textSecondary}
                value={inputText}
                onChangeText={onInputChange}
                multiline
                maxLength={1000}
                submitBehavior="newline"
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor:
                      inputText.trim().length > 0 ? colors.tint : colors.border,
                  },
                ]}
                onPress={onSend}
                disabled={inputText.trim().length === 0 || disabled}
                activeOpacity={0.8}
              >
                <IconSymbol
                  name="arrow.up"
                  size={16}
                  color={
                    inputText.trim().length > 0
                      ? colors.white
                      : colors.textSecondary
                  }
                />
              </TouchableOpacity>
            </View>
          </View>
        </BlurView>
      </View>
    );
  }
);

MessageInput.displayName = "MessageInput";

const styles = StyleSheet.create({
  inputContainer: {
    // Remove absolute positioning - parent handles it now
    zIndex: 1000,
  },
  blurContainer: {
    overflow: "hidden",
  },
  inputContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
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
