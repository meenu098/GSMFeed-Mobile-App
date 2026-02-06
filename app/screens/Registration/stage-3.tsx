import { Ionicons } from "@expo/vector-icons";
import { countries, getEmojiFlag, TCountryCode } from "countries-list";
import { LinearGradient } from "expo-linear-gradient";
import * as Localization from "expo-localization";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FooterLinks from "../../navigation/FooterLinks";
import CONFIG from "../../utils/config";
import { useRegistration } from "../../utils/RegistrationContext"; // Import Context
import { useTheme } from "../../utils/themeContext";

const { height } = Dimensions.get("window");

export default function RegistrationScreen3() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  // --- 1. Access Registration Context ---
  const { formData, updateFormData } = useRegistration();

  // --- 2. State Management initialized from Context ---
  const [establishedOn, setEstablishedOn] = useState(
    formData.est_year ? formData.est_year.toString() : null,
  );
  const [industry, setIndustry] = useState(
    formData.company_category_id
      ? formData.company_category_id.toString()
      : null,
  );
  const [industries, setIndustries] = useState([]);
  const [loadingIndustries, setLoadingIndustries] = useState(false);

  // Country Selection State
  const deviceRegion = (Localization.getLocales()[0]?.regionCode ||
    "AE") as TCountryCode;
  const [selectedCountry, setSelectedCountry] = useState<TCountryCode>(
    (formData.country as TCountryCode) || deviceRegion,
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const countryData = countries[selectedCountry] || countries["AE"];

  // --- 3. Dynamic Year Generation ---
  const establishedOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i <= 40; i++) {
      const year = (currentYear - i).toString();
      years.push({ label: year, value: year });
    }
    return years;
  }, []);

  // --- 4. API Call: Fetch Industries ---
  useEffect(() => {
    const fetchIndustries = async () => {
      setLoadingIndustries(true);
      try {
        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/selections/industries`,
        );
        const data = await response.json();
        if (response.ok && data?.data) {
          const formattedIndustries = data.data.map((item: any) => ({
            label: item.name,
            value: item.id.toString(),
          }));
          setIndustries(formattedIndustries);
        }
      } catch (error) {
        console.error("Failed to fetch industries:", error);
      } finally {
        setLoadingIndustries(false);
      }
    };
    fetchIndustries();
  }, []);

  // --- 5. Filtered Country List ---
  const countryList = useMemo(() => {
    return Object.entries(countries)
      .map(([code, data]) => ({
        code: code as TCountryCode,
        name: data.name,
        emoji: getEmojiFlag(code as TCountryCode),
        phone: data.phone[0], // Include phone code for dynamic update
      }))
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  }, [searchQuery]);

  const canGoNext = establishedOn && industry && selectedCountry;

  // --- 6. Navigation Handler ---
  const handleNext = () => {
    // Safety check: Get the dial code and ensure it is treated as a string for parseInt
    const dialCodeRaw = countryData?.phone?.[0] || "0";

    updateFormData({
      company_category_id: industry ? parseInt(industry) : null,
      est_year: establishedOn ? parseInt(establishedOn) : null,
      country: selectedCountry,
      // Convert the string dial code to a number for your backend payload
      phone_country_code: parseInt(String(dialCodeRaw), 10),
    });
    router.push("/screens/Registration/stage-4");
  };
  const theme = {
    colors: {
      primary: "#3B66F5",
      background: isDark ? "#020205" : "#F8FAFC",
      text: isDark ? "#FFFFFF" : "#0F172A",
      subText: isDark ? "#94A3B8" : "#64748B",
      cardBg: isDark ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
      cardBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
      inputBg: isDark ? "rgba(255, 255, 255, 0.03)" : "#F1F5F9",
      gradient: isDark
        ? ["#1A0B2E", "#020205", "#050A1A"]
        : ["#F8FAFC", "#E2E8F0", "#FFFFFF"],
    },
  };

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        translucent
        backgroundColor="transparent"
      />
      <LinearGradient
        colors={theme.colors.gradient as any}
        style={StyleSheet.absoluteFillObject}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 },
        ]}
      >
        <Image
          source={
            isDark
              ? require("../../../assets/common/logo-dark.png")
              : require("../../../assets/common/logo.png")
          }
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.textHeader}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Company Profile
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.subText }]}>
            Step 3: Industry & Location
          </Text>
        </View>

        <View
          style={[
            styles.card,
            {
              backgroundColor: theme.colors.cardBg,
              borderColor: theme.colors.cardBorder,
            },
          ]}
        >
          {/* Established On Dropdown */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Established On
            </Text>
            <Dropdown
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.colors.inputBg,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
              placeholderStyle={[
                styles.placeholderStyle,
                { color: theme.colors.subText },
              ]}
              selectedTextStyle={[
                styles.selectedTextStyle,
                { color: theme.colors.text },
              ]}
              containerStyle={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.cardBorder,
              }}
              itemTextStyle={{ color: theme.colors.text }}
              activeColor={isDark ? "rgba(255,255,255,0.1)" : "#f0f0f0"}
              data={establishedOptions}
              labelField="label"
              valueField="value"
              placeholder="Select Year"
              value={establishedOn}
              onChange={(item) => setEstablishedOn(item.value)}
              renderRightIcon={() =>
                establishedOn ? (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                ) : (
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={theme.colors.subText}
                  />
                )
              }
            />
          </View>

          {/* Industry Dropdown */}
          <View style={styles.inputGroup}>
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Industry
              </Text>
              {loadingIndustries && (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              )}
            </View>
            <Dropdown
              style={[
                styles.dropdown,
                {
                  backgroundColor: theme.colors.inputBg,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
              placeholderStyle={[
                styles.placeholderStyle,
                { color: theme.colors.subText },
              ]}
              selectedTextStyle={[
                styles.selectedTextStyle,
                { color: theme.colors.text },
              ]}
              containerStyle={{
                backgroundColor: theme.colors.background,
                borderColor: theme.colors.cardBorder,
              }}
              itemTextStyle={{ color: theme.colors.text }}
              data={industries}
              labelField="label"
              valueField="value"
              placeholder={loadingIndustries ? "Loading..." : "Select Industry"}
              value={industry}
              onChange={(item) => setIndustry(item.value)}
              renderRightIcon={() =>
                industry ? (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                ) : (
                  <Ionicons
                    name="chevron-down"
                    size={20}
                    color={theme.colors.subText}
                  />
                )
              }
            />
          </View>

          {/* Country Selection */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Country of Operation
            </Text>
            <TouchableOpacity
              style={[
                styles.countrySelector,
                {
                  backgroundColor: theme.colors.inputBg,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
              onPress={() => setIsModalVisible(true)}
            >
              <View style={styles.countryInner}>
                <Text style={styles.flagEmoji}>
                  {getEmojiFlag(selectedCountry)}
                </Text>
                <Text
                  style={[
                    styles.selectedTextStyle,
                    { color: theme.colors.text, marginLeft: 10 },
                  ]}
                >
                  {countryData.name}
                </Text>
              </View>
              <Ionicons
                name="chevron-down"
                size={20}
                color={theme.colors.subText}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.navButtons}>
            <TouchableOpacity
              style={[
                styles.navButton,
                {
                  backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
                },
              ]}
              onPress={() => router.back()}
            >
              <Text
                style={[styles.backButtonText, { color: theme.colors.text }]}
              >
                Back
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.navButton,
                {
                  backgroundColor: canGoNext ? theme.colors.primary : "#CBD5E1",
                },
              ]}
              onPress={handleNext}
              disabled={!canGoNext}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
        <FooterLinks />
      </ScrollView>

      {/* Country Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: theme.colors.background },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Select Country
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setIsModalVisible(false);
                  setSearchQuery("");
                }}
              >
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Search country..."
              placeholderTextColor={theme.colors.subText}
              style={[
                styles.searchInput,
                {
                  backgroundColor: theme.colors.inputBg,
                  color: theme.colors.text,
                  borderColor: theme.colors.cardBorder,
                },
              ]}
              onChangeText={setSearchQuery}
              value={searchQuery}
            />

            <FlatList
              data={countryList}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryItem,
                    { borderBottomColor: theme.colors.cardBorder },
                  ]}
                  onPress={() => {
                    setSelectedCountry(item.code);
                    setIsModalVisible(false);
                    setSearchQuery("");
                  }}
                >
                  <Text style={styles.countryEmoji}>{item.emoji}</Text>
                  <Text
                    style={[styles.countryName, { color: theme.colors.text }]}
                  >
                    {item.name}
                  </Text>
                  {selectedCountry === item.code && (
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={theme.colors.primary}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, alignItems: "center", paddingHorizontal: 25 },
  logo: { width: 120, height: 120, marginTop: 10 },
  textHeader: { alignItems: "center", marginTop: 10, marginBottom: 30 },
  title: { fontSize: 26, fontWeight: "800" },
  subtitle: { fontSize: 14, marginTop: 5 },
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    marginBottom: 30,
  },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, marginLeft: 4 },
  dropdown: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
  },
  placeholderStyle: { fontSize: 15 },
  selectedTextStyle: { fontSize: 15 },
  countrySelector: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countryInner: { flexDirection: "row", alignItems: "center" },
  flagEmoji: { fontSize: 20 },
  navButtons: { flexDirection: "row", gap: 12, marginTop: 10 },
  navButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  backButtonText: { fontWeight: "700", fontSize: 16 },
  nextButtonText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: height * 0.75,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold" },
  searchInput: {
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    borderWidth: 1,
    fontSize: 16,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  countryEmoji: { fontSize: 24, marginRight: 15 },
  countryName: { flex: 1, fontSize: 16 },
});
