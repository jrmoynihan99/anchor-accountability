// app/(tabs)/community.tsx
import { CommunityPostList } from "@/components/community/CommunityPostList";
import { CreatePostFAB } from "@/components/community/CreatePostFAB";
import { CreatePostModal } from "@/components/community/CreatePostModal";
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { useTheme } from "@/hooks/ThemeContext";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CommunityScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedPost, setSelectedPost] = useState<any>(null); // For future use

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />

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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
});
