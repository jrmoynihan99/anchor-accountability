// lib/onboarding.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "hasCompletedOnboarding"; // Match the key used in login.tsx

export async function getHasOnboarded() {
  try {
    const value = await AsyncStorage.getItem(KEY);
    return value === "true"; // Match the value used in login.tsx
  } catch (error) {
    console.error("Error getting onboarding status:", error);
    return false;
  }
}

export async function setHasOnboarded() {
  try {
    await AsyncStorage.setItem(KEY, "true"); // Match the value used in login.tsx
  } catch (error) {
    console.error("Error setting onboarding status:", error);
  }
}
