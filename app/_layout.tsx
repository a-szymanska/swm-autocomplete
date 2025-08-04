import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import "react-native-reanimated";

export default function RootLayout() {
  const [loaded] = useFonts({
    AeonikRegular: require("@/assets/fonts/Aeonik-Regular.otf"),
    AeonikMedium: require("@/assets/fonts/Aeonik-Medium.otf"),
  });

  if (!loaded) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
    </Stack>
  );
}
