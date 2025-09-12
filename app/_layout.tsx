// app/_layout.tsx
import "react-native-reanimated";

import { ModalIntentProvider } from "@/context/ModalIntentContext";
import { ThreadProvider, useThread } from "@/context/ThreadContext";
import { useNotificationHandler } from "@/hooks/useNotificationHandler";
import { ensureSignedIn } from "@/lib/auth";
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
import * as Notifications from "expo-notifications";

let getCurrentThreadId: (() => string | null) | null = null;
let getCurrentPleaId: (() => string | null) | null = null;

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const data = notification.request.content.data;

    // Suppress banner if already viewing thread
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

    // Suppress banner if already viewing encouragement plea
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

    // Default banner behavior
    return {
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    };
  },
});

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
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const { currentThreadId, currentPleaId } = useThread();

  // Only keep regular notification handling
  useNotificationHandler({ currentThreadId, currentPleaId });

  const [spectralLoaded] = useSpectralFonts({
    Spectral_400Regular,
    Spectral_700Bold,
    Spectral_700Bold_Italic,
  });

  const inAuthGroup = segments[0] === "onboarding";

  useEffect(() => {
    if (!spectralLoaded || !navigationState?.key) return;
    const checkAuth = async () => {
      try {
        const hasCompleted = await getHasOnboarded();
        if (hasCompleted) await ensureSignedIn();
        if (!isNavigationReady) {
          setIsNavigationReady(true);
          await SplashScreen.hideAsync();
        }
        if (hasCompleted && inAuthGroup) router.replace("/(tabs)");
        else if (!hasCompleted && !inAuthGroup)
          router.replace("/onboarding/intro");
      } catch (error) {
        if (!isNavigationReady) {
          setIsNavigationReady(true);
          await SplashScreen.hideAsync();
        }
        router.replace("/onboarding/intro");
      }
    };
    checkAuth();
  }, [spectralLoaded, navigationState?.key, isNavigationReady]);

  if (!spectralLoaded || !isNavigationReady) {
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
