import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ContactsMenuIcons,
  MarketingIcon,
  NewsFeedMenuIcons,
  Settings,
} from "../../components/icons/sidebarIcon";
import CONFIG from "../utils/config";
import { useTheme } from "../utils/themeContext";

export default function Sidebar() {
  const router = useRouter();
  const { top, bottom } = useSafeAreaInsets();
  const { isDark, toggleTheme } = useTheme();

  const [userData, setUserData] = useState<any>(null);
  const [imgLoading, setImgLoading] = useState(false);

  const themeColors = {
    bg: isDark ? "#050609" : "#F8FAFC",
    text: isDark ? "#FFFFFF" : "#000000",
    subText: isDark ? "#94A3B8" : "#666666",
    footerBorder: isDark ? "#1E293B" : "#F0F0F0",
    toggleTrack: isDark ? "#3B66F5" : "#E2E8F0",
  };

  const formatUrl = (url: string) => {
    if (!url) return null;
    return url.replace("http://localhost:8000", CONFIG.API_ENDPOINT);
  };

  useEffect(() => {
    const loadSidebarStats = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (!userString) return;
        const user = JSON.parse(userString);

        // 1. Initial UI from storage for instant feedback
        setUserData(user);

        // 2. Fetch fresh profile details (same as ProfileScreen/BottomNav)
        const identifier = user.username || user.id;
        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/user/profile/${identifier}`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${user.token}`,
              Accept: "application/json",
            },
          },
        );

        const json = await response.json();

        if (json.status && json.data) {
          // Sync all fresh data: followers, following, and posts_count
          const updatedData = {
            ...user,
            followers_count: json.data.followers_count,
            following_count: json.data.following_count,
            posts_count: json.data.posts_count,
            avatar: json.data.avatar,
            name: json.data.name,
          };

          setUserData(updatedData);

          // Update storage so all components benefit from fresh data
          await AsyncStorage.setItem("user", JSON.stringify(updatedData));
        }
      } catch (error) {
      }
    };

    loadSidebarStats();
  }, []);

  const menuItems = [
    { icon: NewsFeedMenuIcons, label: "Newsfeed", screen: "/screens/Newsfeed" },
    // {
    //   icon: MarketPlaceMenuIcons,
    //   label: "TradingFeed",
    //   screen: "/screens/TradingFeed",
    // },
    { icon: ContactsMenuIcons, label: "Contacts", screen: "/screens/Contacts" },
    {
      icon: MarketingIcon,
      label: "Notifications",
      screen: "/screens/Notifications",
    },
    { icon: Settings, label: "Settings", screen: "/screens/Settings" },
  ];

  return (
    <View style={[styles.wrapper, { backgroundColor: themeColors.bg }]}>
      <View style={styles.sidebar}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: top + 20, paddingBottom: 50 }}
        >
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri:
                      formatUrl(userData?.avatar) ||
                      `https://ui-avatars.com/api/?name=${userData?.name || "User"}&background=3B66F5&color=fff`,
                  }}
                  style={styles.avatar}
                  onLoadStart={() => setImgLoading(true)}
                  onLoadEnd={() => setImgLoading(false)}
                />
                {imgLoading && (
                  <View style={styles.loaderOverlay}>
                    <ActivityIndicator size="small" color="#3B66F5" />
                  </View>
                )}
              </View>
            </View>

            <Text style={[styles.name, { color: themeColors.text }]}>
              {userData?.name || "Loading..."}
            </Text>
            <Text style={[styles.username, { color: themeColors.subText }]}>
              @{userData?.username || "user"}
            </Text>

            <View style={styles.statsRow}>
              <TouchableOpacity
                onPress={() => router.push("/screens/Contacts")}
              >
                <Text style={[styles.statText, { color: themeColors.subText }]}>
                  <Text
                    style={[styles.statNumber, { color: themeColors.text }]}
                  >
                    {userData?.following_count ?? 0}
                  </Text>{" "}
                  Following
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.push("/screens/Contacts")}
              >
                <Text style={[styles.statText, { color: themeColors.subText }]}>
                  <Text
                    style={[styles.statNumber, { color: themeColors.text }]}
                  >
                    {userData?.followers_count ?? 0}
                  </Text>{" "}
                  Followers
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.menuContainer}>
            {menuItems.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.menuItem}
                activeOpacity={0.7}
                onPress={() => router.push(item.screen as any)}
              >
                <View style={styles.menuLeft}>
                  <item.icon width={22} height={22} fill={themeColors.text} />
                  <Text style={[styles.menuText, { color: themeColors.text }]}>
                    {item.label}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>

        <View
          style={[
            styles.footer,
            {
              paddingBottom: bottom + 20,
              borderTopColor: themeColors.footerBorder,
            },
          ]}
        >
          <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
            <Feather
              name="moon"
              size={18}
              color={isDark ? "#3B66F5" : "#94A3B8"}
            />
            <View
              style={[
                styles.toggleTrack,
                { backgroundColor: themeColors.toggleTrack },
              ]}
            >
              <View
                style={[
                  styles.toggleThumb,
                  { alignSelf: isDark ? "flex-end" : "flex-start" },
                ]}
              />
            </View>
            <Feather
              name="sun"
              size={18}
              color={isDark ? "#94A3B8" : "#FFC700"}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.replace("/screens/Login")}>
            <Feather name="log-out" size={22} color={themeColors.text} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  sidebar: { flex: 1, paddingHorizontal: 25 },
  header: { marginBottom: 10 },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  avatar: { width: "100%", height: "100%" },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  name: { fontSize: 20, fontWeight: "700" },
  username: { fontSize: 14, marginBottom: 15 },
  statsRow: { flexDirection: "row", gap: 15, marginBottom: 20 },
  statText: { fontSize: 14 },
  statNumber: { fontWeight: "700" },
  menuContainer: { marginTop: 10 },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
  },
  menuLeft: { flexDirection: "row", alignItems: "center" },
  menuText: { fontSize: 16, marginLeft: 15, fontWeight: "400" },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 20,
    borderTopWidth: 1,
  },
  themeToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 6,
  },
  toggleTrack: {
    width: 38,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 16,
    height: 16,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 2,
  },
});
