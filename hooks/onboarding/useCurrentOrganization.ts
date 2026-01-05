// hooks/organizations/useCurrentOrganization.ts
import { useOrganization } from "@/context/OrganizationContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export interface CurrentOrganizationData {
  id: string;
  name: string;
  mission: string;
}

export function useCurrentOrganization() {
  const { organizationId, loading: orgLoading } = useOrganization();
  const [organization, setOrganization] =
    useState<CurrentOrganizationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentOrganization = async () => {
      // Don't fetch for public org or while org context is loading
      if (!organizationId || organizationId === "public" || orgLoading) {
        setOrganization(null);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const orgRef = doc(db, "organizations", organizationId);
        const orgDoc = await getDoc(orgRef);

        if (orgDoc.exists()) {
          const data = orgDoc.data();
          setOrganization({
            id: organizationId,
            name: data.name || organizationId,
            mission: data.mission || "",
          });
          setError(null);
        } else {
          setOrganization(null);
          setError("Organization not found");
        }
      } catch (err) {
        console.error("Error fetching current organization:", err);
        setError("Failed to load organization");
        setOrganization(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentOrganization();
  }, [organizationId, orgLoading]);

  return { organization, loading, error };
}
