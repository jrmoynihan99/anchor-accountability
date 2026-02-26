import { OnboardingNextButton } from "@/components/onboarding/narrative/OnboardingNextButton";
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar, StyleSheet, View } from "react-native";

interface OnboardingScreenProps {
  children: React.ReactNode;
  onNext?: () => void;
  nextVisible?: boolean;
  showNextButton?: boolean;
}

export function OnboardingScreen({
  children,
  onNext,
  nextVisible = false,
  showNextButton = true,
}: OnboardingScreenProps) {
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
        <View style={styles.content}>{children}</View>

        {showNextButton && onNext && (
          <OnboardingNextButton visible={nextVisible} onPress={onNext} />
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
  content: {
    flex: 1,
    paddingHorizontal: 32,
    paddingTop: "40%",
  },
});
