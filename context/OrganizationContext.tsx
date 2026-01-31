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
    console.log(`[OrganizationContext.updateOrganization] 🔵 Called with orgId: "${orgId}"`);
    console.log(`[OrganizationContext.updateOrganization] Previous state:`, {
      previousOrgId: organizationId,
      loading,
      isSigningUp: isSigningUpRef.current
    });

    setOrganizationId(orgId);
    await AsyncStorage.setItem(ORG_CACHE_KEY, orgId);
    setLoading(false);
    isSigningUpRef.current = false; // ✅ Reset flag after manual update

    console.log(`[OrganizationContext.updateOrganization] ✅ Updated to "${orgId}", isSigningUp reset to false`);
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
      console.log("[OrganizationContext] 🔵 onAuthStateChanged fired", {
        hasUser: !!user,
        userId: user?.uid,
        isSigningUp: isSigningUpRef.current,
        userCreatedAt: user?.metadata.creationTime,
        now: new Date().toISOString()
      });

      // ✅ Skip if currently signing up a new user
      if (isSigningUpRef.current) {
        console.log("[OrganizationContext] ⏸️ Skipping - user is currently signing up");
        return;
      }

      if (user) {
        try {
          console.log("[OrganizationContext] 🔵 Reading organizationId claim from token...");

          // Get the token and check for organizationId claim
          let idTokenResult = await user.getIdTokenResult();
          let orgId = idTokenResult.claims.organizationId as string | null;

          console.log("[OrganizationContext] 📋 Token claims:", {
            organizationId: orgId,
            userCreatedAt: user.metadata.creationTime,
            now: new Date().toISOString()
          });

          // If no claim, check if this is a brand new user (< 10 seconds old)
          if (!orgId) {
            const creationTime = new Date(user.metadata.creationTime!).getTime();
            const now = Date.now();
            const isRecentlyCreated = now - creationTime < 10000;

            if (isRecentlyCreated) {
              console.log("[OrganizationContext] ⏳ Brand new user, waiting for claim propagation...");
              // Wait 2 seconds for claim to propagate
              await new Promise(resolve => setTimeout(resolve, 2000));
              // Force token refresh
              await user.getIdToken(true);
              // Get updated token
              idTokenResult = await user.getIdTokenResult();
              orgId = idTokenResult.claims.organizationId as string | null;
              console.log("[OrganizationContext] 🔄 After refresh, organizationId:", orgId);
            }
          }

          // Default to "public" if still no claim (migration path for old users)
          const finalOrgId = orgId || "public";

          console.log(`[OrganizationContext] ✅ Setting organizationId to: "${finalOrgId}"`);
          setOrganizationId(finalOrgId);

          await AsyncStorage.setItem(ORG_CACHE_KEY, finalOrgId);
          console.log(`[OrganizationContext] 💾 Saved to AsyncStorage: "${finalOrgId}"`);
        } catch (error) {
          console.error(
            "🔴 [OrganizationContext] Error reading organization claim:",
            error
          );
          throw error;
        }
      } else {
        console.log("[OrganizationContext] 🚪 No user, clearing organizationId");
        setOrganizationId(null);
        await AsyncStorage.removeItem(ORG_CACHE_KEY);
      }
      console.log("[OrganizationContext] ✅ setLoading(false)");
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
