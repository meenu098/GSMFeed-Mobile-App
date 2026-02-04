import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "../utils/themeContext";

function RootLayoutNav() {
  const { isDark } = useTheme();

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: isDark ? "#000" : "#FFF" },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="Login" />
        <Stack.Screen
          name="BroadcastManager"
          options={{
            presentation: "modal",
            animation: "slide_from_bottom",
          }}
        />

        {/* Other Screens */}
        <Stack.Screen name="Notifications" />
        <Stack.Screen name="Profile" />
      </Stack>
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}
