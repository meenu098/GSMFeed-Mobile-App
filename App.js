import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import React from "react";
import { useColorScheme } from "react-native";
import Newsfeed from "./app/screens/Newsfeed";
import Sidebar from "./app/screens/Sidebar";

const Stack = createNativeStackNavigator();

export default function App() {
  const colorScheme = useColorScheme();

  return (
    <NavigationContainer
      theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}
    >
      <Stack.Navigator
        initialRouteName="Sidebar"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen name="Sidebar" component={Sidebar} />
        <Stack.Screen name="Newsfeed" component={Newsfeed} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// import {
//   DarkTheme,
//   DefaultTheme,
//   NavigationContainer,
// } from "@react-navigation/native";
// import { createNativeStackNavigator } from "@react-navigation/native-stack";
// import React, { useEffect } from "react";
// import { Platform, StatusBar, useColorScheme } from "react-native";
// import Newsfeed from "./app/Newsfeed";
// import Sidebar from "./app/Sidebar";

// const Stack = createNativeStackNavigator();

// export default function App() {
//   const colorScheme = useColorScheme();
//   const isDark = colorScheme === "dark";

//   useEffect(() => {
//     if (Platform.OS === "android") {
//       StatusBar.setTranslucent(true);
//       StatusBar.setBackgroundColor("transparent");
//     }
//   }, []);

//   return (
//     <NavigationContainer theme={isDark ? DarkTheme : DefaultTheme}>
//       <StatusBar
//         barStyle={isDark ? "light-content" : "dark-content"}
//         backgroundColor="transparent"
//         translucent
//       />

//       <Stack.Navigator
//         initialRouteName="Sidebar"
//         screenOptions={{
//           headerShown: false,
//           contentStyle: { backgroundColor: isDark ? "#000" : "#fff" },
//         }}
//       >
//         <Stack.Screen name="Sidebar" component={Sidebar} />
//         <Stack.Screen name="Newsfeed" component={Newsfeed} />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// }
