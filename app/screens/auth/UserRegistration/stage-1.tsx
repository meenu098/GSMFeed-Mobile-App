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
import FooterLinks from "../../../../components/FooterLinks";
import CONFIG from "../../../../shared/config";
import { useTheme } from "../../../../shared/themeContext";
import { useRegistration } from "../../../../shared/RegistrationContext";

const { height } = Dimensions.get("window");

export default function UserRegistrationScreen1() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { formData, updateFormData } = useRegistration();

  const deviceRegion = (Localization.getLocales()[0]?.regionCode ||
    "AE") as TCountryCode;
  const [selectedCountry, setSelectedCountry] = useState<TCountryCode>(
    (formData.country as TCountryCode) || deviceRegion,
  );
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [firstName, setFirstName] = useState(formData.first_name || "");
  const [lastName, setLastName] = useState(formData.last_name || "");
  const [phone, setPhone] = useState(formData.phone || "");
  const [email, setEmail] = useState(formData.email || "");

  const [emailValidity, setEmailValidity] = useState({
    valid: null as boolean | null,
    loading: false,
    message: "",
  });
  const [nameValidity, setNameValidity] = useState({
    valid: null as boolean | null,
    loading: false,
  });

  const countryData = countries[selectedCountry] || countries["AE"];

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

  // Email Validation API
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

  // Handle Next - Correctly parsing country code and storing names
  const handleNext = () => {
    const dialCodeRaw = countryData?.phone?.[0] || "0";

    updateFormData({
      first_name: firstName,
      last_name: lastName,
      email: email,
      phone: phone,
      country: selectedCountry,
      phone_country_code: parseInt(String(dialCodeRaw), 10),
    });

    // Note: If names change, Screen 6 will re-generate username suggestions
    router.push("/screens/auth/UserRegistration/stage-2");
  };

  const canGoNext =
    emailValidity.valid &&
    firstName.length > 1 &&
    lastName.length > 1 &&
    phone.length > 5;

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

  const renderStatusIcon = (validity: any) => {
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
              ? require("../../../../assets/common/logo-dark.png")
              : require("../../../../assets/common/logo.png")
          }
          style={styles.logo}
          resizeMode="contain"
        />

        <View style={styles.textHeader}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            Personal Details
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.subText }]}>
            Create your individual account
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
          {/* Names Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                First Name
              </Text>
              <TextInput
                placeholder="John"
                placeholderTextColor={theme.colors.subText}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.inputBg,
                    color: theme.colors.text,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                value={firstName}
                onChangeText={setFirstName}
              />
            </View>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Last Name
              </Text>
              <TextInput
                placeholder="Doe"
                placeholderTextColor={theme.colors.subText}
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.inputBg,
                    color: theme.colors.text,
                    borderColor: theme.colors.cardBorder,
                  },
                ]}
                value={lastName}
                onChangeText={setLastName}
              />
            </View>
          </View>

          {/* Contact Number */}
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
                  +{countryData.phone[0]}
                </Text>
              </TouchableOpacity>
              <TextInput
                placeholder="561234567"
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
                placeholder="john@example.com"
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
              onPress={handleNext}
              disabled={!canGoNext}
            >
              <Text style={styles.nextButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
        <FooterLinks />
      </ScrollView>

      {/* Modal Selection */}
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
              placeholder="Search..."
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
  row: { flexDirection: "row" },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, marginLeft: 4 },
  inputWrapper: { position: "relative", justifyContent: "center" },
  input: {
    height: 56,
    borderRadius: 12,
    paddingHorizontal: 16,
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
