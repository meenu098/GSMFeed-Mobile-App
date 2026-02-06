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
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

const MutedAccountsScreen = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const [mutedUsers, setMutedUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic Theme based on your global theme context
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
    fetchMutedList();
  }, []);

  // API Call: Fetch Muted List
  const fetchMutedList = async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      const response = await fetch(`${CONFIG.API_ENDPOINT}/api/mute/list`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setMutedUsers(data.data); // data.data contains the list of muted objects
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // API Call: Unmute User
  const handleUnmute = async (id: string) => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      const response = await fetch(`${CONFIG.API_ENDPOINT}/api/unmute/user`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
        body: JSON.stringify({ muted_user_id: id }), // Payload uses muted_user_id
      });

      if (response.ok) {
        // Refresh the list after successful unmute
        fetchMutedList();
      } else {
        Alert.alert("Error", "Failed to unmute user.");
      }
    } catch (error) {
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Muted accounts
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={[styles.description, { color: theme.subText }]}>
          You can view and manage the accounts you have muted here anytime.
        </Text>

        {loading ? (
          <ActivityIndicator
            size="large"
            color={theme.primary}
            style={{ marginTop: 50 }}
          />
        ) : mutedUsers?.length > 0 ? (
          /* Muted User List Mapping */
          mutedUsers.map((item, index) => (
            <View
              key={item.id}
              style={[
                styles.userCard,
                { backgroundColor: theme.card, borderColor: theme.border },
                index === mutedUsers.length - 1 ? { marginBottom: 40 } : null,
              ]}
            >
              <View style={styles.userInfo}>
                <Image
                  source={{
                    uri: item?.user?.avatar || "https://via.placeholder.com/40",
                  }}
                  style={styles.avatar}
                />
                <View>
                  <Text style={[styles.userName, { color: theme.text }]}>
                    {item?.user?.name}
                  </Text>
                  <Text style={[styles.userHandle, { color: theme.subText }]}>
                    @{item?.user?.username}
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[
                  styles.unmuteButton,
                  { backgroundColor: theme.buttonBg },
                ]}
                onPress={() => handleUnmute(item?.user?.id)}
              >
                <Text style={[styles.unmuteText, { color: theme.text }]}>
                  Unmute
                </Text>
              </TouchableOpacity>
            </View>
          ))
        ) : (
          /* Empty State: Matches the SVG exclamation design */
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
              You currently have no muted users.
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
  unmuteButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  unmuteText: { fontSize: 13, fontWeight: "600" },
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

export default MutedAccountsScreen;
