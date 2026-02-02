// hooks/misc/useDonation.ts
import { useStripe } from "@stripe/stripe-react-native";
import { getFunctions, httpsCallable } from "firebase/functions";
import { useState, useCallback } from "react";
import { Platform, Alert } from "react-native";

type DonationAmount = 200 | 500 | 1000; // $2, $5, $10 in cents

interface DonationResult {
  success: boolean;
  error?: string;
}

/**
 * Hook to handle donations via Stripe with Apple Pay / Google Pay.
 */
export function useDonation() {
  const { initPaymentSheet, presentPaymentSheet, isApplePaySupported } =
    useStripe();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Process a donation for the given amount.
   * Shows native Apple Pay / Google Pay sheet.
   *
   * @param amount - Amount in cents (200, 500, or 1000)
   */
  const donate = useCallback(
    async (amount: DonationAmount): Promise<DonationResult> => {
      setIsLoading(true);
      setError(null);

      try {
        // 1. Call Firebase function to create PaymentIntent
        const functions = getFunctions();
        const createPaymentIntent = httpsCallable<
          { amount: number },
          { clientSecret: string; paymentIntentId: string }
        >(functions, "createPaymentIntent");

        const result = await createPaymentIntent({ amount });
        const { clientSecret } = result.data;

        if (!clientSecret) {
          throw new Error("Failed to get payment client secret");
        }

        // 2. Initialize the Payment Sheet
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: clientSecret,
          merchantDisplayName: "Anchor",
          // Return URL for redirect-based payment methods
          returnURL: "anchor://stripe-redirect",
          // Apple Pay configuration
          applePay: {
            merchantCountryCode: "US",
          },
          // Google Pay configuration
          googlePay: {
            merchantCountryCode: "US",
            testEnv: __DEV__, // Use test environment in development
          },
          // Default to Apple Pay / Google Pay
          defaultBillingDetails: {},
        });

        if (initError) {
          throw new Error(initError.message);
        }

        // 3. Present the Payment Sheet
        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          // User cancelled or error occurred
          if (presentError.code === "Canceled") {
            // User cancelled - not an error
            setIsLoading(false);
            return { success: false, error: "cancelled" };
          }
          throw new Error(presentError.message);
        }

        // 4. Success!
        setIsLoading(false);
        Alert.alert(
          "Thank You!",
          "Your donation means the world to me. Thank you for supporting Anchor!",
          [{ text: "OK" }]
        );
        return { success: true };
      } catch (err: any) {
        const errorMessage = err.message || "Failed to process donation";
        console.error("[useDonation] Error:", err);
        console.error("[useDonation] Error message:", errorMessage);
        console.error("[useDonation] Error code:", err.code);
        setError(errorMessage);
        setIsLoading(false);

        // Show more detailed error in dev
        Alert.alert(
          "Donation Failed",
          __DEV__
            ? `Debug: ${errorMessage}`
            : "Something went wrong. Please try again later.",
          [{ text: "OK" }]
        );

        return { success: false, error: errorMessage };
      }
    },
    [initPaymentSheet, presentPaymentSheet]
  );

  return {
    donate,
    isLoading,
    error,
    isApplePaySupported:
      Platform.OS === "ios" ? isApplePaySupported : undefined,
  };
}
