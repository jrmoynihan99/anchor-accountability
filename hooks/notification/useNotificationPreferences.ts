import { useOrganization } from "@/context/OrganizationContext";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { getAuth } from "firebase/auth";
import { doc, getDoc, getFirestore, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
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
  const { organizationId, loading: orgLoading } = useOrganization();
  const [state, setState] = useState<NotificationState>({
    systemPermissionGranted: false,
    systemPermissionDenied: false,
    hasExpoPushToken: false,
    preferences: EMPTY_NOTIFICATION_PREFS,
    loading: true,
    error: null,
  });

  const [androidDenialCount, setAndroidDenialCount] = useState(0);
  const hasLoadedOnce = useRef(false);

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
    if (!enabled || !organizationId || orgLoading) return;
    loadNotificationState(hasLoadedOnce.current);
    // eslint-disable-next-line
  }, [enabled, auth.currentUser?.uid, organizationId, orgLoading]);

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

  const loadNotificationState = async (silent = false) => {
    if (!enabled || !organizationId) return;

    try {
      if (!silent) {
        setState((prev) => ({ ...prev, loading: true, error: null }));
      }

      const { status } = await Notifications.getPermissionsAsync();

      const systemPermissionGranted = status === "granted";
      const systemPermissionDenied = status === "denied";

      if (Platform.OS === "android" && systemPermissionGranted) {
        await AsyncStorage.removeItem(ANDROID_DENIAL_COUNT_KEY);
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

      const userRef = doc(db, "organizations", organizationId, "users", uid);
      const userDoc = await getDoc(userRef);
      const userData = userDoc.data();

      let hasExpoPushToken = !!userData?.expoPushToken;
      const preferences =
        userData?.notificationPreferences || EMPTY_NOTIFICATION_PREFS;

      if (systemPermissionGranted && !hasExpoPushToken) {
        try {
          await savePushTokenToFirestore(organizationId ?? undefined);

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
      hasLoadedOnce.current = true;
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

      if (currentStatus === "denied" && Platform.OS === "ios") {
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
        return false;
      }

      if (Platform.OS === "android" && currentStatus === "denied") {
        const denialCountStr = await AsyncStorage.getItem(
          ANDROID_DENIAL_COUNT_KEY
        );
        const denialCount = denialCountStr ? parseInt(denialCountStr, 10) : 0;

        if (denialCount >= 2) {
          Linking.openSettings();
          return false;
        }
      }

      setState((prev) => ({ ...prev, loading: true, error: null }));

      await savePushTokenToFirestore(organizationId ?? undefined);
      await loadNotificationState();

      const { status: newStatus } = await Notifications.getPermissionsAsync();

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
          setAndroidDenialCount(newCount);
        } else if (newStatus === "granted") {
          await AsyncStorage.removeItem(ANDROID_DENIAL_COUNT_KEY);
          setAndroidDenialCount(0);
        }
      }

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
    if (!enabled || !organizationId) return;

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

      const userRef = doc(db, "organizations", organizationId, "users", uid);
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
    reload: () => loadNotificationState(true),
    shouldShowEnableButton:
      !state.systemPermissionGranted || !state.hasExpoPushToken,
    shouldShowPreferences:
      state.systemPermissionGranted && state.hasExpoPushToken,
  };
}
