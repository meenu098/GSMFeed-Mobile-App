import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import type { Href } from "expo-router";
import { usePathname, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  Image,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";

import { Home, Message, Search, User } from "../components/icons/bottomNavIcon";
import CONFIG from "../shared/config";
import { useTheme } from "../shared/themeContext";

const { width } = Dimensions.get("window");

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();
  const { isDark } = useTheme();

  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [imgLoading, setImgLoading] = useState(false);

  const themeColors = {
    gradient: isDark
      ? ([
          "rgba(11, 14, 20, 0.85)",
          "rgba(11, 14, 20, 0.95)",
          "#0B0E14",
        ] as const)
      : ([
          "rgba(255,255,255,0.85)",
          "rgba(255,255,255,0.95)",
          "#FFFFFF",
        ] as const),
    inactiveIcon: isDark ? "#94A3B8" : "#64748B",
    activeIcon: "#3B66F5",
  };

  const formatAvatarUrl = (url: string) => {
    if (!url) return null;
    // Fix for local development vs production endpoint
    return url.replace("http://localhost:8000", CONFIG.API_ENDPOINT);
  };

  useEffect(() => {
    const syncAvatar = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (!userString) return;

        const user = JSON.parse(userString);

        // 1. Set from storage immediately to prevent blank icon
        if (user.avatar) {
          setProfileImage(formatAvatarUrl(user.avatar));
        }

        // 2. Fetch fresh profile details using the updated endpoint
        // Using username as the identifier just like in the ProfileScreen
        const identifier = user.username || user.id;

        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/user/profile/${identifier}`,
          {
            method: "GET",
            headers: { Authorization: `Bearer ${user.token}` },
          },
        );

        const json = await response.json();

        // Update with the fresh 'avatar' field from the profile response
        if (json.status && json.data?.avatar) {
          const freshAvatar = formatAvatarUrl(json.data.avatar);
          setProfileImage(freshAvatar);

          // Keep AsyncStorage in sync so the next app load is instant
          const updatedUser = { ...user, avatar: json.data.avatar };
          await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        }
      } catch (error) {}
    };

    syncAvatar();
  }, []);

  const navItems = [
    { name: "Home", Icon: Home, route: "/screens/Newsfeed" as Href },
    { name: "Contacts", Icon: User, route: "/screens/Contacts" as Href },
    { name: "Chats", Icon: Message, route: "/screens/ChatItem" as Href },
    {
      name: "Search",
      Icon: Search,
      route: "/screens/AdvancedSearchOverlay" as Href,
    },
    { name: "Profile", route: "/screens/Profile" as Href },
  ];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={themeColors.gradient}
        locations={[0, 0.3, 1]}
        style={styles.gradientOverlay}
      >
        <View style={styles.iconRow}>
          {navItems.map((item, index) => {
            const isActive = pathname === item.route;

            return (
              <TouchableOpacity
                key={index}
                onPress={() => {
                  if (item.name === "Profile") {
                    if (isActive) {
                      router.replace(item.route);
                    } else {
                      router.push(item.route);
                    }
                    return;
                  }
                  if (!isActive) router.push(item.route);
                }}
                style={styles.iconButton}
              >
                {item.name === "Profile" ? (
                  <View
                    style={[
                      styles.avatarContainer,
                      {
                        borderColor: isActive
                          ? themeColors.activeIcon
                          : "transparent",
                      },
                    ]}
                  >
                    <Image
                      key={profileImage}
                      source={{
                        uri:
                          profileImage ||
                          "https://ui-avatars.com/api/?name=User&background=3B66F5&color=fff",
                      }}
                      style={styles.avatarIcon}
                      onLoadStart={() => !profileImage && setImgLoading(true)}
                      onLoadEnd={() => setImgLoading(false)}
                      onError={() => setImgLoading(false)}
                    />
                    {imgLoading && (
                      <View style={styles.loaderOverlay}>
                        <ActivityIndicator
                          size="small"
                          color={themeColors.activeIcon}
                        />
                      </View>
                    )}
                  </View>
                ) : (
                  item.Icon && (
                    <item.Icon
                      width={24}
                      height={24}
                      fill={
                        isActive
                          ? themeColors.activeIcon
                          : themeColors.inactiveIcon
                      }
                    />
                  )
                )}
                {isActive && (
                  <View
                    style={[
                      styles.activeDot,
                      { backgroundColor: themeColors.activeIcon },
                    ]}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: "absolute", bottom: 0, width: width, zIndex: 100 },
  gradientOverlay: {
    width: "100%",
    height: 85,
    justifyContent: "center",
    paddingBottom: 20,
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingHorizontal: 10,
  },
  iconButton: { padding: 10, alignItems: "center", justifyContent: "center" },
  avatarContainer: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    overflow: "hidden",
    backgroundColor: "#cbd5e1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarIcon: { width: "100%", height: "100%", resizeMode: "cover" },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
    position: "absolute",
    bottom: -2,
  },
});
