import { OnboardingNextButton } from "@/components/onboarding/narrative/OnboardingNextButton";
import {
  Closing,
  CommitReachOut,
  CommitSupport,
  Greeting,
  HowItWorks,
  IntroAnchor,
  Problem1,
  Problem1b,
  Problem2,
  Reinforcement,
  TheEnemy,
  TheExperience,
  TheWeight,
} from "@/components/onboarding/narrative/steps";
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useRef, useState } from "react";
import { Animated, StatusBar, StyleSheet, View } from "react-native";
import { useOnboardingContext } from "./_layout";

const FADE_DURATION = 300;

export default function NarrativeScreen() {
  const { colors } = useTheme();
  const { deferredOrgId } = useOnboardingContext();
  const [step, setStep] = useState(0);
  const [nextVisible, setNextVisible] = useState(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const isTransitioning = useRef(false);

  const isCommitmentStep = step === 9 || step === 11;

  const goToNext = () => {
    if (isTransitioning.current) return;
    isTransitioning.current = true;
    setNextVisible(false);

    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: FADE_DURATION,
      useNativeDriver: true,
    }).start(() => {
      setStep((prev) => prev + 1);

      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: FADE_DURATION,
        useNativeDriver: true,
      }).start(() => {
        isTransitioning.current = false;
      });
    });
  };

  const advancePastNarrative = () => {
    if (deferredOrgId) {
      router.push("/onboarding/community");
    } else {
      router.push("/onboarding/login");
    }
  };

  const renderStep = () => {
    switch (step) {
      case 0:
        return <Greeting onReady={() => setNextVisible(true)} />;
      case 1:
        return <Problem1 onReady={() => setNextVisible(true)} />;
      case 2:
        return <Problem1b onReady={() => setNextVisible(true)} />;
      case 3:
        return <Problem2 onReady={() => setNextVisible(true)} />;
      case 4:
        return <TheWeight onReady={() => setNextVisible(true)} />;
      case 5:
        return <TheEnemy onReady={() => setNextVisible(true)} />;
      case 6:
        return <IntroAnchor onReady={() => setNextVisible(true)} />;
      case 7:
        return <HowItWorks onReady={() => setNextVisible(true)} />;
      case 8:
        return <TheExperience onReady={() => setNextVisible(true)} />;
      case 9:
        return <CommitReachOut onCommit={goToNext} />;
      case 10:
        return <Reinforcement onReady={() => setNextVisible(true)} />;
      case 11:
        return <CommitSupport onCommit={goToNext} onSkip={goToNext} />;
      case 12:
        return <Closing onReady={() => setNextVisible(true)} />;
      default:
        return null;
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
        start={{ x: 0.5, y: 0.5 }}
        end={{ x: 1, y: 1 }}
      >
        <Animated.View
          key={step}
          style={[styles.content, { opacity: fadeAnim }]}
        >
          {renderStep()}
        </Animated.View>

        {!isCommitmentStep && (
          <OnboardingNextButton
            visible={nextVisible}
            onPress={step === 12 ? advancePastNarrative : goToNext}
            icon={step === 12 ? "checkmark" : "arrow-forward"}
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
  content: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: "center",
    paddingBottom: "20%",
  },
});
