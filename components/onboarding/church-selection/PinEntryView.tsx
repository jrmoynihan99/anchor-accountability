// components/onboarding/church-selection/PinEntryView.tsx
import { BackButton } from "@/components/BackButton";
import { ButtonModalTransitionBridge } from "@/components/morphing/ButtonModalTransitionBridge";
import { ChurchBadgeButton } from "@/components/morphing/login/church-badge/ChurchBadgeButton";
import { ChurchBadgeModal } from "@/components/morphing/login/church-badge/ChurchBadgeModal";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import * as Haptics from "expo-haptics";
import React, { useEffect, useState } from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

interface PinEntryViewProps {
  church: {
    id: string;
    name: string;
    pin: string;
    mission: string;
  };
  onBack: () => void;
  onSuccess: (organizationId: string, organizationName: string) => void;
}

export function PinEntryView({ church, onBack, onSuccess }: PinEntryViewProps) {
  const { colors } = useTheme();
  const [enteredPin, setEnteredPin] = useState("");
  const [pinError, setPinError] = useState(false);

  // Smooth keyboard animation
  const keyboardHeight = useSharedValue(0);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      (event) => {
        const duration = Platform.OS === "ios" ? event.duration || 250 : 250;
        const height = event.endCoordinates.height;
        keyboardHeight.value = withTiming(height, {
          duration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      (event) => {
        const duration = Platform.OS === "ios" ? event.duration || 250 : 250;
        keyboardHeight.value = withTiming(0, {
          duration,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY:
          Platform.OS === "ios"
            ? -keyboardHeight.value * 0.3
            : -keyboardHeight.value * 0.4,
      },
    ],
  }));

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

        <Animated.View
          style={[styles.pinSection, animatedStyle]}
          pointerEvents="box-none"
        >
          {/* Church Badge with Modal */}
          <ButtonModalTransitionBridge
            modalWidthPercent={0.85}
            modalHeightPercent={0.6}
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
                <ChurchBadgeButton
                  buttonRef={buttonRef}
                  style={[buttonAnimatedStyle, { marginBottom: 24 }]}
                  onPress={open}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  churchName={church.name}
                />
                <ChurchBadgeModal
                  isVisible={isModalVisible}
                  progress={progress}
                  modalAnimatedStyle={modalAnimatedStyle}
                  close={close}
                  churchName={church.name}
                  mission={church.mission}
                />
              </>
            )}
          </ButtonModalTransitionBridge>

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
        </Animated.View>
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
    paddingTop: 16,
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
