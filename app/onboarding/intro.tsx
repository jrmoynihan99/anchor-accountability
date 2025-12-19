import { useTheme } from "@/context/ThemeContext";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Dimensions, StatusBar, StyleSheet, View } from "react-native";
import { IntroContinueButton } from "../../components/onboarding/IntroContinueButton";
import { IntroFeaturesCard } from "../../components/onboarding/IntroFeaturesCard";
import { IntroHeader } from "../../components/onboarding/IntroHeader";
import { IntroScrollableMessage } from "../../components/onboarding/IntroScrollableMessage";

const { width, height } = Dimensions.get("window");

export default function IntroScreen() {
  const handleContinue = () => {
    router.push("/onboarding/login");
  };

  const { colors } = useTheme();

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
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Main Glass Card */}
          <View style={[styles.mainCardShadow, { shadowColor: colors.shadow }]}>
            <BlurView
              intensity={20}
              tint="light"
              style={[
                styles.mainCard,
                {
                  borderColor: colors.modalCardBorder,
                },
              ]}
            >
              <IntroHeader />
              <IntroScrollableMessage />
            </BlurView>
          </View>

          {/* Features Card */}
          <IntroFeaturesCard />
        </View>

        {/* Bottom CTA */}
        <IntroContinueButton onPress={handleContinue} />
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: "space-between",
    paddingVertical: 20,
    paddingBottom: 10,
  },
  mainCardShadow: {
    flex: 1,
    marginTop: 20,
    marginBottom: 16,
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  mainCard: {
    flex: 1,
    borderRadius: 24,
    padding: 24,
    borderWidth: 0,
    overflow: "hidden",
  },
});
