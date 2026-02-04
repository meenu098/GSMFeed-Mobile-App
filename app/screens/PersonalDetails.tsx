import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CONFIG from "../utils/config";
import { useTheme } from "../utils/themeContext";

// Import your modal file
import { AddressInfoModal, PersonalInfoModal } from "../screens/PersonalInfo";

const PersonalDetailsScreen = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  // State Management
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>({});
  const [tempData, setTempData] = useState<any>({});

  const [personalModalVisible, setPersonalModalVisible] = useState(false);
  const [addressModalVisible, setAddressModalVisible] = useState(false);

  const theme = {
    bg: isDark ? "#0B0E14" : "#F8FAFC",
    card: isDark ? "#121721" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1a1a1a",
    border: isDark ? "#2D3748" : "#E2E8F0",
    primary: "#3B66F5",
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const parsedUser = JSON.parse(userString);
        setUser(parsedUser);
        await fetchUserDetails(parsedUser.token);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // API Call: Fetch Personal Details
  const fetchUserDetails = async (token: string) => {
    try {
      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/user/details/personal`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        },
      );
      const json = await response.json();
      if (response.ok) {
        setData(json.data);
        setTempData(json.data);
      }
    } catch (error) {
    }
  };

  // Logic to check if data changed for save buttons
  const checkIfDataChanged = () => {
    return JSON.stringify(data) !== JSON.stringify(tempData);
  };

  if (loading) {
    return (
      <View
        style={[
          styles.container,
          { backgroundColor: theme.bg, justifyContent: "center" },
        ]}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>
          Personal details
        </Text>
      </View>

      <Text style={styles.desc}>
        You can edit your personal details here including contact info, address,
        and if youre a business you can also change your representative details.
      </Text>

      <View
        style={[
          styles.card,
          { backgroundColor: theme.card, borderColor: theme.border },
        ]}
      >
        {/* Personal/Company Info Row */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => setPersonalModalVisible(true)}
        >
          <View>
            <Text style={[styles.rowTitle, { color: theme.text }]}>
              {user?.account_type === "individual"
                ? "Personal information"
                : "Company information"}
            </Text>
            <Text style={styles.rowSub}>
              {user?.account_type === "individual"
                ? "Name, Date of Birth, and Contact No."
                : "Company Name and Industry Details"}
            </Text>
          </View>
          <Feather name="chevron-right" size={24} color={theme.text} />
        </TouchableOpacity>

        <View style={{ height: 1, backgroundColor: theme.border }} />

        {/* Address Info Row */}
        <TouchableOpacity
          style={styles.row}
          onPress={() => setAddressModalVisible(true)}
        >
          <View>
            <Text style={[styles.rowTitle, { color: theme.text }]}>
              Address information
            </Text>
            <Text style={styles.rowSub}>
              Street Address, City, Country, and Zip Code
            </Text>
          </View>
          <Feather name="chevron-right" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Modals with Data Props */}
      <PersonalInfoModal
        visible={personalModalVisible}
        onClose={() => setPersonalModalVisible(false)}
        data={data}
        setData={setData}
        user={user}
        checkIfDataChanged={checkIfDataChanged}
      />
      <AddressInfoModal
        visible={addressModalVisible}
        onClose={() => setAddressModalVisible(false)}
        data={data}
        setData={setData}
        user={user}
        checkIfDataChanged={checkIfDataChanged}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginLeft: 15 },
  desc: { color: "#666", lineHeight: 22, marginBottom: 30 },
  card: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  rowTitle: { fontSize: 16, fontWeight: "bold" },
  rowSub: { color: "#666", fontSize: 13, marginTop: 4 },
});

export default PersonalDetailsScreen;
