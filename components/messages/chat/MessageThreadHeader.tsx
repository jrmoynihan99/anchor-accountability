// components/messages/MessageThreadHeader.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThreadHeaderProps } from "./types";

export function MessageThreadHeader({
  threadName,
  isTyping,
  colors,
  onBack,
  colorScheme = "light",
}: ThreadHeaderProps & { colorScheme?: "light" | "dark" }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.headerContainer}>
      <BlurView
        intensity={80}
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
              <ThemedText type="bodyMedium" style={{ color: colors.text }}>
                {threadName || "Anonymous User"}
              </ThemedText>
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

          <TouchableOpacity style={styles.headerAction} activeOpacity={0.7}>
            <IconSymbol
              name="info.circle"
              size={24}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
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
  headerAction: {
    padding: 4,
    marginLeft: 8,
  },
});
