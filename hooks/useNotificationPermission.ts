// hooks/useNotificationPermission.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";
import { Platform } from "react-native";

const NOTIFICATION_PROMPT_KEY = "hasSeenNotificationPrompt";
const NOTIFICATION_DISMISSED_KEY = "notificationPromptDismissedAt";
const ANDROID_DENIAL_COUNT_KEY = "androidNotificationDenialCount";

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
  }, [auth.currentUser?.uid]); // Re-check when user changes

  const checkNotificationState = async () => {
    try {
      // Check current permission status
      const { status } = await Notifications.getPermissionsAsync();

      console.log("=== NOTIFICATION PERMISSION CHECK ===");
      console.log("Platform:", Platform.OS);
      console.log("Raw permission status:", status);
      console.log("User ID:", auth.currentUser?.uid || "anonymous");

      if (Platform.OS === "android" && status === "granted") {
        await AsyncStorage.removeItem(ANDROID_DENIAL_COUNT_KEY);
        console.log("Cleared Android denial count (permissions granted)");
        setAndroidDenialCount(0);
      }

      // Get user-specific storage keys (so different users don't share state)
      const uid = auth.currentUser?.uid || "anonymous";
      const userSpecificPromptKey = `${NOTIFICATION_PROMPT_KEY}_${uid}`;
      const userSpecificDismissedKey = `${NOTIFICATION_DISMISSED_KEY}_${uid}`;

      // Check if THIS USER has seen the prompt before
      const seenPrompt = await AsyncStorage.getItem(userSpecificPromptKey);
      const hasSeenBefore = seenPrompt === "true";

      console.log("Has seen prompt before:", hasSeenBefore);
      console.log("AsyncStorage value:", seenPrompt);

      // Load Android denial count for status determination
      let denialCount = 0;
      if (Platform.OS === "android") {
        const countStr = await AsyncStorage.getItem(ANDROID_DENIAL_COUNT_KEY);
        denialCount = countStr ? parseInt(countStr, 10) : 0;
        setAndroidDenialCount(denialCount);
        console.log("Android denial count:", denialCount);
      }

      // ANDROID FIX: On Android, fresh install returns "denied" but user hasn't actually
      // been prompted yet. Treat as "undetermined" for first-time users OR if they haven't
      // been locked out yet (< 2 denials).
      let effectiveStatus: string = status;
      if (Platform.OS === "android" && status === "denied") {
        if (!hasSeenBefore || denialCount < 2) {
          effectiveStatus = "undetermined";
          console.log(
            "Android with 'denied' but < 2 denials: treating as 'undetermined'"
          );
        } else {
          console.log("Android locked out (2+ denials): keeping as 'denied'");
        }
      }

      setPermissionStatus(effectiveStatus);
      console.log("Effective status:", effectiveStatus);

      // If already granted and user has push token, don't show modal
      if (status === "granted") {
        console.log("Status is granted, not showing modal");
        setHasSeenPrompt(true);
        setShouldShowModal(false);
        console.log("=== END CHECK ===");
        return;
      }

      setHasSeenPrompt(hasSeenBefore);

      if (!hasSeenBefore) {
        console.log("First time user - will show modal in 1.5s");
        console.log("Modal will display with status:", effectiveStatus);
        setTimeout(() => {
          setShouldShowModal(true);
        }, 1500);
      } else {
        console.log("User has seen prompt before, checking dismissal date");
        const dismissedAt = await AsyncStorage.getItem(
          userSpecificDismissedKey
        );
        console.log("Dismissed at:", dismissedAt);

        if (dismissedAt) {
          const dismissedDate = new Date(dismissedAt);
          const now = new Date();
          const daysSinceDismissed =
            (now.getTime() - dismissedDate.getTime()) / (1000 * 60 * 60 * 24);

          console.log("Days since dismissed:", daysSinceDismissed);

          if (daysSinceDismissed >= 3) {
            console.log("3+ days passed, will show modal again");
            setTimeout(() => {
              setShouldShowModal(true);
            }, 1500);
          } else {
            console.log("Not showing modal - dismissed less than 3 days ago");
          }
        }
      }
      console.log("=== END CHECK ===");
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
      // Permission was granted, mark as seen and don't ask again
      await markPromptAsSeen();
      setPermissionStatus("granted");

      // Clear denial count on Android
      if (Platform.OS === "android") {
        await AsyncStorage.removeItem(ANDROID_DENIAL_COUNT_KEY);
        setAndroidDenialCount(0);
      }
    } else {
      // Permission was denied or dismissed, mark for retry later
      await markPromptDismissed();
    }
    setShouldShowModal(false);
  };

  const closeModal = () => {
    setShouldShowModal(false);
  };

  // Function to manually trigger showing the modal (for settings, etc.)
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
