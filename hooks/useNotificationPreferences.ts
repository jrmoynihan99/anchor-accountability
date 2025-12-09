import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Alert, Linking, Platform } from "react-native";
import { savePushTokenToFirestore } from "./usePushNotifications";

export interface NotificationPreferences {
  pleas: boolean;
  encouragements: boolean;
  messages: boolean;
  general: boolean;
  accountability: boolean;
}

export interface NotificationState {
  systemPermissionGranted: boolean;
  systemPermissionDenied: boolean;
  hasExpoPushToken: boolean;
  preferences: NotificationPreferences;
  loading: boolean;
  error: string | null;
}

const EMPTY_NOTIFICATION_PREFS: NotificationPreferences = {
  pleas: true,
  encouragements: true,
  messages: true,
  general: true,
  accountability: true,
};

const ANDROID_DENIAL_COUNT_KEY = "androidNotificationDenialCount";

export function useNotificationPreferences(enabled: boolean = true) {
  const [state, setState] = useState<NotificationState>({
    systemPermissionGranted: false,
    systemPermissionDenied: false,
    hasExpoPushToken: false,
    preferences: EMPTY_NOTIFICATION_PREFS,
    loading: true,
    error: null,
  });

  const [androidDenialCount, setAndroidDenialCount] = useState(0);

  const auth = getAuth();
  const db = getFirestore();

  // Load Android denial count
  useEffect(() => {
    if (!enabled || Platform.OS !== "android") return;

    const loadDenialCount = async () => {
      const countStr = await AsyncStorage.getItem(ANDROID_DENIAL_COUNT_KEY);
      const count = countStr ? parseInt(countStr, 10) : 0;
      setAndroidDenialCount(count);
    };

    loadDenialCount();
  }, [enabled, state.systemPermissionDenied]);

  useEffect(() => {
    if (!enabled) return;
    loadNotificationState();
    // eslint-disable-next-line
  }, [enabled, auth.currentUser?.uid]);

  useEffect(() => {
    if (!enabled) return;
    const subscription = Notifications.addNotificationReceivedListener(() => {
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
    console.log("🔄🔄🔄 LOAD NOTIFICATION STATE CALLED 🔄🔄🔄");
    console.log("Enabled:", enabled);
    if (!enabled) {
      console.log("❌ Hook disabled, returning early");
      return;
    }
    try {
      console.log("✅ Starting to load notification state...");
      setState((prev) => ({ ...prev, loading: true, error: null }));

      // Just check permissions, don't request (to avoid triggering dialogs)
      const { status } = await Notifications.getPermissionsAsync();
      console.log("📱 Permission status:", status);

      const systemPermissionGranted = status === "granted";
      const systemPermissionDenied = status === "denied";

      // ANDROID: Clear denial count if permissions are now granted
      if (Platform.OS === "android" && systemPermissionGranted) {
        await AsyncStorage.removeItem(ANDROID_DENIAL_COUNT_KEY);
        console.log("✅ Cleared Android denial count (permissions granted)");
        setAndroidDenialCount(0);
      }

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

      if (systemPermissionGranted && !hasExpoPushToken) {
        try {
          console.log(
            "Auto-setting up push token for new user with granted permissions"
          );
          await savePushTokenToFirestore();

          const updatedUserDoc = await getDoc(userRef);
          const updatedUserData = updatedUserDoc.data();
          hasExpoPushToken = !!updatedUserData?.expoPushToken;
        } catch (error) {
          console.error("Error auto-setting up push token:", error);
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

  const enableNotifications = async (): Promise<boolean> => {
    if (!enabled) return false;
    try {
      const { status: currentStatus } =
        await Notifications.getPermissionsAsync();

      console.log("=== ENABLE NOTIFICATIONS ===");
      console.log("Platform:", Platform.OS);
      console.log("Status before attempting to enable:", currentStatus);

      // iOS-specific: If denied, must go to settings (can't re-prompt)
      if (currentStatus === "denied" && Platform.OS === "ios") {
        console.log("iOS with denied status - showing Alert to go to Settings");
        Alert.alert(
          "Notifications Disabled",
          "You previously declined notifications. To enable them:\n\n1. Open Phone Settings\n2. Find this app\n3. Tap Notifications\n4. Turn on Allow Notifications",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Open Settings",
              onPress: () => Linking.openSettings(),
            },
          ]
        );
        console.log("=== END ENABLE (iOS denied) ===");
        return false;
      }

      // Android-specific: Check if user has been locked out (2+ denials)
      if (Platform.OS === "android" && currentStatus === "denied") {
        const denialCountStr = await AsyncStorage.getItem(
          ANDROID_DENIAL_COUNT_KEY
        );
        const denialCount = denialCountStr ? parseInt(denialCountStr, 10) : 0;
        console.log("Android denial count:", denialCount);

        if (denialCount >= 2) {
          console.log(
            "Android locked out (2+ denials) - opening Settings directly"
          );
          Linking.openSettings();
          console.log("=== END ENABLE (Android locked out) ===");
          return false;
        }
      }

      console.log("Status allows attempt, calling savePushTokenToFirestore...");
      setState((prev) => ({ ...prev, loading: true, error: null }));

      await savePushTokenToFirestore();
      await loadNotificationState();

      const { status: newStatus } = await Notifications.getPermissionsAsync();
      console.log("Status after attempting to enable:", newStatus);

      // Android-specific: Track denials
      if (Platform.OS === "android") {
        if (newStatus === "denied") {
          const denialCountStr = await AsyncStorage.getItem(
            ANDROID_DENIAL_COUNT_KEY
          );
          const denialCount = denialCountStr ? parseInt(denialCountStr, 10) : 0;
          const newCount = denialCount + 1;
          await AsyncStorage.setItem(
            ANDROID_DENIAL_COUNT_KEY,
            newCount.toString()
          );
          console.log("Incremented Android denial count to:", newCount);
          setAndroidDenialCount(newCount);
        } else if (newStatus === "granted") {
          await AsyncStorage.removeItem(ANDROID_DENIAL_COUNT_KEY);
          console.log("Cleared Android denial count (granted)");
          setAndroidDenialCount(0);
        }
      }

      console.log("systemPermissionGranted:", state.systemPermissionGranted);
      console.log("hasExpoPushToken:", state.hasExpoPushToken);
      console.log("=== END ENABLE ===");

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
    const previousValue = state.preferences[preferenceKey];

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

  if (!enabled) {
    return {
      ...state,
      preferences: EMPTY_NOTIFICATION_PREFS,
      loading: true,
      error: null,
      androidDenialCount: 0,
      enableNotifications: async () => false,
      updatePreference: async () => {},
      reload: async () => {},
      shouldShowEnableButton: false,
      shouldShowPreferences: false,
    };
  }

  return {
    ...state,
    androidDenialCount,
    enableNotifications,
    updatePreference,
    reload: loadNotificationState,
    shouldShowEnableButton:
      !state.systemPermissionGranted || !state.hasExpoPushToken,
    shouldShowPreferences:
      state.systemPermissionGranted && state.hasExpoPushToken,
  };
}
