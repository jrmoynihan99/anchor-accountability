// lib/tour.ts
import AsyncStorage from "@react-native-async-storage/async-storage";

const TOUR_KEY = "hasCompletedTour";

export async function getHasCompletedTour() {
  try {
    const value = await AsyncStorage.getItem(TOUR_KEY);
    return value === "true";
  } catch (error) {
    console.error("Error getting tour status:", error);
    return false;
  }
}

export async function setHasCompletedTour() {
  try {
    await AsyncStorage.setItem(TOUR_KEY, "true");
  } catch (error) {
    console.error("Error setting tour status:", error);
  }
}
