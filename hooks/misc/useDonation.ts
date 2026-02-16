// hooks/misc/useDonation.ts
import { useCallback, useState } from "react";
import { Alert, Linking, Platform } from "react-native";

const STRIPE_PAYMENT_LINK =
  "https://buy.stripe.com/3cI6oH4pPeLa8fk6ep0oM00";

/**
 * Hook to handle opening the Stripe donation page and checking availability.
 *
 * Availability rules:
 * - Android: always available (Google Play allows external payments)
 * - iOS: disabled (Apple requires in-app purchase for tips/donations)
 */
export function useDonation() {
  const [isDonationAvailable] = useState(Platform.OS === "android");

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

  return { openDonationPage, isDonationAvailable };
}
