import { NativeModules, Platform } from "react-native";

const { InstallReferrer } = NativeModules;

export async function getDeferredOrg(): Promise<string | null> {
  if (Platform.OS !== "android") {
    return null;
  }

  if (!InstallReferrer || !InstallReferrer.getDeferredOrg) {
    console.warn("[InstallReferrer] Native module not available");
    return null;
  }

  try {
    const org = await InstallReferrer.getDeferredOrg();
    return typeof org === "string" && org.length > 0 ? org : null;
  } catch (err) {
    console.warn("[InstallReferrer] Error reading referrer", err);
    return null;
  }
}
