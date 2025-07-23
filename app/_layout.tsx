import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import "react-native-reanimated";

import { useColorScheme } from "@/hooks/useColorScheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("@/assets/fonts/SpaceMono-Regular.ttf"),
    GamjaFlower: require("@/assets/fonts/GamjaFlower.ttf"),
    KleeOne: require("@/assets/fonts/KleeOne.ttf"),
    PlaywriteRegular: require("@/assets/fonts/PlaywriteDEGrund-Regular.ttf"),
    PlaywriteLight: require("@/assets/fonts/PlaywriteDEGrund-Light.ttf"),
    PlaywriteVariable: require("@/assets/fonts/PlaywriteDEGrund-Variable.ttf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
