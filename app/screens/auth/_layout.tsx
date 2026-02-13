import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { parseStoredUser, resolveAuthenticatedRoute } from "../../../shared/authGate";

export default function AuthLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let mounted = true;
    const checkAuth = async () => {
      try {
        const rawUser = await AsyncStorage.getItem("user");
        const user = parseStoredUser(rawUser);
        const nextRoute = resolveAuthenticatedRoute(user);
        if (nextRoute !== "/screens/auth/Login") {
          router.replace(nextRoute);
          return;
        }
      } finally {
        if (mounted) setChecking(false);
      }
    };

    checkAuth();
    return () => {
      mounted = false;
    };
  }, [router]);

  if (checking) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
