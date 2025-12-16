// app/community.tsx
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { CommunityPostList } from "@/components/morphing/community/CommunityPostList";
import { CreatePostFAB } from "@/components/morphing/community/CreatePostFAB";
import { CreatePostModal } from "@/components/morphing/community/CreatePostModal";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { BlurView } from "expo-blur";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Platform, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CommunityPage() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedPost, setSelectedPost] = useState<any>(null);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />

      {/* Header with blur effect */}
      <View style={styles.headerContainer}>
        <BlurView
          intensity={Platform.OS === "android" ? 100 : 80}
          tint={effectiveTheme === "dark" ? "dark" : "light"}
          style={styles.blurContainer}
        >
          {/* Status bar spacer */}
          <View
            style={[
              { height: insets.top },
              { backgroundColor: colors.navBackground },
            ]}
          />

          {/* Header content */}
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
              onPress={() => router.back()}
              activeOpacity={0.7}
            >
              <IconSymbol name="chevron.left" size={24} color={colors.tint} />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: colors.iconCircleBackground },
                ]}
              >
                <IconSymbol
                  name="person.3.fill"
                  size={20}
                  color={colors.icon}
                />
              </View>
              <View style={styles.headerText}>
                <ThemedText type="bodyMedium" style={{ color: colors.text }}>
                  Community Posts
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={{ color: colors.textSecondary }}
                >
                  Share encouragement and support
                </ThemedText>
              </View>
            </View>
          </View>
        </BlurView>
      </View>

      {/* Post List */}
      <CommunityPostList />

      {/* Floating Action Button with Modal Transition */}
      <ButtonModalTransitionBridge
        buttonBorderRadius={28}
        modalBorderRadius={28}
        modalWidthPercent={0.95}
        modalHeightPercent={0.85}
        buttonFadeThreshold={0.1}
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
            <CreatePostFAB
              buttonRef={buttonRef}
              style={buttonAnimatedStyle}
              onPress={() => {
                setSelectedPost(null); // Reset for new post
                open();
              }}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              insets={insets}
            />
            <CreatePostModal
              isVisible={isModalVisible}
              progress={progress}
              modalAnimatedStyle={modalAnimatedStyle}
              close={close}
            />
          </>
        )}
      </ButtonModalTransitionBridge>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
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
  iconCircle: {
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
});
