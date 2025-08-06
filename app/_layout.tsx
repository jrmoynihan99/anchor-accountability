import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";

// Font imports
import {
  DancingScript_400Regular,
  DancingScript_700Bold,
  useFonts as useDancingScriptFonts,
} from "@expo-google-fonts/dancing-script";
import {
  GreatVibes_400Regular,
  useFonts as useGreatVibesFonts,
} from "@expo-google-fonts/great-vibes";
import {
  MarckScript_400Regular,
  useFonts as useMarckScriptFonts,
} from "@expo-google-fonts/marck-script";
import {
  Satisfy_400Regular,
  useFonts as useSatisfyFonts,
} from "@expo-google-fonts/satisfy";
import {
  Spectral_400Regular,
  Spectral_700Bold,
  Spectral_700Bold_Italic,
  useFonts as useSpectralFonts,
} from "@expo-google-fonts/spectral";

// Optional: Your custom font (e.g. SpaceMono)
import { useFonts as useMonoFonts } from "expo-font";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [spectralLoaded] = useSpectralFonts({
    Spectral_400Regular,
    Spectral_700Bold,
    Spectral_700Bold_Italic,
  });
  const [greatVibesLoaded] = useGreatVibesFonts({
    GreatVibes_400Regular,
  });
  const [satisfyLoaded] = useSatisfyFonts({
    Satisfy_400Regular,
  });
  const [marckLoaded] = useMarckScriptFonts({
    MarckScript_400Regular,
  });
  const [dancingLoaded] = useDancingScriptFonts({
    DancingScript_400Regular,
    DancingScript_700Bold,
  });
  const [monoLoaded] = useMonoFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const fontsReady =
    spectralLoaded &&
    greatVibesLoaded &&
    satisfyLoaded &&
    marckLoaded &&
    dancingLoaded &&
    monoLoaded;

  useEffect(() => {
    if (fontsReady) {
      SplashScreen.hideAsync();
    }
  }, [fontsReady]);

  if (!fontsReady) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{
            presentation: "modal",
            headerShown: false,
            animation: "slide_from_bottom", // or try other values
            gestureEnabled: true,
            gestureDirection: "vertical",
          }}
        />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
