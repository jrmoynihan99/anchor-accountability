// hooks/useNotificationHandler.ts
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect, useRef } from "react";

type RejectionModalParams = {
  type: "plea" | "post";
  message?: string;
  reason?: string;
};

interface NotificationHandlerOptions {
  openRejectionModal?: (params: RejectionModalParams) => void;
  currentThreadId?: string | null; // Add current thread tracking
  currentPleaId?: string | null; // Add current plea tracking
}

/**
 * Handles push notification responses globally.
 * @param options Optional callbacks for handling special notification types and current thread info
 */
export function useNotificationHandler(
  options: NotificationHandlerOptions = {}
) {
  const { openRejectionModal, currentThreadId, currentPleaId } = options;
  const lastHandledNotificationId = useRef<string | null>(null);

  useEffect(() => {
    // Handle notification when app is in foreground
    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        const { data } = notification.request.content;

        // If this is a message notification and user is already in that thread,
        // don't show the banner
        if (data?.threadId && currentThreadId === data.threadId) {
          return;
        }

        // If this is an encouragement notification and user is viewing that plea,
        // don't show the banner
        if (
          data?.type === "encouragement" &&
          data?.pleaId &&
          currentPleaId === data.pleaId
        ) {
          return;
        }

        // For all other cases, the default behavior will show the banner
        // (this is controlled by the notification handler we set up in _layout.tsx)
      });

    // Handle notification tap (backgrounded or closed)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { data } = response.notification.request.content;
        const notificationId = response.notification.request.identifier;

        // Prevent handling the same notification multiple times
        if (lastHandledNotificationId.current === notificationId) {
          return;
        }

        lastHandledNotificationId.current = notificationId;
        handleNotificationData(data, notificationId);
      });

    // Handle app launch from notification (cold start)
    const checkInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        const { data } = response.notification.request.content;
        const notificationId = response.notification.request.identifier;

        // Add a small delay to ensure navigation is ready before navigating or showing modal
        setTimeout(() => {
          if (lastHandledNotificationId.current === notificationId) {
            return;
          }

          lastHandledNotificationId.current = notificationId;
          handleNotificationData(data, notificationId);
        }, 1000);
      }
    };

    checkInitialNotification();

    return () => {
      foregroundSubscription.remove();
      responseSubscription.remove();
    };

    // ----- HANDLER -----
    function handleNotificationData(data: any, notificationId: string) {
      if (!data) {
        return;
      }

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
            params: {
              openPleaId: data.pleaId,
              originless: "1", // 👈 tell the screen to use slide-up
            },
          });
        } else if (data.type === "plea") {
          router.push({
            pathname: "/plea-view-all",
            params: {
              openPleaId: data.pleaId,
              originless: "1", // 👈 tell the screen to use slide-up
            },
          });
        } else {
          // Fallback for unknown types, route to plea-view-all
          router.push({
            pathname: "/plea-view-all",
            params: {
              openPleaId: data.pleaId,
              originless: "1", // 👈 tell the screen to use slide-up
            },
          });
        }
      } else if (data.threadId) {
        // If user is already in this thread, don't navigate
        if (currentThreadId === data.threadId) {
          return;
        }

        router.push({
          pathname: "/message-thread",
          params: { threadId: data.threadId, messageId: data.messageId },
        });
      }
    }
    // -----
  }, [openRejectionModal, currentThreadId, currentPleaId]);
}
