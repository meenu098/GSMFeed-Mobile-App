import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

const AccountPrivacyScreen = () => {
  const { isDark } = useTheme();
  const router = useRouter();
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(true);

  const theme = {
    bg: isDark ? "#0B0E14" : "#F8FAFC",
    card: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1B2331" : "#E2E8F0",
    primary: "#3B66F5",
  };

  useEffect(() => {
    fetchPrivacySetting();
  }, []);

  // GET API Call: Fetch current privacy state
  const fetchPrivacySetting = async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      const res = await fetch(`${CONFIG.API_ENDPOINT}/api/privacy/settings`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setIsPrivate(data.data.privacy === "private"); // Set initial toggle state
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // POST API Call: Update privacy state
  const togglePrivacy = async (value: boolean) => {
    const newPrivacy = value ? "private" : "public";
    setIsPrivate(value); // Optimistic update for UI feel

    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      const res = await fetch(
        `${CONFIG.API_ENDPOINT}/api/privacy/settings/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify({ privacy: newPrivacy }), // Payload matches web logic
        },
      );

      if (!res.ok) {
        setIsPrivate(!value); // Rollback on failure
        Alert.alert("Error", "Failed to update privacy settings.");
      }
    } catch (error) {
      setIsPrivate(!value);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header with circular back button */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="arrow-back"
            size={24}
            color={isDark ? "#FFF" : "#000"}
          />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Account privacy
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator
          size="large"
          color={theme.primary}
          style={{ marginTop: 50 }}
        />
      ) : (
        <View style={styles.content}>
          {/* Main Privacy Card */}
          <View
            style={[
              styles.privacyCard,
              { backgroundColor: theme.card, borderColor: theme.border },
            ]}
          >
            <View style={styles.cardHeader}>
              <View style={styles.textContainer}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>
                  Private account
                </Text>
                <Text
                  style={[styles.cardDescription, { color: theme.subText }]}
                >
                  When your account is public, your profile and posts can be
                  seen by anyone, on or off gsmfeed. When your account is
                  private, only the followers you approve can see what you
                  share. Certain info on your profile, like your profile picture
                  and username, is visible to everyone on and off gsmfeed.
                </Text>
              </View>

              {/* Toggle Switch aligned to the right */}
              <Switch
                trackColor={{ false: "#D1D5DB", true: theme.primary }}
                thumbColor={"#FFFFFF"}
                onValueChange={togglePrivacy}
                value={isPrivate}
              />
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  headerTitle: { fontSize: 22, fontWeight: "bold" },
  content: { paddingHorizontal: 20, paddingTop: 10 },
  privacyCard: {
    padding: 24,
    borderRadius: 25,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  textContainer: { flex: 1, marginRight: 15 },
  cardTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 10 },
  cardDescription: { fontSize: 14, lineHeight: 22 },
});

export default AccountPrivacyScreen;
