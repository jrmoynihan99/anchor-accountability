import { auth } from "@/lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import React, { createContext, useContext, useEffect, useState } from "react";

interface OrganizationContextType {
  organizationId: string | null;
  loading: boolean;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(
  undefined
);

const ORG_CACHE_KEY = "cached_organization_id";

export function OrganizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load cached org ID immediately for faster startup
    const loadCachedOrgId = async () => {
      try {
        const cached = await AsyncStorage.getItem(ORG_CACHE_KEY);
        if (cached) {
          setOrganizationId(cached);
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading cached org ID:", error);
      }
    };

    loadCachedOrgId();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();
          const orgId =
            (idTokenResult.claims.organizationId as string | null) || "public";

          setOrganizationId(orgId);

          // Cache for next startup
          await AsyncStorage.setItem(ORG_CACHE_KEY, orgId);
        } catch (error) {
          console.error("Error fetching organization ID:", error);
          setOrganizationId("public");
          await AsyncStorage.setItem(ORG_CACHE_KEY, "public");
        }
      } else {
        setOrganizationId(null);
        await AsyncStorage.removeItem(ORG_CACHE_KEY);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <OrganizationContext.Provider value={{ organizationId, loading }}>
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error(
      "useOrganization must be used within an OrganizationProvider"
    );
  }
  return context;
}
