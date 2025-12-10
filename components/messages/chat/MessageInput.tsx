// components/messages/MessageInput.tsx
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
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
import { AccountabilityInviteButton } from "../../morphing/message-thread/accountability/AccountabilityInviteButton";
import { AccountabilityInviteModal } from "../../morphing/message-thread/accountability/AccountabilityInviteModal";
import { MessageInputProps } from "./types";

export const MessageInput = forwardRef<
  TextInput,
  MessageInputProps & {
    colorScheme?: "light" | "dark";
    otherUserId?: string;
    threadName?: string;
    onInviteModalReady?: (openFn: () => void) => void;
  }
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
      otherUserId = "",
      threadName = "Anonymous User",
      onInviteModalReady,
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
        <View style={styles.row}>
          {/* ------------------------------------------------ */}
          {/* ACCOUNTABILITY INVITE BUTTON WITH MODAL          */}
          {/* ------------------------------------------------ */}
          <ButtonModalTransitionBridge
            buttonBorderRadius={20}
            modalBorderRadius={28}
            modalWidthPercent={0.9}
            modalHeightPercent={0.75}
            buttonFadeThreshold={0.01}
          >
            {({
              open,
              close,
              isModalVisible,
              progress,
              buttonAnimatedStyle,
              modalAnimatedStyle,
              buttonRef,
              handlePressIn,
              handlePressOut,
            }) => {
              // Expose the open function to parent component
              React.useEffect(() => {
                if (onInviteModalReady) {
                  onInviteModalReady(open);
                }
              }, [open]);

              // One-time measurement to enable proper morph animation
              React.useEffect(() => {
                const timer = setTimeout(() => {
                  handlePressIn();
                  setTimeout(() => {
                    handlePressOut();
                  }, 10);
                }, 100);
                return () => clearTimeout(timer);
              }, []);

              return (
                <>
                  <AccountabilityInviteButton
                    colors={colors}
                    onPress={open}
                    buttonRef={buttonRef}
                    style={buttonAnimatedStyle}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                  />

                  <AccountabilityInviteModal
                    isVisible={isModalVisible}
                    progress={progress}
                    modalAnimatedStyle={modalAnimatedStyle}
                    close={close}
                    otherUserId={otherUserId}
                    threadName={threadName}
                  />
                </>
              );
            }}
          </ButtonModalTransitionBridge>

          {/* ------------------------------------------------ */}
          {/* INPUT FIELD + SEND BUTTON                       */}
          {/* ------------------------------------------------ */}
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
      </View>
    );

    return (
      <View style={styles.inputContainer}>
        {/* -------------------------------------------- */}
        {/* ANDROID fallback without blur                */}
        {/* -------------------------------------------- */}
        {Platform.OS === "android" ? (
          <View
            style={[
              styles.blurContainer,
              {
                backgroundColor:
                  Platform.OS === "android"
                    ? colors.background
                    : colors.navBackground,
              },
            ]}
          >
            {renderContent()}
          </View>
        ) : (
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
  inputContainer: {},
  blurContainer: {
    overflow: "hidden",
  },
  inputContent: {
    paddingHorizontal: 16,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  /* New row wrapper */
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },

  /* Existing input wrapper (unchanged) */
  inputWrapper: {
    flex: 1,
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
