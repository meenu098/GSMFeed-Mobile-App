import { Feather, Ionicons } from "@expo/vector-icons";
import { countries, getEmojiFlag, TCountryCode } from "countries-list";
import React, { useState } from "react";
import {
    Alert,
    Dimensions,
    FlatList,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import CONFIG from "../shared/config";
import { useTheme } from "../shared/themeContext";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

// --- Personal Information Modal ---
const PersonalInfoModal = ({
  visible,
  onClose,
  data,
  setData,
  user,
  checkIfDataChanged,
}: any) => {
  const { isDark } = useTheme();
  const [isChecked, setIsChecked] = useState(false);
  const [countryPickerVisible, setCountryPickerVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const theme = {
    card: isDark ? "#1E2530" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    subText: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#2D3748" : "#E2E8F0",
    primary: "#3B66F5",
    inputBg: isDark ? "#121721" : "#F9FAFB",
    overlay: "rgba(0,0,0,0.5)",
    disabledBtn: isDark ? "#2D3748" : "#A5B4FC",
  };

  // --- 30-Day Logic ---
  const profileUpdateDateString = data?.profile_update_at;
  let daysSinceUpdate = 0;
  if (profileUpdateDateString) {
    const profileUpdateDate = new Date(
      profileUpdateDateString.replace(" ", "T") + "Z",
    );
    const currentDate = new Date();
    daysSinceUpdate = Math.floor(
      (currentDate.getTime() - profileUpdateDate.getTime()) /
        (1000 * 60 * 60 * 24),
    );
  }
  const isLocked = daysSinceUpdate < 30;

  // --- Date Picker Handlers ---
  const handleConfirmDate = (date: Date) => {
    const formattedDate = date.toISOString().split("T")[0]; // Returns YYYY-MM-DD
    setData({ ...data, dob: formattedDate });
    setDatePickerVisibility(false);
  };

  // --- Country Picker Logic ---
  const countryData = Object.entries(countries).map(([code, details]) => ({
    code,
    name: details.name,
    dialCode: `+${details.phone[0]}`,
    flag: getEmojiFlag(code as TCountryCode),
  }));

  const filteredCountries = countryData.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.dialCode.includes(searchQuery),
  );

  const handleSubmit = async () => {
    try {
      const newData =
        user?.account_type === "business"
          ? { phone_country_code: data?.phone_country_code, phone: data?.phone }
          : {
              first_name: data?.first_name,
              last_name: data?.last_name,
              dob: data?.dob,
              phone_country_code: data?.phone_country_code,
              phone: data?.phone,
            };

      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/user/details/personal/info`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify(newData),
        },
      );

      const res = await response.json();
      if (res.status === true) {
        setData((prev: any) => ({ ...prev, ...res.data }));
        Alert.alert("Success", "Personal details updated.");
        onClose();
      } else {
        Alert.alert("Error", res.message || "Failed to update");
      }
    } catch (error) {
      Alert.alert("Error", "Update failed.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              {user?.account_type === "individual"
                ? "Personal information"
                : "Company information"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={26} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            <Text style={[styles.desc, { color: theme.subText }]}>
              You can only edit your personal details every 30 days. If you need
              to change them before then, please contact support.
            </Text>

            <View style={styles.row}>
              <View style={styles.flex1}>
                <Text style={[styles.label, { color: theme.text }]}>
                  First name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.border,
                      color: theme.text,
                      backgroundColor: theme.inputBg,
                    },
                  ]}
                  value={data?.first_name}
                  onChangeText={(val) => setData({ ...data, first_name: val })}
                />
              </View>
              <View style={[styles.flex1, { marginLeft: 15 }]}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Last name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.border,
                      color: theme.text,
                      backgroundColor: theme.inputBg,
                    },
                  ]}
                  value={data?.last_name}
                  onChangeText={(val) => setData({ ...data, last_name: val })}
                />
              </View>
            </View>

            <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>
              Date of birth
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  backgroundColor: theme.inputBg,
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                },
              ]}
              onPress={() => setDatePickerVisibility(true)}
            >
              <Text style={{ color: theme.text }}>
                {data?.dob || "Select Date"}
              </Text>
              <Feather name="calendar" size={18} color={theme.text} />
            </TouchableOpacity>

            <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>
              Contact no.
            </Text>
            <View style={styles.row}>
              <TouchableOpacity
                style={[
                  styles.countryTrigger,
                  {
                    borderColor: theme.primary,
                    backgroundColor: theme.inputBg,
                  },
                ]}
                onPress={() => setCountryPickerVisible(true)}
              >
                <Text style={{ color: theme.text }}>
                  {data?.phone_country_code || "🇦🇪 +971"}
                </Text>
                <Ionicons name="chevron-down" size={14} color={theme.text} />
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.input,
                  {
                    flex: 1,
                    marginLeft: 10,
                    borderColor: theme.border,
                    color: theme.text,
                    backgroundColor: theme.inputBg,
                  },
                ]}
                value={data?.phone}
                placeholder="0568168490"
                placeholderTextColor={theme.subText}
                keyboardType="phone-pad"
                onChangeText={(val) => setData({ ...data, phone: val })}
              />
            </View>

            {isLocked && (
              <TouchableOpacity
                style={styles.checkboxRow}
                onPress={() => setIsChecked(!isChecked)}
              >
                <Ionicons
                  name={isChecked ? "checkbox" : "square-outline"}
                  size={22}
                  color={theme.primary}
                />
                <Text style={[styles.checkboxText, { color: theme.subText }]}>
                  I agree to edit my personal details, and I understand that I
                  can only edit my details every 30 days.
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor:
                    isLocked && !isChecked ? theme.disabledBtn : theme.primary,
                },
              ]}
              onPress={handleSubmit}
              disabled={isLocked && !isChecked}
            >
              <Text style={styles.submitBtnText}>
                {isLocked
                  ? `Edit after ${30 - daysSinceUpdate} days`
                  : "Save changes"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {/* Date Picker Modal */}
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={() => setDatePickerVisibility(false)}
        maximumDate={new Date()}
        isDarkModeEnabled={isDark}
      />

      {/* Country Picker Modal */}
      <Modal
        visible={countryPickerVisible}
        transparent={true}
        animationType="fade"
      >
        <TouchableOpacity
          style={styles.subModalOverlay}
          onPress={() => setCountryPickerVisible(false)}
        >
          <View
            style={[styles.searchContainer, { backgroundColor: theme.card }]}
          >
            <TextInput
              style={[
                styles.searchInput,
                { color: theme.text, borderColor: theme.border },
              ]}
              placeholder="Search country..."
              placeholderTextColor={theme.subText}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.countryItem}
                  onPress={() => {
                    setData({
                      ...data,
                      phone_country_code: `${item.flag} ${item.dialCode}`,
                    });
                    setCountryPickerVisible(false);
                  }}
                >
                  <Text style={[styles.countryText, { color: theme.text }]}>
                    {item.flag} {item.dialCode} {item.name}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </Modal>
  );
};

// --- Address Information Modal ---
const AddressInfoModal = ({
  visible,
  onClose,
  data,
  setData,
  user,
  checkIfDataChanged,
}: any) => {
  const { isDark } = useTheme();

  const theme = {
    card: isDark ? "#1E2530" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#0F172A",
    border: isDark ? "#2D3748" : "#E2E8F0",
    primary: "#3B66F5",
    inputBg: isDark ? "#121721" : "#F9FAFB",
    disabledBtn: isDark ? "#2D3748" : "#A5B4FC",
  };

  const handleSubmit = async () => {
    try {
      const newData = {
        street_address: data?.street_address,
        city: data?.city,
        country: data?.country,
        zip: data?.zip,
      };

      const response = await fetch(
        `${CONFIG.API_ENDPOINT}/api/user/details/personal/address`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user?.token}`,
          },
          body: JSON.stringify(newData),
        },
      );

      const res = await response.json();
      if (res.status === true) {
        setData((prev: any) => ({ ...prev, ...res.data }));
        Alert.alert("Success", "Address updated.");
        onClose();
      }
    } catch (error) {
      Alert.alert("Error", "Update failed.");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true}>
      <View style={styles.overlay}>
        <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              Address information
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={26} color={theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 30 }}
          >
            <Text style={[styles.label, { color: theme.text }]}>
              Street address
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.inputBg,
                },
              ]}
              value={data?.street_address}
              onChangeText={(val) => setData({ ...data, street_address: val })}
            />

            <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>
              City
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.inputBg,
                },
              ]}
              value={data?.city}
              onChangeText={(val) => setData({ ...data, city: val })}
            />

            <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>
              Country Code
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.inputBg,
                },
              ]}
              value={data?.country}
              placeholder="e.g. AE"
              onChangeText={(val) => setData({ ...data, country: val })}
            />

            <Text style={[styles.label, { color: theme.text, marginTop: 15 }]}>
              Zip code
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  borderColor: theme.border,
                  color: theme.text,
                  backgroundColor: theme.inputBg,
                },
              ]}
              value={data?.zip}
              keyboardType="numeric"
              onChangeText={(val) => setData({ ...data, zip: val })}
            />

            <TouchableOpacity
              style={[
                styles.submitBtn,
                {
                  backgroundColor: !checkIfDataChanged()
                    ? theme.disabledBtn
                    : theme.primary,
                },
              ]}
              onPress={handleSubmit}
              disabled={!checkIfDataChanged()}
            >
              <Text style={styles.submitBtnText}>Save changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 25,
    maxHeight: SCREEN_HEIGHT * 0.9,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: { fontSize: 22, fontWeight: "bold" },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 25 },
  row: { flexDirection: "row", alignItems: "center" },
  flex1: { flex: 1 },
  label: { fontSize: 15, fontWeight: "600", marginBottom: 8 },
  input: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  countryTrigger: {
    height: 52,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    width: 120,
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 25,
    gap: 10,
  },
  checkboxText: { flex: 1, fontSize: 13 },
  submitBtn: {
    height: 55,
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 30,
  },
  submitBtnText: { color: "white", fontWeight: "bold", fontSize: 16 },
  subModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    padding: 20,
  },
  searchContainer: {
    borderRadius: 15,
    padding: 15,
    maxHeight: 450,
    elevation: 5,
  },
  searchInput: {
    height: 45,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  countryItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#EEE",
  },
  countryText: { fontSize: 15 },
});

export { AddressInfoModal, PersonalInfoModal };
