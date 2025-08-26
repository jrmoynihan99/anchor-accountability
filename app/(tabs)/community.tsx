// app/(tabs)/community.tsx
import { CommunityPostList } from "@/components/community/CommunityPostList";
import { CreatePostFAB } from "@/components/community/CreatePostFAB";
import { useTheme } from "@/hooks/ThemeContext";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CommunityScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />

      {/* Post List */}
      <CommunityPostList />

      {/* Floating Action Button */}
      <CreatePostFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "flex-start",
  },
});
