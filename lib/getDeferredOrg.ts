// lib/getDeferredOrg.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NativeModules, Platform } from "react-native";
import { addDeepLinkedOrg } from "./deepLinkedOrgs";

const { InstallReferrer, AppGroupStorage } = NativeModules;

export async function getDeferredOrg(): Promise<string | null> {
  try {
    let orgId: string | null = null;

    if (Platform.OS === "android") {
      // First try Install Referrer (for fresh installs)
      orgId = (await InstallReferrer?.getDeferredOrg?.()) ?? null;

      if (!orgId) {
        // Fallback to AsyncStorage (for existing installs via deep link)
        orgId = await AsyncStorage.getItem("@deferred_org");
      }

      // Clean up the one-time temp key
      await AsyncStorage.removeItem("@deferred_org");
    }

    if (Platform.OS === "ios") {
      // Native module reads AND deletes from UserDefaults
      orgId = (await AppGroupStorage?.getDeferredOrg?.()) ?? null;
    }

    // Persist to durable store (survives restarts)
    if (orgId) {
      await addDeepLinkedOrg(orgId);
    }

    return orgId;
  } catch (e) {
    console.warn("[getDeferredOrg] error", e);
    return null;
  }
}
