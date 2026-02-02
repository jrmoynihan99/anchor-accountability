// hooks/misc/useReviewPrompt.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as StoreReview from "expo-store-review";
import { useEffect, useCallback } from "react";

const APP_OPEN_COUNT_KEY = "@app_open_count";
const HAS_PROMPTED_REVIEW_KEY = "@has_prompted_review";
const OPENS_BEFORE_PROMPT = 5;

/**
 * Hook to manage app store review prompts.
 * Automatically triggers native review prompt after 5 app opens (one time only).
 * Also exposes a manual trigger for the "Rate Us" button in settings.
 */
export function useReviewPrompt() {
  // Check and potentially trigger review on mount
  useEffect(() => {
    checkAndPromptReview();
  }, []);

  const checkAndPromptReview = async () => {
    try {
      // Check if we've already prompted
      const hasPrompted = await AsyncStorage.getItem(HAS_PROMPTED_REVIEW_KEY);
      if (hasPrompted === "true") {
        return;
      }

      // Increment open count
      const currentCountStr = await AsyncStorage.getItem(APP_OPEN_COUNT_KEY);
      const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;
      const newCount = currentCount + 1;

      await AsyncStorage.setItem(APP_OPEN_COUNT_KEY, newCount.toString());

      // Check if we should prompt (5th open)
      if (newCount >= OPENS_BEFORE_PROMPT) {
        // Check if review is available on this device
        const isAvailable = await StoreReview.isAvailableAsync();
        if (isAvailable) {
          // Small delay to let app fully load
          setTimeout(async () => {
            await StoreReview.requestReview();
            // Mark as prompted so we don't show again
            await AsyncStorage.setItem(HAS_PROMPTED_REVIEW_KEY, "true");
          }, 2000);
        }
      }
    } catch (error) {
      console.error("[useReviewPrompt] Error checking/prompting review:", error);
    }
  };

  /**
   * Manually trigger the native review prompt.
   * Use this for the "Rate Us" button in settings.
   */
  const triggerReview = useCallback(async () => {
    try {
      const isAvailable = await StoreReview.isAvailableAsync();
      if (isAvailable) {
        await StoreReview.requestReview();
      } else {
        // Fallback: open store page directly
        const hasAction = await StoreReview.hasAction();
        if (hasAction) {
          await StoreReview.requestReview();
        }
      }
    } catch (error) {
      console.error("[useReviewPrompt] Error triggering review:", error);
    }
  }, []);

  return { triggerReview };
}
