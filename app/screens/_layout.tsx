import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useTheme } from "../../shared/themeContext";

function RootLayoutNav() {
  const { isDark, colors } = useTheme();

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen
          name="BroadcastManager"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />
      </Stack>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return <RootLayoutNav />;
}
