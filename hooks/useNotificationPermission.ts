// hooks/useNotificationPermission.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { useEffect, useState } from "react";

const NOTIFICATION_PROMPT_KEY = "hasSeenNotificationPrompt";
const NOTIFICATION_DISMISSED_KEY = "notificationPromptDismissedAt";

export function useNotificationPermission() {
  const [hasSeenPrompt, setHasSeenPrompt] = useState<boolean | null>(null);
  const [shouldShowModal, setShouldShowModal] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<string | null>(null);

  // Check if we should show the notification prompt
  useEffect(() => {
    checkNotificationState();
  }, []);

  const checkNotificationState = async () => {
    try {
      // Check current permission status
      const { status } = await Notifications.getPermissionsAsync();
      setPermissionStatus(status);

      // If already granted, don't show modal
      if (status === "granted") {
        setHasSeenPrompt(true);
        setShouldShowModal(false);
        return;
      }

      // Check if user has seen the prompt before
      const seenPrompt = await AsyncStorage.getItem(NOTIFICATION_PROMPT_KEY);
      const hasSeenBefore = seenPrompt === "true";
      setHasSeenPrompt(hasSeenBefore);

      if (!hasSeenBefore) {
        // First time - show modal after delay
        setTimeout(() => {
          setShouldShowModal(true);
        }, 1500);
      } else {
        // Check if we should ask again (after 7 days if they said "ask later")
        const dismissedAt = await AsyncStorage.getItem(
          NOTIFICATION_DISMISSED_KEY
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
      await AsyncStorage.setItem(NOTIFICATION_PROMPT_KEY, "true");
      setHasSeenPrompt(true);
    } catch (error) {
      console.error("Error marking prompt as seen:", error);
    }
  };

  const markPromptDismissed = async () => {
    try {
      await AsyncStorage.setItem(
        NOTIFICATION_DISMISSED_KEY,
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
