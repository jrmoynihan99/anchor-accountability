// hooks/plea/useCreatePlea.ts
import { useOrganization } from "@/context/OrganizationContext";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";

interface CreatePleaParams {
  message: string;
}

export function useCreatePlea() {
  const { organizationId } = useOrganization();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPlea = async (
    params: CreatePleaParams
  ): Promise<string | null> => {
    const user = auth.currentUser;

    if (!user) {
      setError("User not authenticated");
      return null;
    }

    if (!organizationId) {
      setError("Organization not available");
      return null;
    }

    setCreating(true);
    setError(null);

    try {
      const hasMessage = params.message && params.message.trim();
      const initialStatus = hasMessage ? "pending" : "approved";

      const docRef = await addDoc(
        collection(db, "organizations", organizationId, "pleas"),
        {
          uid: user.uid,
          message: params.message || "",
          createdAt: serverTimestamp(),
          status: initialStatus,
        }
      );

      setCreating(false);
      return docRef.id;
    } catch (err) {
      console.error("Error creating plea:", err);
      setError(err instanceof Error ? err.message : "Failed to create plea");
      setCreating(false);
      return null;
    }
  };

  return {
    createPlea,
    creating,
    error,
  };
}
