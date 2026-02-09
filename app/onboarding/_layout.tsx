import { useOrganizations } from "@/hooks/onboarding/useOrganizations";
import { getDeepLinkedOrgs } from "@/lib/deepLinkedOrgs";
import { getDeferredOrg } from "@/lib/getDeferredOrg";
import { Stack } from "expo-router";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Create context to share deferred org across onboarding screens
type OnboardingContextType = {
  deferredOrgId: string | null;
  deferredOrgName: string | null;
  deepLinkedOrgIds: Set<string>;
};

const OnboardingContext = createContext<OnboardingContextType>({
  deferredOrgId: null,
  deferredOrgName: null,
  deepLinkedOrgIds: new Set(),
});

export const useOnboardingContext = () => useContext(OnboardingContext);

export default function OnboardingLayout() {
  const { organizations } = useOrganizations();
  const [deferredOrgId, setDeferredOrgId] = useState<string | null>(null);
  const [deferredOrgName, setDeferredOrgName] = useState<string | null>(null);
  const [deepLinkedOrgIds, setDeepLinkedOrgIds] = useState<Set<string>>(
    new Set(),
  );
  const storedOrgId = useRef<string | null | undefined>(undefined);

  // Load deferred org once for entire onboarding flow
  useEffect(() => {
    async function loadDeferredOrg() {
      // Only read from storage once
      if (storedOrgId.current === undefined) {
        // getDeferredOrg() also persists to deepLinkedOrgs internally
        storedOrgId.current = await getDeferredOrg();

        // Load ALL previously deep-linked orgs from persistent storage
        const deepLinkedData = await getDeepLinkedOrgs();
        if (deepLinkedData) {
          setDeepLinkedOrgIds(new Set(deepLinkedData.orgIds));

          // If no fresh deferred link this launch, fall back to persisted latest
          if (!storedOrgId.current && deepLinkedData.latestOrgId) {
            storedOrgId.current = deepLinkedData.latestOrgId;
          }
        }
      }

      // Wait for organizations to load
      if (!storedOrgId.current || organizations.length === 0) {
        return;
      }

      // Only set state once
      if (deferredOrgId !== null) {
        return;
      }

      const org = organizations.find((o) => o.id === storedOrgId.current);

      if (org) {
        setDeferredOrgId(org.id);
        setDeferredOrgName(org.name);
      }
    }

    loadDeferredOrg();
  }, [organizations, deferredOrgId]);

  return (
    <OnboardingContext.Provider
      value={{ deferredOrgId, deferredOrgName, deepLinkedOrgIds }}
    >
      <GestureHandlerRootView style={styles.container}>
        <Stack
          screenOptions={{
            headerShown: false,
            gestureEnabled: false, // Prevent swiping back during onboarding
          }}
        >
          <Stack.Screen name="intro" />
          <Stack.Screen name="login" />
          <Stack.Screen name="notifications" />
        </Stack>
      </GestureHandlerRootView>
    </OnboardingContext.Provider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
