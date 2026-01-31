// app/_layout.tsx
import "react-native-reanimated";

import { AccountabilityProvider } from "@/context/AccountabilityContext";
import { ModalIntentProvider } from "@/context/ModalIntentContext";
import { OrganizationProvider } from "@/context/OrganizationContext";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";
import { ThreadProvider, useThread } from "@/context/ThreadContext";

import { useNotificationHandler } from "@/hooks/notification/useNotificationHandler";
import { useVersionCheck } from "@/hooks/updates/useVersionCheck";
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

// Notifications
import * as NavigationBar from "expo-navigation-bar";
import * as Notifications from "expo-notifications";

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
        <Stack.Screen name="update" />
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
        console.log(
          "[_layout.useAuthAndClaimsGate] 🔵 User signed in:",
          user.uid,
        );

        // Simple gate: just mark auth as ready
        // OrganizationContext will handle finding the user document and setting the org
        console.log("[_layout.useAuthAndClaimsGate] ✅ Auth ready");
        setState((prev) => ({
          ...prev,
          claimsReady: true,
        }));
      } catch (err) {
        console.error("❌ Fatal auth gate failure:", err);
        setState((prev) => ({
          ...prev,
          claimsReady: true,
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

function AppRouterGate({
  fontsLoaded,
  updateRequired,
}: {
  fontsLoaded: boolean;
  updateRequired: boolean;
}) {
  const [appReady, setAppReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const isNavigatingRef = useRef(false);

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

  // Routing gate (update check -> onboarding vs tabs)
  useEffect(() => {
    if (!fontsLoaded || !navigationState?.key) return;
    if (isNavigatingRef.current) return; // Prevent concurrent navigation attempts

    const route = async () => {
      isNavigatingRef.current = true;
      setRedirecting(true);
      try {
        const isJoinRoute = segments[0] === "join";
        const isUpdateRoute = segments[0] === "update";

        console.log("[AppRouterGate] Routing check:", {
          updateRequired,
          isUpdateRoute,
          currentSegment: segments[0],
        });

        // If update is required, redirect to update screen and stop
        if (updateRequired && !isUpdateRoute) {
          console.log("[AppRouterGate] ➡️ Redirecting to /update");

          // Defer navigation to next tick to avoid navigator state conflicts
          setTimeout(() => {
            router.replace("/update");
          }, 0);

          setTimeout(async () => {
            setAppReady(true);
            await SplashScreen.hideAsync();
          }, 40);
          setRedirecting(false);
          return;
        }

        // Skip routing if we're on the join route - it handles its own navigation
        if (isJoinRoute) {
          setAppReady(true);
          await SplashScreen.hideAsync();
          setRedirecting(false);
          return;
        }

        const hasOnboarded = await getHasOnboarded();
        const inOnboarding = segments[0] === "onboarding";

        // If we're on update screen but no longer need update, route based on onboarding status
        // OR if we're in wrong place for onboarding state
        if (
          (isUpdateRoute && !updateRequired) ||
          (hasOnboarded && inOnboarding) ||
          (!hasOnboarded && !inOnboarding && !isUpdateRoute)
        ) {
          const targetRoute = hasOnboarded ? "/(tabs)" : "/onboarding/intro";
          console.log(`[AppRouterGate] ➡️ Routing to ${targetRoute}`);

          // Defer navigation to next tick to avoid navigator state conflicts
          setTimeout(() => {
            router.replace(targetRoute);
          }, 0);

          setTimeout(async () => {
            setAppReady(true);
            await SplashScreen.hideAsync();
          }, 40);
          setRedirecting(false);
          return;
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
        isNavigatingRef.current = false;
      }
    };

    route();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontsLoaded, navigationState?.key, updateRequired]);

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

  const { updateRequired, loading: versionLoading } = useVersionCheck();

  const { authInitialized, claimsReady } = useAuthAndClaimsGate();

  useEffect(() => {
    if (!auth.currentUser) return;
    if (!claimsReady) return;

    updateUserTimezone();
  }, [claimsReady]);

  // Gate on fonts loading first
  if (!fontsLoaded) {
    return <FullScreenLoader />;
  }

  // Check version requirement (after fonts, before auth)
  if (versionLoading) {
    return <FullScreenLoader />;
  }

  // Gate EVERYTHING (including providers that mount Firestore listeners)
  if (!authInitialized || !claimsReady) {
    return <FullScreenLoader />;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <OrganizationProvider>
          <AccountabilityProvider>
            <ModalIntentProvider>
              <ThreadProvider>
                <AppRouterGate
                  fontsLoaded={fontsLoaded}
                  updateRequired={updateRequired}
                />
              </ThreadProvider>
            </ModalIntentProvider>
          </AccountabilityProvider>
        </OrganizationProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
