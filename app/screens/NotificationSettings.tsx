import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CONFIG from "../../shared/config";
import { useTheme } from "../../shared/themeContext";

const NotificationSettingsScreen = () => {
  const { isDark } = useTheme();
  const router = useRouter();

  // States
  const [loading, setLoading] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [settings, setSettings] = useState<any>({
    like: "everyone",
    comment: "everyone",
    follow: "everyone",
    tagged_comment: "everyone",
  });

  const theme = {
    bg: isDark ? "#0B0E14" : "#F8FAFC",
    card: isDark ? "#1E2530" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#1B2331" : "#E2E8F0",
    primary: "#3B66F5",
    overlay: "rgba(0,0,0,0.6)",
  };

  const timeOptions = [
    { label: "15 minutes", value: "15min" },
    { label: "30 minutes", value: "30min" },
    { label: "1 hour", value: "1hr" },
    { label: "2 hours", value: "2hr" },
    { label: "4 hours", value: "4hr" },
    { label: "8 hours", value: "8hr" },
    { label: "Until I turn it on back", value: "unli" },
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  // GET API: Fetch current settings
  const fetchSettings = async () => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      const res = await fetch(
        `${CONFIG.API_ENDPOINT}/api/notifications/settings`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
        },
      );

      if (res.ok) {
        const json = await res.json();
        setSettings(json.data);
        setIsPaused(json.data.pause_all_boolean);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  // POST API: Update individual section
  const updateNotification = async (section: string, value: string) => {
    const previousValue = settings[section];
    setSettings({ ...settings, [section]: value });

    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      const res = await fetch(
        `${CONFIG.API_ENDPOINT}/api/notifications/settings/update`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify({ section, value }),
        },
      );

      if (!res.ok) throw new Error();
    } catch (error) {
      setSettings({ ...settings, [section]: previousValue });
      Alert.alert("Error", "Failed to update settings.");
    }
  };

  // POST API: Pause Notifications
  const pauseAllNotifications = async (limit: string | null) => {
    try {
      const userString = await AsyncStorage.getItem("user");
      if (!userString) return;
      const user = JSON.parse(userString);

      const res = await fetch(
        `${CONFIG.API_ENDPOINT}/api/notifications/settings/pause`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify({ limit }),
        },
      );

      if (res.ok) {
        setIsPaused(limit !== null);
        setModalVisible(false);
        const json = await res.json();
        setSettings(json.data);
      }
    } catch (error) {
      Alert.alert("Error", "Could not update pause settings.");
    }
  };

  const handlePauseSwitch = (value: boolean) => {
    if (value) {
      setModalVisible(true);
    } else {
      pauseAllNotifications(null);
    }
  };

  const RadioOption = ({ section, label, value }: any) => {
    const isSelected = settings[section] === value;
    return (
      <TouchableOpacity
        style={styles.radioRow}
        onPress={() => updateNotification(section, value)}
      >
        <View
          style={[
            styles.radioCircle,
            { borderColor: isSelected ? theme.primary : "#D1D5DB" },
          ]}
        >
          {isSelected && (
            <View
              style={[styles.radioDot, { backgroundColor: theme.primary }]}
            />
          )}
        </View>
        <Text style={[styles.radioLabel, { color: theme.text }]}>{label}</Text>
      </TouchableOpacity>
    );
  };

  if (loading)
    return <ActivityIndicator style={{ flex: 1 }} color={theme.primary} />;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>
          Notifications
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Pause All Toggle */}
        <View style={styles.pauseRow}>
          <Text style={[styles.pauseText, { color: theme.text }]}>
            Pause all notifications
          </Text>
          <Switch
            value={isPaused}
            trackColor={{ false: "#D1D5DB", true: theme.primary }}
            onValueChange={handlePauseSwitch}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        {/* Dynamic Sections */}
        {["like", "comment", "follow", "tagged_comment"].map((section) => (
          <View key={section} style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {section.replace("_", " ").charAt(0).toUpperCase() +
                section.replace("_", " ").slice(1)}
            </Text>
            <RadioOption section={section} label="Off" value="Off" />
            <RadioOption
              section={section}
              label="From people I follow"
              value="follow"
            />
            <RadioOption
              section={section}
              label="From everyone"
              value="everyone"
            />
          </View>
        ))}
      </ScrollView>

      {/* Animated Time Popup Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: theme.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                Pause notifications
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={26} color={theme.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalDesc, { color: theme.subText }]}>
              You can pause receiving notifications for a specific period of
              time.
            </Text>

            <View style={styles.optionsList}>
              {timeOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.timeOption,
                    { borderBottomColor: theme.border },
                  ]}
                  onPress={() => pauseAllNotifications(option.value)}
                >
                  <Text style={[styles.timeLabel, { color: theme.text }]}>
                    {option.label}
                  </Text>
                  <Ionicons
                    name="chevron-forward"
                    size={18}
                    color={theme.subText}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", padding: 20 },
  backBtn: { marginRight: 15 },
  headerTitle: { fontSize: 22, fontWeight: "bold" },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 40 },
  pauseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 20,
  },
  pauseText: { fontSize: 16, fontWeight: "500" },
  divider: { height: 1, marginVertical: 10 },
  section: { marginTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  radioRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
    paddingLeft: 5,
  },
  radioCircle: {
    height: 24,
    width: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  radioDot: { height: 12, width: 12, borderRadius: 6 },
  radioLabel: { fontSize: 16 },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end", // Slides up from bottom
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    paddingBottom: Platform.OS === "ios" ? 40 : 25,
    // Shadow for iOS
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    // Elevation for Android
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  modalTitle: { fontSize: 22, fontWeight: "bold" },
  modalDesc: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  optionsList: { marginTop: 10 },
  timeOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  timeLabel: { fontSize: 16, fontWeight: "500" },
});

export default NotificationSettingsScreen;
