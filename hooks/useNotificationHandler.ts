// hooks/useNotificationHandler.ts
import { globalModalManager } from "@/hooks/useGlobalModalManager";
import * as Notifications from "expo-notifications";
import { router, useSegments } from "expo-router";
import { useEffect, useRef } from "react";

interface NotificationHandlerOptions {
  currentThreadId?: string | null;
  currentPleaId?: string | null;
}

/**
 * Handles push notification responses globally.
 * @param options Optional callbacks for handling special notification types and current thread info
 */
export function useNotificationHandler(
  options: NotificationHandlerOptions = {}
) {
  const { currentThreadId, currentPleaId } = options;
  const lastHandledNotificationId = useRef<string | null>(null);
  const segments = useSegments();
  const isOnReachOutsScreen = segments.some(
    (segment: string) => segment === "my-reachouts-all"
  );

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

        // If this is an encouragement notification and either:
        // 1. User is viewing that specific plea, OR
        // 2. User is on the my-reachouts-all screen
        // Then don't show the banner
        if (
          data?.type === "encouragement" &&
          data?.pleaId &&
          (currentPleaId === data.pleaId || isOnReachOutsScreen)
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

      // Close any open modals before navigating
      globalModalManager.closeAllModals();

      // Handle streak reminder notifications
      if (data.type === "streak_reminder") {
        router.push("/(tabs)");
        return;
      }

      // 🆕 Handle accountability invite notifications
      if (data.type === "accountability_invite") {
        // Navigate to the thread with the invite modal open
        router.push({
          pathname: "/message-thread",
          params: {
            threadId: data.threadId,
            threadName: data.otherUserName || "User",
            otherUserId: data.otherUserId,
            isNewThread: "false",
            openInviteModal: "true", // Opens the invite modal
          },
        });
        return;
      }

      // 🆕 Handle accountability notifications
      if (data.type === "accountability_reminder") {
        // Mentee needs to check in - open MentorModal
        router.push({
          pathname: "/(tabs)/accountability",
          params: {
            openMentorModal: "true",
          },
        });
        return;
      }

      if (
        data.type === "mentee_checked_in" ||
        data.type === "mentee_missed_checkin"
      ) {
        // Mentor notification - open specific MenteeModal
        router.push({
          pathname: "/(tabs)/accountability",
          params: {
            openMenteeRelationship: data.relationshipId,
          },
        });
        return;
      }

      // Existing logic for app routing
      if (data.pleaId) {
        if (data.type === "encouragement") {
          router.push({
            pathname: "/my-reachouts-all",
            params: {
              openPleaId: data.pleaId,
              originless: "1",
            },
          });
        } else if (data.type === "plea") {
          router.push({
            pathname: "/plea-view-all",
            params: {
              openPleaId: data.pleaId,
              originless: "1",
            },
          });
        } else {
          // Fallback for unknown types, route to plea-view-all
          router.push({
            pathname: "/plea-view-all",
            params: {
              openPleaId: data.pleaId,
              originless: "1",
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
  }, [currentThreadId, currentPleaId]);
}
