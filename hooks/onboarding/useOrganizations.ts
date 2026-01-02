// hooks/organizations/useOrganizations.ts
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { useEffect, useState } from "react";

export interface OrganizationData {
  id: string;
  name: string;
  pin: string;
  mission: string;
}

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<OrganizationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);

        // Get all organization documents
        const orgsRef = collection(db, "organizations");
        const snapshot = await getDocs(orgsRef);

        const orgs: OrganizationData[] = [];

        snapshot.forEach((doc) => {
          // Exclude "public" organization
          if (doc.id !== "public") {
            const data = doc.data();
            orgs.push({
              id: doc.id,
              name: data.name || doc.id,
              pin: String(data.pin || ""), // Convert to string
              mission: data.mission || "",
            });
          }
        });

        // Sort alphabetically by name
        orgs.sort((a, b) => a.name.localeCompare(b.name));

        setOrganizations(orgs);
        setError(null);
      } catch (err) {
        console.error("Error fetching organizations:", err);
        setError("Failed to load churches");
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  return { organizations, loading, error };
}
