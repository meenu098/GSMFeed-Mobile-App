import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { ThemeProvider, useTheme } from "./utils/themeContext";

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
      >
        <Stack.Screen name="screens/index" />
        <Stack.Screen name="screens/Login" />
        <Stack.Screen name="screens/Newsfeed" />
        <Stack.Screen name="screens/Notifications" />
        <Stack.Screen name="screens/Profile" />
        <Stack.Screen name="screens/Pricelist" />

        <Stack.Screen
          name="screens/BroadcastManager"
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
  return (
    <ThemeProvider>
      <RootLayoutNav />
    </ThemeProvider>
  );
}

// import { Stack } from "expo-router";
// import { StatusBar } from "expo-status-bar";
// import { SafeAreaProvider } from "react-native-safe-area-context";
// import { ThemeProvider, useTheme } from "./utils/themeContext";

// // 1. Import Redux requirements
// import { Provider } from "react-redux";
// import { store } from "./redux/store";

// function RootLayoutNav() {
//   const { isDark } = useTheme();

//   return (
//     <SafeAreaProvider>
//       <StatusBar
//         style={isDark ? "light" : "dark"}
//         translucent={true}
//         backgroundColor="transparent"
//       />

//       <Stack
//         screenOptions={{
//           headerShown: false,
//           contentStyle: {
//             backgroundColor: isDark ? "#000" : "#FFF",
//             flex: 1,
//           },
//         }}
//       >
//         <Stack.Screen name="screens/index" />
//         <Stack.Screen name="screens/Login" />
//         <Stack.Screen name="screens/Newsfeed" />
//         <Stack.Screen name="screens/Notifications" />
//         <Stack.Screen name="screens/Profile" />
//         <Stack.Screen name="screens/Pricelist" />

//         <Stack.Screen
//           name="screens/BroadcastManager"
//           options={{
//             presentation: "modal",
//             animation: "slide_from_bottom",
//           }}
//         />
//       </Stack>
//     </SafeAreaProvider>
//   );
// }

// export default function RootLayout() {
//   return (
//     /* 2. Wrap everything in the Redux Provider */
//     <Provider store={store}>
//       <ThemeProvider>
//         <RootLayoutNav />
//       </ThemeProvider>
//     </Provider>
//   );
// }
