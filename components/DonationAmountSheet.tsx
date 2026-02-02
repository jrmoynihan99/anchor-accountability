// components/DonationAmountSheet.tsx
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/context/ThemeContext";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type DonationAmount = 200 | 500 | 1000;

interface DonationAmountSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectAmount: (amount: DonationAmount) => void;
  isLoading: boolean;
}

const AMOUNTS: { value: DonationAmount; label: string }[] = [
  { value: 200, label: "$2" },
  { value: 500, label: "$5" },
  { value: 1000, label: "$10" },
];

export function DonationAmountSheet({
  visible,
  onClose,
  onSelectAmount,
  isLoading,
}: DonationAmountSheetProps) {
  const { colors, effectiveTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const handleSelect = (amount: DonationAmount) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onSelectAmount(amount);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={[styles.backdrop, { backgroundColor: colors.shadow }]}
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Sheet */}
      <View
        style={[styles.sheetContainer, { paddingBottom: insets.bottom + 16 }]}
        pointerEvents="box-none"
      >
        <View style={styles.sheet}>
          <BlurView
            intensity={Platform.OS === "android" ? 100 : 60}
            tint={effectiveTheme === "dark" ? "dark" : "light"}
            style={StyleSheet.absoluteFill}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor:
                    effectiveTheme === "dark"
                      ? "rgba(30, 30, 35, 0.85)"
                      : "rgba(255, 255, 255, 0.85)",
                },
              ]}
            />
          </BlurView>

          {/* Close button */}
          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: colors.closeButtonBackground },
            ]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <IconSymbol
              name="xmark"
              size={16}
              weight="light"
              color={colors.closeButtonText}
            />
          </TouchableOpacity>

          {/* Content */}
          <View style={styles.content}>
            <IconSymbol
              name="heart.fill"
              size={32}
              color={colors.tint}
              style={styles.icon}
            />
            <ThemedText type="subtitle" style={styles.title}>
              Support Anchor
            </ThemedText>
            <ThemedText
              type="body"
              style={[styles.subtitle, { color: colors.textSecondary }]}
            >
              Anchor is free for everyone, funded entirely by people like you.
              Your support keeps the servers running and helps me keep improving
              the app!
            </ThemedText>

            {/* Amount buttons */}
            <View style={styles.amountContainer}>
              {AMOUNTS.map(({ value, label }) => (
                <TouchableOpacity
                  key={value}
                  style={[
                    styles.amountButton,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: colors.cardBorder,
                    },
                  ]}
                  onPress={() => handleSelect(value)}
                  activeOpacity={0.7}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.tint} />
                  ) : (
                    <ThemedText type="subtitle" style={styles.amountText}>
                      {label}
                    </ThemedText>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText
              type="caption"
              style={[styles.disclaimer, { color: colors.textSecondary }]}
            >
              Secure payment via Stripe
            </ThemedText>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  sheetContainer: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: 16,
  },
  sheet: {
    borderRadius: 24,
    overflow: "hidden",
    minHeight: 280,
  },
  closeButton: {
    position: "absolute",
    top: 16,
    right: 16,
    zIndex: 10,
    borderRadius: 14,
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    padding: 24,
    paddingTop: 32,
    alignItems: "center",
  },
  icon: {
    marginBottom: 12,
  },
  title: {
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  amountContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  amountButton: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 80,
    alignItems: "center",
    justifyContent: "center",
  },
  amountText: {
    fontSize: 20,
  },
  disclaimer: {
    textAlign: "center",
    fontSize: 12,
  },
});
