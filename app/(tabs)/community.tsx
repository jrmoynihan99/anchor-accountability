// app/(tabs)/community.tsx
import { CommunityHeader } from "@/components/community/CommunityHeader";
import { CommunityPostList } from "@/components/community/CommunityPostList";
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { CreatePostFAB } from "@/components/morphing/community/CreatePostFAB";
import { CreatePostModal } from "@/components/morphing/community/CreatePostModal";
import { useTheme } from "@/hooks/ThemeContext";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { StyleSheet, View } from "react-native";
import {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CommunityScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedPost, setSelectedPost] = useState<any>(null); // For future use

  // Scroll animation values
  const scrollY = useSharedValue(0);

  // Scroll handler
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />

      {/* Post List */}
      <CommunityPostList scrollY={scrollY} onScroll={scrollHandler} />

      {/* Sticky Header */}
      <CommunityHeader scrollY={scrollY} />

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
});
