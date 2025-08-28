// hooks/useNotificationHandler.ts
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

type RejectionModalParams = {
  type: "plea" | "post";
  message?: string;
  reason?: string;
};

interface NotificationHandlerOptions {
  openRejectionModal?: (params: RejectionModalParams) => void;
}

/**
 * Handles push notification responses globally.
 * @param options Optional callbacks for handling special notification types (e.g., openRejectionModal)
 */
export function useNotificationHandler(
  options: NotificationHandlerOptions = {}
) {
  const { openRejectionModal } = options;

  useEffect(() => {
    // Handle notification when app is in foreground (e.g., show banner/badge/etc)
    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        // Optionally, show a custom banner or badge here if you want.
        // You could handle "rejection" type here as well for immediate modals in the foreground,
        // but usually only handle notification taps in background/terminated.
        // console.log("Notification received in foreground:", notification);
      });

    // Handle notification tap (backgrounded or closed)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { data } = response.notification.request.content;
        handleNotificationData(data);
      });

    // Handle app launch from notification (cold start)
    const checkInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        const { data } = response.notification.request.content;
        // Add a small delay to ensure navigation is ready before navigating or showing modal
        setTimeout(() => {
          handleNotificationData(data);
        }, 1000);
      }
    };

    checkInitialNotification();

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };

    // ----- HANDLER -----
    function handleNotificationData(data: any) {
      if (!data) return;

      // 1. New: Moderation rejection for plea or post
      if (
        data.type === "rejection" &&
        typeof openRejectionModal === "function"
      ) {
        openRejectionModal({
          type: data.itemType as "plea" | "post",
          message: data.message,
          reason: data.reason,
        });
        return;
      }

      // 2. Existing logic for app routing
      if (data.pleaId) {
        if (data.type === "encouragement") {
          router.push({
            pathname: "/my-reachouts-all",
            params: { openPleaId: data.pleaId },
          });
        } else if (data.type === "plea") {
          router.push({
            pathname: "/plea-view-all",
            params: { openPleaId: data.pleaId },
          });
        } else {
          // Fallback for unknown types, route to plea-view-all
          router.push({
            pathname: "/plea-view-all",
            params: { openPleaId: data.pleaId },
          });
        }
      } else if (data.threadId) {
        router.push({
          pathname: "/message-thread",
          params: { threadId: data.threadId, messageId: data.messageId },
        });
      }
    }
    // -----
  }, [openRejectionModal]);
}
