// components/onboarding/church-selection/ChurchSelectionView.tsx
import { BackButton } from "@/components/BackButton";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { OrganizationData } from "@/hooks/onboarding/useOrganizations";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { ChurchListItem } from "./ChurchListItem";
import { ChurchSearchBar } from "./ChurchSearchBar";
import { EmptyChurchState } from "./EmptyChurchState";
import { GuestContinueButton } from "./GuestContinueButton";

interface ChurchSelectionViewProps {
  organizations: OrganizationData[];
  loading: boolean;
  error: string | null;
  onChurchSelect: (org: OrganizationData) => void;
  onGuestContinue: () => void;
  onBack: () => void;
}

export function ChurchSelectionView({
  organizations,
  loading,
  error,
  onChurchSelect,
  onGuestContinue,
  onBack,
}: ChurchSelectionViewProps) {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  // Filter organizations based on search
  const filteredOrganizations = organizations.filter((org) =>
    org.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleChurchSelect = (org: OrganizationData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChurchSelect(org);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton onPress={onBack} style={styles.backButtonSpacing} />
        <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
          How are you joining?
        </ThemedText>
      </View>

      <ChurchSearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      ) : error ? (
        <View style={styles.centerContent}>
          <ThemedText type="body" style={{ color: colors.error }}>
            {error}
          </ThemedText>
        </View>
      ) : (
        <>
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {filteredOrganizations.length === 0 ? (
              <EmptyChurchState />
            ) : (
              filteredOrganizations.map((org) => (
                <ChurchListItem
                  key={org.id}
                  name={org.name}
                  onPress={() => handleChurchSelect(org)}
                />
              ))
            )}
          </ScrollView>

          <View style={styles.divider}>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
            <ThemedText
              type="caption"
              style={[styles.dividerText, { color: colors.textSecondary }]}
            >
              OR
            </ThemedText>
            <View
              style={[styles.dividerLine, { backgroundColor: colors.border }]}
            />
          </View>

          <GuestContinueButton onPress={onGuestContinue} />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 16,
    paddingBottom: 24,
  },
  backButtonSpacing: {
    marginRight: 16,
  },
  title: {
    fontWeight: "600",
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 12,
  },
});
