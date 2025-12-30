// hooks/plea/useCreateEncouragement.ts
import { useOrganization } from "@/context/OrganizationContext";
import { auth, db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useState } from "react";

interface CreateEncouragementParams {
  pleaId: string;
  message: string;
  openToChat: boolean;
}

export function useCreateEncouragement() {
  const { organizationId } = useOrganization();
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEncouragement = async (
    params: CreateEncouragementParams
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

    if (!params.message.trim()) {
      setError("Message cannot be empty");
      return null;
    }

    setCreating(true);
    setError(null);

    try {
      const docRef = await addDoc(
        collection(
          db,
          "organizations",
          organizationId,
          "pleas",
          params.pleaId,
          "encouragements"
        ),
        {
          helperUid: user.uid,
          message: params.message.trim(),
          openToChat: params.openToChat,
          createdAt: serverTimestamp(),
          status: "pending",
        }
      );

      setCreating(false);
      return docRef.id;
    } catch (err) {
      console.error("Error creating encouragement:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create encouragement"
      );
      setCreating(false);
      return null;
    }
  };

  return {
    createEncouragement,
    creating,
    error,
  };
}
