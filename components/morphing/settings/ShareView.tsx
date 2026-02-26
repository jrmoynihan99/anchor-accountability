// components/morphing/settings/ShareView.tsx
import { BackButton } from "@/components/BackButton";
import { ThemedText } from "@/components/ThemedText";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useOrganization } from "@/context/OrganizationContext";
import { useTheme } from "@/context/ThemeContext";
import { useCurrentOrganization } from "@/hooks/onboarding/useCurrentOrganization";
import React, { useState } from "react";
import {
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

interface ShareViewProps {
  onBackPress: () => void;
  colors: any;
}

const STORE_URL = Platform.select({
  ios: "https://apps.apple.com/us/app/anchor-fight-lust-together/id6752869901",
  android:
    "https://play.google.com/store/apps/details?id=com.jrmoynihan99.anchor",
}) as string;

type ShareMode = "org" | "generic";

export function ShareView({ onBackPress, colors }: ShareViewProps) {
  const { organizationId } = useOrganization();
  const { organization } = useCurrentOrganization();
  const { effectiveTheme } = useTheme();

  const hasOrg = !!organizationId && organizationId !== "public";
  const [mode, setMode] = useState<ShareMode>(hasOrg ? "org" : "generic");

  const encodedName = organization?.name.replace(/ /g, "_") ?? "";
  const orgLink = `https://anchoraccountability.com/join?org=${organizationId}&name=${encodedName}`;
  const activeLink = mode === "org" ? orgLink : STORE_URL;

  const handleShare = async () => {
    try {
      await Share.share({
        message: activeLink,
      });
    } catch {
      // User cancelled or error — no action needed
    }
  };

  const isDark = effectiveTheme === "dark";

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
            Share
          </ThemedText>
        </View>
        <View style={{ width: 32 }} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Toggle (only if user has an org) */}
        {hasOrg && (
          <View
            style={[
              styles.toggleContainer,
              { backgroundColor: colors.background },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.toggleOption,
                mode === "org" && {
                  backgroundColor: colors.cardBackground,
                },
              ]}
              onPress={() => setMode("org")}
              activeOpacity={0.8}
            >
              <ThemedText
                type="caption"
                style={{
                  color: mode === "org" ? colors.text : colors.textSecondary,
                  fontWeight: mode === "org" ? "600" : "400",
                }}
              >
                {organization?.name ?? "My Community"}
              </ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                mode === "generic" && {
                  backgroundColor: colors.cardBackground,
                },
              ]}
              onPress={() => setMode("generic")}
              activeOpacity={0.8}
            >
              <ThemedText
                type="caption"
                style={{
                  color:
                    mode === "generic" ? colors.text : colors.textSecondary,
                  fontWeight: mode === "generic" ? "600" : "400",
                }}
              >
                Anchor App
              </ThemedText>
            </TouchableOpacity>
          </View>
        )}

        {/* Description */}
        <ThemedText
          type="caption"
          style={[styles.description, { color: colors.textSecondary }]}
        >
          {mode === "org"
            ? `Share an invite link to download Anchor and join ${organization?.name}. No pin code needed to join.`
            : "Share a link to download Anchor from the app store."}
        </ThemedText>

        {/* QR Code */}
        <View style={styles.qrContainer}>
          <View style={[styles.qrWrapper, { backgroundColor: "#FFFFFF" }]}>
            <QRCode
              value={activeLink}
              size={180}
              color={isDark ? "#1a1a1a" : "#000000"}
              backgroundColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Share Link Button */}
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: colors.tint }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <IconSymbol name="square.and.arrow.up" size={18} color="#FFFFFF" />
          <ThemedText type="bodyMedium" style={styles.shareButtonText}>
            Share Link
          </ThemedText>
        </TouchableOpacity>
      </ScrollView>
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
  toggleContainer: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
  },
  description: {
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 32,
    opacity: 0.8,
  },
  qrContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  qrWrapper: {
    padding: 16,
    borderRadius: 16,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: "#FFFFFF",
  },
});
