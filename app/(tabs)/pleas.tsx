// app/(tabs)/pleas.tsx
import { MyReachOutsSection } from "@/components/morphing/messages/my-reach-outs/MyReachOutsSection";
import { PendingPleasSection } from "@/components/morphing/messages/plea/PendingPleasSection";
import { useTheme } from "@/hooks/ThemeContext";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, StyleSheet, View, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";

export default function PleasScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();

  // These should match your other screens for consistency:
  const BLUR_HEIGHT = insets.top;
  const MASK_HEIGHT = 24; // tweak if you want a longer fade

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
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

      {/* Blur Header with MaskedView */}
      <View
        style={[
          styles.blurHeader,
          { height: BLUR_HEIGHT + MASK_HEIGHT, pointerEvents: "none" },
        ]}
      >
        <MaskedView
          style={{ flex: 1 }}
          maskElement={
            <LinearGradient
              colors={["rgba(0,0,0,1)", "rgba(0,0,0,0)"]}
              locations={[0.4, 1]} // 0.4=40% blurred, 60% fade
              style={{ flex: 1 }}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
            />
          }
        >
          <BlurView
            intensity={50}
            tint={effectiveTheme === "dark" ? "dark" : "light"}
            style={{ flex: 1 }}
          >
            <View
              style={{
                ...StyleSheet.absoluteFillObject,
                backgroundColor: colors.background,
                opacity: Platform.OS === "ios" ? 0.4 : 0.95,
              }}
            />
          </BlurView>
        </MaskedView>
      </View>
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
  blurHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
  },
});
