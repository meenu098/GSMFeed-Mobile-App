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
import FooterLinks from "../../navigation/FooterLinks";
import CONFIG from "../../utils/config";
import { useRegistration } from "../../utils/RegistrationContext";
import { useTheme } from "../../utils/themeContext";

export default function UserRegistrationScreen2() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useTheme();
  const { formData, updateFormData } = useRegistration();

  const [dob, setDob] = useState(new Date(formData.dob || Date.now()));
  const [showPicker, setShowPicker] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<TCountryCode>(
    formData.country || "AE",
  );

  const [countryModal, setCountryModal] = useState(false);
  const [countrySearch, setCountrySearch] = useState("");
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [roleSearch, setRoleSearch] = useState("");

  const [company, setCompany] = useState(formData.company_name || "");
  const [companySuggestions, setCompanySuggestions] = useState<any[]>([]);
  const [showCompanyList, setShowCompanyList] = useState(false);

  const [position, setPosition] = useState(formData.position || "");
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
      modalOverlay: "rgba(0,0,0,0.7)",
    },
  };

  useEffect(() => {
    const fetchRoles = async () => {
      setLoading((prev) => ({ ...prev, roles: true }));
      try {
        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/selections/roles`,
        );
        const result = await response.json();
        setRoleOptions(result?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading((prev) => ({ ...prev, roles: false }));
      }
    };
    fetchRoles();
  }, []);

  useEffect(() => {
    if (company.length < 2) {
      setCompanySuggestions([]);
      return;
    }
    const fetchCompanies = async () => {
      setLoading((prev) => ({ ...prev, companies: true }));
      try {
        const response = await fetch(
          `${CONFIG.API_ENDPOINT}/api/selections/companies?search=${company}`,
        );
        const result = await response.json();
        setCompanySuggestions(result?.data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading((prev) => ({ ...prev, companies: false }));
      }
    };
    const timeout = setTimeout(fetchCompanies, 500);
    return () => clearTimeout(timeout);
  }, [company]);

  // Memoized Filters
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

  const handleNext = () => {
    updateFormData({
      dob: dob.toISOString().split("T")[0],
      country: selectedCountry,
      company_name: company,
      position: position,
    });
    router.push("/screens/Registration/stage-5");
  };

  const renderItem = (
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
            source={require("../../../assets/common/logo-dark.png")}
            style={styles.logo}
            resizeMode="contain"
          />

          <View style={styles.textHeader}>
            <Text style={[styles.title, { color: theme.colors.text }]}>
              Professional Info
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.subText }]}>
              Complete your profile details
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
            {/* DOB */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Date of Birth
              </Text>
              <TouchableOpacity
                style={[
                  styles.selector,
                  { backgroundColor: theme.colors.inputBg },
                ]}
                onPress={() => setShowPicker(true)}
              >
                <Text style={{ color: theme.colors.text }}>
                  {dob.toDateString()}
                </Text>
                <Ionicons
                  name="calendar-outline"
                  size={18}
                  color={theme.colors.subText}
                />
              </TouchableOpacity>
            </View>

            {/* Country */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Country
              </Text>
              <TouchableOpacity
                style={[
                  styles.selector,
                  { backgroundColor: theme.colors.inputBg },
                ]}
                onPress={() => setCountryModal(true)}
              >
                <Text style={{ color: theme.colors.text }}>
                  {getEmojiFlag(selectedCountry)}{" "}
                  {countries[selectedCountry].name}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={theme.colors.subText}
                />
              </TouchableOpacity>
            </View>

            {/* Company */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Company
              </Text>
              <View>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.inputBg,
                      color: theme.colors.text,
                    },
                  ]}
                  placeholder="Start typing company name..."
                  placeholderTextColor={theme.colors.subText}
                  value={company}
                  onChangeText={(text) => {
                    setCompany(text);
                    setShowCompanyList(true);
                  }}
                />
                {loading.companies && (
                  <ActivityIndicator
                    style={styles.inlineLoader}
                    size="small"
                    color={theme.colors.primary}
                  />
                )}
                {showCompanyList && companySuggestions.length > 0 && (
                  <View
                    style={[
                      styles.dropdown,
                      {
                        backgroundColor: theme.colors.cardBg,
                        borderColor: theme.colors.border,
                      },
                    ]}
                  >
                    {companySuggestions.map((item, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setCompany(item.name);
                          setShowCompanyList(false);
                        }}
                      >
                        <Text style={{ color: theme.colors.text }}>
                          {item.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>
            </View>

            {/* Position */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.colors.text }]}>
                Position / Role
              </Text>
              <TouchableOpacity
                style={[
                  styles.selector,
                  { backgroundColor: theme.colors.inputBg },
                ]}
                onPress={() => setShowRoleModal(true)}
              >
                <Text
                  style={{
                    color: position ? theme.colors.text : theme.colors.subText,
                  }}
                >
                  {position || "Select your role"}
                </Text>
                <Ionicons
                  name="briefcase-outline"
                  size={18}
                  color={theme.colors.subText}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.navButtons}>
              <TouchableOpacity
                style={styles.backButton}
                onPress={() => router.back()}
              >
                <Text style={[styles.backText, { color: theme.colors.text }]}>
                  Back
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
                <Text style={styles.nextText}>Next</Text>
              </TouchableOpacity>
            </View>
          </View>
          <FooterLinks />
        </ScrollView>

        {/* UNIFORM MODAL COMPONENT */}
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
            visible: showRoleModal,
            setVisible: setShowRoleModal,
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
                  />
                </View>

                <FlatList
                  data={m.data}
                  keyExtractor={(item, index) => index.toString()}
                  contentContainerStyle={{ paddingBottom: 20 }}
                  renderItem={({ item }) =>
                    m.type === "country"
                      ? renderItem(
                          countries[item as TCountryCode].name,
                          getEmojiFlag(item as TCountryCode),
                          () => {
                            setSelectedCountry(item as TCountryCode);
                            m.setVisible(false);
                            setCountrySearch("");
                          },
                        )
                      : renderItem(item.name, null, () => {
                          setPosition(item.name);
                          m.setVisible(false);
                          setRoleSearch("");
                        })
                  }
                />
              </View>
            </View>
          </Modal>
        ))}

        {showPicker && (
          <DateTimePicker
            value={dob}
            mode="date"
            display="spinner"
            onChange={(event, date) => {
              setShowPicker(false);
              if (date) setDob(date);
            }}
          />
        )}
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
  card: {
    width: "100%",
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  inputGroup: { marginBottom: 20 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
    opacity: 0.9,
  },
  input: { height: 52, borderRadius: 14, paddingHorizontal: 16, fontSize: 15 },
  selector: {
    height: 52,
    borderRadius: 14,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  inlineLoader: { position: "absolute", right: 16, top: 16 },
  dropdown: {
    borderRadius: 14,
    marginTop: 8,
    padding: 8,
    borderWidth: 1,
    maxHeight: 200,
    overflow: "hidden",
  },
  dropdownItem: {
    padding: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
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
  closeBtn: {
    backgroundColor: "#3B66F5",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 10,
  },
});
