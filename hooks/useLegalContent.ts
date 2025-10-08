// hooks/useLegalContent.ts
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

interface LegalContent {
  termsOfService: string;
  privacyPolicy: string;
  loading: boolean;
  error: string | null;
}

// Default fallback content in case Firebase fails
const DEFAULT_TERMS = `These terms help us maintain a safe, supportive community for everyone seeking help and healing.

Acceptance of Terms
By using this app, you agree to these terms and commit to using it as intended - for mutual support and encouragement.

Our Purpose
This app exists to provide anonymous support for those struggling with pornography and related challenges. While it has a Christian foundation, all people seeking genuine help are welcome.

Prohibited Uses
To protect our community, the following are strictly prohibited:
- Spam, trolling, or abusive behavior
- Sharing inappropriate content or links
- Attempting to identify or contact other users outside the app
- Using the platform for any purpose other than seeking or providing support
- Creating multiple accounts to abuse the system

Our Commitment to Safety
We actively monitor for abuse and will remove users who violate these terms. While we respect anonymity, we reserve the right to prevent harmful behavior.

Disclaimer
This app is designed to supplement, not replace, professional help or real-world accountability relationships. For serious mental health concerns, please seek professional support.

No Guarantees
We provide this service as-is and cannot guarantee specific outcomes. Recovery is a personal journey that requires commitment beyond any app.

Community Guidelines
Be kind, be encouraging, be real. We're all in this struggle together, and every person deserves compassion and support.

Changes to Terms
We may update these terms as needed. Continued use of the app means you accept any changes.`;

const DEFAULT_PRIVACY = `Your privacy and anonymity are fundamental to our mission. We believe seeking help should never come with shame or fear of judgment.

Our Commitment to Anonymity
This app was built with anonymity at its core. We don't track who you are, what you share, or who you talk to. Your struggles and conversations remain completely private.

What We Collect
We collect only the minimum information necessary to make the app function:
- Firebase authentication (email for account recovery only)
- Anonymous messages and encouragement you choose to send
- Basic app usage data to prevent abuse and improve functionality

We never collect your real name, personal details, or link your identity to your activity in the app.

How We Use Information
The information we collect is used solely to:
- Enable anonymous communication between users
- Deliver daily verses and prayer content
- Prevent spam, trolling, and abuse
- Maintain the technical operation of the app

We never sell, share, or use your data for advertising or any other purpose.

Your Data Security
All data is stored securely using Firebase's enterprise-grade security. Messages and interactions are designed to be untraceable to your identity.

Your Control
You can delete your account at any time, which will remove all associated data. You have complete control over what you share and when.

Contact Us
If you have questions about privacy, please reach out: jrmoynihan99@gmail.com`;

export function useLegalContent(): LegalContent {
  const [termsOfService, setTermsOfService] = useState<string>(DEFAULT_TERMS);
  const [privacyPolicy, setPrivacyPolicy] = useState<string>(DEFAULT_PRIVACY);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLegalContent = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch both documents in parallel
        const [termsDoc, privacyDoc] = await Promise.all([
          getDoc(doc(db, "config", "termsOfService")),
          getDoc(doc(db, "config", "privacyPolicy")),
        ]);

        // Update terms if available
        if (termsDoc.exists() && termsDoc.data()?.content) {
          setTermsOfService(termsDoc.data().content);
        }

        // Update privacy if available
        if (privacyDoc.exists() && privacyDoc.data()?.content) {
          setPrivacyPolicy(privacyDoc.data().content);
        }
      } catch (err) {
        console.error("Error fetching legal content:", err);
        setError("Failed to load legal content. Using default text.");
        // Keep using default content
      } finally {
        setLoading(false);
      }
    };

    fetchLegalContent();
  }, []);

  return {
    termsOfService,
    privacyPolicy,
    loading,
    error,
  };
}
