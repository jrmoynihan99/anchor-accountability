// components/morphing/login/forgot-password/ForgotPasswordModal.tsx
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/context/ThemeContext";
import { resendVerificationEmail, sendPasswordReset } from "@/lib/authHelpers";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SharedValue } from "react-native-reanimated";
import { BaseModal } from "../../BaseModal";
import { ForgotPasswordButton } from "./ForgotPasswordButton";

interface ForgotPasswordModalProps {
  isVisible: boolean;
  progress: SharedValue<number>;
  modalAnimatedStyle: any;
  close: (velocity?: number) => void;
}

export function ForgotPasswordModal({
  isVisible,
  progress,
  modalAnimatedStyle,
  close,
}: ForgotPasswordModalProps) {
  const { colors, effectiveTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showUnverifiedPrompt, setShowUnverifiedPrompt] = useState(false);
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const handleReset = () => {
    setEmail("");
    setShowUnverifiedPrompt(false);
    setLoading(false);
    setIsResendingVerification(false);
  };

  const handleSendReset = async () => {
    if (!email || !email.trim()) {
      Alert.alert("Error", "Please enter your email address");
      return;
    }

    setLoading(true);
    setShowUnverifiedPrompt(false);

    try {
      await sendPasswordReset(email);
      Alert.alert(
        "Email Sent",
        "Password reset instructions have been sent to your email. Please check your inbox.",
        [
          {
            text: "OK",
            onPress: () => {
              handleReset();
              close();
            },
          },
        ]
      );
    } catch (error: any) {
      // Check if it's an unverified email error
      if (error.message === "UNVERIFIED_EMAIL") {
        setShowUnverifiedPrompt(true);
      } else {
        Alert.alert("Error", error.message || "Failed to send reset email");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    try {
      // Note: This won't work for logged-out users
      // We're just attempting it in case they're logged in
      await resendVerificationEmail();
      Alert.alert(
        "Verification Email Sent",
        "Please check your inbox and verify your email before resetting your password.",
        [
          {
            text: "OK",
            onPress: () => {
              handleReset();
              close();
            },
          },
        ]
      );
    } catch (error: any) {
      // If they're not logged in, show a generic message
      Alert.alert(
        "Verification Required",
        "Please sign in and verify your email before resetting your password. Check your inbox for the verification email sent when you created your account."
      );
    } finally {
      setIsResendingVerification(false);
    }
  };

  // Use the same button component for morphing!
  const buttonContent = (
    <ForgotPasswordButton style={{ alignSelf: "center" }} />
  );

  return (
    <BaseModal
      isVisible={isVisible}
      progress={progress}
      modalAnimatedStyle={modalAnimatedStyle}
      close={() => {
        handleReset();
        close();
      }}
      theme={effectiveTheme ?? "dark"}
      backgroundColor={colors.modalCardBackground}
      buttonContent={buttonContent}
      buttonContentOpacityRange={[0, 0.2]}
      buttonContentPadding={0}
    >
      {/* Modal content with semi-transparent background */}
      <View
        style={[
          styles.modalContentWrapper,
          { backgroundColor: `${colors.cardBackground}B3` },
        ]}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.modalContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
        >
          <ThemedText
            type="title"
            style={[styles.title, { color: colors.text }]}
          >
            Reset Password
          </ThemedText>

          <ThemedText
            type="caption"
            style={[styles.subtitle, { color: colors.textSecondary }]}
          >
            Enter your email address and we'll send you instructions to reset
            your password
          </ThemedText>

          {!showUnverifiedPrompt ? (
            <>
              {/* Email Input */}
              <View
                style={[styles.inputShadow, { shadowColor: colors.shadow }]}
              >
                <BlurView
                  intensity={20}
                  tint="light"
                  style={[
                    styles.inputContainer,
                    { borderColor: colors.modalCardBorder },
                  ]}
                >
                  <Ionicons
                    name="mail"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="Email"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    editable={!loading}
                  />
                </BlurView>
              </View>

              {/* Send Button */}
              <View
                style={[styles.buttonShadow, { shadowColor: colors.shadow }]}
              >
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    { backgroundColor: colors.tint },
                    loading && styles.disabledButton,
                  ]}
                  onPress={handleSendReset}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  {loading ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <ThemedText
                      type="buttonLarge"
                      style={{ color: colors.background }}
                    >
                      Send Reset Email
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </>
          ) : (
            // Unverified Email Prompt
            <View style={styles.unverifiedContainer}>
              <View
                style={[
                  styles.warningBox,
                  {
                    backgroundColor: colors.cardBackground,
                    borderColor: colors.border,
                  },
                ]}
              >
                <Ionicons
                  name="warning"
                  size={32}
                  color={colors.textSecondary}
                  style={styles.warningIcon}
                />
                <ThemedText
                  type="body"
                  style={[styles.warningText, { color: colors.text }]}
                >
                  Your email address is not verified. Please verify your email
                  before resetting your password.
                </ThemedText>
              </View>

              {/* Resend Verification Button */}
              <View
                style={[styles.buttonShadow, { shadowColor: colors.shadow }]}
              >
                <TouchableOpacity
                  style={[
                    styles.sendButton,
                    { backgroundColor: colors.tint },
                    isResendingVerification && styles.disabledButton,
                  ]}
                  onPress={handleResendVerification}
                  disabled={isResendingVerification}
                  activeOpacity={0.8}
                >
                  {isResendingVerification ? (
                    <ActivityIndicator color={colors.background} size="small" />
                  ) : (
                    <ThemedText
                      type="buttonLarge"
                      style={{ color: colors.background }}
                    >
                      Resend Verification Email
                    </ThemedText>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Cancel Button */}
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => {
              handleReset();
              close();
            }}
            disabled={loading || isResendingVerification}
          >
            <ThemedText
              type="body"
              style={[styles.cancelText, { color: colors.textSecondary }]}
            >
              Cancel
            </ThemedText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </BaseModal>
  );
}

const styles = StyleSheet.create({
  modalContentWrapper: {
    flex: 1,
    borderRadius: 28,
    margin: -24, // Counteract BaseModal's padding
    padding: 24,
  },
  scrollView: {
    flex: 1,
  },
  modalContent: {
    marginTop: 60,
    paddingBottom: 40,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.8,
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
  buttonShadow: {
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 16,
  },
  sendButton: {
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  cancelText: {
    textDecorationLine: "underline",
  },
  unverifiedContainer: {
    gap: 20,
  },
  warningBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    alignItems: "center",
    gap: 12,
  },
  warningIcon: {
    marginBottom: 4,
  },
  warningText: {
    textAlign: "center",
    lineHeight: 22,
  },
});
