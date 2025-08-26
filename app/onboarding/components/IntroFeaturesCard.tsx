// components/IntroFeaturesCard.tsx
import { useTheme } from "@/hooks/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React from "react";
import { StyleSheet, View } from "react-native";
import { ThemedText } from "../../../components/ThemedText";

export function IntroFeaturesCard() {
  const { colors } = useTheme();

  const features = [
    { icon: "eye-off", text: "100% Anonymous" },
    { icon: "people", text: "Real accountability partners" },
    { icon: "time", text: "Available 24/7" },
    { icon: "heart", text: "Judgment-free support" },
  ];

  return (
    <View style={styles.featuresCardShadow}>
      <BlurView
        intensity={20}
        tint="light"
        style={[
          styles.featuresCard,
          {
            borderColor: colors.modalCardBorder,
          },
        ]}
      >
        <View style={styles.featuresContainer}>
          {features.map((feature, index) => (
            <View key={index} style={styles.feature}>
              <View
                style={[
                  styles.featureIcon,
                  {
                    backgroundColor: colors.iconCircleSecondaryBackground,
                    borderColor: `${colors.icon}33`, // Adding 33 for 20% opacity
                  },
                ]}
              >
                <Ionicons
                  name={feature.icon as any}
                  size={20}
                  color={colors.icon}
                />
              </View>
              <ThemedText
                type="bodyMedium"
                style={[styles.featureText, { color: colors.textSecondary }]}
              >
                {feature.text}
              </ThemedText>
            </View>
          ))}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  featuresCardShadow: {
    marginBottom: 12,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  featuresCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    overflow: "hidden",
  },
  featuresContainer: {
    gap: 16,
  },
  feature: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
  },
  featureText: {
    fontWeight: "500",
  },
});
