const { onCall, HttpsError } = require("firebase-functions/v2/https");
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * Create a Stripe PaymentIntent for donations.
 * Called from the app when user selects a donation amount.
 *
 * @param {number} amount - Amount in cents (e.g., 500 for $5.00)
 * @returns {object} - { clientSecret, paymentIntentId }
 */
exports.createPaymentIntent = onCall(async (request) => {
  // Optional: require authentication
  // Uncomment if you want only logged-in users to donate
  // if (!request.auth) {
  //   throw new HttpsError("unauthenticated", "User must be authenticated");
  // }

  const { amount } = request.data;

  // Validate amount
  if (!amount || typeof amount !== "number" || amount < 100) {
    throw new HttpsError(
      "invalid-argument",
      "Amount must be a number of at least 100 cents ($1.00)"
    );
  }

  // Validate amount is one of our preset amounts (200, 500, 1000 cents)
  const validAmounts = [200, 500, 1000]; // $2, $5, $10
  if (!validAmounts.includes(amount)) {
    throw new HttpsError(
      "invalid-argument",
      "Amount must be one of: $2, $5, or $10"
    );
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      // Enable automatic payment methods (includes Apple Pay, Google Pay, cards)
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        type: "donation",
        userId: request.auth?.uid || "anonymous",
      },
    });

    console.log(
      `✅ Created PaymentIntent ${paymentIntent.id} for $${(amount / 100).toFixed(2)}`
    );

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error("❌ Error creating PaymentIntent:", error);
    throw new HttpsError("internal", "Failed to create payment intent");
  }
});
