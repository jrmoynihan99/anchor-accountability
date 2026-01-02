// app/onboarding/church-selection.tsx
import { useTheme } from "@/context/ThemeContext";
import { useOrganizations } from "@/hooks/onboarding/useOrganizations";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { ChurchSelectionView } from "../../components/onboarding/church-selection/ChurchSelectionView";
import { PinEntryView } from "../../components/onboarding/church-selection/PinEntryView";

export default function ChurchSelectionScreen() {
  const { colors } = useTheme();
  const { organizations, loading, error } = useOrganizations();

  const [selectedChurch, setSelectedChurch] = useState<{
    id: string;
    name: string;
    pin: string;
    mission: string;
  } | null>(null);

  const handleChurchSelect = (org: {
    id: string;
    name: string;
    pin: string;
    mission: string;
  }) => {
    setSelectedChurch(org);
  };

  const handlePinSuccess = (
    organizationId: string,
    organizationName: string
  ) => {
    router.push({
      pathname: "/onboarding/login",
      params: {
        organizationId,
        organizationName,
      },
    });
  };

  const handleGuestContinue = () => {
    router.push({
      pathname: "/onboarding/login",
      params: {
        organizationId: "public",
        organizationName: "Guest",
      },
    });
  };

  const handleBack = () => {
    if (selectedChurch) {
      setSelectedChurch(null);
    } else {
      router.back();
    }
  };

  return (
    <View
      style={[styles.container, { backgroundColor: colors.cardBackground }]}
    >
      <StatusBar
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent
      />
      <LinearGradient
        colors={[colors.cardBackground, colors.tint]}
        style={styles.gradient}
        start={{ x: 0.2, y: 0.2 }}
        end={{ x: 1, y: 1 }}
      >
        {selectedChurch ? (
          <PinEntryView
            church={selectedChurch}
            onBack={handleBack}
            onSuccess={handlePinSuccess}
          />
        ) : (
          <ChurchSelectionView
            organizations={organizations}
            loading={loading}
            error={error}
            onChurchSelect={handleChurchSelect}
            onGuestContinue={handleGuestContinue}
            onBack={handleBack}
          />
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 44,
  },
});
