// hooks/useNotificationPreferences.ts
import * as Notifications from "expo-notifications";
import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Linking } from "react-native";
import { savePushTokenToFirestore } from "./usePushNotifications";

export interface NotificationPreferences {
  pleas: boolean;
  encouragements: boolean;
  messages: boolean;
}

export interface NotificationState {
  systemPermissionGranted: boolean;
  systemPermissionDenied: boolean;
  hasExpoPushToken: boolean;
  preferences: NotificationPreferences;
  loading: boolean;
  error: string | null;
}

export function useNotificationPreferences() {
  const [state, setState] = useState<NotificationState>({
    systemPermissionGranted: false,
    systemPermissionDenied: false,
    hasExpoPushToken: false,
    preferences: {
      pleas: false,
      encouragements: false,
      messages: false,
    },
    loading: true,
    error: null,
  });

  const auth = getAuth();
  const db = getFirestore();

  const loadNotificationState = async () => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Check system permissions
      const { status } = await Notifications.getPermissionsAsync();
      const systemPermissionGranted = status === "granted";
      const systemPermissionDenied = status === "denied";

      // Check user document for expoPushToken and preferences
      const uid = auth.currentUser?.uid;
      if (!uid) {
        setState((prev) => ({
          ...prev,
          systemPermissionGranted,
          systemPermissionDenied,
          hasExpoPushToken: false,
          loading: false,
        }));
        return;
      }

      const userRef = doc(db, "users", uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      const hasExpoPushToken = !!userData?.expoPushToken;
      const preferences = userData?.notificationPreferences || {
        pleas: false,
        encouragements: false,
        messages: false,
      };

      setState({
        systemPermissionGranted,
        systemPermissionDenied,
        hasExpoPushToken,
        preferences,
        loading: false,
        error: null,
      });
    } catch (error) {
      console.error("Error loading notification state:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to load notification settings",
      }));
    }
  };

  const enableNotifications = async (): Promise<boolean> => {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Check current permission status first
      const { status: currentStatus } =
        await Notifications.getPermissionsAsync();

      if (currentStatus === "denied") {
        // Permissions were explicitly denied - guide to settings
        Alert.alert(
          "Notifications Disabled",
          "You previously declined notifications. To enable them:\n\n1. Open iPhone Settings\n2. Find this app\n3. Tap Notifications\n4. Turn on Allow Notifications",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        setState((prev) => ({ ...prev, loading: false }));
        return false;
      }

      // Continue with normal flow for undetermined/granted status
      await savePushTokenToFirestore();

      // Reload state to reflect changes
      await loadNotificationState();

      return state.systemPermissionGranted && state.hasExpoPushToken;
    } catch (error) {
      console.error("Error enabling notifications:", error);
      setState((prev) => ({
        ...prev,
        loading: false,
        error: "Failed to enable notifications",
      }));
      return false;
    }
  };

  const updatePreference = async (
    preferenceKey: keyof NotificationPreferences,
    value: boolean
  ): Promise<void> => {
    // Store the previous value for rollback
    const previousValue = state.preferences[preferenceKey];

    // Optimistically update the UI immediately
    setState((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [preferenceKey]: value,
      },
    }));

    try {
      const uid = auth.currentUser?.uid;
      if (!uid) {
        throw new Error("No user logged in");
      }

      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        [`notificationPreferences.${preferenceKey}`]: value,
      });
    } catch (error) {
      // Rollback on error
      setState((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [preferenceKey]: previousValue,
        },
        error: `Failed to update ${preferenceKey} setting`,
      }));
    }
  };

  // Load initial state
  useEffect(() => {
    loadNotificationState();
  }, [auth.currentUser?.uid]);

  // Reload when app comes to foreground (to catch permission changes)
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(() => {
      // If we receive a notification, permissions are definitely granted
      if (!state.systemPermissionGranted) {
        loadNotificationState();
      }
    });

    return () => subscription.remove();
  }, [state.systemPermissionGranted]);

  return {
    ...state,
    enableNotifications,
    updatePreference,
    reload: loadNotificationState,
    // Computed properties for UI logic
    shouldShowEnableButton:
      !state.systemPermissionGranted || !state.hasExpoPushToken,
    shouldShowPreferences:
      state.systemPermissionGranted && state.hasExpoPushToken,
  };
}
