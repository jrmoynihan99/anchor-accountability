// components/morphing/settings/ConvertAccountView.tsx
import { BackButton } from "@/components/BackButton";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { convertAnonymousToEmail } from "@/lib/auth";
import * as Haptics from "expo-haptics";
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

interface ConvertAccountViewProps {
  onBackPress: () => void;
  colors: any;
}

export function ConvertAccountView({
  onBackPress,
  colors,
}: ConvertAccountViewProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Validation
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await convertAnonymousToEmail(email.trim(), password);

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Success!
      Alert.alert(
        "Success!",
        "Your account has been converted. You can now sign in with your email and password anytime!",
        [
          {
            text: "OK",
            style: "default",
            onPress: onBackPress,
          },
        ]
      );

      // Reset form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Error", error.message || "Failed to convert account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton
          onPress={onBackPress}
          size={36}
          iconSize={18}
          backgroundColor={colors.buttonBackground}
        />
        <View style={{ flex: 1, alignItems: "center" }}>
          <ThemedText
            type="title"
            style={[styles.title, { color: colors.text }]}
          >
            Create Account
          </ThemedText>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon and Description */}
        <View style={styles.heroSection}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: `${colors.success || "#34C759"}20` },
            ]}
          >
            <IconSymbol
              name="checkmark.shield.fill"
              size={48}
              color={colors.success || "#34C759"}
            />
          </View>
          <ThemedText
            type="subtitle"
            style={[styles.heroTitle, { color: colors.text }]}
          >
            Keep Your Data Forever
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.heroSubtitle, { color: colors.textSecondary }]}
          >
            Convert your guest account to a permanent account. Sign in from any
            device and never lose your progress.
          </ThemedText>
        </View>

        {/* Benefits */}
        <View style={styles.benefitsSection}>
          <BenefitItem
            icon="iphone"
            title="Sign in anywhere"
            description="Access your account from any device"
            colors={colors}
          />
          <BenefitItem
            icon="checkmark.shield"
            title="Keep your data safe"
            description="Never lose your progress or conversations"
            colors={colors}
          />
          <BenefitItem
            icon="lock.shield"
            title="Secure your account"
            description="Protect your data with a password"
            colors={colors}
          />
        </View>

        {/* Input Form */}
        <View style={styles.formSection}>
          <View style={styles.inputWrapper}>
            <ThemedText
              type="captionMedium"
              style={[styles.inputLabel, { color: colors.textSecondary }]}
            >
              Email Address
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="your@email.com"
              placeholderTextColor={colors.textSecondary}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrapper}>
            <ThemedText
              type="captionMedium"
              style={[styles.inputLabel, { color: colors.textSecondary }]}
            >
              Password
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="At least 6 characters"
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>

          <View style={styles.inputWrapper}>
            <ThemedText
              type="captionMedium"
              style={[styles.inputLabel, { color: colors.textSecondary }]}
            >
              Confirm Password
            </ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.cardBackground,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Re-enter your password"
              placeholderTextColor={colors.textSecondary}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              editable={!loading}
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: colors.success || "#34C759",
              opacity: loading ? 0.6 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color={colors.white} />
          ) : (
            <>
              <IconSymbol
                name="checkmark.circle.fill"
                size={20}
                color={colors.white}
              />
              <ThemedText
                type="bodyMedium"
                style={{ color: colors.white, fontWeight: "600" }}
              >
                Create Permanent Account
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Info Card */}
        <View
          style={[styles.infoCard, { backgroundColor: colors.cardBackground }]}
        >
          <IconSymbol
            name="info.circle"
            size={20}
            color={colors.textSecondary}
            style={styles.infoIcon}
          />
          <ThemedText
            type="caption"
            style={[styles.infoText, { color: colors.textSecondary }]}
          >
            Your account will keep the same data and progress. This action
            cannot be undone, but you can always sign out or delete your
            account.
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

// Benefit Item Component
function BenefitItem({
  icon,
  title,
  description,
  colors,
}: {
  icon: string;
  title: string;
  description: string;
  colors: any;
}) {
  return (
    <View style={styles.benefitItem}>
      <View
        style={[
          styles.benefitIcon,
          { backgroundColor: `${colors.success || "#34C759"}15` },
        ]}
      >
        <IconSymbol name={icon} size={20} color={colors.success || "#34C759"} />
      </View>
      <View style={styles.benefitText}>
        <ThemedText
          type="bodyMedium"
          style={[styles.benefitTitle, { color: colors.text }]}
        >
          {title}
        </ThemedText>
        <ThemedText
          type="caption"
          style={[styles.benefitDescription, { color: colors.textSecondary }]}
        >
          {description}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: -4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    marginBottom: 16,
  },
  title: {
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  heroTitle: {
    marginBottom: 12,
    textAlign: "center",
  },
  heroSubtitle: {
    textAlign: "center",
    lineHeight: 22,
    opacity: 0.9,
  },
  benefitsSection: {
    gap: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  benefitIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    flex: 1,
    paddingTop: 2,
  },
  benefitTitle: {
    marginBottom: 4,
  },
  benefitDescription: {
    lineHeight: 18,
    opacity: 0.8,
  },
  formSection: {
    gap: 16,
    marginBottom: 24,
  },
  inputWrapper: {
    gap: 8,
  },
  inputLabel: {
    paddingLeft: 4,
  },
  input: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 16,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    marginBottom: 24,
  },
  infoCard: {
    flexDirection: "row",
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoIcon: {
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    lineHeight: 18,
    opacity: 0.9,
  },
});
