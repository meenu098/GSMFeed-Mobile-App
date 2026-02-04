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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FooterLinks from "../../navigation/FooterLinks";
import CONFIG from "../../utils/config";
import { useTheme } from "../../utils/themeContext";

const { height } = Dimensions.get("window");

export default function RegistrationScreen2() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();

  // 1. Detection and Form States
  const deviceRegion = (Localization.getLocales()[0]?.regionCode ||
    "AE") as TCountryCode;
  const [selectedCountry, setSelectedCountry] =
    useState<TCountryCode>(deviceRegion);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // Validation States
  const [emailValidity, setEmailValidity] = useState<{
    valid: boolean | null;
    loading: boolean;
    message: string;
  }>({ valid: null, loading: false, message: "" });

  const [businessNameValidity, setBusinessNameValidity] = useState<{
    valid: boolean | null;
    loading: boolean;
    message: string;
  }>({ valid: null, loading: false, message: "" });

  const countryData = countries[selectedCountry] || countries["AE"];

  // 2. Memoized Country List for Dropdown
  const countryList = useMemo(() => {
    return Object.entries(countries)
      .map(([code, data]) => ({
        code: code as TCountryCode,
        name: data.name,
        emoji: getEmojiFlag(code as TCountryCode),
        phone: data.phone[0],
      }))
      .filter(
        (c) =>
          c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          c.code.toLowerCase().includes(searchQuery.toLowerCase()),
      );
  }, [searchQuery]);

  // 3. Email Validation API
  useEffect(() => {
    const checkEmail = async () => {
      if (!email) {
        setEmailValidity({ valid: null, loading: false, message: "" });
        return;
      }
      setEmailValidity((p) => ({ ...p, loading: true, valid: null }));
      try {
        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/auth/validate/email`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email }),
          },
        );
        const data = await response.json();
        setEmailValidity({
          valid: data?.data?.is_available && data?.data?.valid,
          loading: false,
          message: !data?.data?.valid
            ? "Invalid email format"
            : !data?.data?.is_available
              ? "Email already taken"
              : "",
        });
      } catch (err) {
        setEmailValidity({
          valid: false,
          loading: false,
          message: "Server error",
        });
      }
    };
    const timeout = setTimeout(checkEmail, 500);
    return () => clearTimeout(timeout);
  }, [email]);

  // 4. Business Name Validation API
  useEffect(() => {
    const checkBusinessName = async () => {
      if (!businessName) {
        setBusinessNameValidity({ valid: null, loading: false, message: "" });
        return;
      }
      setBusinessNameValidity((p) => ({ ...p, loading: true, valid: null }));
      try {
        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/auth/validate/business-name`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ first_name: businessName }),
          },
        );
        const data = await response.json();
        setBusinessNameValidity({
          valid: data?.data?.is_available,
          loading: false,
          message: !data?.data?.is_available
            ? "Business name already taken"
            : "",
        });
      } catch (err) {
        setBusinessNameValidity({
          valid: false,
          loading: false,
          message: "Server error",
        });
      }
    };
    const timeout = setTimeout(checkBusinessName, 500);
    return () => clearTimeout(timeout);
  }, [businessName]);

  const canGoNext =
    emailValidity.valid && businessNameValidity.valid && phone.length > 5;

  const theme = {
    colors: {
      primary: "#3B66F5",
      background: isDark ? "#020205" : "#F8FAFC",
      text: isDark ? "#FFFFFF" : "#0F172A",
      subText: isDark ? "#94A3B8" : "#64748B",
      cardBg: isDark ? "rgba(255, 255, 255, 0.05)" : "#FFFFFF",
      cardBorder: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.05)",
      inputBg: isDark ? "rgba(255, 255, 255, 0.03)" : "#F1F5F9",
      success: "#10B981",
      error: "#EF4444",
      gradient: isDark
        ? ["#1A0B2E", "#020205", "#050A1A"]
        : ["#F8FAFC", "#E2E8F0", "#FFFFFF"],
    },
  };

  const renderStatusIcon = (validity: {
    valid: boolean | null;
    loading: boolean;
  }) => {
    if (validity.loading)
      return <ActivityIndicator size="small" color={theme.colors.primary} />;
    if (validity.valid === true)
      return (
        <Ionicons
          name="checkmark-circle"
          size={20}
          color={theme.colors.success}
        />
      );
    if (validity.valid === false)
      return (
        <Ionicons name="close-circle" size={20} color={theme.colors.error} />
      );
    return null;
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
            Company Details
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.subText }]}>
            Step 2: Tell us about your business
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
          {/* Business Name */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Business Name
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="eg: XYZ Co"
                placeholderTextColor={theme.colors.subText}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.inputBg,
                    color: theme.colors.text,
                    borderColor:
                      businessNameValidity.valid === false
                        ? theme.colors.error
                        : theme.colors.cardBorder,
                  },
                ]}
                value={businessName}
                onChangeText={setBusinessName}
              />
              <View style={styles.statusIconContainer}>
                {renderStatusIcon(businessNameValidity)}
              </View>
            </View>
            {businessNameValidity.message ? (
              <Text style={styles.errorText}>
                {businessNameValidity.message}
              </Text>
            ) : null}
          </View>

          {/* Contact Number with Modal Trigger */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Contact Number
            </Text>
            <View style={styles.phoneRow}>
              <TouchableOpacity
                style={[
                  styles.flagBox,
                  {
                    backgroundColor: theme.colors.inputBg,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                onPress={() => setIsModalVisible(true)}
              >
                <Text style={styles.flagEmoji}>
                  {getEmojiFlag(selectedCountry)}
                </Text>
                <Text style={[styles.prefix, { color: theme.colors.text }]}>
                  {selectedCountry} (+{countryData.phone[0]})
                </Text>
              </TouchableOpacity>
              <TextInput
                placeholder="eg: 561234567"
                placeholderTextColor={theme.colors.subText}
                keyboardType="phone-pad"
                style={[
                  styles.input,
                  {
                    flex: 1,
                    backgroundColor: theme.colors.inputBg,
                    color: theme.colors.text,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                value={phone}
                onChangeText={setPhone}
              />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.colors.text }]}>
              Email Address
            </Text>
            <View style={styles.inputWrapper}>
              <TextInput
                placeholder="eg: info@xyz.com"
                placeholderTextColor={theme.colors.subText}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.inputBg,
                    color: theme.colors.text,
                    borderColor:
                      emailValidity.valid === false
                        ? theme.colors.error
                        : theme.colors.cardBorder,
                  },
                ]}
                value={email}
                onChangeText={setEmail}
              />
              <View style={styles.statusIconContainer}>
                {renderStatusIcon(emailValidity)}
              </View>
            </View>
            {emailValidity.message ? (
              <Text style={styles.errorText}>{emailValidity.message}</Text>
            ) : null}
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
              onPress={() =>
                canGoNext && router.push("/screens/Registration/stage-3")
              }
              disabled={!canGoNext}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
        <FooterLinks />
      </ScrollView>

      {/* Country Selection Modal */}
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
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.colors.text} />
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
                },
              ]}
              onChangeText={setSearchQuery}
            />

            <FlatList
              data={countryList}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
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
                  <Text
                    style={[
                      styles.countryPhone,
                      { color: theme.colors.subText },
                    ]}
                  >
                    +{item.phone}
                  </Text>
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
  logo: { width: 120, height: 80, marginTop: 10 },
  textHeader: { alignItems: "center", marginTop: 20, marginBottom: 30 },
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
  inputWrapper: { position: "relative", justifyContent: "center" },
  input: {
    height: 56,
    borderRadius: 12,
    paddingLeft: 16,
    paddingRight: 45,
    fontSize: 15,
    borderWidth: 1,
  },
  statusIconContainer: {
    position: "absolute",
    right: 15,
    height: "100%",
    justifyContent: "center",
  },
  errorText: { color: "#EF4444", fontSize: 12, marginTop: 4, marginLeft: 4 },
  phoneRow: { flexDirection: "row", alignItems: "center" },
  flagBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 10,
  },
  flagEmoji: { fontSize: 20, marginRight: 8 },
  prefix: { fontSize: 13, fontWeight: "600" },
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

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    height: height * 0.7,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  searchInput: {
    height: 50,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
  },
  countryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(150,150,150,0.2)",
  },
  countryEmoji: { fontSize: 24, marginRight: 15 },
  countryName: { flex: 1, fontSize: 16 },
  countryPhone: { fontSize: 14 },
});
