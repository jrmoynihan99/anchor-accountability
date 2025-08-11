// login.tsx
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
  withTiming,
} from "react-native-reanimated";
import { Colors } from "../../constants/Colors";
import { useColorScheme } from "../../hooks/useColorScheme";
import { LoginForm } from "./components/LoginForm";
import { LoginHeader } from "./components/LoginHeader";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  // Smooth keyboard animation
  const keyboard = useAnimatedKeyboard();
  const translateY = useDerivedValue(() => {
    return withTiming(-keyboard.height.value * 0.5, {
      duration: 50,
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
