// hooks/misc/useDonation.ts
import * as Localization from "expo-localization";
import { useCallback } from "react";
import { Alert, Linking, Platform } from "react-native";

const STRIPE_PAYMENT_LINK =
  "https://buy.stripe.com/3cI6oH4pPeLa8fk6ep0oM00";

/**
 * Whether the donation option should be shown.
 * - Android: always available (Google Play allows external payments)
 * - iOS: only available for US region (per Apple's US storefront ruling)
 */
export const isDonationAvailable =
  Platform.OS === "android" ||
  Localization.getLocales()[0]?.regionCode === "US";

/**
 * Hook to handle opening the Stripe donation page in the default browser.
 */
export function useDonation() {
  const openDonationPage = useCallback(async () => {
    try {
      const supported = await Linking.canOpenURL(STRIPE_PAYMENT_LINK);
      if (supported) {
        await Linking.openURL(STRIPE_PAYMENT_LINK);
      }
    } catch (err) {
      console.error("[useDonation] Error opening payment link:", err);
      Alert.alert(
        "Unable to Open",
        "Something went wrong. Please try again later.",
        [{ text: "OK" }]
      );
    }
  }, []);

  return { openDonationPage };
}
