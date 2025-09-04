// app/(tabs)/pleas.tsx
import { MyReachOutsSection } from "@/components/morphing/messages/my-reach-outs/MyReachOutsSection";
import { PendingPleasSection } from "@/components/morphing/messages/plea/PendingPleasSection";
import { useTheme } from "@/hooks/ThemeContext";
import { useTabFadeAnimation } from "@/hooks/useTabFadeAnimation";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Animated, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PleasScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const fadeStyle = useTabFadeAnimation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
      <Animated.View style={[{ flex: 1 }, fadeStyle]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + 20,
              paddingBottom: insets.bottom + 120,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="always"
          keyboardDismissMode="interactive"
        >
          {/* Pending Requests Section */}
          <PendingPleasSection />

          {/* My Reach Outs Section */}
          <MyReachOutsSection />
        </ScrollView>
      </Animated.View>
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
