// app/(tabs)/pleas.tsx
import { MyReachOutsSection } from "@/components/morphing/pleas/my-reach-outs/MyReachOutsSection";
import { PendingPleasSection } from "@/components/morphing/pleas/plea/PendingPleasSection";
import { useOrganization } from "@/context/OrganizationContext";
import { useTheme } from "@/context/ThemeContext";
import { useUnreadCount } from "@/hooks/messages/useUnreadCount";
import { markPleasAsSeen } from "@/lib/firebase";
import { useFocusEffect } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function PleasScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const { organizationId } = useOrganization();
  const { refreshUnreadCount } = useUnreadCount();

  // Mark pleas as seen when tab is focused, then refresh badge
  useFocusEffect(
    useCallback(() => {
      if (!organizationId) return;
      markPleasAsSeen(organizationId)
        .then(() => refreshUnreadCount())
        .catch(console.error);
    }, [organizationId, refreshUnreadCount])
  );

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
