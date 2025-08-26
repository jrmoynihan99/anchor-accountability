// hooks/useNotificationHandler.ts
import * as Notifications from "expo-notifications";
import { router } from "expo-router";
import { useEffect } from "react";

export function useNotificationHandler() {
  useEffect(() => {
    // Handle notification when app is in foreground
    const foregroundSubscription =
      Notifications.addNotificationReceivedListener((notification) => {
        console.log("Notification received in foreground:", notification);
        // You can show an in-app banner or update badge here if needed
      });

    // Handle notification tap (when app is backgrounded or closed)
    const responseSubscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const { data } = response.notification.request.content;
        console.log("Notification tapped:", data);

        handleNotificationData(data);
      });

    // Handle notification when app is launched from terminated state
    const checkInitialNotification = async () => {
      const response = await Notifications.getLastNotificationResponseAsync();
      if (response) {
        const { data } = response.notification.request.content;
        console.log("App launched from notification:", data);

        // Add a small delay to ensure navigation is ready
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
  }, []);
}

function handleNotificationData(data: any) {
  if (!data) return;

  if (data.pleaId) {
    // Route based on notification type
    if (data.type === "encouragement") {
      // User received encouragement on their plea
      router.push({
        pathname: "/my-reachouts-all",
        params: { openPleaId: data.pleaId },
      });
    } else if (data.type === "plea") {
      // Someone needs help
      router.push({
        pathname: "/plea-view-all",
        params: { openPleaId: data.pleaId },
      });
    } else {
      // Fallback for notifications without type (shouldn't happen with new notifications)
      console.log("Notification missing type, defaulting to plea-view-all");
      router.push({
        pathname: "/plea-view-all",
        params: { openPleaId: data.pleaId },
      });
    }
  } else if (data.threadId) {
    // Handle message notifications
    router.push({
      pathname: "/message-thread",
      params: { threadId: data.threadId, messageId: data.messageId },
    });
  }
}
