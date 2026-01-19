// lib/getDeferredOrg.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";

const { InstallReferrer, AppGroupStorage } = NativeModules;

export async function getDeferredOrg(): Promise<string | null> {
  try {
    if (Platform.OS === "android") {
      // First try Install Referrer (for fresh installs)
      const referrerOrg = (await InstallReferrer?.getDeferredOrg?.()) ?? null;
      if (referrerOrg) {
        // Clear AsyncStorage backup if we got it from Install Referrer
        await AsyncStorage.removeItem("@deferred_org");
        return referrerOrg;
      }

      // Fallback to AsyncStorage (for existing installs via deep link)
      const asyncOrg = await AsyncStorage.getItem("@deferred_org");
      if (asyncOrg) {
        // Clear it after reading (one-time use)
        await AsyncStorage.removeItem("@deferred_org");
        return asyncOrg;
      }

      return null;
    }

    if (Platform.OS === "ios") {
      return (await AppGroupStorage?.getDeferredOrg?.()) ?? null;
    }

    return null;
  } catch (e) {
    console.warn("[getDeferredOrg] error", e);
    return null;
  }
}
