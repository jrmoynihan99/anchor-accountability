// hooks/misc/useDonation.ts
import { useCallback, useEffect, useState } from "react";
import { Alert, Linking, NativeModules, Platform } from "react-native";

const STRIPE_PAYMENT_LINK =
  "https://buy.stripe.com/3cI6oH4pPeLa8fk6ep0oM00";

/**
 * Hook to handle opening the Stripe donation page and checking availability.
 *
 * Availability rules:
 * - Android: always available (Google Play allows external payments)
 * - iOS: only available when the App Store storefront is US (per Apple's US storefront ruling)
 */
export function useDonation() {
  const [isDonationAvailable, setIsDonationAvailable] = useState(
    Platform.OS === "android"
  );

  useEffect(() => {
    if (Platform.OS !== "ios") return;

    const checkStorefront = async () => {
      try {
        const countryCode =
          await NativeModules.StorefrontModule.getCountryCode();
        setIsDonationAvailable(countryCode === "USA");
      } catch {
        // If storefront check fails, hide the button (safe default)
        setIsDonationAvailable(false);
      }
    };

    checkStorefront();
  }, []);

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
