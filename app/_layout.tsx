// FIXED - app/_layout.tsx
import "react-native-reanimated";

import { ModalIntentProvider } from "@/context/ModalIntentContext";
import { ThreadProvider, useThread } from "@/context/ThreadContext";
import { useNotificationHandler } from "@/hooks/useNotificationHandler";
import { auth } from "@/lib/firebase";
import { getHasOnboarded } from "@/lib/onboarding";
import {
  Stack,
  router,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

import { ThemeProvider, useTheme } from "@/hooks/ThemeContext";
import {
  Spectral_400Regular,
  Spectral_700Bold,
  Spectral_700Bold_Italic,
  useFonts as useSpectralFonts,
} from "@expo-google-fonts/spectral";

// Notifications
import * as NavigationBar from "expo-navigation-bar"; // <-- Add this import at the top
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

// --- Notification handler logic remains unchanged ---
let getCurrentThreadId: (() => string | null) | null = null;
let getCurrentPleaId: (() => string | null) | null = null;

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;
    if (data?.threadId && getCurrentThreadId) {
      const currentThread = getCurrentThreadId();
      if (currentThread === data.threadId) {
        return {
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }
    }
    if (data?.pleaId && data?.type === "encouragement" && getCurrentPleaId) {
      const currentPlea = getCurrentPleaId();
      if (currentPlea === data.pleaId) {
        return {
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        };
      }
    }
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});

// --- Prevent splash from auto-hiding, will hide manually ---
SplashScreen.preventAutoHideAsync();

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
        <Stack.Screen
          name="message-thread"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="plea-view-all"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            presentation: "card",
          }}
        />
        <Stack.Screen
          name="my-reachouts-all"
          options={{
            headerShown: false,
            animation: "slide_from_right",
            presentation: "card",
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
    </>
  );
}

function AppContent() {
  const [spectralLoaded] = useSpectralFonts({
    Spectral_400Regular,
    Spectral_700Bold,
    Spectral_700Bold_Italic,
  });

  const [appReady, setAppReady] = useState(false);
  const [redirecting, setRedirecting] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  const navigationState = useRootNavigationState();
  const segments = useSegments();
  const { currentThreadId, currentPleaId } = useThread();

  useNotificationHandler({ currentThreadId, currentPleaId });

  useEffect(() => {
    if (Platform.OS === "android") {
      NavigationBar.setBackgroundColorAsync("transparent");
    }
  }, []);

  // ✅ FIX: Wait for auth to initialize before doing anything
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setAuthInitialized(true);
    });
    return () => unsubscribe();
  }, []);

  // --- Core: Only show spinner until the decision is made ---
  useEffect(() => {
    if (!spectralLoaded || !navigationState?.key || !authInitialized) {
      return;
    }

    const checkAndRoute = async () => {
      setRedirecting(true);
      try {
        const hasCompleted = await getHasOnboarded();
        // Get first segment (onboarding or tabs)
        const inAuthGroup = segments[0] === "onboarding";
        if (hasCompleted && inAuthGroup) {
          // User completed onboarding but is on onboarding screens: route to tabs
          await router.replace("/(tabs)");
        } else if (!hasCompleted && !inAuthGroup) {
          // User has not onboarded, but is not in onboarding screens: route to onboarding
          await router.replace("/onboarding/intro");
        }
        // Delay just a tick so navigation state can update
        setTimeout(async () => {
          setAppReady(true);
          await SplashScreen.hideAsync();
        }, 40);
      } catch (error) {
        // Fail open: route to onboarding
        await router.replace("/onboarding/intro");
        setTimeout(async () => {
          setAppReady(true);
          await SplashScreen.hideAsync();
        }, 40);
      } finally {
        setRedirecting(false);
      }
    };

    checkAndRoute();
    // Only run on initial load (not on segments/naviationState change)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spectralLoaded, navigationState?.key, authInitialized]);

  // --- Don't mount stack until all fonts loaded, auth initialized, check finished, and redirect done ---
  if (!spectralLoaded || !appReady || redirecting || !authInitialized) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "#fff",
          }}
        >
          <ActivityIndicator size="large" color="#667eea" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return <ThemedStack />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <ModalIntentProvider>
          <ThreadProvider>
            <AppContent />
          </ThreadProvider>
        </ModalIntentProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
