// hooks/useNotificationPermission.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { getAuth } from "firebase/auth";
import { useEffect, useState } from "react";

const NOTIFICATION_PROMPT_KEY = "hasSeenNotificationPrompt";
const NOTIFICATION_DISMISSED_KEY = "notificationPromptDismissedAt";

export function useNotificationPermission() {
  const [hasSeenPrompt, setHasSeenPrompt] = useState<boolean | null>(null);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  const auth = getAuth();

  // Check if we should show the notification prompt
  useEffect(() => {
    checkNotificationState();
  }, [auth.currentUser?.uid]); // Re-check when user changes

  const checkNotificationState = async () => {
    try {
      // Check current permission status
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);

      // If already granted and user has push token, don't show modal
      if (status === "granted") {
        // Let useNotificationPreferences handle the auto-setup
        setHasSeenPrompt(true);
        setShouldShowModal(false);
        return;
      }

      // Get user-specific storage keys (so different users don't share state)
      const uid = auth.currentUser?.uid || "anonymous";
      const userSpecificPromptKey = `${NOTIFICATION_PROMPT_KEY}_${uid}`;
      const userSpecificDismissedKey = `${NOTIFICATION_DISMISSED_KEY}_${uid}`;

      // Check if THIS USER has seen the prompt before
      const seenPrompt = await AsyncStorage.getItem(userSpecificPromptKey);
      const hasSeenBefore = seenPrompt === "true";
      setHasSeenPrompt(hasSeenBefore);

      if (!hasSeenBefore) {
        // First time for this user - show modal after delay
        // This applies whether permissions are undetermined OR denied
        setTimeout(() => {
          setShouldShowModal(true);
        }, 1500);
      } else {
        // Check if we should ask again (after 3 days if they said "ask later")
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
      // Permission was granted, mark as seen and don't ask again
      await markPromptAsSeen();
      setPermissionStatus("granted");
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
    handlePermissionResult,
    closeModal,
    showPermissionModal,
    refreshPermissionStatus: checkNotificationState,
  };
}
