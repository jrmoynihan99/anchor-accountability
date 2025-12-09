// usePushNotifications.ts
import * as Notifications from "expo-notifications";
import { getAuth } from "firebase/auth";
import { doc, getFirestore, setDoc } from "firebase/firestore";
import { Platform } from "react-native";

export async function registerForPushNotificationsAsync() {
  try {
    console.log("=== REGISTER PUSH TOKEN ===");
    console.log("Platform:", Platform.OS);

    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    console.log("Existing status:", existingStatus);

    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      console.log("Status not granted, calling requestPermissionsAsync...");
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
      console.log("Status after requestPermissionsAsync:", finalStatus);
    } else {
      console.log("Status already granted, skipping request");
    }

    if (finalStatus !== "granted") {
      console.log("Final status not granted, returning null");
      console.log("=== END REGISTER (not granted) ===");
      return null;
    }

    console.log("Getting Expo push token...");
    const token = (await Notifications.getExpoPushTokenAsync()).data;
    console.log("Got push token:", token ? "SUCCESS" : "FAILED");

    if (Platform.OS === "android") {
      console.log("Setting up Android notification channel...");
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
      console.log("Android channel setup complete");
    }

    console.log("=== END REGISTER (success) ===");
    return token;
  } catch (err) {
    console.error("❌ Failed to register for notifications:", err);
    console.log("=== END REGISTER (error) ===");
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
