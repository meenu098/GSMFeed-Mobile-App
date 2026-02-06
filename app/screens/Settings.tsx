import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, SimpleLineIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AccountIcon,
  BlockedIcon,
  InterestsIcon,
  MutedIcon,
  NotificationIcon,
  PasswordIcon,
  PersonalDetailsIcon,
  PrivacyIcon,
} from "../../components/icons/sidebarIcon";
import SidebarOverlay from "../../components/SidebarOverlay";
import { useTheme } from "../../shared/themeContext";

// Updated SettingRow to handle both Font Icons and SVG Components
const SettingRow = ({
  icon,
  title,
  isDark,
  iconFamily = "Feather",
  onPress,
}: any) => {
  const iconColor = isDark ? "#FFF" : "#334155";
  const IconComponent =
    iconFamily === "SimpleLineIcons" ? SimpleLineIcons : Feather;

  return (
    <TouchableOpacity style={styles.settingRow} onPress={onPress}>
      {/* Background circle removed as requested */}
      <View style={{ marginRight: 15, width: 24, alignItems: "center" }}>
        {React.isValidElement(icon) ? (
          // Use type assertion to tell TS that 'color' and 'fill' are allowed
          React.cloneElement(icon as React.ReactElement<any>, {
            color: iconColor,
            fill: iconColor,
          })
        ) : (
          <IconComponent name={icon} size={20} color={iconColor} />
        )}
      </View>

      <Text style={[styles.rowTitle, { color: isDark ? "#FFF" : "#334155" }]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
};

const SectionHeader = ({
  title,
  isDark,
}: {
  title: string;
  isDark: boolean;
}) => (
  <Text
    style={[styles.sectionHeader, { color: isDark ? "#94A3B8" : "#64748B" }]}
  >
    {title}
  </Text>
);

export default function SettingsScreen() {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [username, setUsername] = useState<string>("User");

  const theme = {
    bg: isDark ? "#0F172A" : "#FFFFFF",
    text: isDark ? "#FFF" : "#000",
    border: isDark ? "#1E293B" : "#E2E8F0",
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (!userString) return;
        const user = JSON.parse(userString);
        const nextUsername = user?.username || user?.name;
        if (nextUsername) setUsername(nextUsername);
      } catch (error) {
      }
    };

    loadUser();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View
        style={[
          styles.header,
          { paddingTop: insets.top + 10, borderBottomColor: theme.border },
        ]}
      >
        <View style={styles.headerTitleRow}>
          <TouchableOpacity onPress={() => router.back()}>
            <Feather name="chevron-left" size={30} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.profileSelectRow}
            onPress={() => router.push("/screens/Profile")}
          >
            <Text style={[styles.headerTitle, { color: theme.text }]}>
              {username}
            </Text>
            <Feather name="chevron-down" size={20} color={theme.text} />
          </TouchableOpacity>
        </View>

        <View style={styles.headerIcons}>
          <TouchableOpacity style={styles.headerIcon}>
            <Feather name="search" size={24} color={theme.text} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerIcon}
            onPress={() => setSidebarVisible(true)}
          >
            <Feather name="menu" size={24} color={theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <SectionHeader title="Everything about you" isDark={isDark} />
        <SettingRow
          icon={<AccountIcon />}
          title="Edit profile"
          isDark={isDark}
          onPress={() => router.push("/screens/EditProfile")}
        />
        <SettingRow
          icon={<PersonalDetailsIcon />}
          title="Personal details"
          isDark={isDark}
          onPress={() => router.push("/screens/PersonalDetails")}
        />
        <SettingRow
          icon={<PasswordIcon />}
          title="Password and security"
          isDark={isDark}
          onPress={() => router.push("/screens/PasswordAndSecuirty")}
        />
        <SettingRow
          icon={<NotificationIcon />}
          title="Notifications"
          isDark={isDark}
          onPress={() => router.push("/screens/NotificationSettings")}
        />

        <SectionHeader title="Who can see your stuff" isDark={isDark} />
        <SettingRow
          icon={<PrivacyIcon />}
          title="Account Privacy"
          isDark={isDark}
          onPress={() => router.push("/screens/PrivacySettings")}
        />
        <SettingRow
          icon={<BlockedIcon />}
          title="Blocked"
          isDark={isDark}
          onPress={() => router.push("/screens/BlockedList")}
        />

        <SectionHeader title="What you see" isDark={isDark} />
        <SettingRow
          icon={<MutedIcon />}
          title="Muted accounts"
          isDark={isDark}
          onPress={() => router.push("/screens/MutedList")}
        />
        <SettingRow
          icon={<InterestsIcon />}
          title="Interests"
          isDark={isDark}
          onPress={() => router.push("/screens/InterestSelection")}
        />
        {/* <SettingRow
          icon={<MembershipIcon />}
          title="Membership"
          isDark={isDark}
          onPress={() => router.push("/screens/Membership")}
        /> */}
      </ScrollView>

      <SidebarOverlay
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingBottom: 18,
  },

  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  profileSelectRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  headerIcons: { flexDirection: "row", gap: 15 },
  headerIcon: { padding: 4 },
  scrollContent: { paddingHorizontal: 25, paddingBottom: 60 },
  pageTitle: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 10,
    marginTop: 10,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: "600",
    marginTop: 25,
    marginBottom: 10,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
  },
  iconContainer: {
    marginRight: 15,
    width: 24,
    alignItems: "center",
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "500",
  },
  headerTitle: { fontSize: 20, fontWeight: "700" },
});
