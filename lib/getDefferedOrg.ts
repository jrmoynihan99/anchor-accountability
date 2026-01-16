// lib/getDeferredOrg.ts
import { NativeModules, Platform } from "react-native";

const { InstallReferrer, AppGroupStorage } = NativeModules;

export async function getDeferredOrg(): Promise<string | null> {
  try {
    if (Platform.OS === "android") {
      return (await InstallReferrer?.getDeferredOrg?.()) ?? null;
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
