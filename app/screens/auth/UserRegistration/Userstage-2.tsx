import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { countries, getEmojiFlag, TCountryCode } from "countries-list";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
import { useRegistration } from "../../../../shared/RegistrationContext";
import { useTheme } from "../../../../shared/themeContext";

export default function UserRegistrationScreen2() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { formData, updateFormData } = useRegistration();

  // Date State
  const [dobText, setDobText] = useState("");
  const [dobDate, setDobDate] = useState(
    new Date(formData.dob || "2000-01-01"),
  );
  const [showPicker, setShowPicker] = useState(false);

  // Selection States
  const [selectedCountry, setSelectedCountry] = useState<TCountryCode>(
    formData.country || "AE",
  );
  const [selectedCompanyName, setSelectedCompanyName] = useState(
    formData.company_name || "",
  );
  const [selectedPositionName, setSelectedPositionName] = useState("");

  // Modal Visibility
  const [countryModal, setCountryModal] = useState(false);
  const [companyModal, setCompanyModal] = useState(false);
  const [roleModal, setRoleModal] = useState(false);

  // Search States
  const [countrySearch, setCountrySearch] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [roleSearch, setRoleSearch] = useState("");

  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);
  const [roleOptions, setRoleOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState({ companies: false, roles: false });

  const theme = {
    colors: {
      background: isDark ? "#020205" : "#F8FAFC",
      text: isDark ? "#FFFFFF" : "#0F172A",
      subText: isDark ? "#94A3B8" : "#64748B",
      cardBg: isDark ? "#11111F" : "#FFFFFF",
      inputBg: isDark ? "rgba(255, 255, 255, 0.05)" : "#F1F5F9",
      primary: "#3B66F5",
      border: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0",
    },
  };

  // Format Date (DD/MM/YYYY)
  const handleDateTyping = (text: string) => {
    let cleaned = text.replace(/\D/g, "");
    if (cleaned.length > 8) cleaned = cleaned.slice(0, 8);
    let formatted = cleaned;
    if (cleaned.length > 2)
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    if (cleaned.length > 4)
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
    setDobText(formatted);
    if (cleaned.length === 8) {
      const day = parseInt(cleaned.slice(0, 2));
      const month = parseInt(cleaned.slice(2, 4)) - 1;
      const year = parseInt(cleaned.slice(4));
      const dateObj = new Date(year, month, day);
      if (!isNaN(dateObj.getTime())) setDobDate(dateObj);
    }
  };

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading((p) => ({ ...p, roles: true }));
      try {
        const res = await fetch(`${CONFIG.API_ENDPOINT}/api/selections/roles`);
        const result = await res.json();
        setRoleOptions(result?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading((p) => ({ ...p, roles: false }));
      }
    };
    fetchRoles();
  }, []);

  // API SEARCH Logic with Debounce
  useEffect(() => {
    if (companySearch.length < 1) {
      setCompanySuggestions([]);
      return;
    }
    const fetchCompanies = async () => {
      setLoading((p) => ({ ...p, companies: true }));
      try {
        const res = await fetch(
          `${CONFIG.API_ENDPOINT}/api/selections/companies?search=${encodeURIComponent(companySearch)}`,
        );
        const result = await res.json();
        setCompanySuggestions(result?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading((p) => ({ ...p, companies: false }));
      }
    };
    const timeout = setTimeout(fetchCompanies, 300);
    return () => clearTimeout(timeout);
  }, [companySearch]);

  // LOCAL FILTERS for responsive UI
  const filteredCountries = useMemo(() => {
    return Object.keys(countries).filter((code) =>
      countries[code as TCountryCode].name
        .toLowerCase()
        .includes(countrySearch.toLowerCase()),
    );
  }, [countrySearch]);

  const filteredRoles = useMemo(() => {
    return roleOptions.filter((role) =>
      role.name.toLowerCase().includes(roleSearch.toLowerCase()),
    );
  }, [roleSearch, roleOptions]);

  // This ensures the list clears if the search term has no local matches before API returns
  const filteredCompanyDisplay = useMemo(() => {
    if (!companySearch) return companySuggestions;
    return companySuggestions.filter((item) =>
      item.name.toLowerCase().includes(companySearch.toLowerCase()),
    );
  }, [companySearch, companySuggestions]);

  const handleNext = () => {
    updateFormData({
      dob: dobDate.toISOString().split("T")[0],
      country: selectedCountry,
    });
    router.push("/screens/auth/Registration/stage-5");
  };

  const renderModalItem = (
    label: string,
    icon: string | null,
    onPress: () => void,
  ) => (
    <TouchableOpacity
      style={[styles.listItem, { borderBottomColor: theme.colors.border }]}
      onPress={onPress}
    >
      <View style={styles.listItemContent}>
        {icon && <Text style={styles.listIcon}>{icon}</Text>}
        <Text style={[styles.listText, { color: theme.colors.text }]}>
          {label}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={16} color={theme.colors.subText} />
    </TouchableOpacity>
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <StatusBar barStyle="light-content" />
        <LinearGradient
          colors={isDark ? ["#0A0A1A", "#020205"] : ["#F8FAFC", "#FFFFFF"]}
          style={StyleSheet.absoluteFillObject}
        />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + 20 },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <Image
            source={require("../../../../assets/common/logo-dark.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.textHeader}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Professional Info
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.subText }]}>
              Complete your individual profile
            </Text>
          </View>

          <View
            style={[
              styles.card,
              {
                backgroundColor: theme.colors.cardBg,
                borderColor: theme.colors.border,
              },
            ]}
          >
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Date of Birth (DD/MM/YYYY)
              </Text>
              <View
                style={[
                  styles.selector,
                  { backgroundColor: theme.colors.inputBg },
                ]}
              >
                <TextInput
                  style={[styles.flexInput, { color: theme.colors.text }]}
                  placeholder="DD/MM/YYYY"
                  placeholderTextColor={theme.colors.subText}
                  keyboardType="number-pad"
                  value={
                    dobText ||
                    (dobDate
                      ? `${String(dobDate.getDate()).padStart(2, "0")}/${String(dobDate.getMonth() + 1).padStart(2, "0")}/${dobDate.getFullYear()}`
                      : "")
                  }
                  onChangeText={handleDateTyping}
                  maxLength={10}
                />
                <TouchableOpacity onPress={() => setShowPicker(true)}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={theme.colors.subText}
                  />
                </TouchableOpacity>
              </View>
              {showPicker && (
                <DateTimePicker
                  value={dobDate}
                  mode="date"
                  display="spinner"
                  onChange={(e, d) => {
                    setShowPicker(false);
                    if (d) {
                      setDobDate(d);
                      setDobText("");
                    }
                  }}
                />
              )}
            </View>

            {[
              {
                label: "Country",
                value: `${getEmojiFlag(selectedCountry)} ${countries[selectedCountry].name}`,
                icon: "chevron-down",
                onPress: () => {
                  setCountryModal(true);
                  setCountrySearch("");
                },
              },
              {
                label: "Company",
                value: selectedCompanyName || "Search existing company",
                icon: "search",
                onPress: () => {
                  setCompanyModal(true);
                  setCompanySearch("");
                },
              },
              {
                label: "Position / Role",
                value: selectedPositionName || "Select your role",
                icon: "briefcase-outline",
                onPress: () => {
                  setRoleModal(true);
                  setRoleSearch("");
                },
              },
            ].map((item, idx) => (
              <View key={idx} style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.colors.text }]}>
                  {item.label}
                </Text>
                <TouchableOpacity
                  style={[
                    styles.selector,
                    { backgroundColor: theme.colors.inputBg },
                  ]}
                  onPress={item.onPress}
                >
                  <Text
                    style={{
                      color:
                        item.value.includes("Search") ||
                        item.value.includes("Select")
                          ? theme.colors.subText
                          : theme.colors.text,
                    }}
                  >
                    {item.value}
                  </Text>
                  <Ionicons
                    name={item.icon as any}
                    size={18}
                    color={theme.colors.subText}
                  />
                </TouchableOpacity>
              </View>
            ))}

            <View style={styles.navButtons}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={[styles.backText, { color: theme.colors.text }]}>
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  {
                    opacity: formData.company_id && formData.position ? 1 : 0.6,
                  },
                ]}
                onPress={handleNext}
                disabled={!(formData.company_id && formData.position)}
              >
                <Text style={styles.nextText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.linksWrapper}>
            <FooterLinks />
          </View>
        </ScrollView>

        {/* Searchable Modals */}
        {[
          {
            visible: countryModal,
            setVisible: setCountryModal,
            title: "Select Country",
            data: filteredCountries,
            search: countrySearch,
            setSearch: setCountrySearch,
            type: "country",
          },
          {
            visible: companyModal,
            setVisible: setCompanyModal,
            title: "Select Company",
            data: filteredCompanyDisplay,
            search: companySearch,
            setSearch: setCompanySearch,
            type: "company",
          },
          {
            visible: roleModal,
            setVisible: setRoleModal,
            title: "Select Position",
            data: filteredRoles,
            search: roleSearch,
            setSearch: setRoleSearch,
            type: "role",
          },
        ].map((m, i) => (
          <Modal key={i} visible={m.visible} animationType="slide" transparent>
            <View style={styles.overlayModal}>
              <View
                style={[
                  styles.modalContainer,
                  { backgroundColor: theme.colors.cardBg },
                ]}
              >
                <View style={styles.modalHeader}>
                  <Text
                    style={[styles.modalTitle, { color: theme.colors.text }]}
                  >
                    {m.title}
                  </Text>
                  <TouchableOpacity onPress={() => m.setVisible(false)}>
                    <Ionicons
                      name="close"
                      size={24}
                      color={theme.colors.text}
                    />
                  </TouchableOpacity>
                </View>
                <View
                  style={[
                    styles.searchWrapper,
                    { backgroundColor: theme.colors.inputBg },
                  ]}
                >
                  <Ionicons
                    name="search"
                    size={18}
                    color={theme.colors.subText}
                  />
                  <TextInput
                    placeholder="Search..."
                    placeholderTextColor={theme.colors.subText}
                    style={[
                      styles.modalSearchInput,
                      { color: theme.colors.text },
                    ]}
                    value={m.search}
                    onChangeText={m.setSearch}
                    autoFocus
                  />
                  {m.type === "company" && loading.companies && (
                    <ActivityIndicator
                      size="small"
                      color={theme.colors.primary}
                    />
                  )}
                </View>

                <FlatList
                  data={m.data}
                  keyExtractor={(item, index) => index.toString()}
                  ListEmptyComponent={() => (
                    <View style={{ padding: 20, alignItems: "center" }}>
                      <Text style={{ color: theme.colors.subText }}>
                        {loading.companies
                          ? "Searching..."
                          : "No results found"}
                      </Text>
                    </View>
                  )}
                  renderItem={({ item }) =>
                    m.type === "country"
                      ? renderModalItem(
                          countries[item as TCountryCode].name,
                          getEmojiFlag(item as TCountryCode),
                          () => {
                            setSelectedCountry(item as TCountryCode);
                            m.setVisible(false);
                          },
                        )
                      : m.type === "company"
                        ? renderModalItem(item.name, null, () => {
                            updateFormData({
                              company_id: item.id,
                              company_name: item.name,
                            });
                            setSelectedCompanyName(item.name);
                            m.setVisible(false);
                          })
                        : renderModalItem(item.name, null, () => {
                            updateFormData({ position: item.id });
                            setSelectedPositionName(item.name);
                            m.setVisible(false);
                          })
                  }
                />
              </View>
            </View>
          </Modal>
        ))}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  logo: { width: 140, height: 50, marginBottom: 10 },
  textHeader: { alignItems: "center", marginBottom: 25 },
  title: { fontSize: 24, fontWeight: "800", letterSpacing: 0.5 },
  subtitle: { fontSize: 14, marginTop: 4, opacity: 0.8 },
  card: { width: "100%", borderRadius: 24, padding: 24, borderWidth: 1 },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
    opacity: 0.9,
  },
  selector: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  flexInput: { flex: 1, fontSize: 15, height: "100%" },
  navButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    gap: 15,
  },
  backButton: {
    flex: 1,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
  },
  nextButton: {
    flex: 1.5,
    height: 52,
    backgroundColor: "#3B66F5",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  backText: { fontWeight: "600", fontSize: 15 },
  nextText: { color: "#FFF", fontWeight: "700", fontSize: 16 },
  overlayModal: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    height: "85%",
    padding: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  searchWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 50,
  },
  modalSearchInput: { flex: 1, marginLeft: 10, fontSize: 15 },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  listItemContent: { flexDirection: "row", alignItems: "center" },
  listIcon: { fontSize: 22, marginRight: 15 },
  listText: { fontSize: 16, fontWeight: "500" },
  linksWrapper: { alignItems: "center", marginTop: 150, width: "100%" },
});
