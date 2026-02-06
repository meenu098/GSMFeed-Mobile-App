import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { RegistrationProvider } from "../shared/RegistrationContext";
import { ThemeProvider, useTheme } from "../shared/themeContext";

function RootLayoutNav() {
  const { isDark } = useTheme();

  return (
    <SafeAreaProvider>
      <StatusBar
        style={isDark ? "light" : "dark"}
        translucent={true}
        backgroundColor="transparent"
      />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: isDark ? "#000" : "#FFF",
            flex: 1,
          },
        }}
      />
    </SafeAreaProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RegistrationProvider>
        <RootLayoutNav />
      </RegistrationProvider>
    </ThemeProvider>
  );
}
