// app/_layout.tsx
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
import "react-native-reanimated";

import { useNotificationHandler } from "@/hooks/useNotificationHandler";
import { ensureSignedIn } from "@/lib/auth";
import { getHasOnboarded } from "@/lib/onboarding";

// Font imports
import {
  Spectral_400Regular,
  Spectral_700Bold,
  Spectral_700Bold_Italic,
  useFonts as useSpectralFonts,
} from "@expo-google-fonts/spectral";
import * as Notifications from "expo-notifications";

// 👇 Import your ThemeProvider and useTheme
import { ThemeProvider, useTheme } from "@/hooks/ThemeContext";

// 👇 Set foreground notification handler before React renders
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

SplashScreen.preventAutoHideAsync();

// 👇 A wrapper so we can use useTheme inside
function ThemedStack() {
  const { effectiveTheme } = useTheme();

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
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            headerShown: false,
            animation: "slide_from_bottom",
            gestureEnabled: true,
            gestureDirection: "vertical",
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      {/* 👇 Dynamically set StatusBar style based on palette/mode */}
      <StatusBar style={effectiveTheme === "dark" ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const segments = useSegments();
  const navigationState = useRootNavigationState();

  // Add notification handler
  useNotificationHandler();

  const [spectralLoaded] = useSpectralFonts({
    Spectral_400Regular,
    Spectral_700Bold,
    Spectral_700Bold_Italic,
  });

  // Check if we're in the auth group
  const inAuthGroup = segments[0] === "onboarding";

  useEffect(() => {
    if (!spectralLoaded || !navigationState?.key) return;

    const checkAuth = async () => {
      try {
        const hasCompleted = await getHasOnboarded();

        // If onboarding is complete, ensure Firebase auth
        if (hasCompleted) {
          await ensureSignedIn();
        }

        if (!isNavigationReady) {
          setIsNavigationReady(true);
          await SplashScreen.hideAsync();
        }

        // Only navigate if we're not already in the right place
        if (hasCompleted && inAuthGroup) {
          router.replace("/(tabs)");
        } else if (!hasCompleted && !inAuthGroup) {
          router.replace("/onboarding/intro");
        }
      } catch (error) {
        if (!isNavigationReady) {
          setIsNavigationReady(true);
          await SplashScreen.hideAsync();
        }
        router.replace("/onboarding/intro");
      }
    };

    checkAuth();
    // eslint-disable-next-line
  }, [spectralLoaded, navigationState?.key, isNavigationReady]);

  if (!spectralLoaded || !isNavigationReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#fff", // Or some fallback color
        }}
      >
        <ActivityIndicator size="large" color="#667eea" />
      </View>
    );
  }

  // 👇 Wrap app in your ThemeProvider!
  return (
    <ThemeProvider>
      <ThemedStack />
    </ThemeProvider>
  );
}
