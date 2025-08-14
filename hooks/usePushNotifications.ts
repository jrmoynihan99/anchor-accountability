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
      console.log("❌ Notification permissions not granted");
      return null;
    }

    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("✅ Expo Push Token:", token);

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

export async function savePushTokenToFirestore() {
  const auth = getAuth();
  const db = getFirestore();
  const uid = auth.currentUser?.uid;

  if (!uid) {
    console.warn("⚠️ No user logged in — skipping push token save");
    return;
  }

  const token = await registerForPushNotificationsAsync();
  if (!token) {
    console.warn("⚠️ No token returned — skipping Firestore write");
    return;
  }

  try {
    const userRef = doc(db, "users", uid);
    await setDoc(
      userRef,
      {
        expoPushToken: token,
        wantsToHelp: true, // Update as needed
      },
      { merge: true }
    );
    console.log("✅ Push token saved to Firestore for user:", uid);
  } catch (err) {
    console.error("❌ Error saving push token to Firestore:", err);
  }
}
