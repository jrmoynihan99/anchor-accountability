import { ThemedText } from "@/components/ThemedText";
import { ThemedToggle } from "@/components/ThemedToggle";
import { IconSymbol } from "@/components/ui/IconSymbol";
import { useTheme } from "@/hooks/ThemeContext";
import { useNotificationPreferences } from "@/hooks/useNotificationPreferences";
import React from "react";
import {
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

interface NotificationsSectionProps {
  shouldLoad: boolean;
}

export function NotificationsSection({
  shouldLoad,
}: NotificationsSectionProps) {
  const { colors } = useTheme();

  // Always call the hook; lazy loading inside
  const {
    preferences,
    loading: notificationLoading,
    error: notificationError,
    shouldShowEnableButton,
    shouldShowPreferences,
    systemPermissionDenied,
    enableNotifications,
    updatePreference,
  } = useNotificationPreferences(shouldLoad);

  const handleEnablePress = async () => {
    await enableNotifications();
  };

  const getEnableButtonText = () => {
    if (systemPermissionDenied) {
      return "Open Settings";
    }
    return "Enable Notifications";
  };

  const getEnableButtonIcon = () => {
    if (systemPermissionDenied) {
      return "gear";
    }
    return "bell.badge";
  };

  const getEnableDescription = () => {
    if (systemPermissionDenied) {
      return "Notifications are disabled in your device settings. Tap to open Settings and enable them manually.";
    }
    return "Enable push notifications to receive alerts for new incoming help requests, encouragements, and messages.";
  };

  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <IconSymbol name="bell" size={20} color={colors.textSecondary} />
        <ThemedText type="bodyMedium" style={styles.sectionTitle}>
          Notifications
        </ThemedText>
      </View>

      {notificationLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={colors.tint} />
          <ThemedText
            type="caption"
            lightColor={colors.textSecondary}
            darkColor={colors.textSecondary}
            style={styles.loadingText}
          >
            Loading notification settings...
          </ThemedText>
        </View>
      ) : shouldShowEnableButton ? (
        <View style={styles.enableNotificationContainer}>
          <ThemedText
            type="caption"
            lightColor={colors.textSecondary}
            darkColor={colors.textSecondary}
            style={styles.enableDescription}
          >
            {getEnableDescription()}
          </ThemedText>
          <TouchableOpacity
            style={[
              styles.enableButton,
              {
                backgroundColor: systemPermissionDenied
                  ? colors.textSecondary
                  : colors.tint,
              },
            ]}
            onPress={handleEnablePress}
            activeOpacity={0.8}
          >
            <IconSymbol
              name={getEnableButtonIcon()}
              size={18}
              color={colors.white}
            />
            <ThemedText
              type="bodyMedium"
              lightColor={colors.white}
              darkColor={colors.white}
              style={styles.enableButtonText}
            >
              {getEnableButtonText()}
            </ThemedText>
          </TouchableOpacity>
        </View>
      ) : shouldShowPreferences ? (
        <>
          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={styles.settingTextContainer}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Incoming Requests
                </ThemedText>
                <ThemedText
                  type="caption"
                  lightColor={colors.textSecondary}
                  darkColor={colors.textSecondary}
                  style={styles.settingDescription}
                >
                  New help requests
                </ThemedText>
              </View>
              <ThemedToggle
                value={preferences.pleas}
                onValueChange={(value) => updatePreference("pleas", value)}
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={styles.settingTextContainer}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Encouragements
                </ThemedText>
                <ThemedText
                  type="caption"
                  lightColor={colors.textSecondary}
                  darkColor={colors.textSecondary}
                  style={styles.settingDescription}
                >
                  Responses to your help requests
                </ThemedText>
              </View>
              <ThemedToggle
                value={preferences.encouragements}
                onValueChange={(value) =>
                  updatePreference("encouragements", value)
                }
              />
            </View>
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingContent}>
              <View style={styles.settingTextContainer}>
                <ThemedText type="body" style={styles.settingLabel}>
                  Messages
                </ThemedText>
                <ThemedText
                  type="caption"
                  lightColor={colors.textSecondary}
                  darkColor={colors.textSecondary}
                  style={styles.settingDescription}
                >
                  Direct messages notifications
                </ThemedText>
              </View>
              <ThemedToggle
                value={preferences.messages}
                onValueChange={(value) => updatePreference("messages", value)}
              />
            </View>
          </View>
        </>
      ) : null}

      {notificationError && (
        <ThemedText
          type="caption"
          lightColor={colors.error || colors.tint}
          darkColor={colors.error || colors.tint}
          style={styles.errorText}
        >
          {notificationError}
        </ThemedText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionCard: {
    backgroundColor: "transparent",
    borderRadius: 16,
    padding: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    marginLeft: 8,
  },
  settingItem: {
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(128, 128, 128, 0.2)",
  },
  settingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  settingTextContainer: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    marginBottom: 2,
  },
  settingDescription: {
    opacity: 0.8,
    lineHeight: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 8,
  },
  loadingText: {
    opacity: 0.8,
  },
  enableNotificationContainer: {
    paddingVertical: 8,
  },
  enableDescription: {
    opacity: 0.8,
    lineHeight: 18,
    marginBottom: 16,
  },
  enableButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  enableButtonText: {
    fontWeight: "600",
  },
  errorText: {
    marginTop: 8,
    opacity: 0.9,
    lineHeight: 16,
  },
});
