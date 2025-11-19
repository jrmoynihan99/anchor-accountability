// components/messages/chat/MessageThreadHeader.tsx
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { UserStreakDisplay } from "@/components/UserStreakDisplay";
import { BlurView } from "expo-blur";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { InfoButton } from "../../morphing/messages/message-thread-info/InfoButton";
import { ThreadInfoModal } from "../../morphing/messages/message-thread-info/InfoModal";
import { ThreadHeaderProps } from "./types";

export function MessageThreadHeader({
  threadName,
  isTyping,
  colors,
  onBack,
  colorScheme = "light",
  otherUserId, // Add this prop to pass to the modal
}: ThreadHeaderProps & {
  colorScheme?: "light" | "dark";
  otherUserId?: string;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.headerContainer}>
      <BlurView
        intensity={Platform.OS === "android" ? 100 : 50}
        tint={colorScheme === "dark" ? "dark" : "light"}
        style={styles.blurContainer}
      >
        {/* Status bar spacer with matching background color */}
        <View
          style={[
            { height: insets.top },
            { backgroundColor: colors.navBackground },
          ]}
        />

        {/* Actual header content */}
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.navBackground,
              borderBottomColor: colors.navBorder,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={onBack}
            activeOpacity={0.7}
          >
            <IconSymbol name="chevron.left" size={24} color={colors.tint} />
          </TouchableOpacity>

          <View style={styles.headerCenter}>
            <View
              style={[
                styles.avatar,
                { backgroundColor: colors.iconCircleSecondaryBackground },
              ]}
            >
              <ThemedText type="caption" style={{ color: colors.icon }}>
                {threadName
                  ? threadName[5]?.toUpperCase() || threadName[0]?.toUpperCase()
                  : "U"}
              </ThemedText>
            </View>
            <View style={styles.headerText}>
              <View style={styles.usernameRow}>
                <ThemedText type="bodyMedium" style={{ color: colors.text }}>
                  {threadName || "Anonymous User"}
                </ThemedText>
                {otherUserId && (
                  <UserStreakDisplay userId={otherUserId} size="small" />
                )}
              </View>
              {isTyping && (
                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary }}
                >
                  typing...
                </ThemedText>
              )}
            </View>
          </View>

          {/* Info button with modal transition */}
          <ButtonModalTransitionBridge
            buttonBorderRadius={16}
            modalBorderRadius={28}
            modalWidthPercent={0.9}
            modalHeightPercent={0.7}
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
            }) => (
              <>
                <InfoButton
                  colors={colors}
                  onPress={open}
                  buttonRef={buttonRef}
                  style={buttonAnimatedStyle}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                />
                <ThreadInfoModal
                  isVisible={isModalVisible}
                  progress={progress}
                  modalAnimatedStyle={modalAnimatedStyle}
                  close={close}
                  threadName={threadName || "Anonymous User"}
                  otherUserId={otherUserId || ""}
                />
              </>
            )}
          </ButtonModalTransitionBridge>
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blurContainer: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backButton: {
    padding: 4,
    marginRight: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
