import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CONFIG from "../utils/config";
import { useTheme } from "../utils/themeContext";

const BlockedAccountsScreen = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Theme configuration matching your app's branding
  const theme = {
    bg: isDark ? "#0B0E14" : "#F8FAFC",
    card: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1B2331" : "#E2E8F0",
    buttonBg: isDark ? "#1B2331" : "#E9ECEF",
    primary: "#3B66F5",
  };

  useEffect(() => {
    fetchBlockedList();
  }, []);

  // API Call: Fetch Blocked List
  const fetchBlockedList = async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      const response = await fetch(`${CONFIG.API_ENDPOINT}/api/block/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setBlockedUsers(data.data); // data.data contains the list of blocked user objects
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // API Call: Unblock User
  const handleUnblock = async (id: string) => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      const response = await fetch(`${CONFIG.API_ENDPOINT}/api/unblock/user`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ blocked_user_id: id }), // Payload uses blocked_user_id
      });

      if (response.ok) {
        // Refresh the list locally after successful unblock
        fetchBlockedList();
      } else {
        Alert.alert("Error", "Failed to unblock user.");
      }
    } catch (error) {
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Blocked accounts
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.description, { color: theme.subText }]}>
          You can view and manage the accounts you have blocked here anytime.
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginTop: 50 }}
          />
        ) : blockedUsers?.length > 0 ? (
          /* Mapping the blocked users from the API response */
          blockedUsers.map((item) => (
            <View
              key={item.id}
              style={[
                styles.userCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View style={styles.userInfo}>
                <Image
                  source={{
                    uri: item.user.avatar || "https://via.placeholder.com/40",
                  }}
                  style={styles.avatar}
                />
                <View>
                  <Text style={[styles.userName, { color: theme.text }]}>
                    {item.user.name}
                  </Text>
                  <Text style={[styles.userHandle, { color: theme.subText }]}>
                    @{item.user.username}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.unblockButton,
                  { backgroundColor: theme.buttonBg },
                ]}
                onPress={() => handleUnblock(item.user.id)}
              >
                <Text style={[styles.unblockText, { color: theme.text }]}>
                  Unblock
                </Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          /* Empty State UI matching the muted accounts design */
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={["#316aff", "#ff00ff"]}
              style={styles.gradientBorder}
            >
              <View style={[styles.innerCircle, { backgroundColor: theme.bg }]}>
                <Text style={styles.exclamation}>!</Text>
              </View>
            </LinearGradient>
            <Text style={[styles.emptyText, { color: theme.subText }]}>
              You currently have no blocked users.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  headerTitle: { fontSize: 20, fontWeight: "bold" },
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  description: { fontSize: 15, lineHeight: 22, marginBottom: 30 },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  userInfo: { flexDirection: "row", alignItems: "center" },
  avatar: { width: 40, height: 40, borderRadius: 20, marginRight: 12 },
  userName: { fontSize: 15, fontWeight: "600" },
  userHandle: { fontSize: 13 },
  unblockButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  unblockText: { fontSize: 13, fontWeight: "600" },
  emptyContainer: { alignItems: "center", marginTop: 80 },
  gradientBorder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
  },
  innerCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    justifyContent: "center",
    alignItems: "center",
  },
  exclamation: { fontSize: 60, fontWeight: "300", color: "#316aff" },
  emptyText: { fontSize: 15, textAlign: "center", marginTop: 25 },
});

export default BlockedAccountsScreen;
