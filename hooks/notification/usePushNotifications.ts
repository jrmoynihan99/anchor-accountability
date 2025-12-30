// usePushNotifications.ts
import * as Notifications from "expo-notifications";
import { getAuth } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    return token;
  } catch (err) {
    console.error("❌ Failed to register for notifications:", err);
    return null;
  }
}

export async function savePushTokenToFirestore(organizationId?: string) {
  const auth = getAuth();
  const db = getFirestore();
  const uid = auth.currentUser?.uid;

  if (!uid) {
    console.warn("⚠️ No user logged in — skipping push token save");
    return;
  }

  if (!organizationId) {
    // Get organizationId from user's custom claims
    try {
      const idToken = await auth.currentUser?.getIdTokenResult(true);
      organizationId = idToken?.claims.organizationId as string;
    } catch (error) {
      console.error("❌ Error getting organizationId from claims:", error);
    }
  }

  if (!organizationId) {
    console.warn("⚠️ No organizationId available — skipping push token save");
    return;
  }

  const token = await registerForPushNotificationsAsync();
  if (!token) {
    console.warn("⚠️ No token returned — skipping Firestore write");
    return;
  }

  try {
    const userRef = doc(db, "organizations", organizationId, "users", uid);
    await setDoc(
      userRef,
      {
        expoPushToken: token,
        notificationPreferences: {
          pleas: true,
          encouragements: true,
          messages: true,
          general: true,
          accountability: true,
        },
      },
      { merge: true }
    );
  } catch (err) {
    console.error("❌ Error saving push token to Firestore:", err);
  }
}
