// components/onboarding/login/church-indicator/PinEntryModalView.tsx
import { BackButton } from "@/components/BackButton";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Keyboard,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface PinEntryModalViewProps {
  church: {
    id: string;
    name: string;
    pin: string;
    mission?: string;
  };
  onBack: () => void;
  onSuccess: (organizationId: string, organizationName: string) => void;
}

export function PinEntryModalView({
  church,
  onBack,
  onSuccess,
}: PinEntryModalViewProps) {
  const { colors } = useTheme();
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState(false);

  const handlePinSubmit = () => {
    if (String(enteredPin).trim() === String(church.pin).trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSuccess(church.id, church.name);
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setPinError(true);
      setEnteredPin("");
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={styles.container}>
        <View style={styles.header} pointerEvents="box-none">
          <View pointerEvents="auto">
            <BackButton onPress={onBack} style={styles.backButtonSpacing} />
          </View>
          <ThemedText
            type="title"
            style={[styles.title, { color: colors.text }]}
          >
            Enter Access Code
          </ThemedText>
        </View>

        <View style={styles.pinSection} pointerEvents="box-none">
          {/* Static Church Badge */}
          <View
            style={[
              styles.churchBadge,
              { backgroundColor: colors.iconCircleSecondaryBackground },
            ]}
          >
            <IconSymbol name="building.2" size={20} color={colors.icon} />
            <ThemedText type="bodyMedium" style={{ color: colors.text }}>
              {church.name}
            </ThemedText>
          </View>

          <ThemedText
            type="body"
            style={[styles.pinInstructions, { color: colors.textSecondary }]}
          >
            Enter the 6-digit code from your church leadership
          </ThemedText>

          <View pointerEvents="auto">
            <TextInput
              style={[
                styles.pinInput,
                {
                  backgroundColor: colors.inputBackground,
                  color: colors.text,
                  borderColor: pinError ? colors.error : colors.border,
                },
              ]}
              value={enteredPin}
              onChangeText={(text) => {
                setEnteredPin(text);
                setPinError(false);
              }}
              placeholder="123456"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
          </View>

          {pinError && (
            <View style={styles.errorContainer}>
              <IconSymbol
                name="exclamationmark.triangle"
                size={16}
                color={colors.error}
              />
              <ThemedText type="caption" style={{ color: colors.error }}>
                Incorrect code. Please try again.
              </ThemedText>
            </View>
          )}

          <View pointerEvents="auto">
            <TouchableOpacity
              style={[
                styles.verifyButton,
                {
                  backgroundColor:
                    enteredPin.length === 6
                      ? colors.buttonBackground
                      : colors.border,
                },
              ]}
              onPress={handlePinSubmit}
              disabled={enteredPin.length !== 6}
              activeOpacity={0.8}
            >
              <ThemedText
                type="buttonLarge"
                style={[styles.buttonText, { color: colors.white }]}
              >
                Verify & Continue
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 0,
    paddingBottom: 24,
  },
  backButtonSpacing: {
    marginRight: 16,
  },
  title: {
    fontWeight: "600",
    flex: 1,
  },
  pinSection: {
    flex: 1,
    justifyContent: "center",
    paddingBottom: 100,
  },
  churchBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 24,
  },
  pinInstructions: {
    textAlign: "center",
    marginBottom: 24,
  },
  pinInput: {
    fontSize: 32,
    fontWeight: "600",
    textAlign: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    letterSpacing: 8,
    marginBottom: 16,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  verifyButton: {
    paddingVertical: 18,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: {
    fontWeight: "600",
  },
});
