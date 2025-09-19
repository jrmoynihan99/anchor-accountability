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

// --- Add this for fallback state! ---
const EMPTY_NOTIFICATION_PREFS: NotificationPreferences = {
  pleas: false,
  encouragements: false,
  messages: false,
};

export function useNotificationPreferences(enabled: boolean = true) {
  const [state, setState] = useState<NotificationState>({
    systemPermissionGranted: false,
    systemPermissionDenied: false,
    hasExpoPushToken: false,
    preferences: EMPTY_NOTIFICATION_PREFS,
    loading: true,
    error: null,
  });

  const auth = getAuth();
  const db = getFirestore();

  // Prevent *any* side effects or async work unless enabled
  useEffect(() => {
    if (!enabled) return;
    loadNotificationState();
    // eslint-disable-next-line
  }, [enabled, auth.currentUser?.uid]);

  // Only subscribe if enabled
  useEffect(() => {
    if (!enabled) return;
    const subscription = Notifications.addNotificationReceivedListener(() => {
      // If we receive a notification, permissions are definitely granted
      if (!state.systemPermissionGranted) {
        loadNotificationState();
      }
    });
    return () => {
      if (subscription) subscription.remove();
    };
    // eslint-disable-next-line
  }, [enabled, state.systemPermissionGranted]);

  const loadNotificationState = async () => {
    if (!enabled) return; // Extra guard
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

      let hasExpoPushToken = !!userData?.expoPushToken;
      const preferences =
        userData?.notificationPreferences || EMPTY_NOTIFICATION_PREFS;

      // NEW: Auto-setup push token if system permissions are granted but user doesn't have token
      if (systemPermissionGranted && !hasExpoPushToken) {
        try {
          console.log(
            "Auto-setting up push token for new user with granted permissions"
          );
          await savePushTokenToFirestore();

          // Re-fetch to confirm the token was saved
          const updatedUserDoc = await getDoc(userRef);
          const updatedUserData = updatedUserDoc.data();
          hasExpoPushToken = !!updatedUserData?.expoPushToken;
        } catch (error) {
          console.error("Error auto-setting up push token:", error);
          // Don't throw - just continue with the original state
        }
      }

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

  // --- All async actions should check 'enabled' ---
  const enableNotifications = async (): Promise<boolean> => {
    if (!enabled) return false;
    try {
      // Check current permission status first
      const { status: currentStatus } =
        await Notifications.getPermissionsAsync();

      if (currentStatus === "denied") {
        // Permissions were explicitly denied - guide to settings (no loading state)
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
        // Don't set loading: no async work is happening!
        return false;
      }

      // Now we're about to do real work: show loading
      setState((prev) => ({ ...prev, loading: true, error: null }));

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
    if (!enabled) return;
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

  // --- When disabled, always return default props, stubs, and loading true ---
  if (!enabled) {
    return {
      ...state,
      preferences: EMPTY_NOTIFICATION_PREFS,
      loading: true,
      error: null,
      enableNotifications: async () => false,
      updatePreference: async () => {},
      reload: async () => {},
      shouldShowEnableButton: false,
      shouldShowPreferences: false,
    };
  }

  // --- Normal return (enabled) ---
  return {
    ...state,
    enableNotifications,
    updatePreference,
    reload: loadNotificationState,
    shouldShowEnableButton:
      !state.systemPermissionGranted || !state.hasExpoPushToken,
    shouldShowPreferences:
      state.systemPermissionGranted && state.hasExpoPushToken,
  };
}
