import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { resolveAuthenticatedRoute } from "../shared/authGate";
import CONFIG from "../shared/config";
import { getUser, setUser } from "../shared/storage";

const hasPrimaryAccess = (user: any) => {
  const value = user?.has_account_primary_access;
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    return normalized === "1" || normalized === "true" || normalized === "yes";
  }
  return false;
};

export default function UnderReviewScreen() {
  const router = useRouter();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.03,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ]),
    ).start();
  }, [scaleAnim]);

  useEffect(() => {
    let active = true;

    const syncUserAndRoute = async () => {
      const storedUser = await getUser();
      if (!storedUser || !active) return;

      if (hasPrimaryAccess(storedUser)) {
        router.replace("/screens/Newsfeed");
        return;
      }

      const routeFromStored = resolveAuthenticatedRoute(storedUser);
      if (routeFromStored !== "/under-review") {
        router.replace(routeFromStored);
        return;
      }

      if (!storedUser?.token) return;

      try {
        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/auth/get-auth-data`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${storedUser.token}`,
              Accept: "application/json",
            },
          },
        );
        const result = await response.json();

        if (response.ok && result?.status && result?.data) {
          const mergedUser = {
            ...storedUser,
            ...result.data,
            token: storedUser.token,
            refresh_token: storedUser.refresh_token,
          };

          await setUser(mergedUser);
          if (!active) return;

          if (hasPrimaryAccess(mergedUser)) {
            router.replace("/screens/Newsfeed");
            return;
          }

          const nextRoute = resolveAuthenticatedRoute(mergedUser);
          if (nextRoute !== "/under-review") {
            router.replace(nextRoute);
          }
        }
      } catch {
        // Keep user on under-review when revalidation fails.
      }
    };

    syncUserAndRoute();
    const timer = setInterval(syncUserAndRoute, 15000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [router]);

  const handleBackToLogin = () => {
    router.replace("/screens/auth/Login");
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={["#0A0A1A", "#1A0B2E", "#020205"]}
        style={StyleSheet.absoluteFillObject}
      />

      <View style={styles.contentWrapper}>
        {/* REVIEW CARD */}
        <View style={styles.glassWrapper}>
          <BlurView
            intensity={Platform.OS === "ios" ? 40 : 100}
            tint="dark"
            style={styles.blurContainer}
          >
            <View style={styles.innerCard}>
              <View style={styles.iconCircle}>
                <MaterialCommunityIcons
                  name="file-search-outline"
                  size={50}
                  color="#3B66F5"
                />
              </View>
              <Text style={styles.title}>Your account is under review</Text>
              <Text style={styles.subtitle}>
                We are currently reviewing your account. This takes a maximum of
                48 hours.
              </Text>

              <View style={styles.divider} />

              <TouchableOpacity
                onPress={handleBackToLogin}
                style={styles.backBtn}
              >
                <Ionicons
                  name="log-out-outline"
                  size={18}
                  color="rgba(255,255,255,0.5)"
                />
                <Text style={styles.backBtnText}>Back to Login</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentWrapper: { flex: 1, justifyContent: "center", padding: 25 },
  glassWrapper: {
    borderRadius: 28,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  premiumMargin: { marginTop: 20, borderColor: "rgba(59, 102, 245, 0.4)" },
  blurContainer: { padding: 30, alignItems: "center" },
  innerCard: {
    alignItems: "center",
    backgroundColor: "transparent",
    width: "100%",
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(59, 102, 245, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(59, 102, 245, 0.3)",
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 12,
    color: "#FFFFFF",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    textAlign: "center",
    lineHeight: 20,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 20,
  },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 8 },
  backBtnText: {
    color: "rgba(255,255,255,0.5)",
    fontSize: 14,
    fontWeight: "600",
  },
  premiumLabel: {
    color: "#3B66F5",
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#FFF",
    marginTop: 8,
    marginBottom: 20,
  },
  buttonContainer: { width: "100%", maxWidth: 180 },
  touchable: { borderRadius: 14, overflow: "hidden" },
  gradientButton: {
    paddingVertical: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
  },
  buttonText: { color: "#FFFFFF", fontSize: 15, fontWeight: "700" },
  buttonIcon: { marginLeft: 8 },
});
