import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  StatusBar,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  useAnimatedKeyboard,
  useAnimatedStyle,
  useDerivedValue,
  withSpring,
} from "react-native-reanimated";
import { LoginForm } from "../../components/onboarding/login/LoginForm";
import { LoginHeader } from "../../components/onboarding/login/LoginHeader";
import { setHasOnboarded } from "../../lib/onboarding";
import { useOnboardingContext } from "./_layout";

export default function LoginScreen() {
  // Get organization params from route
  const params = useLocalSearchParams<{
    organizationId?: string;
    organizationName?: string;
  }>();

  // Get deferred org from onboarding context (persists across navigation)
  const {
    deferredOrgId: contextDeferredOrgId,
    deferredOrgName: contextDeferredOrgName,
    deepLinkedOrgIds,
  } = useOnboardingContext();

  // State for selected organization (can be updated from modal)
  const [organizationId, setOrganizationId] = useState(
    params.organizationId || contextDeferredOrgId || "public",
  );
  const [organizationName, setOrganizationName] = useState(
    params.organizationName || contextDeferredOrgName || "Guest",
  );

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isChurchModalVisible, setIsChurchModalVisible] = useState(false);

  const { colors } = useTheme();

  // Mark onboarding complete once user reaches login screen
  useEffect(() => {
    setHasOnboarded();
  }, []);

  // Set deferred org from context when it loads
  useEffect(() => {
    if (contextDeferredOrgId && !params.organizationId) {
      setOrganizationId(contextDeferredOrgId);
      setOrganizationName(contextDeferredOrgName || "Guest");
    }
  }, [contextDeferredOrgId, contextDeferredOrgName, params.organizationId]);

  // Handle church selection from modal
  const handleChurchSelected = (orgId: string, orgName: string) => {
    setOrganizationId(orgId);
    setOrganizationName(orgName);
  };

  // Smooth keyboard animation - only when modal is NOT visible
  const keyboard = useAnimatedKeyboard();
  const translateY = useDerivedValue(() => {
    // Don't animate if church modal is open
    if (isChurchModalVisible) {
      return 0;
    }
    return withSpring(-keyboard.height.value * 0.5, {
      damping: 20,
      stiffness: 100,
      mass: 0.5,
    });
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: translateY.value }],
    };
  });

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
          <Animated.View style={[styles.content, animatedStyle]}>
            <LoginHeader
              isSignUp={isSignUp}
              onBackPress={() => router.back()}
              showBack={false}
            />

            <LoginForm
              email={email}
              setEmail={setEmail}
              password={password}
              setPassword={setPassword}
              isSignUp={isSignUp}
              setIsSignUp={setIsSignUp}
              loading={loading}
              setLoading={setLoading}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              organizationId={organizationId}
              organizationName={organizationName}
              deepLinkedOrgIds={deepLinkedOrgIds}
              onChurchSelected={handleChurchSelected}
              onChurchModalVisibilityChange={setIsChurchModalVisible}
            />
          </Animated.View>
        </LinearGradient>
      </View>
    </TouchableWithoutFeedback>
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
    paddingHorizontal: 24,
  },
});
