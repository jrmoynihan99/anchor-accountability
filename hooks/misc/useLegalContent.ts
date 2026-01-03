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

// Minimal fallback content (used only if Firebase fails)
const DEFAULT_TERMS = `Terms of Service content is currently unavailable. Please try again later.`;
const DEFAULT_PRIVACY = `Privacy Policy content is currently unavailable. Please try again later.`;

export function useLegalContent(): LegalContent {
  //const { organizationId, loading: orgLoading } = useOrganization();
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
        } else {
          console.warn("Terms of Service document not found in Firebase");
          setError("Terms of Service not found");
        }

        // Update privacy if available
        if (privacyDoc.exists() && privacyDoc.data()?.content) {
          setPrivacyPolicy(privacyDoc.data().content);
        } else {
          console.warn("Privacy Policy document not found in Firebase");
          setError("Privacy Policy not found");
        }
      } catch (err) {
        console.error("Error fetching legal content:", err);
        setError("Failed to load legal content. Please check your connection.");
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
    loading: loading,
    error,
  };
}
