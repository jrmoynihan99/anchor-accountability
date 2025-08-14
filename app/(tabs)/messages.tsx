// app/(tabs)/messages.tsx
import { MessageThreadsSection } from "@/components/messages/MessageThreadsSection";
import { MyReachOutsSection } from "@/components/morphing/messages/my-reach-outs/MyReachOutsSection";
import { PendingPleasSection } from "@/components/morphing/messages/plea/PendingPleasSection";
import { Colors } from "@/constants/Colors";
import { useColorScheme } from "@/hooks/useColorScheme";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function MessagesScreen() {
  const theme = useColorScheme();
  const bgColor = Colors[theme ?? "dark"].background;
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: bgColor }]}>
      <StatusBar style={theme === "dark" ? "light" : "dark"} />
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
      >
        {/* Pending Requests Section */}
        <PendingPleasSection />

        {/* My Reach Outs Section */}
        <MyReachOutsSection />

        {/* Message Threads Section */}
        <MessageThreadsSection />
      </ScrollView>
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
