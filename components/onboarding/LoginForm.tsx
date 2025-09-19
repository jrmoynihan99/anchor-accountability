// components/LoginForm.tsx
import { AnonymousBadge } from "@/components/morphing/anonymous-badge/AnonymousBadge";
import { AnonymousBadgeModal } from "@/components/morphing/anonymous-badge/AnonymousBadgeModal";
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useTheme } from "../../hooks/useTheme";
import { ensureSignedIn } from "../../lib/auth";
import { auth } from "../../lib/firebase";
import { setHasOnboarded } from "../../lib/onboarding";
import { ThemedText } from "../ThemedText";

type LoadingButton = "auth" | "guest" | null;

interface LoginFormProps {
  email: string;
  setEmail: (email: string) => void;
  password: string;
  setPassword: (password: string) => void;
  isSignUp: boolean;
  setIsSignUp: (isSignUp: boolean) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
  showPassword: boolean;
  setShowPassword: (show: boolean) => void;
}

// Helper to show friendly errors
function showAuthError({
  error,
  isSignUp,
  setIsSignUp,
}: {
  error: any;
  isSignUp: boolean;
  setIsSignUp: (v: boolean) => void;
}) {
  const errorCode = error.code || "";

  if (isSignUp && errorCode === "auth/email-already-in-use") {
    Alert.alert(
      "Error",
      "Account already exists with this email",
      [
        {
          text: "Sign In",
          onPress: () => setIsSignUp(false),
        },
      ],
      { cancelable: true }
    );
  } else if (
    !isSignUp &&
    (errorCode === "auth/invalid-credential" ||
      errorCode === "auth/wrong-password" ||
      errorCode === "auth/user-not-found" ||
      errorCode === "auth/invalid-email")
  ) {
    Alert.alert(
      "Error",
      "Invalid Email or Password",
      [{ text: "OK", style: "default" }],
      { cancelable: true }
    );
  } else {
    Alert.alert(
      "Error",
      error.message || "Something went wrong. Please try again.",
      [{ text: "OK", style: "default" }]
    );
  }
}

