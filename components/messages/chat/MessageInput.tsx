// components/messages/MessageInput.tsx
import { IconSymbol } from "@/components/ui/IconSymbol";
import { BlurView } from "expo-blur";
import React, { forwardRef } from "react";
import {
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
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

    // ------------------------------------------------------------
    // Shared inner content (used for iOS BlurView + Android solid View)
    // ------------------------------------------------------------
    const renderContent = () => (
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
              borderColor: colors.border,
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
            onFocus={onFocus}
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
    );

    return (
      <View style={styles.inputContainer}>
        {/* -------------------------------------------- */}
        {/* ANDROID — remove BlurView entirely            */}
        {/* -------------------------------------------- */}
        {Platform.OS === "android" ? (
          <View
            style={[
              styles.blurContainer,
              {
                backgroundColor:
                  Platform.OS === "android"
                    ? colors.background // 100% opaque
                    : colors.navBackground, // translucent + blur on iOS
              },
            ]}
          >
            {renderContent()}
          </View>
        ) : (
          /* -------------------------------------------- */
          /* iOS — use BlurView exactly as before          */
          /* -------------------------------------------- */
          <BlurView
            intensity={50}
            tint={colorScheme === "dark" ? "dark" : "light"}
            style={styles.blurContainer}
          >
            {renderContent()}
          </BlurView>
        )}
      </View>
    );
  }
);

MessageInput.displayName = "MessageInput";

const styles = StyleSheet.create({
  inputContainer: {
    // No absolute positioning - part of flex layout
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
    borderRadius: 30,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
});
