// app/accountability-dashboard.tsx
import { AccountabilityPartnerSelector } from "@/components/AccountabilityPartnerSelector";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useAccountabilityRelationships } from "@/hooks/useAccountabilityRelationships";
import { router, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { ScrollView, StyleSheet, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AccountabilityDashboardScreen() {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();

  // Get relationship ID from params
  const relationshipId = params.relationshipId as string;
  const initialRole = params.role as "mentor" | "mentee"; // Whether this person is mentor or mentee to me

  const { mentor, mentees, loading } = useAccountabilityRelationships();

  const [selectedRelationshipId, setSelectedRelationshipId] =
    useState<string>(relationshipId);
  const [selectedRole, setSelectedRole] = useState<"mentor" | "mentee">(
    initialRole
  );

  // Find the current relationship data
  const currentRelationship =
    selectedRole === "mentor"
      ? mentor
      : mentees.find((m) => m.id === selectedRelationshipId);

  const partnerUid =
    selectedRole === "mentor"
      ? currentRelationship?.mentorUid
      : currentRelationship?.menteeUid;

  // Handle partner selection from dropdown
  const handlePartnerSelect = (
    newRelationshipId: string,
    role: "mentor" | "mentee"
  ) => {
    setSelectedRelationshipId(newRelationshipId);
    setSelectedRole(role);

    // Update the URL params without stacking a new screen
    router.setParams({
      relationshipId: newRelationshipId,
      role: role,
    });
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <ThemedText type="body" style={{ color: colors.textSecondary }}>
            Loading dashboard...
          </ThemedText>
        </View>
      </View>
    );
  }

  if (!currentRelationship) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
        <View style={styles.loadingContainer}>
          <ThemedText type="body" style={{ color: colors.textSecondary }}>
            Relationship not found
          </ThemedText>
          <TouchableOpacity
            style={[styles.errorButton, { backgroundColor: colors.tint }]}
            onPress={handleBack}
          >
            <ThemedText type="body" style={{ color: colors.white }}>
              Go Back
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 8,
            backgroundColor: colors.background,
            borderBottomColor: colors.border,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBack}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <IconSymbol name="chevron.left" size={24} color={colors.text} />
        </TouchableOpacity>

        <ThemedText type="titleLarge" style={{ color: colors.text }}>
          Accountability
        </ThemedText>

        <View style={styles.headerSpacer} />
      </View>

      {/* Partner Selector Dropdown */}
      <AccountabilityPartnerSelector
        mentor={mentor}
        mentees={mentees}
        selectedRelationshipId={selectedRelationshipId}
        selectedRole={selectedRole}
        onPartnerSelect={handlePartnerSelect}
      />

      {/* Dashboard Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Placeholder: Current Partner Info */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <ThemedText type="title" style={{ marginBottom: 12 }}>
            {selectedRole === "mentor" ? "Your Mentor" : "Your Mentee"}
          </ThemedText>
          <ThemedText type="body" style={{ color: colors.textSecondary }}>
            user-{partnerUid?.slice(0, 5)}
          </ThemedText>
        </View>

        {/* Placeholder: Streak Info */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <ThemedText type="title" style={{ marginBottom: 12 }}>
            Streak
          </ThemedText>
          <View style={styles.streakDisplay}>
            <ThemedText style={{ fontSize: 48 }}>🔥</ThemedText>
            <ThemedText type="titleLarge" style={{ marginLeft: 16 }}>
              {currentRelationship.streak} days
            </ThemedText>
          </View>
          <ThemedText
            type="caption"
            style={{ color: colors.textSecondary, marginTop: 12 }}
          >
            Last check-in: {currentRelationship.lastCheckIn || "Never"}
          </ThemedText>
        </View>

        {/* Placeholder: More dashboard content will go here */}
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
        >
          <ThemedText type="title" style={{ marginBottom: 12 }}>
            Dashboard Content
          </ThemedText>
          <ThemedText type="body" style={{ color: colors.textSecondary }}>
            More accountability dashboard features will be built here...
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerSpacer: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  card: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  streakDisplay: {
    flexDirection: "row",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorButton: {
    marginTop: 16,
    padding: 12,
    borderRadius: 8,
  },
});
