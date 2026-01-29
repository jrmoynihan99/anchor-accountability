// app/_layout.tsx
import "react-native-reanimated";

import { AccountabilityProvider } from "@/context/AccountabilityContext";
import { ModalIntentProvider } from "@/context/ModalIntentContext";
import { OrganizationProvider } from "@/context/OrganizationContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ThreadProvider, useThread } from "@/context/ThreadContext";

import { useNotificationHandler } from "@/hooks/notification/useNotificationHandler";
import { auth, updateUserTimezone } from "@/lib/firebase";
import { getHasOnboarded } from "@/lib/onboarding";
import {
  Stack,
  router,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

// Fonts
import {
  Spectral_400Regular,
  Spectral_700Bold,
  Spectral_700Bold_Italic,
  useFonts as useSpectralFonts,
} from "@expo-google-fonts/spectral";

// Firebase Functions
import { getFunctions, httpsCallable } from "firebase/functions";

// Notifications
import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from "expo-notifications";
import * as Localization from "expo-localization";

/* ------------------------------------------------------------------ */
/* Notification plumbing                                               */
/* ------------------------------------------------------------------ */

let getCurrentThreadId: (() => string | null) | null = null;
let getCurrentPleaId: (() => string | null) | null = null;

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;

    if (data?.threadId && getCurrentThreadId?.() === data.threadId) {
      return {
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    if (
      data?.pleaId &&
      data?.type === "encouragement" &&
      getCurrentPleaId?.() === data.pleaId
    ) {
      return {
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      };
    }

    // Suppress specific notification types (custom in-app banner shown instead)
    if (
      data?.type === "accountability_accepted" ||
      data?.type === "accountability_ended" ||
      data?.type === "accountability_declined" ||
      data?.type === "accountability_invite"
    ) {
      return {
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: true,
      };
    }

    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});

// Prevent splash from auto-hiding, will hide manually
SplashScreen.preventAutoHideAsync();

/* ------------------------------------------------------------------ */
/* UI Helpers                                                          */
/* ------------------------------------------------------------------ */

function FullScreenLoader() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#E6DED7", // cardBackground color
        }}
      >
        <ActivityIndicator size="large" color="#CBAD8D" />
      </View>
    </GestureHandlerRootView>
  );
}

/* ------------------------------------------------------------------ */
/* Stack                                                               */
/* ------------------------------------------------------------------ */

function ThemedStack() {
  const { effectiveTheme } = useTheme();
  const { currentThreadId, currentPleaId } = useThread();

  useEffect(() => {
    getCurrentThreadId = () => currentThreadId;
    getCurrentPleaId = () => currentPleaId;
    return () => {
      getCurrentThreadId = null;
      getCurrentPleaId = null;
    };
  }, [currentThreadId, currentPleaId]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="message-thread" />
        <Stack.Screen name="plea-view-all" />
        <Stack.Screen name="my-reachouts-all" />
        <Stack.Screen name="join" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Auth + Claims gate                                                  */
/* ------------------------------------------------------------------ */

type AuthGateState = {
  authInitialized: boolean;
  claimsReady: boolean;
};

function useAuthAndClaimsGate() {
  const [state, setState] = useState<AuthGateState>({
    authInitialized: false,
    claimsReady: false,
  });

  // Prevent double-running self-heal if onAuthStateChanged fires twice quickly
  const inFlightRef = useRef(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      // auth has now initialized (we got at least one callback)
      setState((prev) => ({
        ...prev,
        authInitialized: true,
      }));

      if (!user) {
        // Signed out: nothing to validate
        setState((prev) => ({
          ...prev,
          claimsReady: true,
        }));
        return;
      }

      if (inFlightRef.current) return;
      inFlightRef.current = true;

      try {
        // Always force refresh first to avoid stale cached claims
        await user.getIdToken(true);
        let token = await user.getIdTokenResult();

        if (!token.claims.organizationId) {
          // Check if this is a fresh signup (don't self-heal new users)
          const creationTime = new Date(user.metadata.creationTime!).getTime();
          const now = Date.now();
          const isRecentlyCreated = now - creationTime < 30000; // 30 seconds

          if (isRecentlyCreated) {
            // New user - wait for claim to propagate, then check again
            await new Promise((resolve) => setTimeout(resolve, 2000));
            await user.getIdToken(true);
            token = await user.getIdTokenResult();
          }

          // If still no claim (and not a brand new user), self-heal migrated users
          if (!token.claims.organizationId && !isRecentlyCreated) {
            const functions = getFunctions();
            const setUserOrganization = httpsCallable(
              functions,
              "setUserOrganization",
            );

            const timezone = Localization.getCalendars()[0]?.timeZone ?? "Unknown";
            await setUserOrganization({ organizationId: "public", timezone });

            // Refresh token after claim mutation
            await user.getIdToken(true);
            token = await user.getIdTokenResult();
          }
        }

        if (!token.claims.organizationId) {
          throw new Error("organizationId claim missing after self-heal");
        }

        setState((prev) => ({
          ...prev,
          claimsReady: true,
        }));
      } catch (err) {
        console.error("❌ Fatal auth/claim gate failure:", err);
        // Hard fail closed: sign out to force clean login + claim set
        try {
          await auth.signOut();
        } catch {}
        setState((prev) => ({
          ...prev,
          claimsReady: true, // allow app to render login/onboarding after signOut
        }));
      } finally {
        inFlightRef.current = false;
      }
    });

    return unsubscribe;
  }, []);

  return state;
}