export function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  isSignUp,
  setIsSignUp,
  loading: _loading, // <- not used anymore, but kept for API compatibility
  setLoading: _setLoading, // <- not used
  showPassword,
  setShowPassword,
}: LoginFormProps) {
  const { colors } = useTheme();
  const [loadingButton, setLoadingButton] = useState<LoadingButton>(null);

  const completeOnboarding = async () => {
    try {
      await setHasOnboarded();
      router.replace("/(tabs)");
    } catch (error) {
      console.error("Error saving onboarding status:", error);
      router.replace("/(tabs)");
    }
  };

  const handleEmailAuth = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingButton("auth");
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      await completeOnboarding();
    } catch (error: any) {
      showAuthError({ error, isSignUp, setIsSignUp });
    } finally {
      setLoadingButton(null);
    }
  };

  const handleContinueWithoutLogin = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingButton("guest");
    try {
      await ensureSignedIn(); // Sign in anonymously
      await completeOnboarding();
    } catch (error) {
      console.error("Error with anonymous sign in:", error);
      Alert.alert("Error", "Something went wrong. Please try again.");
    } finally {
      setLoadingButton(null);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.formContainer}>
        {/* Email Input */}
        <View style={[styles.inputShadow, { shadowColor: colors.shadow }]}>
          <BlurView
            intensity={20}
            tint="light"
            style={[
              styles.inputContainer,
              { borderColor: colors.modalCardBorder },
            ]}
          >
            <Ionicons name="mail" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Email"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </BlurView>
        </View>

        {/* Password Input */}
        <View style={[styles.inputShadow, { shadowColor: colors.shadow }]}>
          <BlurView
            intensity={20}
            tint="light"
            style={[
              styles.inputContainer,
              { borderColor: colors.modalCardBorder },
            ]}
          >
            <Ionicons
              name="lock-closed"
              size={20}
              color={colors.textSecondary}
            />
            <TextInput
              style={[styles.input, { color: colors.text }]}
              placeholder="Password"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeButton}
            >
              <Ionicons
                name={showPassword ? "eye-off" : "eye"}
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Auth Toggle */}
        <TouchableOpacity
          style={styles.toggleContainer}
          onPress={() => setIsSignUp(!isSignUp)}
        >
          <ThemedText
            type="caption"
            style={[styles.toggleText, { color: colors.textSecondary }]}
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </ThemedText>
        </TouchableOpacity>

        {/* Main Auth Button */}
        <View style={[styles.buttonShadow, { shadowColor: colors.shadow }]}>
          <TouchableOpacity
            style={[styles.authButton, { backgroundColor: colors.tint }]}
            onPress={handleEmailAuth}
            disabled={loadingButton !== null}
            activeOpacity={0.8}
          >
            {loadingButton === "auth" ? (
              <ActivityIndicator color={colors.background} size="small" />
            ) : (
              <ThemedText
                type="buttonLarge"
                style={[styles.buttonText, { color: colors.background }]}
              >
                {isSignUp ? "Create Account" : "Sign In"}
              </ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerContainer}>
          <View
            style={[styles.divider, { backgroundColor: colors.textSecondary }]}
          />
          <ThemedText
            type="caption"
            style={[styles.dividerText, { color: colors.textSecondary }]}
          >
            or
          </ThemedText>
          <View
            style={[styles.divider, { backgroundColor: colors.textSecondary }]}
          />
        </View>

        {/* Continue Without Login */}
        <View style={[styles.buttonShadow, { shadowColor: colors.shadow }]}>
          <BlurView
            intensity={15}
            tint="light"
            style={[
              styles.guestButtonContainer,
              { borderColor: colors.modalCardBorder },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.guestButton,
                { backgroundColor: colors.whiteTranslucent },
              ]}
              onPress={handleContinueWithoutLogin}
              disabled={loadingButton !== null}
              activeOpacity={0.8}
            >
              {loadingButton === "guest" ? (
                <ActivityIndicator color={colors.text} size="small" />
              ) : (
                <>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={colors.text}
                  />
                  <ThemedText
                    type="bodyMedium"
                    style={[styles.guestButtonText, { color: colors.text }]}
                  >
                    Continue Without Account
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </BlurView>
        </View>

        {/* Anonymous Badge - Interactive Modal */}
        <ButtonModalTransitionBridge
          modalWidthPercent={0.8}
          modalHeightPercent={0.5}
        >
          {({
            open,
            close,
            isModalVisible,
            progress,
            modalAnimatedStyle,
            buttonAnimatedStyle,
            buttonRef,
            handlePressIn,
            handlePressOut,
          }) => (
            <>
              <AnonymousBadge
                buttonRef={buttonRef}
                style={[buttonAnimatedStyle, { marginBottom: 12 }]}
                onPress={open}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                text="What's the Difference?"
                icon="questionmark.circle" // <<--- Explicit icon
                iconColor={colors.textSecondary} // <<--- Explicit color
                textColor={colors.textSecondary} // <<--- (optional: match modal style)
              />
              <AnonymousBadgeModal
                isVisible={isModalVisible}
                progress={progress}
                modalAnimatedStyle={modalAnimatedStyle}
                close={close}
              />
            </>
          )}
        </ButtonModalTransitionBridge>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <ThemedText
          type="small"
          style={[styles.footerText, { color: colors.textSecondary }]}
        >
          By continuing, you agree to our Terms of Service and Privacy Policy
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "space-between",
  },
  formContainer: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 50,
  },
  inputShadow: {
    marginBottom: 16,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    overflow: "hidden",
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  eyeButton: {
    padding: 8,
  },
  toggleContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  toggleText: {
    textDecorationLine: "underline",
  },
  buttonShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  authButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    marginBottom: 8,
  },
  buttonText: {
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    textAlign: "center",
  },
  guestButtonContainer: {
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    overflow: "hidden",
  },
  guestButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  guestButtonText: {
    fontWeight: "500",
  },
  footer: {
    paddingBottom: 32,
  },
  footerText: {
    textAlign: "center",
    opacity: 0.8,
  },
});
