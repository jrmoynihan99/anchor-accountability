import { useOrganizations } from "@/hooks/onboarding/useOrganizations";
import { getDeferredOrg } from "@/lib/getDeferredOrg";
import { Stack } from "expo-router";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { StyleSheet } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Create context to share deferred org across onboarding screens
type OnboardingContextType = {
  deferredOrgId: string | null;
  deferredOrgName: string | null;
};

const OnboardingContext = createContext<OnboardingContextType>({
  deferredOrgId: null,
  deferredOrgName: null,
});

export const useOnboardingContext = () => useContext(OnboardingContext);

export default function OnboardingLayout() {
  const { organizations } = useOrganizations();
  const [deferredOrgId, setDeferredOrgId] = useState<string | null>(null);
  const [deferredOrgName, setDeferredOrgName] = useState<string | null>(null);
  const storedOrgId = useRef<string | null | undefined>(undefined);

  // Load deferred org once for entire onboarding flow
  useEffect(() => {
    async function loadDeferredOrg() {
      // Only read from storage once
      if (storedOrgId.current === undefined) {
        storedOrgId.current = await getDeferredOrg();
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
    <OnboardingContext.Provider value={{ deferredOrgId, deferredOrgName }}>
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
