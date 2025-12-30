// hooks/misc/useUserDisplayName.ts
import { useOrganization } from "@/context/OrganizationContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

/**
 * Fetches display name for a given user ID
 * Returns a fallback name if user not found or displayName not set
 */
export function useUserDisplayName(userId: string | null) {
  const { organizationId, loading: orgLoading } = useOrganization();
  const [displayName, setDisplayName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId || !organizationId || orgLoading) {
      setDisplayName("");
      setLoading(false);
      return;
    }

    const fetchDisplayName = async () => {
      setLoading(true);
      try {
        const userDoc = await getDoc(
          doc(db, "organizations", organizationId, "users", userId)
        );

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setDisplayName(
            userData.displayName || `user-${userId.substring(0, 5)}`
          );
        } else {
          setDisplayName(`user-${userId.substring(0, 5)}`);
        }
      } catch (error) {
        console.error("Error fetching user display name:", error);
        setDisplayName(`user-${userId.substring(0, 5)}`);
      } finally {
        setLoading(false);
      }
    };

    fetchDisplayName();
  }, [userId, organizationId, orgLoading]);

  return { displayName, loading: loading || orgLoading };
}