/* ------------------------------------------------------------------ */
/* App routing (requires ThreadProvider)                               */
/* ------------------------------------------------------------------ */

function AppRouterGate({ fontsLoaded }: { fontsLoaded: boolean }) {
  const [appReady, setAppReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const navigationState = useRootNavigationState();
  const segments = useSegments();
  const { currentThreadId, currentPleaId } = useThread();

  useNotificationHandler({ currentThreadId, currentPleaId });

  // Android nav bar styling
  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("transparent");
    }
  }, []);

  // Routing gate (onboarding vs tabs)
  useEffect(() => {
    if (!fontsLoaded || !navigationState?.key) return;

    const route = async () => {
      setRedirecting(true);
      try {
        const hasOnboarded = await getHasOnboarded();
        const inOnboarding = segments[0] === "onboarding";
        const isJoinRoute = segments[0] === "join";

        // Skip routing if we're on the join route - it handles its own navigation
        if (isJoinRoute) {
          setAppReady(true);
          await SplashScreen.hideAsync();
          setRedirecting(false);
          return;
        }

        if (hasOnboarded && inOnboarding) {
          await router.replace("/(tabs)");
        } else if (!hasOnboarded && !inOnboarding) {
          await router.replace("/onboarding/intro");
        }

        setTimeout(async () => {
          setAppReady(true);
          await SplashScreen.hideAsync();
        }, 40);
      } catch (err) {
        console.error("🔴 [RootLayout] Routing error:", err);
        await router.replace("/onboarding/intro");
        setTimeout(async () => {
          setAppReady(true);
          await SplashScreen.hideAsync();
        }, 40);
      } finally {
        setRedirecting(false);
      }
    };

    route();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsLoaded, navigationState?.key]);

  if (!fontsLoaded || !appReady || redirecting) {
    return <FullScreenLoader />;
  }

  return <ThemedStack />;
}

/* ------------------------------------------------------------------ */
/* RootLayout                                                          */
/* ------------------------------------------------------------------ */

export default function RootLayout() {
  const [fontsLoaded] = useSpectralFonts({
    Spectral_400Regular,
    Spectral_700Bold,
    Spectral_700Bold_Italic,
  });

  const { authInitialized, claimsReady } = useAuthAndClaimsGate();

  useEffect(() => {
    if (!auth.currentUser) return;
    if (!claimsReady) return;

    updateUserTimezone();
  }, [claimsReady]);

  // Gate EVERYTHING (including providers that mount Firestore listeners)
  if (!fontsLoaded || !authInitialized || !claimsReady) {
    return <FullScreenLoader />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <OrganizationProvider>
          <AccountabilityProvider>
            <ModalIntentProvider>
              <ThreadProvider>
                <AppRouterGate fontsLoaded={fontsLoaded} />
              </ThreadProvider>
            </ModalIntentProvider>
          </AccountabilityProvider>
        </OrganizationProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
