// components/onboarding/login/church-indicator/ChurchListView.tsx
import { ChurchListItem } from "@/components/morphing/login/church-badge/ChurchListItem";
import { ChurchSearchBar } from "@/components/morphing/login/church-badge/ChurchSearchBar";
import { EmptyChurchState } from "@/components/morphing/login/church-badge/EmptyChurchState";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { OrganizationData } from "@/hooks/onboarding/useOrganizations";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface ChurchListViewProps {
  organizations: OrganizationData[];
  loading: boolean;
  error: string | null;
  onChurchSelect: (org: OrganizationData) => void;
  onClearSelection: () => void;
  onClose: () => void;
  currentlySelectedId?: string;
}

export function ChurchListView({
  organizations,
  loading,
  error,
  onChurchSelect,
  onClearSelection,
  onClose,
  currentlySelectedId,
}: ChurchListViewProps) {
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

  const handleClearSelection = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onClearSelection();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
          Select Your Church
        </ThemedText>
      </View>

      <ChurchSearchBar value={searchQuery} onChangeText={setSearchQuery} />

      {/* Show clear selection button if a church is currently selected */}
      {currentlySelectedId && currentlySelectedId !== "public" && (
        <TouchableOpacity
          style={[
            styles.clearButton,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
          onPress={handleClearSelection}
          activeOpacity={0.7}
        >
          <Ionicons name="close-circle" size={20} color={colors.error} />
          <ThemedText type="body" style={{ color: colors.error }}>
            Clear Selection
          </ThemedText>
        </TouchableOpacity>
      )}

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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {filteredOrganizations.length === 0 ? (
            <EmptyChurchState />
          ) : (
            filteredOrganizations.map((org) => (
              <ChurchListItem
                key={org.id}
                name={org.name}
                onPress={() => handleChurchSelect(org)}
                isSelected={org.id === currentlySelectedId}
              />
            ))
          )}
        </ScrollView>
      )}

      <View
        style={[
          styles.footer,
          {
            borderTopColor: colors.border,
          },
        ]}
      >
        <ThemedText
          type="caption"
          style={[styles.footerText, { color: colors.textSecondary }]}
        >
          <Ionicons
            name="information-circle-outline"
            size={14}
            color={colors.textSecondary}
          />{" "}
          You will only interact with other members who join through your
          church. Your identity is kept completely anonymous.
        </ThemedText>
      </View>
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
    paddingTop: 0,
    paddingBottom: 24,
  },
  backButtonSpacing: {
    marginRight: 16,
  },
  title: {
    fontWeight: "600",
    flex: 1,
  },
  clearButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
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
  footer: {
    paddingVertical: 12,
    borderTopWidth: 1,
  },

  footerText: {
    lineHeight: 18,
  },
});
