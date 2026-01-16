// context/OrganizationContext.tsx
import { auth } from "@/lib/firebase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { onAuthStateChanged } from "firebase/auth";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

interface OrganizationContextType {
  organizationId: string | null;
  loading: boolean;
  updateOrganization: (orgId: string) => Promise<void>;
  setIsSigningUp: (value: boolean) => void; // ✅ Add this
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
  const isSigningUpRef = useRef(false); // ✅ Add flag

  // ✅ Function to set the flag from outside
  const setIsSigningUp = (value: boolean) => {
    isSigningUpRef.current = value;
  };

  const updateOrganization = async (orgId: string) => {
    setOrganizationId(orgId);
    await AsyncStorage.setItem(ORG_CACHE_KEY, orgId);
    setLoading(false);
    isSigningUpRef.current = false; // ✅ Reset flag after manual update
  };

  useEffect(() => {
    const loadCachedOrgId = async () => {
      try {
        const cached = await AsyncStorage.getItem(ORG_CACHE_KEY);
        if (cached) {
          setOrganizationId(cached);
          setLoading(false);
        }
      } catch (error) {
        console.error(
          "🔴 [OrganizationContext] Error loading cached org ID:",
          error
        );
      }
    };

    loadCachedOrgId();

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // ✅ Skip if currently signing up a new user
      if (isSigningUpRef.current) {
        return;
      }

      if (user) {
        try {
          const idTokenResult = await user.getIdTokenResult();

          const orgId =
            (idTokenResult.claims.organizationId as string | null) || "public";

          setOrganizationId(orgId);

          await AsyncStorage.setItem(ORG_CACHE_KEY, orgId);
        } catch (error) {
          console.error(
            "🔴 [OrganizationContext] Error fetching organization ID:",
            error
          );
          setOrganizationId("public");
          await AsyncStorage.setItem(ORG_CACHE_KEY, "public");
        }
      } else {
        setOrganizationId(null);
        await AsyncStorage.removeItem(ORG_CACHE_KEY);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <OrganizationContext.Provider
      value={{ organizationId, loading, updateOrganization, setIsSigningUp }}
    >
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
