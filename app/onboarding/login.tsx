// app/onboarding/login.tsx
import { useTheme } from "@/context/ThemeContext";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
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

export default function LoginScreen() {
  // Get organization params from route
  const params = useLocalSearchParams<{
    organizationId?: string;
    organizationName?: string;
  }>();

  const organizationId = params.organizationId || "public";
  const organizationName = params.organizationName || "Guest";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { colors } = useTheme();

  // Smooth keyboard animation
  const keyboard = useAnimatedKeyboard();
  const translateY = useDerivedValue(() => {
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
