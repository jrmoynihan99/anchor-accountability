// hooks/useNotificationPermission.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { getAuth } from "firebase/auth";
import { useEffect, useRef, useState } from "react";
import { AppState, AppStateStatus, Platform } from "react-native";

const NOTIFICATION_PROMPT_KEY = "hasSeenNotificationPrompt";
const NOTIFICATION_DISMISSED_KEY = "notificationPromptDismissedAt";
const ANDROID_DENIAL_COUNT_KEY = "androidNotificationDenialCount";
const NOTIFICATION_ONBOARDING_KEY = "hasSeenNotificationOnboarding";
const ONBOARDING_NOTIFICATION_PROMPTED_KEY = "onboarding_notification_prompted_at";

export function useNotificationPermission() {
  const [hasSeenPrompt, setHasSeenPrompt] = useState<boolean | null>(null);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);
  const [androidDenialCount, setAndroidDenialCount] = useState(0);

  const auth = getAuth();

  // Load Android denial count
  useEffect(() => {
    if (Platform.OS !== "android") return;

    const loadDenialCount = async () => {
      const countStr = await AsyncStorage.getItem(ANDROID_DENIAL_COUNT_KEY);
      const count = countStr ? parseInt(countStr, 10) : 0;
      setAndroidDenialCount(count);
    };

    loadDenialCount();
  }, []);

  // Check if we should show the notification prompt
  useEffect(() => {
    checkNotificationState();
  }, [auth.currentUser?.uid]);

  // Re-check permission when app returns to foreground
  // (covers: user enabled from system settings, or from settings modal triggering OS prompt)
  const appState = useRef<AppStateStatus>(AppState.currentState);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (
        (appState.current === "inactive" ||
          appState.current === "background") &&
        nextAppState === "active"
      ) {
        const { status } = await Notifications.getPermissionsAsync();
        if (status === "granted" && permissionStatus !== "granted") {
          setPermissionStatus("granted");
          setShouldShowModal(false);
        }
      }
      appState.current = nextAppState;
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );
    return () => subscription.remove();
  }, [permissionStatus]);

  const checkNotificationState = async () => {
    try {
      const { status } = await Notifications.getPermissionsAsync();

      if (Platform.OS === "android" && status === "granted") {
        await AsyncStorage.removeItem(ANDROID_DENIAL_COUNT_KEY);
        setAndroidDenialCount(0);
      }

      const uid = auth.currentUser?.uid || "anonymous";
      const userSpecificPromptKey = `${NOTIFICATION_PROMPT_KEY}_${uid}`;
      const userSpecificDismissedKey = `${NOTIFICATION_DISMISSED_KEY}_${uid}`;
      const userSpecificOnboardingKey = `${NOTIFICATION_ONBOARDING_KEY}_${uid}`;

      const seenPrompt = await AsyncStorage.getItem(userSpecificPromptKey);
      const seenOnboarding = await AsyncStorage.getItem(userSpecificOnboardingKey);
      // If user went through onboarding notification page, treat as "seen prompt"
      const hasSeenBefore = seenPrompt === "true" || seenOnboarding === "true";

      let denialCount = 0;
      if (Platform.OS === "android") {
        const countStr = await AsyncStorage.getItem(ANDROID_DENIAL_COUNT_KEY);
        denialCount = countStr ? parseInt(countStr, 10) : 0;
        setAndroidDenialCount(denialCount);
      }

      let effectiveStatus: string = status;
      if (Platform.OS === "android" && status === "denied") {
        if (!hasSeenBefore || denialCount < 2) {
          effectiveStatus = "undetermined";
        }
      }

      setPermissionStatus(effectiveStatus);

      if (status === "granted") {
        setHasSeenPrompt(true);
        setShouldShowModal(false);
        return;
      }

      setHasSeenPrompt(hasSeenBefore);

      if (!hasSeenBefore) {
        // Check if user was prompted during onboarding (device-level, pre-account)
        const onboardingPromptedAt = await AsyncStorage.getItem(
          ONBOARDING_NOTIFICATION_PROMPTED_KEY
        );

        if (onboardingPromptedAt) {
          // Migrate to per-user keys so this only runs once
          await AsyncStorage.setItem(userSpecificPromptKey, "true");
          await AsyncStorage.setItem(userSpecificDismissedKey, onboardingPromptedAt);
          setHasSeenPrompt(true);

          // Apply the same 3-day rule
          const promptedDate = new Date(onboardingPromptedAt);
          const now = new Date();
          const daysSincePrompted =
            (now.getTime() - promptedDate.getTime()) / (1000 * 60 * 60 * 24);

          if (daysSincePrompted >= 3) {
            setTimeout(() => {
              setShouldShowModal(true);
            }, 1500);
          }
        } else {
          // Never prompted at all — show immediately
          setTimeout(() => {
            setShouldShowModal(true);
          }, 1500);
        }
      } else {
        const dismissedAt = await AsyncStorage.getItem(
          userSpecificDismissedKey
        );

        if (dismissedAt) {
          const dismissedDate = new Date(dismissedAt);
          const now = new Date();
          const daysSinceDismissed =
            (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

          if (daysSinceDismissed >= 3) {
            setTimeout(() => {
              setShouldShowModal(true);
            }, 1500);
          }
        }
      }
    } catch (error) {
      console.error("Error checking notification state:", error);
      setHasSeenPrompt(false);
      setShouldShowModal(false);
    }
  };

  const markPromptAsSeen = async () => {
    try {
      const uid = auth.currentUser?.uid || "anonymous";
      const userSpecificPromptKey = `${NOTIFICATION_PROMPT_KEY}_${uid}`;
      await AsyncStorage.setItem(userSpecificPromptKey, "true");
      setHasSeenPrompt(true);
    } catch (error) {
      console.error("Error marking prompt as seen:", error);
    }
  };

  const markPromptDismissed = async () => {
    try {
      const uid = auth.currentUser?.uid || "anonymous";
      const userSpecificDismissedKey = `${NOTIFICATION_DISMISSED_KEY}_${uid}`;
      await AsyncStorage.setItem(
        userSpecificDismissedKey,
        new Date().toISOString()
      );
      await markPromptAsSeen();
      setShouldShowModal(false);
    } catch (error) {
      console.error("Error marking prompt as dismissed:", error);
    }
  };

  const handlePermissionResult = async (granted: boolean) => {
    if (granted) {
      await markPromptAsSeen();
      setPermissionStatus("granted");

      if (Platform.OS === "android") {
        await AsyncStorage.removeItem(ANDROID_DENIAL_COUNT_KEY);
        setAndroidDenialCount(0);
      }
    } else {
      await markPromptDismissed();
    }

    setShouldShowModal(false);
  };

  const closeModal = () => {
    setShouldShowModal(false);
  };

  const showPermissionModal = () => {
    setShouldShowModal(true);
  };

  return {
    shouldShowModal,
    permissionStatus,
    hasSeenPrompt,
    androidDenialCount,
    handlePermissionResult,
    closeModal,
    showPermissionModal,
    refreshPermissionStatus: checkNotificationState,
  };
}
